import * as admin from 'firebase-admin';
import { firebaseService } from '@/services/firebase';
import { geminiService } from '@/services/gemini';
import { logger } from '@/utils/logger';
import type { Streak, RecoveryAssessment, RecoveryResult, QuizQuestion } from '@/types';

class StreakService {
  /**
   * Get parse integer base from environment variable
   * Default: 10 (decimal)
   */
  private getParseIntBase(): number {
    const baseEnv = process.env['PARSE_INT_BASE'];
    if (baseEnv != null && baseEnv !== '') {
      const parsed = Number.parseInt(baseEnv, 10);
      if (!Number.isNaN(parsed) && parsed >= 2 && parsed <= 36) {
        return parsed;
      }
    }
    return 10; // Default: 10 (decimal)
  }

  /**
   * Calculate missed days based on last study date
   */
  async calculateMissedDays(
    userId: string
  ): Promise<{ missedDays: number; lastStudyDate: Date | null }> {
    try {
      const streak = await this.getStreak(userId);
      if (streak == null) {
        return { missedDays: 0, lastStudyDate: null };
      }

      const lastStudyDate =
        streak.lastStudyDate instanceof Date
          ? streak.lastStudyDate
          : new Date(streak.lastStudyDate);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastStudy = new Date(lastStudyDate);
      lastStudy.setHours(0, 0, 0, 0);

      const daysSinceLastStudy = Math.floor(
        (today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Missed days = days since last study - 1 (since today doesn't count as missed)
      const missedDays = Math.max(0, daysSinceLastStudy - 1);

      return { missedDays, lastStudyDate };
    } catch (error: unknown) {
      logger.error('Error calculating missed days:', error);
      throw error;
    }
  }

  /**
   * Get active objectives eligible for recovery
   */
  async getActiveObjectivesForRecovery(userId: string): Promise<Array<Record<string, unknown>>> {
    try {
      const objectives = await firebaseService.queryDocuments('objectives', [
        { field: 'userId', operator: '==', value: userId },
        { field: 'status', operator: '==', value: 'in_progress' },
      ]);

      return objectives;
    } catch (error: unknown) {
      logger.error('Error getting active objectives for recovery:', error);
      throw error;
    }
  }

  /**
   * Get max recovery days from environment variable
   * Default: 7 days
   */
  private getMaxRecoveryDays(): number {
    const maxDaysEnv = process.env['STREAK_RECOVERY_MAX_DAYS'];
    if (maxDaysEnv != null && maxDaysEnv !== '') {
      const parsed = Number.parseInt(maxDaysEnv, this.getParseIntBase());
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return 7; // Default: 7 days
  }

  /**
   * Get questions per day from environment variable
   * Default: 10 questions per day
   */
  private getQuestionsPerDay(): number {
    const questionsEnv = process.env['STREAK_RECOVERY_QUESTIONS_PER_DAY'];
    if (questionsEnv != null && questionsEnv !== '') {
      const parsed = Number.parseInt(questionsEnv, this.getParseIntBase());
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return 10; // Default: 10 questions per day
  }

  /**
   * Get max questions from environment variable
   * Default: 30 questions
   */
  private getMaxQuestions(): number {
    const maxQuestionsEnv = process.env['STREAK_RECOVERY_MAX_QUESTIONS'];
    if (maxQuestionsEnv != null && maxQuestionsEnv !== '') {
      const parsed = Number.parseInt(maxQuestionsEnv, this.getParseIntBase());
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return 30; // Default: 30 questions
  }

  /**
   * Calculate question count based on missed days
   * Formula: min(missedDays, MAX_RECOVERY_DAYS) × QUESTIONS_PER_DAY, capped at MAX_QUESTIONS
   */
  calculateQuestionCount(missedDays: number): number {
    const MAX_RECOVERY_DAYS = this.getMaxRecoveryDays();
    const QUESTIONS_PER_DAY = this.getQuestionsPerDay();
    const MAX_QUESTIONS = this.getMaxQuestions();
    const recoverableDays = Math.min(missedDays, MAX_RECOVERY_DAYS);
    const calculated = recoverableDays * QUESTIONS_PER_DAY;
    return Math.min(calculated, MAX_QUESTIONS);
  }

  /**
   * Get cooldown duration in hours from environment variable
   * Default: 1 hour
   */
  private getCooldownHours(): number {
    const cooldownEnv = process.env['STREAK_RECOVERY_COOLDOWN_HOURS'];
    if (cooldownEnv != null && cooldownEnv !== '') {
      const parsed = Number.parseFloat(cooldownEnv);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return 1; // Default: 1 hour
  }

  /**
   * Check if user can attempt recovery (cooldown check)
   */
  async canAttemptRecovery(
    userId: string,
    objectiveId: string
  ): Promise<{ canAttempt: boolean; cooldownEndsAt?: Date }> {
    try {
      const COOLDOWN_HOURS = this.getCooldownHours();
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      const now = new Date();
      const cooldownStart = new Date(now.getTime() - cooldownMs);

      // Check for recent recovery attempts for this objective
      // Query for pending or completed assessments
      const allAttempts = await firebaseService.queryDocuments('recoveryAssessments', [
        { field: 'userId', operator: '==', value: userId },
        { field: 'objectiveId', operator: '==', value: objectiveId },
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
          return { canAttempt: false, cooldownEndsAt };
        }
      }

      return { canAttempt: true };
    } catch (error: unknown) {
      logger.error('Error checking recovery cooldown:', error);
      // On error, allow attempt (fail open)
      return { canAttempt: true };
    }
  }

  /**
   * Generate recovery assessment on demand
   */
  async generateRecoveryAssessment(
    userId: string,
    objectiveId: string,
    missedDays: number
  ): Promise<RecoveryAssessment> {
    try {
      // Check cooldown before generating
      const cooldownCheck = await this.canAttemptRecovery(userId, objectiveId);
      if (!cooldownCheck.canAttempt && cooldownCheck.cooldownEndsAt != null) {
        throw new Error(
          `Vous devez attendre ${this.formatCooldownTime(
            cooldownCheck.cooldownEndsAt
          )} avant de pouvoir réessayer.`
        );
      }

      // Fetch objective details
      const objectiveDoc = await firebaseService.getDocument('objectives', objectiveId);
      if (objectiveDoc == null) {
        throw new Error('Objective not found');
      }

      const objective = objectiveDoc;
      const objectiveUserId: unknown = objective['userId'];
      if (objectiveUserId !== userId) {
        throw new Error('Unauthorized access to objective');
      }

      const objectiveTitle: unknown = objective['title'];
      const objectiveDescription: unknown = objective['description'];
      const objectiveCategory: unknown = objective['category'];
      const objectiveTargetRole: unknown = objective['targetRole'];
      const objectiveCurrentLevel: unknown = objective['currentLevel'];
      const objectiveTargetLevel: unknown = objective['targetLevel'];

      // Limit recovery to max days (from env)
      const MAX_RECOVERY_DAYS = this.getMaxRecoveryDays();
      const recoverableDays = Math.min(missedDays, MAX_RECOVERY_DAYS);

      // Calculate question count based on recoverable days
      const questionCount = this.calculateQuestionCount(recoverableDays);

      // Generate questions using Gemini (on demand)
      logger.info(`Generating ${questionCount} recovery questions for objective ${objectiveId}`);
      const questions: QuizQuestion[] = await geminiService.generateRecoveryAssessmentQuestions(
        {
          title: typeof objectiveTitle === 'string' ? objectiveTitle : '',
          description: typeof objectiveDescription === 'string' ? objectiveDescription : '',
          category: typeof objectiveCategory === 'string' ? objectiveCategory : '',
          targetRole: typeof objectiveTargetRole === 'string' ? objectiveTargetRole : '',
          currentLevel:
            typeof objectiveCurrentLevel === 'string' ? objectiveCurrentLevel : 'beginner',
          targetLevel:
            typeof objectiveTargetLevel === 'string' ? objectiveTargetLevel : 'intermediate',
        },
        missedDays,
        questionCount
      );

      // Create assessment document
      const now = new Date();

      const assessmentId = `recovery_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const assessment: RecoveryAssessment = {
        id: assessmentId,
        userId,
        objectiveId,
        objectiveTitle: typeof objectiveTitle === 'string' ? objectiveTitle : '',
        missedDays: recoverableDays, // Store recoverable days, not total missed days
        questionCount,
        questions,
        status: 'pending',
        createdAt: now,
      };

      // Save to Firestore (convert dates to Firestore Timestamps)
      const assessmentData: Record<string, unknown> = {
        ...assessment,
        createdAt: admin.firestore.Timestamp.fromDate(now),
      };
      await firebaseService.createDocument('recoveryAssessments', assessmentData, assessmentId);

      logger.info(`Recovery assessment ${assessmentId} created successfully`);
      return assessment;
    } catch (error: unknown) {
      logger.error('Error generating recovery assessment:', error);
      throw error;
    }
  }

  /**
   * Validate recovery assessment and update streak
   */
  // eslint-disable-next-line complexity
  async validateRecoveryAssessment(
    assessmentId: string,
    answers: Array<{ questionId: string; selectedAnswer: string | number }>,
    timeSpent?: number // total time in seconds
  ): Promise<RecoveryResult> {
    try {
      // Fetch assessment
      const assessmentDoc = await firebaseService.getDocument('recoveryAssessments', assessmentId);
      if (assessmentDoc == null) {
        throw new Error('Assessment not found');
      }

      // Convert Firestore Timestamps to Dates
      const doc = assessmentDoc;
      const createdAtValue: unknown = doc['createdAt'];

      const createdAt: Date =
        createdAtValue instanceof admin.firestore.Timestamp
          ? createdAtValue.toDate()
          : createdAtValue instanceof Date
          ? createdAtValue
          : new Date(createdAtValue as string);

      // Extract all properties from doc
      const assessment: RecoveryAssessment = {
        id: doc['id'] as string,
        userId: doc['userId'] as string,
        objectiveId: doc['objectiveId'] as string,
        objectiveTitle: doc['objectiveTitle'] as string,
        missedDays: doc['missedDays'] as number,
        questionCount: doc['questionCount'] as number,
        questions: doc['questions'] as QuizQuestion[],
        status: doc['status'] as 'pending' | 'completed',
        createdAt,
        score: doc['score'] as number | undefined,
        passed: doc['passed'] as boolean | undefined,
        recoveredDays: doc['recoveredDays'] as number | undefined,
        completedAt:
          doc['completedAt'] != null
            ? doc['completedAt'] instanceof admin.firestore.Timestamp
              ? doc['completedAt'].toDate()
              : doc['completedAt'] instanceof Date
              ? doc['completedAt']
              : new Date(doc['completedAt'] as string)
            : undefined,
      };

      // Check if already completed
      if (assessment.status === 'completed') {
        throw new Error('Assessment already completed');
      }

      const now = new Date();

      // Limit recovery to max days (from env)
      const MAX_RECOVERY_DAYS = this.getMaxRecoveryDays();
      const recoverableDays = Math.min(assessment.missedDays, MAX_RECOVERY_DAYS);

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

          // Generate feedback for all questions
          const correctAnswerValue =
            typeof correct === 'number' ? question.options[correct] ?? correct : correct;

          feedback.push({
            questionId: question.id,
            question: question.question,
            correct: isCorrect,
            userAnswer: answer.selectedAnswer,
            correctAnswer: correctAnswerValue,
            explanation:
              question.explanation !== '' ? question.explanation : 'No explanation available',
          });
        }
      }

      const score = (correctAnswers / assessment.questionCount) * 100;
      const passed = score >= 70;

      // Calculate average time per question and detect suspicious patterns
      const averageTimePerQuestion =
        timeSpent != null && timeSpent > 0 ? timeSpent / assessment.questionCount : undefined;

      // Suspicious pattern: average time < 5 seconds per question (too fast)
      const suspiciousPattern =
        averageTimePerQuestion != null && averageTimePerQuestion < 5 && passed;

      // Recover days only if passed, but cap at MAX_RECOVERY_DAYS
      const recoveredDays = passed ? recoverableDays : 0;

      // Get current streak
      const streak = await this.getStreak(assessment.userId);
      const currentStreak = streak?.currentStreak ?? 0;
      const newStreak = passed ? currentStreak + recoveredDays : currentStreak;

      // Update assessment
      await firebaseService.updateDocument('recoveryAssessments', assessmentId, {
        status: 'completed',
        score,
        passed,
        recoveredDays,
        completedAt: admin.firestore.Timestamp.fromDate(now),
      });

      // Update streak if passed
      if (passed) {
        await this.updateStreakAfterRecovery(
          assessment.userId,
          recoveredDays,
          assessmentId,
          assessment.objectiveId
        );
      }

      const result: RecoveryResult = {
        assessmentId,
        score,
        passed,
        correctAnswers,
        totalQuestions: assessment.questionCount,
        recoveredDays,
        newStreak,
        feedback,
        averageTimePerQuestion,
        suspiciousPattern,
      };

      logger.info(
        `Recovery assessment ${assessmentId} validated: ${passed ? 'PASSED' : 'FAILED'} (${score}%)`
      );
      return result;
    } catch (error: unknown) {
      logger.error('Error validating recovery assessment:', error);
      throw error;
    }
  }

  /**
   * Update streak after successful recovery
   */
  async updateStreakAfterRecovery(
    userId: string,
    recoveredDays: number,
    assessmentId: string,
    objectiveId: string
  ): Promise<void> {
    try {
      const streak = await this.getStreak(userId);
      const currentStreak = streak?.currentStreak ?? 0;
      const longestStreak = streak?.longestStreak ?? 0;
      const recoveryHistory = streak?.recoveryHistory ?? [];

      const newStreak = currentStreak + recoveredDays;
      const newLongestStreak = Math.max(longestStreak, newStreak);

      const streakData: Streak = {
        userId,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastStudyDate: new Date(),
        missedDays: 0,
        recoveryHistory: [
          ...recoveryHistory,
          {
            date: new Date(),
            recoveredDays,
            assessmentId,
            objectiveId,
          },
        ],
        updatedAt: new Date(),
      };

      // Convert dates to Firestore Timestamps
      const streakDataWithTimestamps: Record<string, unknown> = {
        ...streakData,
        lastStudyDate: admin.firestore.Timestamp.fromDate(streakData.lastStudyDate),
        updatedAt: admin.firestore.Timestamp.fromDate(streakData.updatedAt),
        recoveryHistory: streakData.recoveryHistory.map(
          (entry: {
            date: Date;
            recoveredDays: number;
            assessmentId: string;
            objectiveId: string;
          }): Record<string, unknown> => ({
            ...entry,
            date: admin.firestore.Timestamp.fromDate(entry.date),
          })
        ),
      };
      await firebaseService.createDocument('streaks', streakDataWithTimestamps, userId);
      logger.info(`Streak updated for user ${userId}: ${currentStreak} → ${newStreak}`);
    } catch (error: unknown) {
      logger.error('Error updating streak after recovery:', error);
      throw error;
    }
  }

  /**
   * Recalculate streak based on current date
   * This method checks if the streak is still valid and updates the values accordingly
   * WITHOUT persisting to the database (read-only operation)
   * 
   * @param streak - The streak object from the database
   * @returns The streak with recalculated values based on current date
   */
  private recalculateStreakFromLastStudy(streak: Streak): Streak {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const lastStudy = new Date(streak.lastStudyDate);
    lastStudy.setHours(0, 0, 0, 0);

    const daysSinceLastStudy = Math.floor(
      (today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Streak is still active if:
    // - Studied today (0 days since last study) OR
    // - Studied yesterday (1 day since last study - grace period)
    const isStreakActive = daysSinceLastStudy <= 1;

    if (!isStreakActive && daysSinceLastStudy >= 2) {
      // Streak is broken - recalculate values
      const missedDays = daysSinceLastStudy - 1; // Don't count today as missed
      
      logger.info('Streak recalculated as broken', {
        userId: streak.userId,
        oldStreak: streak.currentStreak,
        daysSinceLastStudy,
        missedDays,
        lastStudyDate: streak.lastStudyDate.toISOString(),
      });

      return {
        ...streak,
        currentStreak: 0,              // Reset to 0 when broken
        missedDays,                    // Update missed days count
      };
    }

    // Streak is still active - return as is
    logger.debug('Streak still active', {
      userId: streak.userId,
      currentStreak: streak.currentStreak,
      daysSinceLastStudy,
    });

    return streak;
  }

  /**
   * Get or create streak for user
   * Always returns recalculated values based on current date
   */
  async getStreak(userId: string): Promise<Streak | null> {
    try {
      const streakDoc = await firebaseService.getDocument('streaks', userId);
      if (streakDoc == null) {
        // Create initial streak
        const now = new Date();
        const initialStreak: Streak = {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: now,
          missedDays: 0,
          recoveryHistory: [],
          updatedAt: now,
        };
        const initialStreakData: Record<string, unknown> = {
          ...initialStreak,
          lastStudyDate: admin.firestore.Timestamp.fromDate(now),
          updatedAt: admin.firestore.Timestamp.fromDate(now),
        };
        await firebaseService.createDocument('streaks', initialStreakData, userId);
        return initialStreak;
      }
      // Convert Firestore Timestamps to Dates
      const streak = streakDoc;
      const lastStudyDateValue: unknown = streak['lastStudyDate'];
      const updatedAtValue: unknown = streak['updatedAt'];
      const recoveryHistoryValue: unknown = streak['recoveryHistory'];

      const lastStudyDateConverted: Date =
        lastStudyDateValue != null &&
        typeof lastStudyDateValue === 'object' &&
        'toDate' in lastStudyDateValue
          ? (lastStudyDateValue as admin.firestore.Timestamp).toDate()
          : lastStudyDateValue instanceof Date
          ? lastStudyDateValue
          : new Date();

      const updatedAtConverted: Date =
        updatedAtValue != null && typeof updatedAtValue === 'object' && 'toDate' in updatedAtValue
          ? (updatedAtValue as admin.firestore.Timestamp).toDate()
          : updatedAtValue instanceof Date
          ? updatedAtValue
          : new Date();

      const recoveryHistoryConverted: Array<{
        date: Date;
        recoveredDays: number;
        assessmentId: string;
        objectiveId: string;
      }> = Array.isArray(recoveryHistoryValue)
        ? recoveryHistoryValue.map(
            (
              entry: Record<string, unknown>
            ): { date: Date; recoveredDays: number; assessmentId: string; objectiveId: string } => {
              const dateValue: unknown = entry['date'];
              const dateConverted: Date =
                dateValue != null && typeof dateValue === 'object' && 'toDate' in dateValue
                  ? (dateValue as admin.firestore.Timestamp).toDate()
                  : dateValue instanceof Date
                  ? dateValue
                  : new Date();
              return {
                ...entry,
                date: dateConverted,
              } as {
                date: Date;
                recoveredDays: number;
                assessmentId: string;
                objectiveId: string;
              };
            }
          )
        : [];

      const rawStreak = {
        ...streak,
        lastStudyDate: lastStudyDateConverted,
        updatedAt: updatedAtConverted,
        recoveryHistory: recoveryHistoryConverted,
      } as Streak;

      // Recalculate streak based on current date before returning
      // This ensures the frontend always gets accurate data
      return this.recalculateStreakFromLastStudy(rawStreak);
    } catch (error: unknown) {
      logger.error('Error getting streak:', error);
      throw error;
    }
  }

  /**
   * Update streak when user studies
   * This method is idempotent: calling it multiple times on the same day won't cause issues
   */
  async updateStreakOnStudy(userId: string): Promise<void> {
    try {
      const streak = await this.getStreak(userId);
      if (streak == null) {
        logger.warn('Cannot update streak: streak not found', { userId });
        return;
      }

      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      const lastStudy = new Date(streak.lastStudyDate);
      lastStudy.setHours(0, 0, 0, 0);

      const daysSinceLastStudy = Math.floor(
        (today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Si même jour, pas de changement (idempotent)
      if (daysSinceLastStudy === 0) {
        logger.debug('Streak update skipped: same day', { userId });
        return;
      }

      let newStreak: number;
      if (daysSinceLastStudy === 1) {
        // Jour consécutif, incrémenter
        newStreak = streak.currentStreak + 1;
        logger.info('Streak incremented', {
          userId,
          oldStreak: streak.currentStreak,
          newStreak,
        });
      } else {
        // Streak brisé, reset à 1
        newStreak = 1;
        logger.info('Streak reset', {
          userId,
          oldStreak: streak.currentStreak,
          daysSince: daysSinceLastStudy,
        });
      }

      const newLongestStreak = Math.max(streak.longestStreak, newStreak);

      await firebaseService.updateDocument('streaks', userId, {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastStudyDate: admin.firestore.Timestamp.fromDate(now),
        missedDays: 0, // Reset missed days when studying
        updatedAt: admin.firestore.Timestamp.fromDate(now),
      });

      logger.info('Streak updated successfully', {
        userId,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
      });
    } catch (error: unknown) {
      logger.error('Error updating streak on study:', error);
      // Ne pas throw pour ne pas casser le flux principal
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

export const streakService = new StreakService();
