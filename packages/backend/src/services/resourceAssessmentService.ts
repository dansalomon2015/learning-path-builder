import * as admin from 'firebase-admin';
import { firebaseService } from '@/services/firebase';
import { geminiService } from '@/services/gemini';
import { logger } from '@/utils/logger';
import type { ResourceAssessment, ResourceAssessmentResult, QuizQuestion } from '@/types';
import { moduleProgressService } from '@/services/moduleProgressService';

class ResourceAssessmentService {
  /**
   * Get cooldown duration in hours from environment variable
   * Default: 1 hour
   */
  private getCooldownHours(): number {
    const cooldownEnv = process.env['RESOURCE_ASSESSMENT_COOLDOWN_HOURS'];
    if (cooldownEnv != null && cooldownEnv !== '') {
      const parsed = Number.parseFloat(cooldownEnv);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return 1; // Default: 1 hour
  }

  /**
   * Get minimum score for resource assessment from environment variable
   * Default: 80%
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
   * Check if user can create a new assessment (cooldown check)
   */
  async canCreateAssessment(
    userId: string,
    resourceId: string
  ): Promise<{ canCreate: boolean; cooldownEndsAt?: Date }> {
    try {
      const COOLDOWN_HOURS = this.getCooldownHours();
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      const now = new Date();
      const cooldownStart = new Date(now.getTime() - cooldownMs);

      // Check for recent assessments for this resource
      const allAttempts = await firebaseService.queryDocuments('resourceAssessments', [
        { field: 'userId', operator: '==', value: userId },
        { field: 'resourceId', operator: '==', value: resourceId },
      ]);

      // Filter for pending or completed status
      const recentAttempts = allAttempts.filter((attempt: Record<string, unknown>): boolean => {
        const status: unknown = attempt['status'];
        return status === 'pending' || status === 'completed';
      });

      // Check if there's a recent attempt within cooldown period
      for (const attempt of recentAttempts) {
        const createdAtValue: unknown = attempt['createdAt'];
        let createdAt: Date;

        if (createdAtValue instanceof admin.firestore.Timestamp) {
          createdAt = createdAtValue.toDate();
        } else if (createdAtValue instanceof Date) {
          createdAt = createdAtValue;
        } else if (typeof createdAtValue === 'string') {
          createdAt = new Date(createdAtValue);
        } else {
          continue;
        }

        if (createdAt > cooldownStart) {
          // Still in cooldown
          const cooldownEndsAt = new Date(createdAt.getTime() + cooldownMs);
          return { canCreate: false, cooldownEndsAt };
        }
      }

      return { canCreate: true };
    } catch (error: unknown) {
      logger.error('Error checking resource assessment cooldown:', error);
      // On error, allow attempt (fail open)
      return { canCreate: true };
    }
  }

  /**
   * Create a new resource assessment
   */
  async createAssessment(
    userId: string,
    resourceId: string,
    moduleId: string,
    objectiveId: string,
    questionCount: number = 5
  ): Promise<ResourceAssessment> {
    try {
      // Fetch objective to find module and resource
      const objectiveDoc = await firebaseService.getDocument('objectives', objectiveId);
      if (objectiveDoc == null) {
        throw new Error('Objective not found');
      }

      const objective = objectiveDoc as Record<string, unknown>;
      const objectiveUserId: unknown = objective['userId'];
      if (objectiveUserId !== userId) {
        throw new Error('Unauthorized access to objective');
      }

      // Find module in learning paths
      const learningPaths = (objective['learningPaths'] as Array<Record<string, unknown>>) ?? [];
      let module: Record<string, unknown> | null = null;
      let pathId: string | null = null;

      for (const path of learningPaths) {
        const pathIdCandidate: unknown = path['id'];
        const modules = (path['modules'] as Array<Record<string, unknown>>) ?? [];
        const foundModule = modules.find((m: Record<string, unknown>): boolean => m['id'] === moduleId);
        if (foundModule != null) {
          module = foundModule;
          if (pathIdCandidate != null && typeof pathIdCandidate === 'string') {
            pathId = pathIdCandidate;
          }
          break;
        }
      }

      if (module == null) {
        throw new Error('Module not found');
      }

      if (pathId == null || pathId === '') {
        throw new Error('Path ID not found for module');
      }

      // Find the resource in the module
      const suggestedResources: unknown = module['suggestedResources'];
      if (!Array.isArray(suggestedResources)) {
        throw new Error('Module has no suggested resources');
      }

      const resource = suggestedResources.find(
        (r: Record<string, unknown>): boolean => r['id'] === resourceId
      ) as Record<string, unknown> | undefined;

      if (resource == null) {
        throw new Error('Resource not found in module');
      }

      // Update objective status to 'in_progress' if it's still in 'planning'
      const objectiveStatus: string = (objective['status'] as string) ?? 'planning';
      if (objectiveStatus === 'planning') {
        try {
          await firebaseService.updateDocument('objectives', objectiveId, {
            status: 'in_progress',
            updatedAt: new Date().toISOString(),
          });
          logger.info(`Objective ${objectiveId} status updated from 'planning' to 'in_progress'`);
        } catch (updateError: unknown) {
          // Log but don't fail the assessment creation if status update fails
          logger.warn('Failed to update objective status to in_progress:', updateError);
        }
      }

      // Prepare context for Gemini
      const moduleTitle: string = (module['title'] as string) ?? '';
      const moduleDescription: string = (module['description'] as string) ?? '';
      const objectiveTitle: string = (objective['title'] as string) ?? '';
      const objectiveCategory: string = (objective['category'] as string) ?? '';
      const targetRole: string = (objective['targetRole'] as string) ?? '';
      const difficulty: 'beginner' | 'intermediate' | 'advanced' =
        (objective['targetLevel'] as 'beginner' | 'intermediate' | 'advanced') ?? 'beginner';

      // Generate questions using Gemini
      logger.info(`Generating ${questionCount} resource assessment questions for resource ${resourceId}`);
      const questions: QuizQuestion[] = await geminiService.generateResourceAssessmentQuestions(
        {
          id: resourceId,
          title: (resource['title'] as string) ?? '',
          description: (resource['description'] as string) ?? '',
          type: (resource['type'] as
            | 'documentation'
            | 'book'
            | 'article'
            | 'video'
            | 'tutorial'
            | 'official_guide') ?? 'documentation',
          url: resource['url'] as string | undefined,
          author: resource['author'] as string | undefined,
        },
        {
          moduleTitle,
          moduleDescription,
          objectiveTitle,
          objectiveCategory,
          targetRole,
          difficulty,
        },
        questionCount
      );

      // Create assessment document
      const now = new Date();
      const assessmentId = `resource_assessment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const assessment: ResourceAssessment = {
        id: assessmentId,
        userId,
        resourceId,
        moduleId,
        pathId,
        objectiveId,
        resourceTitle: (resource['title'] as string) ?? '',
        resourceType: (resource['type'] as
          | 'documentation'
          | 'book'
          | 'article'
          | 'video'
          | 'tutorial'
          | 'official_guide') ?? 'documentation',
        resourceUrl: resource['url'] as string | undefined,
        questions,
        status: 'pending',
        createdAt: now,
      };

      // Save to Firestore (convert dates to Firestore Timestamps)
      const assessmentData: Record<string, unknown> = {
        ...assessment,
        createdAt: admin.firestore.Timestamp.fromDate(now),
      };
      await firebaseService.createDocument('resourceAssessments', assessmentData, assessmentId);

      logger.info(`Resource assessment ${assessmentId} created successfully`);
      return assessment;
    } catch (error: unknown) {
      logger.error('Error creating resource assessment:', error);
      throw error;
    }
  }

  /**
   * Get or create an assessment (returns existing pending if available)
   * Note: questionCount is not used when returning existing assessment
   */
  async getOrCreateAssessment(
    userId: string,
    resourceId: string,
    moduleId: string,
    objectiveId: string,
    forceNew: boolean = false,
    questionCount: number = 5
  ): Promise<ResourceAssessment> {
    try {
      // If not forcing new, check for existing pending assessment
      if (!forceNew) {
        const existingAssessments = await firebaseService.queryDocuments('resourceAssessments', [
          { field: 'userId', operator: '==', value: userId },
          { field: 'resourceId', operator: '==', value: resourceId },
          { field: 'status', operator: '==', value: 'pending' },
        ]);

        if (existingAssessments.length > 0) {
          const existing = existingAssessments[0] as Record<string, unknown>;
          const createdAtValue: unknown = existing['createdAt'];
          const createdAt: Date =
            createdAtValue instanceof admin.firestore.Timestamp
              ? createdAtValue.toDate()
              : createdAtValue instanceof Date
              ? createdAtValue
              : new Date(createdAtValue as string);

          // Ensure objective status is updated to 'in_progress' if still in 'planning'
          // This handles the case where an assessment was created but status update failed
          try {
            const objectiveDoc = await firebaseService.getDocument('objectives', objectiveId);
            if (objectiveDoc != null) {
              const objective = objectiveDoc as Record<string, unknown>;
              const objectiveStatus: string = (objective['status'] as string) ?? 'planning';
              if (objectiveStatus === 'planning') {
                await firebaseService.updateDocument('objectives', objectiveId, {
                  status: 'in_progress',
                  updatedAt: new Date().toISOString(),
                });
                logger.info(
                  `Objective ${objectiveId} status updated from 'planning' to 'in_progress' (existing assessment)`
                );
              }
            }
          } catch (updateError: unknown) {
            // Log but don't fail - this is a best-effort update
            logger.warn('Failed to update objective status in getOrCreateAssessment:', updateError);
          }

          return {
            id: existing['id'] as string,
            userId: existing['userId'] as string,
            resourceId: existing['resourceId'] as string,
            moduleId: existing['moduleId'] as string,
            pathId: (existing['pathId'] as string) ?? '',
            objectiveId: existing['objectiveId'] as string,
            resourceTitle: existing['resourceTitle'] as string,
            resourceType: existing['resourceType'] as
              | 'documentation'
              | 'book'
              | 'article'
              | 'video'
              | 'tutorial'
              | 'official_guide',
            resourceUrl: existing['resourceUrl'] as string | undefined,
            questions: existing['questions'] as QuizQuestion[],
            status: existing['status'] as 'pending' | 'completed',
            createdAt,
            completedAt: undefined,
            score: existing['score'] as number | undefined,
            passed: existing['passed'] as boolean | undefined,
            correctAnswers: existing['correctAnswers'] as number | undefined,
            totalQuestions: existing['totalQuestions'] as number | undefined,
            timeSpent: existing['timeSpent'] as number | undefined,
          };
        }
      }

      // Check cooldown before creating new
      const cooldownCheck = await this.canCreateAssessment(userId, resourceId);
      if (!cooldownCheck.canCreate && cooldownCheck.cooldownEndsAt != null) {
        throw new Error(
          `Vous devez attendre ${this.formatCooldownTime(
            cooldownCheck.cooldownEndsAt
          )} avant de pouvoir créer un nouveau quiz.`
        );
      }

      // Create new assessment
      return await this.createAssessment(userId, resourceId, moduleId, objectiveId, questionCount);
    } catch (error: unknown) {
      logger.error('Error getting or creating resource assessment:', error);
      throw error;
    }
  }

  /**
   * Submit and validate resource assessment
   */
  async submitAssessment(
    assessmentId: string,
    userId: string,
    answers: Array<{ questionId: string; selectedAnswer: string | number }>,
    timeSpent?: number
  ): Promise<ResourceAssessmentResult> {
    try {
      // Fetch assessment
      const assessmentDoc = await firebaseService.getDocument('resourceAssessments', assessmentId);
      if (assessmentDoc == null) {
        throw new Error('Assessment not found');
      }

      const doc = assessmentDoc as Record<string, unknown>;
      const assessmentUserId: string = doc['userId'] as string;
      if (assessmentUserId !== userId) {
        throw new Error('Unauthorized access to assessment');
      }

      // Convert Firestore Timestamps to Dates
      const createdAtValue: unknown = doc['createdAt'];
      const createdAt: Date =
        createdAtValue instanceof admin.firestore.Timestamp
          ? createdAtValue.toDate()
          : createdAtValue instanceof Date
          ? createdAtValue
          : new Date(createdAtValue as string);

      // Extract assessment
      const assessment: ResourceAssessment = {
        id: doc['id'] as string,
        userId: doc['userId'] as string,
        resourceId: doc['resourceId'] as string,
        moduleId: doc['moduleId'] as string,
        pathId: (doc['pathId'] as string) ?? '',
        objectiveId: doc['objectiveId'] as string,
        resourceTitle: doc['resourceTitle'] as string,
        resourceType: doc['resourceType'] as
          | 'documentation'
          | 'book'
          | 'article'
          | 'video'
          | 'tutorial'
          | 'official_guide',
        resourceUrl: doc['resourceUrl'] as string | undefined,
        questions: doc['questions'] as QuizQuestion[],
        status: doc['status'] as 'pending' | 'completed',
        createdAt,
        completedAt: undefined,
        score: doc['score'] as number | undefined,
        passed: doc['passed'] as boolean | undefined,
        correctAnswers: doc['correctAnswers'] as number | undefined,
        totalQuestions: doc['totalQuestions'] as number | undefined,
        timeSpent: doc['timeSpent'] as number | undefined,
      };

      // Check if already completed
      if (assessment.status === 'completed') {
        throw new Error('Assessment already completed');
      }

      const now = new Date();

      // Calculate score and generate feedback
      let correctAnswers = 0;
      const feedback: Array<{
        questionId: string;
        question: string;
        correct: boolean;
        userAnswer: string | number;
        correctAnswer: string | number;
        explanation: string;
      }> = [];
      const answerResults: Array<{
        questionId: string;
        selectedAnswer: string | number;
        correct: boolean;
        explanation?: string;
      }> = [];

      for (const answer of answers) {
        const question = assessment.questions.find(
          (q: QuizQuestion): boolean => q.id === answer.questionId
        );
        if (question != null) {
          // Normalize answers for comparison
          const selected =
            typeof answer.selectedAnswer === 'number'
              ? answer.selectedAnswer
              : String(answer.selectedAnswer);
          const correct = question.correctAnswer;
          const isCorrect = selected === correct;

          if (isCorrect) {
            correctAnswers++;
          }

          // Generate feedback
          const correctAnswerValue =
            typeof correct === 'number' && question.options != null
              ? question.options[correct] ?? correct
              : correct;

          const explanation =
            question.explanation != null && question.explanation !== ''
              ? question.explanation
              : 'No explanation available';

          feedback.push({
            questionId: question.id,
            question: question.question,
            correct: isCorrect,
            userAnswer: answer.selectedAnswer,
            correctAnswer: correctAnswerValue,
            explanation,
          });

          answerResults.push({
            questionId: question.id,
            selectedAnswer: answer.selectedAnswer,
            correct: isCorrect,
            explanation,
          });
        }
      }

      const score = (correctAnswers / assessment.questions.length) * 100;
      const minScore = this.getResourceAssessmentMinScore();
      const passed = score >= minScore;

      // Update assessment
      await firebaseService.updateDocument('resourceAssessments', assessmentId, {
        status: 'completed',
        score,
        passed,
        correctAnswers,
        totalQuestions: assessment.questions.length,
        timeSpent: timeSpent ?? 0,
        completedAt: admin.firestore.Timestamp.fromDate(now),
      });

      // Create result document
      const resultId = `resource_result_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const result: ResourceAssessmentResult = {
        id: resultId,
        userId,
        resourceId: assessment.resourceId,
        assessmentId,
        moduleId: assessment.moduleId,
        objectiveId: assessment.objectiveId,
        resourceTitle: assessment.resourceTitle,
        score,
        correctAnswers,
        totalQuestions: assessment.questions.length,
        timeSpent: timeSpent ?? 0,
        passed,
        answers: answerResults,
        feedback,
        completedAt: now,
      };

      const resultData: Record<string, unknown> = {
        ...result,
        completedAt: admin.firestore.Timestamp.fromDate(now),
      };
      await firebaseService.createDocument('resourceAssessmentResults', resultData, resultId);

      logger.info(
        `Resource assessment ${assessmentId} validated: ${passed ? 'PASSED' : 'FAILED'} (${score}%)`
      );

      // Update module progress if assessment passed (non-blocking)
      if (passed && assessment.pathId != null && assessment.pathId !== '') {
        moduleProgressService
          .updateModuleProgress(assessment.objectiveId, assessment.pathId, assessment.moduleId, userId)
          .catch((error: unknown) => {
            logger.warn('Failed to update module progress after resource assessment', {
              userId,
              moduleId: assessment.moduleId,
              error,
            });
          });
      }

      return result;
    } catch (error: unknown) {
      logger.error('Error submitting resource assessment:', error);
      throw error;
    }
  }

  /**
   * Get resource assessment status
   */
  async getResourceStatus(
    userId: string,
    resourceId: string
  ): Promise<{
    hasAssessment: boolean;
    assessmentId?: string;
    isCompleted: boolean;
    lastScore?: number;
  }> {
    try {
      const assessments = await firebaseService.queryDocuments('resourceAssessments', [
        { field: 'userId', operator: '==', value: userId },
        { field: 'resourceId', operator: '==', value: resourceId },
      ]);

      if (assessments.length === 0) {
        return { hasAssessment: false, isCompleted: false };
      }

      // Get the most recent assessment
      const sorted = assessments.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aCreated = a['createdAt'];
        const bCreated = b['createdAt'];
        const aDate =
          aCreated instanceof admin.firestore.Timestamp
            ? aCreated.toDate()
            : aCreated instanceof Date
            ? aCreated
            : new Date(0);
        const bDate =
          bCreated instanceof admin.firestore.Timestamp
            ? bCreated.toDate()
            : bCreated instanceof Date
            ? bCreated
            : new Date(0);
        return bDate.getTime() - aDate.getTime();
      });

      const latest = sorted[0] as Record<string, unknown>;
      const status = latest['status'] as 'pending' | 'completed';
      const score = latest['score'] as number | undefined;

      return {
        hasAssessment: true,
        assessmentId: latest['id'] as string,
        isCompleted: status === 'completed',
        lastScore: score,
      };
    } catch (error: unknown) {
      logger.error('Error getting resource status:', error);
      return { hasAssessment: false, isCompleted: false };
    }
  }

  /**
   * Get assessment history for a resource
   */
  async getResourceAssessmentHistory(
    userId: string,
    resourceId: string
  ): Promise<ResourceAssessmentResult[]> {
    try {
      const results = await firebaseService.queryDocuments('resourceAssessmentResults', [
        { field: 'userId', operator: '==', value: userId },
        { field: 'resourceId', operator: '==', value: resourceId },
      ]);

      // Sort by completedAt descending (most recent first)
      const sorted = results.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aCompleted = a['completedAt'];
        const bCompleted = b['completedAt'];
        const aDate =
          aCompleted instanceof admin.firestore.Timestamp
            ? aCompleted.toDate()
            : aCompleted instanceof Date
            ? aCompleted
            : new Date(0);
        const bDate =
          bCompleted instanceof admin.firestore.Timestamp
            ? bCompleted.toDate()
            : bCompleted instanceof Date
            ? bCompleted
            : new Date(0);
        return bDate.getTime() - aDate.getTime();
      });

      return sorted.map((result: Record<string, unknown>): ResourceAssessmentResult => {
        const completedAtValue: unknown = result['completedAt'];
        const completedAt: Date =
          completedAtValue instanceof admin.firestore.Timestamp
            ? completedAtValue.toDate()
            : completedAtValue instanceof Date
            ? completedAtValue
            : new Date(completedAtValue as string);

        return {
          id: result['id'] as string,
          userId: result['userId'] as string,
          resourceId: result['resourceId'] as string,
          assessmentId: result['assessmentId'] as string,
          moduleId: result['moduleId'] as string,
          objectiveId: result['objectiveId'] as string,
          resourceTitle: result['resourceTitle'] as string,
          score: result['score'] as number,
          correctAnswers: result['correctAnswers'] as number,
          totalQuestions: result['totalQuestions'] as number,
          timeSpent: result['timeSpent'] as number,
          passed: result['passed'] as boolean,
          answers: result['answers'] as Array<{
            questionId: string;
            selectedAnswer: string | number;
            correct: boolean;
            explanation?: string;
          }>,
          feedback: result['feedback'] as Array<{
            questionId: string;
            question: string;
            correct: boolean;
            userAnswer: string | number;
            correctAnswer: string | number;
            explanation: string;
          }>,
          completedAt,
        };
      });
    } catch (error: unknown) {
      logger.error('Error getting resource assessment history:', error);
      throw error;
    }
  }

  /**
   * Format cooldown time remaining
   */
  private formatCooldownTime(cooldownEndsAt: Date): string {
    const now = new Date();
    const remainingMs = cooldownEndsAt.getTime() - now.getTime();

    if (remainingMs <= 0) {
      return 'quelques secondes';
    }

    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

    if (remainingMinutes < 60) {
      return `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
    }

    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMins = remainingMinutes % 60;

    if (remainingMins === 0) {
      return `${remainingHours} heure${remainingHours > 1 ? 's' : ''}`;
    }

    return `${remainingHours}h ${remainingMins}min`;
  }
}

export const resourceAssessmentService = new ResourceAssessmentService();

