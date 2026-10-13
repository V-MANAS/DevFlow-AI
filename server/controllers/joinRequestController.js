import { prisma } from "../configs/prisma.js";

/* SEND JOIN REQUEST */
export const sendJoinRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workspaceId } = req.body;

    if (!workspaceId) {
      return res.status(400).json({
        message: "Workspace ID is required",
      });
    }

    // Check workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    // User cannot request to join a workspace they already belong to
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({
        message: "You are already a member of this workspace",
      });
    }

    // Check existing request
    const existingRequest = await prisma.workspaceJoinRequest.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return res.status(400).json({
          message: "Join request is already pending",
        });
      }

      // Allow user to request again after rejection
      if (existingRequest.status === "REJECTED") {
        const request = await prisma.workspaceJoinRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: "PENDING",
          },
        });

        return res.status(201).json({
          request,
          message: "Join request sent successfully",
        });
      }

      if (existingRequest.status === "ACCEPTED") {
        return res.status(400).json({
          message: "You are already a member of this workspace",
        });
      }
    }

    const request = await prisma.workspaceJoinRequest.create({
      data: {
        userId,
        workspaceId,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      request,
      message: "Join request sent successfully",
    });
  } catch (error) {
    console.error("Send join request error:", error);

    return res.status(500).json({
      message: "Failed to send join request",
    });
  }
};

/* GET JOIN REQUESTS */
export const getJoinRequests = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const requests = await prisma.workspaceJoinRequest.findMany({
      where: {
        workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      requests,
      message: "Join requests fetched successfully",
    });
  } catch (error) {
    console.error("Get join requests error:", error);

    return res.status(500).json({
      message: "Failed to fetch join requests",
    });
  }
};


/* ACCEPT JOIN REQUEST */
export const acceptJoinRequest = async (req, res) => {
  try {
    const { workspaceId, requestId } = req.params;
    
    const request = await prisma.workspaceJoinRequest.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!request) {
      return res.status(404).json({
        message: "Join request not found",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        message: `Join request is already ${request.status.toLowerCase()}`,
      });
    }

    // Make sure the requesting user is still not a workspace member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: request.userId,
          workspaceId: request.workspaceId,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({
        message: "User is already a member of this workspace",
      });
    }

    // Create membership and update request together
    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.workspaceMember.create({
        data: {
          userId: request.userId,
          workspaceId: request.workspaceId,
          role: "MEMBER",
        },
      });

      const updatedRequest = await tx.workspaceJoinRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status: "ACCEPTED",
        },
      });

      return {
        member,
        request: updatedRequest,
      };
    });

    return res.json({
      member: result.member,
      request: result.request,
      message: "Join request accepted successfully",
    });
  } catch (error) {
    console.error("Accept join request error:", error);

    return res.status(500).json({
      message: "Failed to accept join request",
    });
  }
};

/* REJECT JOIN REQUEST */
export const rejectJoinRequest = async (req, res) => {
  try {
    const { workspaceId, requestId } = req.params;

    const request = await prisma.workspaceJoinRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({
        message: "Join request not found",
      });
    }

    if (request.workspaceId !== workspaceId) {
      return res.status(404).json({
        message: "Join request not found in this workspace",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        message: `Join request is already ${request.status.toLowerCase()}`,
      });
    }

    const updatedRequest = await prisma.workspaceJoinRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
      },
    });

    return res.json({
      request: updatedRequest,
      message: "Join request rejected successfully",
    });
  } catch (error) {
    console.error("Reject join request error:", error);

    return res.status(500).json({
      message: "Failed to reject join request",
    });
  }
};