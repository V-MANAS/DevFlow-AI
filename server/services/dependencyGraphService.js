export const buildDependencyGraph = (tasks, dependencies) => {
  const graph = new Map();

  // Create a node for every task
  for (const task of tasks) {
    graph.set(task.id, []);
  }

  // Add directed edges:
  // predecessor → dependent
  for (const dependency of dependencies) {
    if (!graph.has(dependency.predecessorId)) {
      graph.set(dependency.predecessorId, []);
    }

    graph.get(dependency.predecessorId).push(
      dependency.dependentId
    );
  }

  return graph;
};
export const topologicalSort = (tasks, graph) => {
  const inDegree = new Map();

  // Initially every task has 0 incoming edges
  for (const task of tasks) {
    inDegree.set(task.id, 0);
  }

  // Calculate incoming edges
  for (const [taskId, neighbors] of graph.entries()) {
    for (const neighbor of neighbors) {
      inDegree.set(
        neighbor,
        (inDegree.get(neighbor) || 0) + 1
      );
    }
  }

  // Tasks with no dependencies
  const queue = [];

  for (const [taskId, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(taskId);
    }
  }

  const sortedTasks = [];

  while (queue.length > 0) {
    const currentTask = queue.shift();

    sortedTasks.push(currentTask);

    const neighbors = graph.get(currentTask) || [];

    for (const neighbor of neighbors) {
      const newDegree = inDegree.get(neighbor) - 1;

      inDegree.set(neighbor, newDegree);

      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If not every task was processed,
  // the graph contains a cycle.
  if (sortedTasks.length !== tasks.length) {
    throw new Error(
      "Dependency graph contains a cycle"
    );
  }

  return sortedTasks;
};

export const getBlockedTasks = (tasks, dependencies) => {
  const dependencyMap = new Map();

  // Store predecessors for every task
  for (const task of tasks) {
    dependencyMap.set(task.id, []);
  }

  for (const dependency of dependencies) {
    if (!dependencyMap.has(dependency.dependentId)) {
      dependencyMap.set(dependency.dependentId, []);
    }

    dependencyMap
      .get(dependency.dependentId)
      .push(dependency.predecessorId);
  }

  const blockedTasks = [];

  for (const task of tasks) {
    const predecessors = dependencyMap.get(task.id) || [];

    /*
      A task is blocked if at least one of its
      predecessor tasks is not completed.
    */
    const isBlocked = predecessors.some((predecessorId) => {
      const predecessor = tasks.find(
        (item) => item.id === predecessorId
      );

      return predecessor && predecessor.status !== "DONE";
    });

    if (isBlocked) {
      blockedTasks.push(task.id);
    }
  }

  return blockedTasks;
};

export const calculateCriticalPath = (tasks, dependencies) => {
  if (!tasks || tasks.length === 0) {
    return {
      criticalPath: [],
      duration: 0,
    };
  }

  // Build graph
  const graph = buildDependencyGraph(tasks, dependencies);

  // Get valid execution order
  const sortedTasks = topologicalSort(tasks, graph);

  /*
    earliestFinish:
    Maximum time at which a task can finish
    based on its predecessors.
  */
  const earliestFinish = new Map();

  /*
    previousTask:
    Used to reconstruct the actual critical path.
  */
  const previousTask = new Map();

  for (const taskId of sortedTasks) {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) continue;

    const duration = task.estimatedHours || 1;

    let earliestStart = 0;
    let bestPredecessor = null;

    // Find predecessors of this task
    for (const dependency of dependencies) {
      if (dependency.dependentId !== taskId) {
        continue;
      }

      const predecessorFinish =
        earliestFinish.get(dependency.predecessorId) || 0;

      if (predecessorFinish > earliestStart) {
        earliestStart = predecessorFinish;
        bestPredecessor = dependency.predecessorId;
      }
    }

    earliestFinish.set(
      taskId,
      earliestStart + duration
    );

    previousTask.set(taskId, bestPredecessor);
  }

  // Find the task with the latest finish time
  let finalTaskId = null;
  let projectDuration = 0;

  for (const [taskId, finishTime] of earliestFinish.entries()) {
    if (finishTime > projectDuration) {
      projectDuration = finishTime;
      finalTaskId = taskId;
    }
  }

  // Reconstruct critical path
  const criticalPath = [];

  let currentTaskId = finalTaskId;

  while (currentTaskId) {
    criticalPath.unshift(currentTaskId);

    currentTaskId = previousTask.get(currentTaskId);
  }

  return {
    criticalPath,
    duration: projectDuration,
  };
};