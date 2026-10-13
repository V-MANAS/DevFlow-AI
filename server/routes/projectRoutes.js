import express from 'express'

import {
    addMember,
    createProject,
    updateProject
} from '../controllers/projectController.js';

import { requireWorkspaceRole } from '../middlewares/roleMiddleware.js';

const projectRouter = express.Router();

projectRouter.post(
    '/',
    requireWorkspaceRole('OWNER', 'ADMIN'),
    createProject
);

projectRouter.put(
    '/',
    requireWorkspaceRole('OWNER', 'ADMIN'),
    updateProject
);

projectRouter.post(
    '/:projectId/addMember',
    requireWorkspaceRole('OWNER', 'ADMIN'),
    addMember
);

export default projectRouter;