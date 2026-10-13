import express from "express";
import {
  sendJoinRequest,
  getJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
} from "../controllers/joinRequestController.js";

import { requireWorkspaceRole } from "../middlewares/roleMiddleware.js";

const joinRequestRouter = express.Router();

joinRequestRouter.post("/", sendJoinRequest);

joinRequestRouter.get(
  "/:workspaceId",
  requireWorkspaceRole("OWNER", "ADMIN"),
  getJoinRequests
);
joinRequestRouter.patch(
  "/:workspaceId/:requestId/accept",
  requireWorkspaceRole("OWNER", "ADMIN"),
  acceptJoinRequest
);

joinRequestRouter.patch(
  "/:workspaceId/:requestId/reject",
  requireWorkspaceRole("OWNER", "ADMIN"),
  rejectJoinRequest
);

export default joinRequestRouter;