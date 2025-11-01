/**
 * Critical function tests for session service
 * Tests session management, progress tracking, and adaptive recommendations
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { sessionService } from '../sessionService';
import { type LearningPlan, SkillLevel, Difficulty, StudyMode } from '../../types';

describe('SessionService - Critical Functions', () => {
  const mockPlan: LearningPlan = {
    id: 'plan1',
    userId: 'user1',
    title: 'Test Plan',
    description: 'Test Description',
    topic: 'Test Topic',
    skillLevel: SkillLevel.BEGINNER,
    flashcards: [
      {
        id: 'card1',
        question: 'Question 1?',
        answer: 'Answer 1',
        difficulty: Difficulty.EASY,
        category: 'test',
        tags: [],
        createdAt: new Date().toISOString(),
        reviewCount: 0,
        masteryLevel: 0,
      },
      {
        id: 'card2',
        question: 'Question 2?',
        answer: 'Answer 2',
        difficulty: Difficulty.EASY,
        category: 'test',
        tags: [],
        createdAt: new Date().toISOString(),
        reviewCount: 0,
        masteryLevel: 0,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    totalCards: 2,
    masteredCards: 0,
  };

  beforeEach(() => {
    localStorage.clear();
    // Note: SessionService is a singleton, so we work with the instance
  });

  describe('startSession', () => {
    it('should create a new session with correct initial state', () => {
      const session = sessionService.startSession(mockPlan, StudyMode.FLASHCARDS);

      expect(session).toBeDefined();
      expect(session.sessionId).toBeDefined();
      expect(session.planId).toBe(mockPlan.id);
      expect(session.mode).toBe(StudyMode.FLASHCARDS);
      expect(session.currentCardIndex).toBe(0);
      expect(session.totalCards).toBe(2);
      expect(session.correctAnswers).toBe(0);
      expect(session.incorrectAnswers).toBe(0);
      expect(session.isPaused).toBe(false);
    });

    it('should create session with quiz mode', () => {
      const session = sessionService.startSession(mockPlan, StudyMode.QUIZ);

      expect(session.mode).toBe(StudyMode.QUIZ);
      expect(session.planId).toBe(mockPlan.id);
    });
  });

  describe('recordCardInteraction', () => {
    it('should increment correct answers for correct response', () => {
      sessionService.startSession(mockPlan, StudyMode.FLASHCARDS);
      sessionService.recordCardInteraction('card1', true, 5, Difficulty.EASY);

      const session = sessionService.getCurrentSession();
      expect(session?.correctAnswers).toBe(1);
      expect(session?.incorrectAnswers).toBe(0);
    });

    it('should increment incorrect answers for incorrect response', () => {
      sessionService.startSession(mockPlan, StudyMode.FLASHCARDS);
      sessionService.recordCardInteraction('card1', false, 10, Difficulty.EASY);

      const session = sessionService.getCurrentSession();
      expect(session?.correctAnswers).toBe(0);
      expect(session?.incorrectAnswers).toBe(1);
    });

    it('should track multiple interactions correctly', () => {
      sessionService.startSession(mockPlan, StudyMode.FLASHCARDS);
      sessionService.recordCardInteraction('card1', true, 5, Difficulty.EASY);
      sessionService.recordCardInteraction('card2', true, 6, Difficulty.EASY);
      sessionService.recordCardInteraction('card1', false, 8, Difficulty.EASY);

      const session = sessionService.getCurrentSession();
      expect(session?.correctAnswers).toBe(2);
      expect(session?.incorrectAnswers).toBe(1);
    });
  });

  describe('nextCard', () => {
    it('should increment current card index', () => {
      sessionService.startSession(mockPlan, StudyMode.FLASHCARDS);
      const initialIndex = sessionService.getCurrentSession()?.currentCardIndex ?? 0;

      sessionService.nextCard();
      const newIndex = sessionService.getCurrentSession()?.currentCardIndex ?? 0;

      expect(newIndex).toBe(initialIndex + 1);
    });

    it('should not exceed total cards', () => {
      sessionService.startSession(mockPlan, StudyMode.FLASHCARDS);
      sessionService.nextCard(); // Index 1
      sessionService.nextCard(); // Index 2 (should not exceed)

      const session = sessionService.getCurrentSession();
      expect(session?.currentCardIndex).toBeLessThanOrEqual(session?.totalCards ?? 0);
    });
  });

  describe('completeSession', () => {
    it('should return session stats after completion', () => {
      sessionService.startSession(mockPlan, StudyMode.FLASHCARDS);
      sessionService.recordCardInteraction('card1', true, 5, Difficulty.EASY);
      sessionService.recordCardInteraction('card2', true, 6, Difficulty.EASY);

      const completedSession = sessionService.completeSession();

      expect(completedSession).toBeDefined();
      expect(completedSession?.correctAnswers).toBe(2);
      expect(completedSession?.totalQuestions).toBe(2);
    });

    it('should return null if no session exists', () => {
      const completedSession = sessionService.completeSession();
      expect(completedSession).toBeNull();
    });
  });

  describe('getSessionStats', () => {
    it('should calculate accurate statistics', () => {
      sessionService.startSession(mockPlan, StudyMode.FLASHCARDS);
      sessionService.recordCardInteraction('card1', true, 5, Difficulty.EASY);
      sessionService.recordCardInteraction('card2', true, 6, Difficulty.EASY);
      sessionService.completeSession();

      const stats = sessionService.getSessionStats();

      expect(stats.totalSessions).toBe(1);
      expect(stats.cardsMastered).toBeGreaterThanOrEqual(0);
      expect(stats.accuracyRate).toBeGreaterThanOrEqual(0);
      expect(stats.accuracyRate).toBeLessThanOrEqual(100);
    });
  });

  describe('getAdaptiveRecommendations', () => {
    it('should return recommendations object', () => {
      const recommendations = sessionService.getAdaptiveRecommendations();

      expect(recommendations).toBeDefined();
      expect(recommendations.difficultyAdjustment).toBeDefined();
      expect(['increase', 'decrease', 'maintain']).toContain(recommendations.difficultyAdjustment);
    });
  });
});
