import type { StudySession, LearningPlan } from '../types';
import { StudyMode } from '../types';

export interface SessionStats {
  totalSessions: number;
  totalStudyTime: number; // in minutes
  averageSessionLength: number; // in minutes
  currentStreak: number; // days
  longestStreak: number; // days
  cardsMastered: number;
  accuracyRate: number; // percentage
  favoriteMode: 'flashcards' | 'quiz' | 'mixed';
  mostStudiedTopic: string;
  lastStudyDate?: string;
}

export interface SessionProgress {
  sessionId: string;
  planId: string;
  mode: 'flashcards' | 'quiz';
  currentCardIndex: number;
  totalCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
  startTime: number;
  lastActivityTime: number;
  isPaused: boolean;
  performance: {
    averageResponseTime: number;
    difficultyProgression: string[];
    weakAreas: string[];
    strongAreas: string[];
  };
}

export interface AdaptiveSettings {
  difficultyAdjustment: 'automatic' | 'manual';
  responseTimeThreshold: number; // seconds
  accuracyThreshold: number; // percentage
  masteryThreshold: number; // percentage
  reviewInterval: number; // days
}

class SessionService {
  private static instance: SessionService | undefined;
  private currentSession: SessionProgress | null = null;
  private readonly adaptiveSettings: AdaptiveSettings = {
    difficultyAdjustment: 'automatic',
    responseTimeThreshold: 5,
    accuracyThreshold: 80,
    masteryThreshold: 85,
    reviewInterval: 1,
  };

  static getInstance(): SessionService {
    if (SessionService.instance === undefined) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  // Start a new study session
  startSession(plan: LearningPlan, mode: 'flashcards' | 'quiz'): SessionProgress {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.currentSession = {
      sessionId,
      planId: plan.id,
      mode,
      currentCardIndex: 0,
      totalCards: plan.flashcards.length,
      correctAnswers: 0,
      incorrectAnswers: 0,
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      isPaused: false,
      performance: {
        averageResponseTime: 0,
        difficultyProgression: [],
        weakAreas: [],
        strongAreas: [],
      },
    };

    // Save to localStorage for persistence
    this.saveSessionToStorage();

    return this.currentSession;
  }

  // Resume an existing session
  resumeSession(sessionId: string): SessionProgress | null {
    const savedSession = this.loadSessionFromStorage(sessionId);
    if (savedSession != null) {
      this.currentSession = savedSession;
      this.currentSession.isPaused = false;
      this.currentSession.lastActivityTime = Date.now();
      this.saveSessionToStorage();
      return this.currentSession;
    }
    return null;
  }

  // Pause current session
  pauseSession(): void {
    if (this.currentSession != null) {
      this.currentSession.isPaused = true;
      this.currentSession.lastActivityTime = Date.now();
      this.saveSessionToStorage();
    }
  }

  // Record card interaction
  recordCardInteraction(
    cardId: string,
    isCorrect: boolean,
    responseTime: number,
    difficulty: 'easy' | 'medium' | 'hard'
  ): void {
    if (this.currentSession == null) {
      return;
    }

    // Update counters
    if (isCorrect) {
      this.currentSession.correctAnswers++;
    } else {
      this.currentSession.incorrectAnswers++;
    }

    // Update performance metrics
    const totalAnswers = this.currentSession.correctAnswers + this.currentSession.incorrectAnswers;
    this.currentSession.performance.averageResponseTime =
      (this.currentSession.performance.averageResponseTime * (totalAnswers - 1) + responseTime) /
      totalAnswers;

    // Track difficulty progression
    this.currentSession.performance.difficultyProgression.push(difficulty);

    // Update weak/strong areas based on performance
    this.updatePerformanceAreas(cardId, isCorrect, responseTime);

    this.currentSession.lastActivityTime = Date.now();
    this.saveSessionToStorage();
  }

  // Move to next card
  nextCard(): void {
    if (this.currentSession == null) {
      return;
    }

    this.currentSession.currentCardIndex++;
    this.currentSession.lastActivityTime = Date.now();
    this.saveSessionToStorage();
  }

  // Complete session
  completeSession(): StudySession | null {
    if (this.currentSession == null) {
      return null;
    }

    const session: StudySession = {
      id: this.currentSession.sessionId,
      userId: 'current-user', // This should come from auth context
      learningPlanId: this.currentSession.planId,
      mode: this.currentSession.mode as StudyMode,
      startTime: new Date(this.currentSession.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: Math.floor((Date.now() - this.currentSession.startTime) / 1000),
      score:
        this.currentSession.mode === 'quiz'
          ? Math.round((this.currentSession.correctAnswers / this.currentSession.totalCards) * 100)
          : undefined,
      totalQuestions: this.currentSession.totalCards,
      correctAnswers: this.currentSession.correctAnswers,
      flashcardsReviewed: this.currentSession.currentCardIndex + 1,
      isCompleted: true,
      performance: {
        averageResponseTime: this.currentSession.performance.averageResponseTime,
        difficultyProgression: this.currentSession.performance.difficultyProgression,
        weakAreas: this.currentSession.performance.weakAreas,
        strongAreas: this.currentSession.performance.strongAreas,
        recommendations: this.generateRecommendations(),
      },
    };

    // Save completed session
    this.saveCompletedSession(session);

    // Clear current session
    this.currentSession = null;
    this.clearSessionFromStorage();

    return session;
  }

  // Get current session progress
  getCurrentSession(): SessionProgress | null {
    return this.currentSession;
  }

  // Get session statistics
  getSessionStats(): SessionStats {
    const sessions = this.getCompletedSessions();

    // Calculate streaks
    const sortedSessions = sessions.sort(
      (a: StudySession, b: StudySession): number =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.startTime);
      const sessionDay = new Date(
        sessionDate.getFullYear(),
        sessionDate.getMonth(),
        sessionDate.getDate()
      );

      if (lastDate == null) {
        lastDate = sessionDay;
        tempStreak = 1;
        currentStreak = 1;
      } else {
        const dayDiff = Math.floor(
          (lastDate.getTime() - sessionDay.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (dayDiff === 1) {
          tempStreak++;
        } else if (dayDiff === 0) {
          // Same day, don't break streak
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          if (currentStreak === tempStreak) {
            currentStreak = 0; // Streak broken
          }
          tempStreak = 1;
        }
        lastDate = sessionDay;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate other stats
    const totalStudyTime =
      sessions.reduce(
        (sum: number, session: StudySession): number => sum + (session.duration ?? 0),
        0
      ) / 60;
    const averageSessionLength = sessions.length > 0 ? totalStudyTime / sessions.length : 0;
    const totalCorrect = sessions.reduce(
      (sum: number, session: StudySession): number => sum + (session.correctAnswers ?? 0),
      0
    );
    const totalQuestions = sessions.reduce(
      (sum: number, session: StudySession): number => sum + (session.totalQuestions ?? 0),
      0
    );
    const accuracyRate = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Find favorite mode and topic
    const modeCounts = sessions.reduce<Record<string, number>>(
      (counts: Record<string, number>, session: StudySession): Record<string, number> => {
        counts[session.mode] = (counts[session.mode] ?? 0) + 1;
        return counts;
      },
      {}
    );

    const favoriteMode = Object.keys(modeCounts).reduce(
      (a: string, b: string): string => (modeCounts[a] > modeCounts[b] ? a : b),
      'mixed'
    ) as 'flashcards' | 'quiz' | 'mixed';

    return {
      totalSessions: sessions.length,
      totalStudyTime: Math.round(totalStudyTime),
      averageSessionLength: Math.round(averageSessionLength),
      currentStreak,
      longestStreak,
      cardsMastered: sessions.reduce(
        (sum: number, session: StudySession): number => sum + (session.correctAnswers ?? 0),
        0
      ),
      accuracyRate: Math.round(accuracyRate),
      favoriteMode,
      mostStudiedTopic: 'General', // This would need to be calculated from plan data
      lastStudyDate: sessions.length > 0 ? sessions[0].startTime : undefined,
    };
  }

  // Get adaptive recommendations
  getAdaptiveRecommendations(): {
    difficultyAdjustment: 'increase' | 'decrease' | 'maintain';
    suggestedMode: 'flashcards' | 'quiz' | 'mixed';
    focusAreas: string[];
    estimatedTimeToMastery: number; // days
  } {
    const stats = this.getSessionStats();
    const recentSessions = this.getCompletedSessions().slice(0, 5);

    let difficultyAdjustment: 'increase' | 'decrease' | 'maintain' = 'maintain';
    let suggestedMode: 'flashcards' | 'quiz' | 'mixed' = 'mixed';
    const focusAreas: string[] = [];
    let estimatedTimeToMastery = 30; // default

    // Analyze recent performance
    if (recentSessions.length > 0) {
      const recentAccuracy =
        recentSessions.reduce((sum: number, session: StudySession): number => {
          const sessionAccuracy =
            session.totalQuestions != null && session.totalQuestions > 0
              ? (session.correctAnswers ?? 0) / session.totalQuestions
              : 0;
          return sum + sessionAccuracy;
        }, 0) / recentSessions.length;

      if (recentAccuracy > 0.9) {
        difficultyAdjustment = 'increase';
      } else if (recentAccuracy < 0.6) {
        difficultyAdjustment = 'decrease';
      }

      // Suggest mode based on performance
      const flashcardSessions = recentSessions.filter(
        (s: StudySession): boolean => s.mode === StudyMode.FLASHCARDS
      );
      const quizSessions = recentSessions.filter(
        (s: StudySession): boolean => s.mode === StudyMode.QUIZ
      );

      if (flashcardSessions.length > quizSessions.length) {
        suggestedMode = 'quiz';
      } else if (quizSessions.length > flashcardSessions.length) {
        suggestedMode = 'flashcards';
      }
    }

    // Estimate time to mastery based on current progress
    if (stats.accuracyRate > 0) {
      estimatedTimeToMastery = Math.max(7, Math.round((30 * (100 - stats.accuracyRate)) / 100));
    }

    return {
      difficultyAdjustment,
      suggestedMode,
      focusAreas,
      estimatedTimeToMastery,
    };
  }

  // Private helper methods
  private updatePerformanceAreas(cardId: string, isCorrect: boolean, responseTime: number): void {
    if (this.currentSession == null) {
      return;
    }

    // This is a simplified version - in a real app, you'd analyze card categories, topics, etc.
    if (isCorrect && responseTime < this.adaptiveSettings.responseTimeThreshold) {
      if (!this.currentSession.performance.strongAreas.includes(cardId)) {
        this.currentSession.performance.strongAreas.push(cardId);
      }
    } else if (!isCorrect || responseTime > this.adaptiveSettings.responseTimeThreshold * 2) {
      if (!this.currentSession.performance.weakAreas.includes(cardId)) {
        this.currentSession.performance.weakAreas.push(cardId);
      }
    }
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getSessionStats();

    if (stats.accuracyRate < 70) {
      recommendations.push('Consider reviewing easier cards first to build confidence');
    }

    if (stats.currentStreak < 3) {
      recommendations.push('Try to study daily to build a consistent learning habit');
    }

    if (stats.averageSessionLength < 10) {
      recommendations.push('Longer study sessions can improve retention');
    }

    return recommendations;
  }

  private saveSessionToStorage(): void {
    if (this.currentSession != null) {
      localStorage.setItem('currentSession', JSON.stringify(this.currentSession));
    }
  }

  private loadSessionFromStorage(sessionId: string): SessionProgress | null {
    try {
      const saved = localStorage.getItem('currentSession');
      if (saved != null && saved !== '') {
        const session = JSON.parse(saved) as SessionProgress;
        return session.sessionId === sessionId ? session : null;
      }
    } catch (error: unknown) {
      console.error('Error loading session from storage:', error);
    }
    return null;
  }

  private clearSessionFromStorage(): void {
    localStorage.removeItem('currentSession');
  }

  private saveCompletedSession(session: StudySession): void {
    try {
      const sessions = this.getCompletedSessions();
      sessions.unshift(session); // Add to beginning

      // Keep only last 100 sessions
      const limitedSessions = sessions.slice(0, 100);
      localStorage.setItem('completedSessions', JSON.stringify(limitedSessions));
    } catch (error: unknown) {
      console.error('Error saving completed session:', error);
    }
  }

  private getCompletedSessions(): StudySession[] {
    try {
      const saved = localStorage.getItem('completedSessions');
      if (saved != null && saved !== '') {
        return JSON.parse(saved) as StudySession[];
      }
      return [];
    } catch (error: unknown) {
      console.error('Error loading completed sessions:', error);
      return [];
    }
  }
}

export const sessionService = SessionService.getInstance();
export default sessionService;
