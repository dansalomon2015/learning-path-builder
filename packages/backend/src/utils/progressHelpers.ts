import { logger } from './logger';

/**
 * Calculate progress percentage based on completed items
 * @param items Array of items to check
 * @param completedKey Key to check for completion status (e.g., 'isCompleted')
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(
  items: Array<Record<string, unknown>>,
  completedKey: string
): number {
  const completed: number = items.filter((item: Record<string, unknown>): boolean => {
    const isCompleted: unknown = item[completedKey];
    return isCompleted === true;
  }).length;
  return items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
}

/**
 * Activate the next module in a path after completing the current one
 * @param modules Array of modules in the path
 * @param moduleIndex Index of the completed module
 * @param context Optional context for logging (e.g., 'after validation passed', 'after passing final exam')
 */
export function activateNextModule(
  modules: Array<Record<string, unknown>>,
  moduleIndex: number,
  context: string = 'after completion'
): void {
  const nextModuleIndex: number = moduleIndex + 1;
  if (nextModuleIndex < modules.length) {
    const nextModuleUnknown: unknown = modules[nextModuleIndex];
    const nextModule: Record<string, unknown> =
      nextModuleUnknown != null ? (nextModuleUnknown as Record<string, unknown>) : {};
    modules[nextModuleIndex] = {
      ...nextModule,
      isEnabled: true,
    };
    logger.info(`Activated next module: ${String(nextModule['id'])} ${context}`);
  }
}

/**
 * Update path progress and check if all modules are completed
 * @param learningPaths Array of all learning paths
 * @param pathIndex Index of the path being updated
 * @param path The path object being updated
 * @param modules Array of modules in the path
 * @returns Object with pathProgress and allModulesCompleted flag
 */
export function updatePathProgressAndCheckCompletion(
  learningPaths: Array<Record<string, unknown>>,
  pathIndex: number,
  path: Record<string, unknown>,
  modules: Array<Record<string, unknown>>
): { pathProgress: number; allModulesCompleted: boolean } {
  const pathProgress: number = calculateProgress(modules, 'isCompleted');
  const allModulesCompleted: boolean = modules.every((m: Record<string, unknown>): boolean => {
    const mIsCompleted: unknown = m['isCompleted'];
    return mIsCompleted === true;
  });
  learningPaths[pathIndex] = {
    ...path,
    modules,
    progress: pathProgress,
    isCompleted: allModulesCompleted,
    updatedAt: new Date().toISOString(),
  };
  return { pathProgress, allModulesCompleted };
}

/**
 * Activate the next path if the current path is completed
 * @param learningPaths Array of all learning paths
 * @param pathIndex Index of the completed path
 */
export function activateNextPath(
  learningPaths: Array<Record<string, unknown>>,
  pathIndex: number
): void {
  const nextPathIndex: number = pathIndex + 1;
  if (nextPathIndex < learningPaths.length) {
    const nextPathUnknown: unknown = learningPaths[nextPathIndex];
    const nextPath: Record<string, unknown> =
      nextPathUnknown != null ? (nextPathUnknown as Record<string, unknown>) : {};
    learningPaths[nextPathIndex] = {
      ...nextPath,
      isEnabled: true,
      updatedAt: new Date().toISOString(),
    };
    logger.info(`Activated next path: ${String(nextPath['id'])} after completing all modules`);
  }
}

/**
 * Complete a module and update all related progress (path, objective)
 * This is a high-level function that orchestrates the completion process
 * @param params Object containing learningPaths, pathIndex, path, modules, moduleIndex, and module
 * @returns Object with objectiveProgress
 */
export function completeModuleAndUpdateProgress(params: {
  learningPaths: Array<Record<string, unknown>>;
  pathIndex: number;
  path: Record<string, unknown>;
  modules: Array<Record<string, unknown>>;
  moduleIndex: number;
  module: Record<string, unknown>;
  context?: string;
}): { objectiveProgress: number } {
  const {
    learningPaths,
    pathIndex,
    path,
    modules,
    moduleIndex,
    module,
    context = 'after completion',
  } = params;

  // Mark module as completed
  modules[moduleIndex] = {
    ...module,
    isCompleted: true,
    progress: 100,
  };

  // Activate next module if it exists
  activateNextModule(modules, moduleIndex, context);

  // Recalculate path progress
  const { allModulesCompleted }: { pathProgress: number; allModulesCompleted: boolean } =
    updatePathProgressAndCheckCompletion(learningPaths, pathIndex, path, modules);

  // If path is completed, activate next path
  if (allModulesCompleted) {
    activateNextPath(learningPaths, pathIndex);
  }

  // Recalculate objective progress
  const objectiveProgress: number = calculateProgress(learningPaths, 'isCompleted');

  return { objectiveProgress };
}

/**
 * Calculate progress weights for module resources and final exam
 * @param resourceCount Number of resources in the module
 * @returns Object with resourceWeight and finalExamWeight
 */
export function calculateModuleProgressWeights(resourceCount: number): {
  resourceWeight: number;
  finalExamWeight: number;
} {
  if (resourceCount === 0) {
    // No resources, final exam is worth 100%
    return { resourceWeight: 0, finalExamWeight: 100 };
  }

  const totalElements = resourceCount + 1; // resources + final exam
  const baseWeight = 100 / totalElements;

  // Round down resource weight to integer
  let resourceWeight = Math.floor(baseWeight);

  // Calculate final exam weight (remaining percentage)
  let finalExamWeight = 100 - resourceWeight * resourceCount;

  // Ensure minimum 20% for final exam
  const MIN_FINAL_EXAM_WEIGHT = 20;
  if (finalExamWeight < MIN_FINAL_EXAM_WEIGHT) {
    finalExamWeight = MIN_FINAL_EXAM_WEIGHT;
    // Recalculate resource weight with final exam fixed at 20%
    resourceWeight = Math.floor((100 - MIN_FINAL_EXAM_WEIGHT) / resourceCount);
  }

  return { resourceWeight, finalExamWeight };
}

/**
 * Calculate current module progress based on completed resources and final exam
 * @param module Module object with suggestedResources
 * @param completedResourceIds Set of resource IDs that have been completed (score >= min)
 * @param finalExamPassed Whether the final exam has been passed
 * @returns Current progress percentage (0-100)
 */
export function calculateModuleProgress(
  module: Record<string, unknown>,
  completedResourceIds: Set<string>,
  finalExamPassed: boolean
): number {
  const suggestedResources = (module['suggestedResources'] as Array<Record<string, unknown>>) ?? [];
  const resourceCount = suggestedResources.length;

  const { resourceWeight, finalExamWeight } = calculateModuleProgressWeights(resourceCount);

  // Calculate progress from resources
  const completedResources = suggestedResources.filter((resource: Record<string, unknown>): boolean => {
    const resourceId: unknown = resource['id'];
    return resourceId != null && typeof resourceId === 'string' && completedResourceIds.has(resourceId);
  }).length;

  const resourcesProgress = completedResources * resourceWeight;

  // Add final exam progress if passed
  const finalExamProgress = finalExamPassed ? finalExamWeight : 0;

  const totalProgress = Math.min(100, resourcesProgress + finalExamProgress);

  return Math.round(totalProgress);
}

