import * as admin from 'firebase-admin';
import { firebaseService } from '@/services/firebase';
import { logger } from '@/utils/logger';
import { calculateModuleProgress, calculateModuleProgressWeights } from '@/utils/progressHelpers';
import { completeModuleAndUpdateProgress } from '@/utils/progressHelpers';

class ModuleProgressService {
  /**
   * Get minimum score for resource assessment from environment variable
   */
  private getResourceAssessmentMinScore(): number {
    const minScoreEnv = process.env['RESOURCE_ASSESSMENT_MIN_SCORE'];
    if (minScoreEnv != null && minScoreEnv !== '') {
      const parsed = Number.parseFloat(minScoreEnv);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        return parsed;
      }
    }
    return 80; // Default: 80%
  }

  /**
   * Get completed resource IDs for a module
   * Resources are considered completed if they have at least one passed assessment
   */
  async getCompletedResourceIds(
    userId: string,
    moduleId: string
  ): Promise<Set<string>> {
    try {
      // Get all assessments for this module
      const assessments = await firebaseService.queryDocuments('resourceAssessments', [
        { field: 'userId', operator: '==', value: userId },
        { field: 'moduleId', operator: '==', value: moduleId },
        { field: 'status', operator: '==', value: 'completed' },
      ]);

      const completedIds = new Set<string>();
      const minScore = this.getResourceAssessmentMinScore();

      for (const assessment of assessments) {
        const resourceId: unknown = assessment['resourceId'];
        if (resourceId == null || typeof resourceId !== 'string') {
          continue;
        }

        // Check if assessment passed
        const score: unknown = assessment['score'];
        const passed: unknown = assessment['passed'];
        
        let hasPassed = false;
        if (typeof score === 'number') {
          hasPassed = score >= minScore;
        } else if (typeof passed === 'boolean') {
          hasPassed = passed;
        }

        if (hasPassed) {
          completedIds.add(resourceId);
        }
      }

      return completedIds;
    } catch (error: unknown) {
      logger.error('Error getting completed resource IDs:', error);
      return new Set<string>();
    }
  }

  /**
   * Check if final exam has been passed
   */
  async isFinalExamPassed(userId: string, moduleId: string): Promise<boolean> {
    try {
      const exams = await firebaseService.queryDocuments('moduleFinalExams', [
        { field: 'userId', operator: '==', value: userId },
        { field: 'moduleId', operator: '==', value: moduleId },
        { field: 'status', operator: '==', value: 'completed' },
      ]);

      return exams.some((exam: Record<string, unknown>): boolean => {
        const passed: unknown = exam['passed'];
        return passed === true;
      });
    } catch (error: unknown) {
      logger.error('Error checking final exam status:', error);
      return false;
    }
  }

  /**
   * Calculate path progress based on modules (100% / number of modules)
   */
  private calculatePathProgress(modules: Array<Record<string, unknown>>): number {
    if (modules.length === 0) {
      return 0;
    }
    const moduleWeight = 100 / modules.length;
    const totalProgress = modules.reduce((sum: number, module: Record<string, unknown>): number => {
      const moduleProgress: number = typeof module['progress'] === 'number' ? module['progress'] : 0;
      return sum + (moduleProgress * moduleWeight) / 100;
    }, 0);
    return Math.round(totalProgress);
  }

  /**
   * Calculate objective progress based on paths (100% / number of paths)
   */
  private calculateObjectiveProgress(learningPaths: Array<Record<string, unknown>>): number {
    if (learningPaths.length === 0) {
      return 0;
    }
    const pathWeight = 100 / learningPaths.length;
    const totalProgress = learningPaths.reduce((sum: number, path: Record<string, unknown>): number => {
      const pathProgress: number = typeof path['progress'] === 'number' ? path['progress'] : 0;
      return sum + (pathProgress * pathWeight) / 100;
    }, 0);
    return Math.round(totalProgress);
  }

  /**
   * Update module progress based on current state
   */
  async updateModuleProgress(
    objectiveId: string,
    pathId: string,
    moduleId: string,
    userId: string
  ): Promise<number> {
    try {
      // Fetch objective to get module
      const objectiveDoc = await firebaseService.getDocument('objectives', objectiveId);
      if (objectiveDoc == null) {
        throw new Error('Objective not found');
      }

      const learningPaths = (objectiveDoc['learningPaths'] as Array<Record<string, unknown>>) ?? [];
      const pathIndex = learningPaths.findIndex((p: Record<string, unknown>): boolean => p['id'] === pathId);
      if (pathIndex === -1) {
        throw new Error('Path not found');
      }

      const path: Record<string, unknown> | undefined = learningPaths[pathIndex];
      if (path == null) {
        throw new Error('Path not found');
      }

      const modules = (path['modules'] as Array<Record<string, unknown>>) ?? [];
      const moduleIndex = modules.findIndex((m: Record<string, unknown>): boolean => m['id'] === moduleId);
      if (moduleIndex === -1) {
        throw new Error('Module not found');
      }

      const module: Record<string, unknown> | undefined = modules[moduleIndex];
      if (module == null) {
        throw new Error('Module not found');
      }

      // Get completed resources
      const completedResourceIds = await this.getCompletedResourceIds(userId, moduleId);

      // Check final exam
      const finalExamPassed = await this.isFinalExamPassed(userId, moduleId);

      // Calculate new progress
      const newProgress = calculateModuleProgress(module, completedResourceIds, finalExamPassed);

      // Update module
      const wasCompleted: unknown = module['isCompleted'];
      const wasCompletedBefore = wasCompleted === true;

      modules[moduleIndex] = {
        ...module,
        progress: newProgress,
        // Mark as completed if progress is 100% and final exam passed
        isCompleted: newProgress >= 100 && finalExamPassed,
      };

      // Recalculate path progress based on modules (100% / number of modules)
      const pathProgress = this.calculatePathProgress(modules);

      // Update path with new progress
      learningPaths[pathIndex] = {
        ...path,
        modules,
        progress: pathProgress,
        updatedAt: new Date().toISOString(),
      };

      // If module just became completed, activate next modules/paths
      const isCompletedNow: unknown = modules[moduleIndex]['isCompleted'];
      if (!wasCompletedBefore && isCompletedNow === true) {
        const { objectiveProgress } = completeModuleAndUpdateProgress({
          learningPaths,
          pathIndex,
          path: learningPaths[pathIndex] ?? {},
          modules,
          moduleIndex,
          module: modules[moduleIndex] ?? {},
          context: 'after weighted progress reached 100%',
        });

        // Update objective with new progress
        await firebaseService.updateDocument('objectives', objectiveId, {
          learningPaths,
          progress: objectiveProgress,
          updatedAt: new Date().toISOString(),
        });

        logger.info(`Module ${moduleId} completed via weighted progress system`);
      } else {
        // Recalculate objective progress based on paths (100% / number of paths)
        const objectiveProgress = this.calculateObjectiveProgress(learningPaths);

        // Update objective with new progress
        await firebaseService.updateDocument('objectives', objectiveId, {
          learningPaths,
          progress: objectiveProgress,
          updatedAt: new Date().toISOString(),
        });
      }

      logger.info(`Module ${moduleId} progress updated to ${newProgress}%`);
      return newProgress;
    } catch (error: unknown) {
      logger.error('Error updating module progress:', error);
      throw error;
    }
  }
}

export const moduleProgressService = new ModuleProgressService();

