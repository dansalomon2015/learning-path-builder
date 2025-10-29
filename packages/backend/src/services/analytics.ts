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
        (sum, session) => sum + (session.duration || 0),
        0
      );
      const averageScore =
        studySessions.length > 0
          ? studySessions.reduce((sum, session) => sum + (session.score || 0), 0) /
            studySessions.length
          : 0;

      const totalCards = learningPlans.reduce((sum, plan) => sum + plan.totalCards, 0);
      const masteredCards = learningPlans.reduce((sum, plan) => sum + plan.masteredCards, 0);
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
    } catch (error) {
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
      studySessions.forEach(session => {
        const hour = new Date(session.startTime).getHours();
        if (hour >= 6 && hour < 12) timeOfDayCounts.morning++;
        else if (hour >= 12 && hour < 18) timeOfDayCounts.afternoon++;
        else if (hour >= 18 && hour < 22) timeOfDayCounts.evening++;
        else timeOfDayCounts.night++;
      });

      const preferredTimeOfDay = Object.entries(timeOfDayCounts).reduce((a, b) =>
        timeOfDayCounts[a[0]] > timeOfDayCounts[b[0]] ? a : b
      )[0];

      // Calculate average session length
      const averageSessionLength = Math.round(
        studySessions.reduce((sum, session) => sum + (session.duration || 0), 0) /
          studySessions.length /
          60
      );

      // Analyze most effective study mode
      const modeScores: { [key: string]: number } = { flashcards: 0, quiz: 0, mixed: 0 };
      const modeCounts: { [key: string]: number } = { flashcards: 0, quiz: 0, mixed: 0 };

      studySessions.forEach(session => {
        const mode = session.mode || 'mixed';
        modeScores[mode] += session.score || 0;
        modeCounts[mode]++;
      });

      const mostEffectiveMode = Object.entries(modeScores)
        .map(([mode, totalScore]) => ({
          mode,
          averageScore: modeCounts[mode] > 0 ? totalScore / modeCounts[mode] : 0,
        }))
        .reduce((a, b) => (a.averageScore > b.averageScore ? a : b)).mode as
        | 'flashcards'
        | 'quiz'
        | 'mixed';

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
    } catch (error) {
      logger.error('Error analyzing study patterns:', error);
      throw error;
    }
  }

  // Generate personalized learning recommendations
  async generateRecommendations(
    userId: string,
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

      const response = await geminiService.generateContent(prompt);
      return response.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
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
  private async analyzeWeakAreas(userId: string, sessions: any[]): Promise<string[]> {
    // Analyze flashcards with low mastery levels
    const learningPlans = await firebaseService.queryDocuments('learningPlans', [
      { field: 'userId', operator: '==', value: userId },
    ]);

    const weakCards = learningPlans.flatMap(plan =>
      plan.flashcards.filter((card: any) => card.masteryLevel < 50)
    );

    const weakCategories = [...new Set(weakCards.map(card => card.category))];
    return weakCategories.slice(0, 3); // Top 3 weak areas
  }

  private async analyzeStrongAreas(userId: string, sessions: any[]): Promise<string[]> {
    const learningPlans = await firebaseService.queryDocuments('learningPlans', [
      { field: 'userId', operator: '==', value: userId },
    ]);

    const strongCards = learningPlans.flatMap(plan =>
      plan.flashcards.filter((card: any) => card.masteryLevel >= 80)
    );

    const strongCategories = [...new Set(strongCards.map(card => card.category))];
    return strongCategories.slice(0, 3); // Top 3 strong areas
  }

  private async calculateRetentionRate(userId: string, sessions: any[]): Promise<number> {
    // Calculate retention based on spaced repetition effectiveness
    const recentSessions = sessions.slice(-10); // Last 10 sessions
    if (recentSessions.length === 0) return 0;

    const totalQuestions = recentSessions.reduce(
      (sum, session) => sum + (session.totalQuestions || 0),
      0
    );
    const correctAnswers = recentSessions.reduce(
      (sum, session) => sum + (session.correctAnswers || 0),
      0
    );

    return totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  }

  private async calculateDifficultyProgression(userId: string, sessions: any[]): Promise<number> {
    if (sessions.length < 2) return 0;

    const recentSessions = sessions.slice(-5); // Last 5 sessions
    const olderSessions = sessions.slice(-10, -5); // Previous 5 sessions

    const recentAvgScore =
      recentSessions.reduce((sum, session) => sum + (session.score || 0), 0) /
      recentSessions.length;
    const olderAvgScore =
      olderSessions.reduce((sum, session) => sum + (session.score || 0), 0) / olderSessions.length;

    return recentAvgScore - olderAvgScore; // Positive means improvement
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
