import { prisma } from "../configs/prisma.js";
import crypto from "crypto";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
};

// Get all workspaces for user
export const getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: safeUserSelect,
            },
          },
        },

        projects: {
          include: {
            tasks: {
              include: {
                assignee: {
                  select: safeUserSelect,
                },

                comments: {
                  include: {
                    user: {
                      select: safeUserSelect,
                    },
                  },
                },
              },
            },

            members: {
              include: {
                user: {
                  select: safeUserSelect,
                },
              },
            },
          },
        },

        owner: {
          select: safeUserSelect,
        },
      },
    });

    res.json({ workspaces });
  } catch (error) {
    console.error("Get User Workspaces Error:", error);

    res.status(500).json({
      message: error.code || error.message,
    });
  }
};

// Create new workspace
export const createWorkspace = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, image_url } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Workspace name is required",
      });
    }

    const id = crypto.randomUUID();

    const baseSlug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "workspace";

    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const workspace = await prisma.workspace.create({
      data: {
        id,
        name: name.trim(),
        slug,
        description: description || null,
        image_url: image_url || "",
        ownerId: userId,

        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },

      include: {
        members: {
          include: {
            user: {
              select: safeUserSelect,
            },
          },
        },

        projects: {
          include: {
            tasks: {
              include: {
                assignee: {
                  select: safeUserSelect,
                },

                comments: {
                  include: {
                    user: {
                      select: safeUserSelect,
                    },
                  },
                },
              },
            },

            members: {
              include: {
                user: {
                  select: safeUserSelect,
                },
              },
            },
          },
        },

        owner: {
          select: safeUserSelect,
        },
      },
    });

    res.status(201).json({
      workspace,
      message: "Workspace created successfully",
    });
  } catch (error) {
    console.error("Create Workspace Error:", error);

    res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

// Add member to workspace
export const addMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, role, workspaceId, message } = req.body;

    if (!email || !workspaceId || !role) {
      return res.status(400).json({
        message: "Missing required parameters",
      });
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: true,
      },
    });

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const requester = workspace.members.find(
      (member) => member.userId === userId
    );

    if (!requester) {
      return res.status(403).json({
        message: "You are not a member of this workspace",
      });
    }

    // ADMIN cannot assign ADMIN role
    if (requester.role === "ADMIN" && role === "ADMIN") {
      return res.status(403).json({
        message: "Only the owner can assign the ADMIN role",
      });
    }

    const existingMember = workspace.members.find(
      (member) => member.userId === user.id
    );

    if (existingMember) {
      return res.status(409).json({
        message: "User is already a member",
      });
    }

    const member = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role,
        message: message || "",
      },

      include: {
        user: {
          select: safeUserSelect,
        },
      },
    });

    res.json({
      member,
      message: "Member added successfully!!",
    });
  } catch (error) {
    console.error("Add Member Error:", error);

    res.status(500).json({
      message: error.code || error.message,
    });
  }
};

// Remove member from workspace
export const removeMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workspaceId, memberId } = req.body;

    if (!workspaceId || !memberId) {
      return res.status(400).json({
        message: "Workspace ID and member ID are required",
      });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: true,
      },
    });

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const requester = workspace.members.find(
      (member) => member.userId === userId
    );

    if (!requester || !["OWNER", "ADMIN"].includes(requester.role)) {
      return res.status(403).json({
        message: "Workspace management privileges required",
      });
    }

    const targetMember = workspace.members.find(
      (member) => member.id === memberId
    );

    if (!targetMember) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    // Owner cannot be removed
    if (targetMember.role === "OWNER") {
      return res.status(403).json({
        message: "The workspace owner cannot be removed",
      });
    }

    // Admin cannot remove another Admin
    if (
      requester.role === "ADMIN" &&
      targetMember.role === "ADMIN"
    ) {
      return res.status(403).json({
        message: "Only the owner can remove an admin",
      });
    }

    await prisma.workspaceMember.delete({
      where: {
        id: memberId,
      },
    });

    return res.json({
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove Member Error:", error);

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

// Update member role
export const updateMemberRole = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workspaceId, memberId, role } = req.body;

    if (!workspaceId || !memberId || !role) {
      return res.status(400).json({
        message: "Workspace ID, member ID and role are required",
      });
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: true,
      },
    });

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    // Only OWNER can change roles
    const requester = workspace.members.find(
      (member) => member.userId === userId
    );

    if (!requester || requester.role !== "OWNER") {
      return res.status(403).json({
        message: "Only the workspace owner can change member roles",
      });
    }

    const targetMember = workspace.members.find(
      (member) => member.id === memberId
    );

    if (!targetMember) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    // Owner cannot change their own role
    if (targetMember.role === "OWNER") {
      return res.status(403).json({
        message: "The workspace owner's role cannot be changed",
      });
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: {
        id: memberId,
      },

      data: {
        role,
      },

      include: {
        user: {
          select: safeUserSelect,
        },
      },
    });

    return res.json({
      member: updatedMember,
      message: "Member role updated successfully",
    });
  } catch (error) {
    console.error("Update Member Role Error:", error);

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};