import { prisma } from "../configs/prisma.js";

export const requireWorkspaceRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    message: "Unauthorized"
                });
            }

            // Workspace ID can come from params or request body
            const workspaceId =
                req.params.workspaceId ||
                req.body.workspaceId;

            if (!workspaceId) {
                return res.status(400).json({
                    message: "Workspace ID is required"
                });
            }

            const membership = await prisma.workspaceMember.findUnique({
                where: {
                    userId_workspaceId: {
                        userId,
                        workspaceId
                    }
                }
            });

            if (!membership) {
                return res.status(403).json({
                    message: "You are not a member of this workspace"
                });
            }

            if (!allowedRoles.includes(membership.role)) {
                return res.status(403).json({
                    message: "Insufficient permissions"
                });
            }

            // Make membership available to controllers
            req.workspaceMembership = membership;

            next();

        } catch (error) {
            console.error("RBAC error:", error);

            return res.status(500).json({
                message: "Authorization check failed"
            });
        }
    };
};