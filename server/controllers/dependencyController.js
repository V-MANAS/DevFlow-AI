import { prisma } from "../configs/prisma.js";

import {
  buildDependencyGraph,
  topologicalSort,
  getBlockedTasks,
  calculateCriticalPath,
} from "../services/dependencyGraphService.js";


export const addDependency = async (req, res) => {
  try {
    const { predecessorId, dependentId } = req.body;

    if (!predecessorId || !dependentId) {
      return res.status(400).json({
        message: "predecessorId and dependentId are required",
      });
    }

    // A task cannot depend on itself
    if (predecessorId === dependentId) {
      return res.status(400).json({
        message: "A task cannot depend on itself",
      });
    }

    // Fetch both tasks
    const tasks = await prisma.task.findMany({
      where: {
        id: {
          in: [predecessorId, dependentId],
        },
      },
      select: {
        id: true,
        projectId: true,
      },
    });

    if (tasks.length !== 2) {
      return res.status(404).json({
        message: "One or both tasks were not found",
      });
    }

    const predecessor = tasks.find(
      (task) => task.id === predecessorId
    );

    const dependent = tasks.find(
      (task) => task.id === dependentId
    );

    // Tasks must belong to the same project
    if (predecessor.projectId !== dependent.projectId) {
      return res.status(400).json({
        message: "Tasks must belong to the same project",
      });
    }

    // Check duplicate dependency
    const existingDependency =
      await prisma.taskDependency.findUnique({
        where: {
          predecessorId_dependentId: {
            predecessorId,
            dependentId,
          },
        },
      });

    if (existingDependency) {
      return res.status(409).json({
        message: "This dependency already exists",
      });
    }

    /*
      Cycle detection

      We want to add:

      predecessor → dependent

      Before adding it, check whether there is already
      a path:

      dependent → ... → predecessor

      If yes, adding the new edge would create a cycle.
    */

    const dependencies = await prisma.taskDependency.findMany({
      where: {
        predecessor: {
          projectId: predecessor.projectId,
        },
      },
      select: {
        predecessorId: true,
        dependentId: true,
      },
    });

    // Build adjacency list
    const graph = new Map();

    for (const dependency of dependencies) {
      if (!graph.has(dependency.predecessorId)) {
        graph.set(dependency.predecessorId, []);
      }

      graph
        .get(dependency.predecessorId)
        .push(dependency.dependentId);
    }

    // Add the proposed edge temporarily
    if (!graph.has(predecessorId)) {
      graph.set(predecessorId, []);
    }

    graph.get(predecessorId).push(dependentId);

    // DFS cycle detection
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (taskId) => {
      if (recursionStack.has(taskId)) {
        return true;
      }

      if (visited.has(taskId)) {
        return false;
      }

      visited.add(taskId);
      recursionStack.add(taskId);

      const neighbors = graph.get(taskId) || [];

      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(taskId);

      return false;
    };

    let cycleDetected = false;

    for (const taskId of graph.keys()) {
      if (hasCycle(taskId)) {
        cycleDetected = true;
        break;
      }
    }

    if (cycleDetected) {
      return res.status(400).json({
        message: "This dependency would create a cycle",
      });
    }

    // Create dependency
    const dependency = await prisma.taskDependency.create({
      data: {
        predecessorId,
        dependentId,
      },
      include: {
        predecessor: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        dependent: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Dependency created successfully",
      dependency,
    });
  } catch (error) {
    console.error("Add dependency error:", error);

    return res.status(500).json({
      message: "Failed to create dependency",
    });
  }
};


/*
  Get all dependencies of a project
*/
export const getProjectDependencies = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        message: "Project ID is required",
      });
    }

    const dependencies = await prisma.taskDependency.findMany({
      where: {
        predecessor: {
          projectId,
        },
      },
      include: {
        predecessor: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        dependent: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.status(200).json({
      dependencies,
    });
  } catch (error) {
    console.error("Get dependencies error:", error);

    return res.status(500).json({
      message: "Failed to fetch dependencies",
    });
  }
};


/*
  Delete Dependency
*/
export const deleteDependency = async (req, res) => {
  try {
    const { dependencyId } = req.params;

    if (!dependencyId) {
      return res.status(400).json({
        message: "Dependency ID is required",
      });
    }

    const dependency =
      await prisma.taskDependency.findUnique({
        where: {
          id: dependencyId,
        },
      });

    if (!dependency) {
      return res.status(404).json({
        message: "Dependency not found",
      });
    }

    await prisma.taskDependency.delete({
      where: {
        id: dependencyId,
      },
    });

    return res.status(200).json({
      message: "Dependency deleted successfully",
    });
  } catch (error) {
    console.error("Delete dependency error:", error);

    return res.status(500).json({
      message: "Failed to delete dependency",
    });
  }
};

export const getProjectDependencyGraph = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        message: "Project ID is required",
      });
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        estimatedHours: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const dependencies = await prisma.taskDependency.findMany({
      where: {
        predecessor: {
          projectId,
        },
      },
      select: {
        id: true,
        predecessorId: true,
        dependentId: true,
      },
    });

    const graph = buildDependencyGraph(tasks, dependencies);

    const topologicalOrder = topologicalSort(
      tasks,
      graph
    );

    const blockedTasks = getBlockedTasks(
      tasks,
      dependencies
    );

    const criticalPathResult = calculateCriticalPath(
      tasks,
      dependencies
    );

    return res.status(200).json({
      projectId,
      tasks,
      dependencies,
      topologicalOrder,
      blockedTasks,
      criticalPath: criticalPathResult.criticalPath,
      projectDuration: criticalPathResult.duration,
    });
  } catch (error) {
    console.error(
      "Get project dependency graph error:",
      error
    );

    return res.status(500).json({
      message: error.message || "Failed to build dependency graph",
    });
  }
};