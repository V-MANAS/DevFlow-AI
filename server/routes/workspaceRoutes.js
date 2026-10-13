import express from 'express'

import { addMember, createWorkspace, getUserWorkspaces,removeMember,updateMemberRole } from '../controllers/workspaceController.js';
import { requireWorkspaceRole } from '../middlewares/roleMiddleware.js';

const workspaceRouter = express.Router();

workspaceRouter.get('/', getUserWorkspaces);

workspaceRouter.post('/', createWorkspace);

workspaceRouter.post(
    '/add-member',
    requireWorkspaceRole('OWNER','ADMIN'),
    addMember
);

workspaceRouter.delete(
    '/remove-member',
    requireWorkspaceRole('OWNER', 'ADMIN'),
    removeMember
);

workspaceRouter.patch(
    '/update-member-role',
    requireWorkspaceRole('OWNER'),
    updateMemberRole
);

export default workspaceRouter;