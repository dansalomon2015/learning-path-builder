import * as admin from 'firebase-admin';
import { firebaseService } from '@/services/firebase';
import { geminiService } from '@/services/gemini';
import { logger } from '@/utils/logger';
import type { QuizQuestion } from '@/types';
import { completeModuleAndUpdateProgress } from '@/utils/progressHelpers';
import { moduleProgressService } from '@/services/moduleProgressService';

export interface ModuleFinalExam {
  id: string;
  userId: string;
  moduleId: string;
  pathId: string;
  objectiveId: string;
  moduleTitle: string;
  questions: QuizQuestion[];
  status: 'pending' | 'completed';
  createdAt: Date;
  completedAt?: Date;
  score?: number;
  passed?: boolean;
  correctAnswers?: number;
  totalQuestions?: number;
  timeSpent?: number;
}

export interface ModuleFinalExamResult {
  id: string;
  userId: string;
  moduleId: string;
  pathId: string;
  objectiveId: string;
  examId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  passed: boolean;
  answers: Array<{
    questionId: string;
    selectedAnswer: string | number;
    correct: boolean;
    explanation?: string;
  }>;
  feedback: Array<{
    questionId: string;
    question: string;
    correct: boolean;
    userAnswer: string | number;
    correctAnswer: string | number;
    explanation: string;
  }>;
  completedAt: Date;
}

class ModuleFinalExamService {
  /**
   * Get question count from environment variable
   * Default: 10 questions
   */
  private getQuestionCount(): number {
    const questionCountEnv = process.env['MODULE_FINAL_EXAM_QUESTION_COUNT'];
    if (questionCountEnv != null && questionCountEnv !== '') {
      const parsed = Number.parseInt(questionCountEnv, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return 10; // Default: 10 questions
  }

  /**
   * Get minimum score to pass from environment variable
   * Default: 80%
   */
  private getMinScore(): number {
    const minScoreEnv = process.env['MODULE_FINAL_EXAM_MIN_SCORE'];
    if (minScoreEnv != null && minScoreEnv !== '') {
      const parsed = Number.parseFloat(minScoreEnv);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        return parsed;
      }
    }
    return 80; // Default: 80%
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
   * Check if user can take the final exam
   * Requirements: At least one passed resource assessment (> min score) for each resource
   */
  async canTakeFinalExam(
    userId: string,
    moduleId: string
  ): Promise<{ canTake: boolean; missingResources?: string[]; reason?: string }> {
    try {
      // Get all objectives for the user to find the module
      const allObjectives = await firebaseService.queryDocuments('objectives', [
        { field: 'userId', operator: '==', value: userId },
      ]);

      let module: Record<string, unknown> | null = null;
      const resources: Array<{ id: string; title: string }> = [];

      // Find module in objectives
      for (const obj of allObjectives) {
        const learningPaths = (obj['learningPaths'] as Array<Record<string, unknown>>) ?? [];
        for (const path of learningPaths) {
          const modules = (path['modules'] as Array<Record<string, unknown>>) ?? [];
          const foundModule = modules.find((m: Record<string, unknown>): boolean => m['id'] === moduleId);
          if (foundModule != null) {
            module = foundModule;
            const suggestedResources = (foundModule['suggestedResources'] as Array<Record<string, unknown>>) ?? [];
            for (const resource of suggestedResources) {
              resources.push({
                id: (resource['id'] as string) ?? '',
                title: (resource['title'] as string) ?? '',
              });
            }
            break;
          }
        }
        if (module != null) {
          break;
        }
      }

      if (module == null) {
        return { canTake: false, reason: 'Module not found' };
      }

      if (resources.length === 0) {
        return { canTake: true }; // No resources, can take exam
      }

      // Check resource assessments
      const minScore = this.getResourceAssessmentMinScore();
      const missingResources: string[] = [];

      for (const resource of resources) {
        const assessments = await firebaseService.queryDocuments('resourceAssessments', [
          { field: 'userId', operator: '==', value: userId },
          { field: 'resourceId', operator: '==', value: resource.id },
          { field: 'moduleId', operator: '==', value: moduleId },
          { field: 'status', operator: '==', value: 'completed' },
        ]);

        // Check if at least one assessment has score >= minScore
        const hasPassedAssessment = assessments.some((assessment: Record<string, unknown>): boolean => {
          const score = (assessment['score'] as number) ?? 0;
          return score >= minScore;
        });

        if (!hasPassedAssessment) {
          missingResources.push(resource.title);
        }
      }

      if (missingResources.length > 0) {
        return {
          canTake: false,
          missingResources,
          reason: `You must pass at least one assessment (> ${minScore}%) for each resource`,
        };
      }

      return { canTake: true };
    } catch (error: unknown) {
      logger.error('Error checking final exam eligibility:', error);
      return { canTake: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * Create a new module final exam
   */
  async createExam(
    userId: string,
    moduleId: string,
    pathId: string,
    objectiveId: string
  ): Promise<ModuleFinalExam> {
    try {
      // Get module details
      const objectiveDoc = await firebaseService.getDocument('objectives', objectiveId);
      if (objectiveDoc == null) {
        throw new Error('Objective not found');
      }

      const learningPaths = (objectiveDoc['learningPaths'] as Array<Record<string, unknown>>) ?? [];
      const path = learningPaths.find((p: Record<string, unknown>): boolean => p['id'] === pathId);
      if (path == null) {
        throw new Error('Path not found');
      }

      const modules = (path['modules'] as Array<Record<string, unknown>>) ?? [];
      const module = modules.find((m: Record<string, unknown>): boolean => m['id'] === moduleId);
      if (module == null) {
        throw new Error('Module not found');
      }

      const moduleTitle = (module['title'] as string) ?? '';
      const moduleDescription = (module['description'] as string) ?? '';
      const moduleType = (module['type'] as string) ?? 'theory';

      // Get objective details
      const objectiveTitle = (objectiveDoc['title'] as string) ?? '';
      const objectiveCategory = (objectiveDoc['category'] as string) ?? '';
      const targetRole = (objectiveDoc['targetRole'] as string) ?? '';

      // Generate questions using Gemini
      const questionCount = this.getQuestionCount();
      logger.info(`Generating ${questionCount} final exam questions for module ${moduleId}`);

      const questions: QuizQuestion[] = await geminiService.generateModuleFinalExamQuestions(
        {
          moduleTitle,
          moduleDescription,
          moduleType,
        },
        {
          objectiveTitle,
          objectiveCategory,
          targetRole,
        },
        questionCount
      );

      // Create exam document
      const now = new Date();
      const examId = `module_final_exam_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const exam: ModuleFinalExam = {
        id: examId,
        userId,
        moduleId,
        pathId,
        objectiveId,
        moduleTitle,
        questions,
        status: 'pending',
        createdAt: now,
      };

      // Save to Firestore
      const examData: Record<string, unknown> = {
        ...exam,
        createdAt: admin.firestore.Timestamp.fromDate(now),
      };
      await firebaseService.createDocument('moduleFinalExams', examData, examId);

      logger.info(`Module final exam ${examId} created successfully`);
      return exam;
    } catch (error: unknown) {
      logger.error('Error creating module final exam:', error);
      throw error;
    }
  }

  /**
   * Submit and validate module final exam
   */
  async submitExam(
    examId: string,
    userId: string,
    answers: Array<{ questionId: string; selectedAnswer: string | number }>,
    timeSpent?: number
  ): Promise<ModuleFinalExamResult> {
    try {
      const examDoc = await firebaseService.getDocument('moduleFinalExams', examId);
      if (examDoc == null) {
        throw new Error('Exam not found');
      }

      const exam = examDoc as unknown as ModuleFinalExam;
      if (exam.userId !== userId) {
        throw new Error('Unauthorized');
      }

      if (exam.status === 'completed') {
        throw new Error('Exam already completed');
      }

      const now = new Date();
      let correctAnswers = 0;
      const answerResults: Array<{
        questionId: string;
        selectedAnswer: string | number;
        correct: boolean;
        explanation?: string;
      }> = [];

      const feedback: Array<{
        questionId: string;
        question: string;
        correct: boolean;
        userAnswer: string | number;
        correctAnswer: string | number;
        explanation: string;
      }> = [];

      for (const answer of answers) {
        const question = exam.questions.find((q: QuizQuestion): boolean => q.id === answer.questionId);
        if (question != null) {
          const selected =
            typeof answer.selectedAnswer === 'number'
              ? answer.selectedAnswer
              : String(answer.selectedAnswer);
          const correct = question.correctAnswer;
          const isCorrect = selected === correct;

          if (isCorrect) {
            correctAnswers++;
          }

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

      const score = (correctAnswers / exam.questions.length) * 100;
      const minScore = this.getMinScore();
      const passed = score >= minScore;

      // Update exam
      await firebaseService.updateDocument('moduleFinalExams', examId, {
        status: 'completed',
        score,
        passed,
        correctAnswers,
        totalQuestions: exam.questions.length,
        timeSpent: timeSpent ?? 0,
        completedAt: admin.firestore.Timestamp.fromDate(now),
      });

      // Create result document
      const resultId = `module_final_exam_result_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const result: ModuleFinalExamResult = {
        id: resultId,
        userId,
        moduleId: exam.moduleId,
        pathId: exam.pathId,
        objectiveId: exam.objectiveId,
        examId,
        score,
        correctAnswers,
        totalQuestions: exam.questions.length,
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
      await firebaseService.createDocument('moduleFinalExamResults', resultData, resultId);

      // Update module progress (this will mark as completed if progress >= 100% and final exam passed)
      if (passed) {
        await moduleProgressService.updateModuleProgress(
          exam.objectiveId,
          exam.pathId,
          exam.moduleId,
          userId
        );
      }

      logger.info(`Module final exam ${examId} submitted. Score: ${score}%, Passed: ${passed}`);
      return result;
    } catch (error: unknown) {
      logger.error('Error submitting module final exam:', error);
      throw error;
    }
  }

  /**
   * Complete module after passing final exam
   * Uses the shared completeModuleAndUpdateProgress helper
   */
  private async completeModule(
    objectiveId: string,
    pathId: string,
    moduleId: string
  ): Promise<void> {
    try {
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

      const module: Record<string, unknown> = modules[moduleIndex] ?? {};

      // Use shared helper to complete module and update all progress
      const { objectiveProgress }: { objectiveProgress: number } = completeModuleAndUpdateProgress({
        learningPaths,
        pathIndex,
        path,
        modules,
        moduleIndex,
        module,
        context: 'after passing final exam',
      });

      // Update objective
      await firebaseService.updateDocument('objectives', objectiveId, {
        learningPaths,
        progress: objectiveProgress,
        updatedAt: new Date().toISOString(),
      });

      logger.info(`Module ${moduleId} marked as completed after passing final exam`);
    } catch (error: unknown) {
      logger.error('Error completing module:', error);
      throw error;
    }
  }
}

export const moduleFinalExamService = new ModuleFinalExamService();

