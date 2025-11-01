import { adaptiveLearningService } from '../adaptiveLearning';
import { type StudySession, type Flashcard } from '@/types';

describe('AdaptiveLearningService - Critical Functions', () => {
  describe('calculateAdaptiveDifficulty', () => {
    it('should return medium difficulty when no sessions provided', async () => {
      const result = await adaptiveLearningService.calculateAdaptiveDifficulty(
        'user1',
        'plan1',
        []
      );
      expect(result).toBe('medium');
    });

    it('should return hard difficulty for excellent performance', async () => {
      const sessions: StudySession[] = [
        {
          id: 's1',
          userId: 'user1',
          learningPlanId: 'plan1',
          mode: 'quiz',
          startTime: new Date(),
          flashcardsReviewed: 10,
          isCompleted: true,
          score: 95,
          totalQuestions: 10,
          correctAnswers: 9,
          performance: {
            averageResponseTime: 25,
            difficultyProgression: ['medium', 'medium'],
            weakAreas: [],
            strongAreas: ['concept1'],
            recommendations: [],
          },
        },
      ];
      const result = await adaptiveLearningService.calculateAdaptiveDifficulty(
        'user1',
        'plan1',
        sessions
      );
      expect(result).toBe('hard');
    });

    it('should return easy difficulty for poor performance', async () => {
      const sessions: StudySession[] = [
        {
          id: 's1',
          userId: 'user1',
          learningPlanId: 'plan1',
          mode: 'quiz',
          startTime: new Date(),
          flashcardsReviewed: 10,
          isCompleted: true,
          score: 50,
          totalQuestions: 10,
          correctAnswers: 5,
          performance: {
            averageResponseTime: 70,
            difficultyProgression: ['medium', 'medium'],
            weakAreas: ['concept1'],
            strongAreas: [],
            recommendations: [],
          },
        },
      ];
      const result = await adaptiveLearningService.calculateAdaptiveDifficulty(
        'user1',
        'plan1',
        sessions
      );
      expect(result).toBe('easy');
    });

    it('should return medium difficulty for average performance', async () => {
      const sessions: StudySession[] = [
        {
          id: 's1',
          userId: 'user1',
          learningPlanId: 'plan1',
          mode: 'quiz',
          startTime: new Date(),
          flashcardsReviewed: 10,
          isCompleted: true,
          score: 70,
          totalQuestions: 10,
          correctAnswers: 7,
          performance: {
            averageResponseTime: 45,
            difficultyProgression: ['medium'],
            weakAreas: [],
            strongAreas: [],
            recommendations: [],
          },
        },
      ];
      const result = await adaptiveLearningService.calculateAdaptiveDifficulty(
        'user1',
        'plan1',
        sessions
      );
      expect(result).toBe('medium');
    });
  });

  describe('updateFlashcardMastery', () => {
    const baseFlashcard: Flashcard = {
      id: 'card1',
      question: 'Test question?',
      answer: 'Test answer',
      difficulty: 'medium',
      category: 'test',
      tags: [],
      createdAt: new Date(),
      reviewCount: 0,
      masteryLevel: 50,
    };

    it('should increase mastery level for correct response', async () => {
      const result = await adaptiveLearningService.updateFlashcardMastery(
        baseFlashcard,
        'correct',
        25
      );
      expect(result.masteryLevel).toBeGreaterThan(baseFlashcard.masteryLevel);
      expect(result.reviewCount).toBe(1);
      expect(result.lastReviewed).toBeInstanceOf(Date);
    });

    it('should decrease mastery level for incorrect response', async () => {
      const result = await adaptiveLearningService.updateFlashcardMastery(
        baseFlashcard,
        'incorrect',
        30
      );
      expect(result.masteryLevel).toBeLessThan(baseFlashcard.masteryLevel);
      expect(result.reviewCount).toBe(1);
    });

    it('should not allow mastery level below 0', async () => {
      const lowMasteryCard: Flashcard = {
        ...baseFlashcard,
        masteryLevel: 5,
      };
      const result = await adaptiveLearningService.updateFlashcardMastery(
        lowMasteryCard,
        'incorrect',
        30
      );
      expect(result.masteryLevel).toBeGreaterThanOrEqual(0);
    });

    it('should not allow mastery level above 100', async () => {
      const highMasteryCard: Flashcard = {
        ...baseFlashcard,
        masteryLevel: 95,
      };
      const result = await adaptiveLearningService.updateFlashcardMastery(
        highMasteryCard,
        'correct',
        20
      );
      expect(result.masteryLevel).toBeLessThanOrEqual(100);
    });

    it('should calculate next review date based on mastery level', async () => {
      const expertCard: Flashcard = {
        ...baseFlashcard,
        masteryLevel: 95,
      };
      const result = await adaptiveLearningService.updateFlashcardMastery(
        expertCard,
        'correct',
        20
      );
      expect(result.nextReviewDate).toBeInstanceOf(Date);
      const daysDiff =
        (result.nextReviewDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThan(0);
    });
  });

  describe('calculateLearningProgress', () => {
    it('should calculate correct progress for mastered cards', async () => {
      const flashcards: Flashcard[] = [
        {
          id: 'c1',
          question: 'Q1',
          answer: 'A1',
          difficulty: 'easy',
          category: 'test',
          tags: [],
          createdAt: new Date(),
          reviewCount: 5,
          masteryLevel: 85, // Mastered
        },
        {
          id: 'c2',
          question: 'Q2',
          answer: 'A2',
          difficulty: 'easy',
          category: 'test',
          tags: [],
          createdAt: new Date(),
          reviewCount: 3,
          masteryLevel: 70, // In progress
        },
        {
          id: 'c3',
          question: 'Q3',
          answer: 'A3',
          difficulty: 'easy',
          category: 'test',
          tags: [],
          createdAt: new Date(),
          reviewCount: 0,
          masteryLevel: 0, // New
        },
      ];

      const result = await adaptiveLearningService.calculateLearningProgress('plan1', flashcards);

      expect(result.totalCards).toBe(3);
      expect(result.masteredCards).toBe(1);
      expect(result.inProgressCards).toBe(1);
      expect(result.newCards).toBe(1);
      expect(result.masteryPercentage).toBeCloseTo(33.33, 1);
    });

    it('should return zero progress for empty flashcards array', async () => {
      const result = await adaptiveLearningService.calculateLearningProgress('plan1', []);

      expect(result.totalCards).toBe(0);
      expect(result.masteredCards).toBe(0);
      expect(result.inProgressCards).toBe(0);
      expect(result.newCards).toBe(0);
      expect(result.masteryPercentage).toBe(0);
    });

    it('should calculate 100% mastery when all cards are mastered', async () => {
      const flashcards: Flashcard[] = [
        {
          id: 'c1',
          question: 'Q1',
          answer: 'A1',
          difficulty: 'easy',
          category: 'test',
          tags: [],
          createdAt: new Date(),
          reviewCount: 5,
          masteryLevel: 90,
        },
        {
          id: 'c2',
          question: 'Q2',
          answer: 'A2',
          difficulty: 'easy',
          category: 'test',
          tags: [],
          createdAt: new Date(),
          reviewCount: 5,
          masteryLevel: 85,
        },
      ];

      const result = await adaptiveLearningService.calculateLearningProgress('plan1', flashcards);

      expect(result.masteryPercentage).toBe(100);
      expect(result.masteredCards).toBe(2);
    });
  });
});
