import { logger } from '@/utils/logger';
import { firebaseService } from './firebase';
import { geminiService } from './gemini';

export interface LearningAnalytics {
  totalStudyTime: number;
  averageScore: number;
  masteryLevel: number;
  weakAreas: string[];
  strongAreas: string[];
  learningVelocity: number;
  retentionRate: number;
  recommendations: string[];
}

export interface ObjectiveAnalytics extends LearningAnalytics {
  objectiveId: string;
  objectiveTitle: string;
  learningPathsCount: number;
  modulesCount: number;
  sessionsCount: number;
  completionRate: number; // percentage of completed modules
  progressTimeline: Array<{
    date: string;
    studyTime: number;
    masteryLevel: number;
    score: number;
  }>;
}

export interface StudyPattern {
  preferredTimeOfDay: string;
  averageSessionLength: number;
  mostEffectiveMode: 'flashcards' | 'quiz' | 'mixed';
  difficultyProgression: number;
}

export class AnalyticsService {
  // Get comprehensive learning analytics for a user
  async getUserAnalytics(
    userId: string,
    timeRange: 'week' | 'month' | 'all' = 'month'
  ): Promise<LearningAnalytics> {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'all':
          startDate.setFullYear(2020); // Arbitrary start date
          break;
      }

      // Get study sessions
      const studySessions = await firebaseService.queryDocuments('studySessions', [
        { field: 'userId', operator: '==', value: userId },
        { field: 'isCompleted', operator: '==', value: true },
        { field: 'startTime', operator: '>=', value: startDate },
        { field: 'startTime', operator: '<=', value: endDate },
      ]);

      // Get learning plans
      const learningPlans = await firebaseService.queryDocuments('learningPlans', [
        { field: 'userId', operator: '==', value: userId },
      ]);

      // Calculate analytics
      const totalStudyTime = studySessions.reduce(
        (sum: number, session: Record<string, unknown>): number => {
          const duration: unknown = session['duration'];
          return sum + (typeof duration === 'number' ? duration : 0);
        },
        0
      );
      const averageScore =
        studySessions.length > 0
          ? studySessions.reduce((sum: number, session: Record<string, unknown>): number => {
              const score: unknown = session['score'];
              return sum + (typeof score === 'number' ? score : 0);
            }, 0) / studySessions.length
          : 0;

      const totalCards = learningPlans.reduce(
        (sum: number, plan: Record<string, unknown>): number => {
          const totalCardsValue: unknown = plan['totalCards'];
          return sum + (typeof totalCardsValue === 'number' ? totalCardsValue : 0);
        },
        0
      );
      const masteredCards = learningPlans.reduce(
        (sum: number, plan: Record<string, unknown>): number => {
          const masteredCardsValue: unknown = plan['masteredCards'];
          return sum + (typeof masteredCardsValue === 'number' ? masteredCardsValue : 0);
        },
        0
      );
      const masteryLevel = totalCards > 0 ? (masteredCards / totalCards) * 100 : 0;

      // Analyze weak and strong areas
      const weakAreas = await this.analyzeWeakAreas(userId, studySessions);
      const strongAreas = await this.analyzeStrongAreas(userId, studySessions);

      // Calculate learning velocity (cards mastered per hour)
      const learningVelocity = totalStudyTime > 0 ? masteredCards / (totalStudyTime / 3600) : 0;

      // Calculate retention rate (based on spaced repetition effectiveness)
      const retentionRate = await this.calculateRetentionRate(userId, studySessions);

      // Generate AI-powered recommendations
      const recommendations = await this.generateRecommendations(userId, {
        totalStudyTime,
        averageScore,
        masteryLevel,
        weakAreas,
        strongAreas,
        learningVelocity,
        retentionRate,
      });

      return {
        totalStudyTime,
        averageScore: Math.round(averageScore),
        masteryLevel: Math.round(masteryLevel),
        weakAreas,
        strongAreas,
        learningVelocity: Math.round(learningVelocity * 100) / 100,
        retentionRate: Math.round(retentionRate),
        recommendations,
      };
    } catch (error: unknown) {
      logger.error('Error getting user analytics:', error);
      throw error;
    }
  }

  // Analyze study patterns to provide insights
  async getStudyPatterns(userId: string): Promise<StudyPattern> {
    try {
      const studySessions = await firebaseService.queryDocuments('studySessions', [
        { field: 'userId', operator: '==', value: userId },
        { field: 'isCompleted', operator: '==', value: true },
      ]);

      if (studySessions.length === 0) {
        return {
          preferredTimeOfDay: 'morning',
          averageSessionLength: 15,
          mostEffectiveMode: 'mixed',
          difficultyProgression: 0,
        };
      }

      // Analyze time of day preferences
      const timeOfDayCounts: { [key: string]: number } = {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0,
      };
      studySessions.forEach((session: Record<string, unknown>): void => {
        const startTime: unknown = session['startTime'];
        if (
          startTime instanceof Date ||
          typeof startTime === 'string' ||
          typeof startTime === 'number'
        ) {
          const hour: number = new Date(startTime).getHours();
          const morningCount: number = timeOfDayCounts['morning'] ?? 0;
          const afternoonCount: number = timeOfDayCounts['afternoon'] ?? 0;
          const eveningCount: number = timeOfDayCounts['evening'] ?? 0;
          const nightCount: number = timeOfDayCounts['night'] ?? 0;
          if (hour >= 6 && hour < 12) {
            timeOfDayCounts['morning'] = morningCount + 1;
          } else if (hour >= 12 && hour < 18) {
            timeOfDayCounts['afternoon'] = afternoonCount + 1;
          } else if (hour >= 18 && hour < 22) {
            timeOfDayCounts['evening'] = eveningCount + 1;
          } else {
            timeOfDayCounts['night'] = nightCount + 1;
          }
        }
      });

      const preferredTimeOfDay = Object.entries(timeOfDayCounts).reduce(
        (a: [string, number], b: [string, number]): [string, number] => {
          const aCount: number = timeOfDayCounts[a[0]] ?? 0;
          const bCount: number = timeOfDayCounts[b[0]] ?? 0;
          return aCount > bCount ? a : b;
        }
      )[0];

      // Calculate average session length
      const averageSessionLength = Math.round(
        studySessions.reduce((sum: number, session: Record<string, unknown>): number => {
          const duration: unknown = session['duration'];
          return sum + (typeof duration === 'number' ? duration : 0);
        }, 0) /
          studySessions.length /
          60
      );

      // Analyze most effective study mode
      const modeScores: { [key: string]: number } = { flashcards: 0, quiz: 0, mixed: 0 };
      const modeCounts: { [key: string]: number } = { flashcards: 0, quiz: 0, mixed: 0 };

      studySessions.forEach((session: Record<string, unknown>): void => {
        const modeValue: unknown = session['mode'];
        const mode: string =
          typeof modeValue === 'string' &&
          (modeValue === 'flashcards' || modeValue === 'quiz' || modeValue === 'mixed')
            ? modeValue
            : 'mixed';
        const score: unknown = session['score'];
        const currentModeScore: number = modeScores[mode] ?? 0;
        const currentModeCount: number = modeCounts[mode] ?? 0;
        modeScores[mode] = currentModeScore + (typeof score === 'number' ? score : 0);
        modeCounts[mode] = currentModeCount + 1;
      });

      const mostEffectiveMode = Object.entries(modeScores)
        .map((entry: [string, number]): { mode: string; averageScore: number } => {
          const mode: string = entry[0];
          const totalScore: number = entry[1];
          return {
            mode,
            averageScore: (modeCounts[mode] ?? 0) > 0 ? totalScore / (modeCounts[mode] ?? 1) : 0,
          };
        })
        .reduce(
          (
            a: { mode: string; averageScore: number },
            b: { mode: string; averageScore: number }
          ): { mode: string; averageScore: number } => (a.averageScore > b.averageScore ? a : b)
        ).mode as 'flashcards' | 'quiz' | 'mixed';

      // Calculate difficulty progression
      const difficultyProgression = await this.calculateDifficultyProgression(
        userId,
        studySessions
      );

      return {
        preferredTimeOfDay,
        averageSessionLength,
        mostEffectiveMode,
        difficultyProgression,
      };
    } catch (error: unknown) {
      logger.error('Error analyzing study patterns:', error);
      throw error;
    }
  }

  // Generate personalized learning recommendations
  async generateRecommendations(
    _userId: string,
    analytics: Partial<LearningAnalytics>
  ): Promise<string[]> {
    try {
      const prompt = `
        Based on the following learning analytics for a user, generate 5 personalized recommendations:
        
        - Total Study Time: ${analytics.totalStudyTime} minutes
        - Average Score: ${analytics.averageScore}%
        - Mastery Level: ${analytics.masteryLevel}%
        - Learning Velocity: ${analytics.learningVelocity} cards/hour
        - Retention Rate: ${analytics.retentionRate}%
        - Weak Areas: ${analytics.weakAreas?.join(', ')}
        - Strong Areas: ${analytics.strongAreas?.join(', ')}
        
        Provide specific, actionable recommendations to improve their learning experience.
        Focus on:
        1. Study schedule optimization
        2. Difficulty adjustment
        3. Learning method improvements
        4. Focus areas to strengthen
        5. Motivation and engagement
        
        Return only the recommendations, one per line, without numbering.
      `;

      const response: string = await geminiService.generateText(prompt);
      return response.split('\n').filter((line: string): boolean => line.trim().length > 0);
    } catch (error: unknown) {
      logger.error('Error generating recommendations:', error);
      // Fallback recommendations
      return [
        'Maintain a consistent study schedule',
        'Focus on your weak areas with additional practice',
        'Use spaced repetition for better retention',
        'Take breaks between study sessions',
        'Review mastered content periodically',
      ];
    }
  }

  // Private helper methods
  private analyzeWeakAreas(
    userId: string,
    _sessions: Array<Record<string, unknown>>
  ): Promise<string[]> {
    // Analyze flashcards with low mastery levels
    return firebaseService
      .queryDocuments('learningPlans', [{ field: 'userId', operator: '==', value: userId }])
      .then((learningPlans: Array<Record<string, unknown>>): string[] => {
        const weakCards: Array<Record<string, unknown>> = learningPlans.flatMap(
          (plan: Record<string, unknown>): Array<Record<string, unknown>> => {
            const flashcards: unknown = plan['flashcards'];
            if (Array.isArray(flashcards)) {
              return (flashcards as Array<Record<string, unknown>>).filter(
                (card: Record<string, unknown>): boolean => {
                  const masteryLevel: unknown = card['masteryLevel'];
                  return typeof masteryLevel === 'number' && masteryLevel < 50;
                }
              );
            }
            return [];
          }
        );

        const weakCategories: string[] = [
          ...new Set(
            weakCards.map((card: Record<string, unknown>): string => {
              const category: unknown = card['category'];
              return typeof category === 'string' ? category : 'general';
            })
          ),
        ];
        return weakCategories.slice(0, 3); // Top 3 weak areas
      });
  }

  private analyzeStrongAreas(
    userId: string,
    _sessions: Array<Record<string, unknown>>
  ): Promise<string[]> {
    return firebaseService
      .queryDocuments('learningPlans', [{ field: 'userId', operator: '==', value: userId }])
      .then((learningPlans: Array<Record<string, unknown>>): string[] => {
        const strongCards: Array<Record<string, unknown>> = learningPlans.flatMap(
          (plan: Record<string, unknown>): Array<Record<string, unknown>> => {
            const flashcards: unknown = plan['flashcards'];
            if (Array.isArray(flashcards)) {
              return (flashcards as Array<Record<string, unknown>>).filter(
                (card: Record<string, unknown>): boolean => {
                  const masteryLevel: unknown = card['masteryLevel'];
                  return typeof masteryLevel === 'number' && masteryLevel >= 80;
                }
              );
            }
            return [];
          }
        );

        const strongCategories: string[] = [
          ...new Set(
            strongCards.map((card: Record<string, unknown>): string => {
              const category: unknown = card['category'];
              return typeof category === 'string' ? category : 'general';
            })
          ),
        ];
        return strongCategories.slice(0, 3); // Top 3 strong areas
      });
  }

  private calculateRetentionRate(
    _userId: string,
    sessions: Array<Record<string, unknown>>
  ): Promise<number> {
    // Calculate retention based on spaced repetition effectiveness
    const recentSessions = sessions.slice(-10); // Last 10 sessions
    if (recentSessions.length === 0) {
      return Promise.resolve(0);
    }

    const totalQuestions = recentSessions.reduce(
      (sum: number, session: Record<string, unknown>): number => {
        const totalQuestionsValue: unknown = session['totalQuestions'];
        return sum + (typeof totalQuestionsValue === 'number' ? totalQuestionsValue : 0);
      },
      0
    );
    const correctAnswers = recentSessions.reduce(
      (sum: number, session: Record<string, unknown>): number => {
        const correctAnswersValue: unknown = session['correctAnswers'];
        return sum + (typeof correctAnswersValue === 'number' ? correctAnswersValue : 0);
      },
      0
    );

    return Promise.resolve(totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0);
  }

  private calculateDifficultyProgression(
    _userId: string,
    sessions: Array<Record<string, unknown>>
  ): Promise<number> {
    if (sessions.length < 2) {
      return Promise.resolve(0);
    }

    const recentSessions = sessions.slice(-5); // Last 5 sessions
    const olderSessions = sessions.slice(-10, -5); // Previous 5 sessions

    const recentAvgScore =
      recentSessions.reduce((sum: number, session: Record<string, unknown>): number => {
        const score: unknown = session['score'];
        return sum + (typeof score === 'number' ? score : 0);
      }, 0) / recentSessions.length;
    const olderAvgScore =
      olderSessions.reduce((sum: number, session: Record<string, unknown>): number => {
        const score: unknown = session['score'];
        return sum + (typeof score === 'number' ? score : 0);
      }, 0) / olderSessions.length;

    return Promise.resolve(recentAvgScore - olderAvgScore); // Positive means improvement
  }

  // Get analytics for a specific objective
  // eslint-disable-next-line max-lines-per-function
  async getObjectiveAnalytics(
    userId: string,
    objectiveId: string,
    timeRange: 'week' | 'month' | 'all' = 'month'
  ): Promise<ObjectiveAnalytics> {
    try {
      // Get the objective
      const objective = await firebaseService.getDocument('objectives', objectiveId);
      if (objective == null) {
        throw new Error('Objective not found');
      }
      const objectiveData = objective as {
        userId: string;
        title: string;
        learningPaths?: Array<Record<string, unknown>>;
      };
      if (objectiveData.userId !== userId) {
        throw new Error('Access denied');
      }

      // Get time range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'all':
          startDate.setFullYear(2020);
          break;
      }

      // Get all learning paths for this objective
      const learningPaths = (objectiveData.learningPaths ?? []) as Array<{
        id: string;
        modules?: Array<Record<string, unknown>>;
        isCompleted?: boolean;
      }>;

      // Extract all module IDs from all learning paths
      const moduleIds = new Set<string>();
      learningPaths.forEach((path: { modules?: Array<Record<string, unknown>> }): void => {
        if (Array.isArray(path.modules)) {
          path.modules.forEach((module: Record<string, unknown>): void => {
            const moduleId: unknown = module['id'];
            if (typeof moduleId === 'string') {
              moduleIds.add(moduleId);
            }
          });
        }
      });

      // Get all learning plans that are linked to this objective's modules/paths
      // We'll query by userId first, then filter by objectiveId, learningPathId, or moduleId
      const allLearningPlans = await firebaseService.queryDocuments('learningPlans', [
        { field: 'userId', operator: '==', value: userId },
      ]);

      // Filter learning plans that belong to this objective
      // Check if plan has objectiveId, learningPathId in objective's paths, or moduleId in objective's modules
      const relevantPlanIds = allLearningPlans
        .filter((plan: Record<string, unknown>): boolean => {
          const planObjectiveId: unknown = plan['objectiveId'];
          const planPathId: unknown = plan['learningPathId'];
          const planModuleId: unknown = plan['moduleId'];

          if (typeof planObjectiveId === 'string' && planObjectiveId === objectiveId) {
            return true;
          }
          if (typeof planPathId === 'string') {
            const pathExists = learningPaths.some(
              (path: { id: string }): boolean => path.id === planPathId
            );
            if (pathExists) {
              return true;
            }
          }
          if (typeof planModuleId === 'string' && moduleIds.has(planModuleId)) {
            return true;
          }
          return false;
        })
        .map((plan: Record<string, unknown>): string => {
          const id: unknown = plan['id'];
          return typeof id === 'string' ? id : '';
        })
        .filter((id: string): boolean => id !== '');

      // Get all study sessions for these learning plans
      const allSessions = await firebaseService.queryDocuments('studySessions', [
        { field: 'userId', operator: '==', value: userId },
        { field: 'isCompleted', operator: '==', value: true },
        { field: 'startTime', operator: '>=', value: startDate },
        { field: 'startTime', operator: '<=', value: endDate },
      ]);

      const relevantSessions = allSessions.filter((session: Record<string, unknown>): boolean => {
        const sessionPlanId: unknown = session['learningPlanId'];
        return (
          typeof sessionPlanId === 'string' &&
          relevantPlanIds.includes(sessionPlanId) &&
          relevantPlanIds.length > 0
        );
      });

      // Calculate analytics for this objective
      const totalStudyTime = relevantSessions.reduce(
        (sum: number, session: Record<string, unknown>): number => {
          const duration: unknown = session['duration'];
          return sum + (typeof duration === 'number' ? duration : 0);
        },
        0
      );

      const averageScore =
        relevantSessions.length > 0
          ? relevantSessions.reduce((sum: number, session: Record<string, unknown>): number => {
              const score: unknown = session['score'];
              return sum + (typeof score === 'number' ? score : 0);
            }, 0) / relevantSessions.length
          : 0;

      // Calculate mastery from relevant learning plans
      const relevantPlans = allLearningPlans.filter((plan: Record<string, unknown>): boolean => {
        const planId: unknown = plan['id'];
        return typeof planId === 'string' && relevantPlanIds.includes(planId);
      });

      const totalCards = relevantPlans.reduce(
        (sum: number, plan: Record<string, unknown>): number => {
          const totalCardsValue: unknown = plan['totalCards'];
          return sum + (typeof totalCardsValue === 'number' ? totalCardsValue : 0);
        },
        0
      );
      const masteredCards = relevantPlans.reduce(
        (sum: number, plan: Record<string, unknown>): number => {
          const masteredCardsValue: unknown = plan['masteredCards'];
          return sum + (typeof masteredCardsValue === 'number' ? masteredCardsValue : 0);
        },
        0
      );
      const masteryLevel = totalCards > 0 ? (masteredCards / totalCards) * 100 : 0;

      // Calculate completion rate (completed modules / total modules)
      const totalModules = moduleIds.size;
      const completedModules = learningPaths.reduce(
        (count: number, path: { isCompleted?: boolean }): number => {
          // Count completed paths (simplified - in real app might need to check module completion)
          return path.isCompleted === true ? count + 1 : count;
        },
        0
      );
      const completionRate = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

      // Analyze weak and strong areas
      const weakAreas = await this.analyzeWeakAreasForPlans(relevantPlanIds);
      const strongAreas = await this.analyzeStrongAreasForPlans(relevantPlanIds);

      // Calculate learning velocity
      const learningVelocity = totalStudyTime > 0 ? masteredCards / (totalStudyTime / 3600) : 0;

      // Calculate retention rate
      const retentionRate = await this.calculateRetentionRate(userId, relevantSessions);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(userId, {
        totalStudyTime,
        averageScore,
        masteryLevel,
        weakAreas,
        strongAreas,
        learningVelocity,
        retentionRate,
      });

      // Build progress timeline (last 30 days)
      const progressTimeline = this.buildProgressTimeline(relevantSessions, 30);

      // Count modules
      const modulesCount = totalModules;

      return {
        objectiveId,
        objectiveTitle: objectiveData.title,
        totalStudyTime,
        averageScore: Math.round(averageScore),
        masteryLevel: Math.round(masteryLevel),
        weakAreas,
        strongAreas,
        learningVelocity: Math.round(learningVelocity * 100) / 100,
        retentionRate: Math.round(retentionRate),
        recommendations,
        learningPathsCount: learningPaths.length,
        modulesCount,
        sessionsCount: relevantSessions.length,
        completionRate: Math.round(completionRate),
        progressTimeline,
      };
    } catch (error: unknown) {
      logger.error('Error getting objective analytics:', error);
      throw error;
    }
  }

  // Helper methods for objective analytics
  private async analyzeWeakAreasForPlans(planIds: string[]): Promise<string[]> {
    if (planIds.length === 0) {
      return [];
    }

    const plans = await Promise.all(
      planIds.map(
        (id: string): Promise<Record<string, unknown> | null> =>
          firebaseService.getDocument('learningPlans', id)
      )
    );

    const weakCards: Array<Record<string, unknown>> = plans
      .filter(
        (plan: Record<string, unknown> | null): plan is Record<string, unknown> => plan != null
      )
      .flatMap((plan: Record<string, unknown>): Array<Record<string, unknown>> => {
        const flashcards: unknown = plan['flashcards'];
        if (Array.isArray(flashcards)) {
          return (flashcards as Array<Record<string, unknown>>).filter(
            (card: Record<string, unknown>): boolean => {
              const masteryLevel: unknown = card['masteryLevel'];
              return typeof masteryLevel === 'number' && masteryLevel < 50;
            }
          );
        }
        return [];
      });

    const weakCategories: string[] = [
      ...new Set(
        weakCards.map((card: Record<string, unknown>): string => {
          const category: unknown = card['category'];
          return typeof category === 'string' ? category : 'general';
        })
      ),
    ];
    return weakCategories.slice(0, 3);
  }

  private async analyzeStrongAreasForPlans(planIds: string[]): Promise<string[]> {
    if (planIds.length === 0) {
      return [];
    }

    const plans = await Promise.all(
      planIds.map(
        (id: string): Promise<Record<string, unknown> | null> =>
          firebaseService.getDocument('learningPlans', id)
      )
    );

    const strongCards: Array<Record<string, unknown>> = plans
      .filter(
        (plan: Record<string, unknown> | null): plan is Record<string, unknown> => plan != null
      )
      .flatMap((plan: Record<string, unknown>): Array<Record<string, unknown>> => {
        const flashcards: unknown = plan['flashcards'];
        if (Array.isArray(flashcards)) {
          return (flashcards as Array<Record<string, unknown>>).filter(
            (card: Record<string, unknown>): boolean => {
              const masteryLevel: unknown = card['masteryLevel'];
              return typeof masteryLevel === 'number' && masteryLevel >= 80;
            }
          );
        }
        return [];
      });

    const strongCategories: string[] = [
      ...new Set(
        strongCards.map((card: Record<string, unknown>): string => {
          const category: unknown = card['category'];
          return typeof category === 'string' ? category : 'general';
        })
      ),
    ];
    return strongCategories.slice(0, 3);
  }

  private buildProgressTimeline(
    sessions: Array<Record<string, unknown>>,
    days: number
  ): Array<{ date: string; studyTime: number; masteryLevel: number; score: number }> {
    const timeline: Array<{
      date: string;
      studyTime: number;
      masteryLevel: number;
      score: number;
      count: number;
    }> = [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Initialize timeline with zeros
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr: string = date.toISOString().split('T')[0] ?? '';
      timeline.push({
        date: dateStr,
        studyTime: 0,
        masteryLevel: 0,
        score: 0,
        count: 0,
      });
    }

    // Aggregate sessions by date
    sessions.forEach((session: Record<string, unknown>): void => {
      const startTime: unknown = session['startTime'];
      if (startTime == null) {
        return;
      }
      const sessionDate = new Date(startTime as Date | string);
      const dateStr: string = sessionDate.toISOString().split('T')[0] ?? '';
      const timelineEntry = timeline.find(
        (entry: { date: string }): boolean => entry.date === dateStr
      );

      if (timelineEntry != null) {
        const duration: unknown = session['duration'];
        const score: unknown = session['score'];
        timelineEntry.studyTime += typeof duration === 'number' ? duration : 0;
        if (typeof score === 'number') {
          timelineEntry.score += score;
          timelineEntry.count += 1;
        }
      }
    });

    // Calculate averages and return
    return timeline.map(
      (entry: {
        date: string;
        studyTime: number;
        masteryLevel: number;
        score: number;
        count: number;
      }): { date: string; studyTime: number; masteryLevel: number; score: number } => ({
        date: entry.date,
        studyTime: Math.round(entry.studyTime / 60), // Convert to minutes
        masteryLevel: 0, // Would need additional data to calculate per-day mastery
        score: entry.count > 0 ? Math.round(entry.score / entry.count) : 0,
      })
    );
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
