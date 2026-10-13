import express from "express";
import {
  addDependency,
  getProjectDependencies,
  deleteDependency,
  getProjectDependencyGraph,
} from "../controllers/dependencyController.js";
import { protect } from "../middlewares/authMiddleware.js";

const dependencyRouter = express.Router();

// Add dependency
dependencyRouter.post("/", protect, addDependency);

// Get all dependencies of a project
dependencyRouter.get(
  "/project/:projectId",
  protect,
  getProjectDependencies
);

// Delete dependency
dependencyRouter.delete(
  "/:dependencyId",
  protect,
  deleteDependency
);

dependencyRouter.get(
  "/graph/:projectId",
  protect,
  getProjectDependencyGraph
);

export default dependencyRouter;