import { prisma } from "../configs/prisma.js";

/* ======================================================
   CREATE PROJECT
====================================================== */
export const createProject = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      team_members,
      team_lead,
      progress,
      priority,
    } = req.body;

    // Check workspace & permissions
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { include: { user: true } } },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const membership = workspace.members.find(
  (member) => member.userId === userId
);

if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
  return res.status(403).json({
    message: "You don't have permission to create projects in this workspace",
  });
}

    // Get team lead ID (optional)
    let teamLeadId = null;
    if (team_lead) {
      const lead = await prisma.user.findUnique({
        where: { email: team_lead },
        select: { id: true },
      });
      teamLeadId = lead?.id || null;
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        workspaceId,
        name,
        description,
        status,
        priority,
        progress,
        team_lead: teamLeadId,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });

    // Add members to project
    if (team_members?.length > 0) {
      const membersToAdd = [];

      workspace.members.forEach((member) => {
        if (team_members.includes(member.user.email)) {
          membersToAdd.push(member.user.id);
        }
      });

      if (membersToAdd.length > 0) {
        await prisma.projectMember.createMany({
          data: membersToAdd.map((userId) => ({
            projectId: project.id,
            userId,
          })),
        });
      }
    }

    // Return project with relations
    const projectWithRelations = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        members: { include: { user: true } },
        tasks: {
          include: {
            assignee: true,
            comments: { include: { user: true } },
          },
        },
      },
    });

    res.json({
      project: projectWithRelations,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

/* ======================================================
   UPDATE PROJECT
====================================================== */
export const updateProject = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      id,
      workspaceId,
      description,
      name,
      status,
      start_date,
      end_date,
      progress,
      priority,
    } = req.body;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const membership = workspace.members.find(
  (member) => member.userId === userId
);

const isWorkspaceAdmin = membership &&
  ["OWNER", "ADMIN"].includes(membership.role);

    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

if (!isWorkspaceAdmin && project.team_lead !== userId) {
      return res.status(403).json({
        message: "You don't have permission to update this project",
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        status,
        priority,
        progress,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });

    res.json({
      project: updatedProject,
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

/* ======================================================
   ADD MEMBER TO PROJECT
====================================================== */
export const addMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;
    const { email } = req.body;

    const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    members: { include: { user: true } },
    workspace: {
      include: {
        members: true,
      },
    },
  },
});

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

   
    const membership = project.workspace.members.find(
  (member) => member.userId === userId
);

if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
  return res.status(403).json({
    message: "You don't have permission to add project members",
  });
}

    const existingMember = project.members.find(
      (member) => member.user.email === email
    );

    if (existingMember) {
      return res.status(400).json({
        message: "User is already a project member",
      });
    }

const user = await prisma.user.findUnique({
  where: { email },
  include: {
    workspaces: true,
  },
});

if (!user) {
  return res.status(404).json({
    message: "User not found",
  });
}

const isWorkspaceMember = user.workspaces.some(
  (member) => member.workspaceId === project.workspaceId
);

if (!isWorkspaceMember) {
  return res.status(403).json({
    message: "User must be a member of the workspace",
  });
}
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
      },
    });

    res.json({
      member,
      message: "Member added successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.code || error.message });
  }
};
