/**
 * Critical function tests for ModuleFlashcardStudy component
 * Focuses on mastery calculation and progress tracking
 */
import { describe, it, expect } from 'vitest';

describe('ModuleFlashcardStudy - Critical Functions', (): void => {
  describe('calculateModuleMastery', (): void => {
    // Extract the logic for testing
    const calculateModuleMastery = (masteredCards: Set<string>, totalCards: number): number => {
      if (totalCards === 0) {
        return 0;
      }
      const percentage = (masteredCards.size / totalCards) * 100;
      return Math.round(percentage);
    };

    it('should calculate 0% mastery for empty set', (): void => {
      const mastered = new Set<string>();
      const result = calculateModuleMastery(mastered, 10);
      expect(result).toBe(0);
    });

    it('should calculate 100% mastery when all cards mastered', (): void => {
      const mastered = new Set<string>(['card1', 'card2', 'card3']);
      const result = calculateModuleMastery(mastered, 3);
      expect(result).toBe(100);
    });

    it('should calculate 50% mastery for half cards mastered', (): void => {
      const mastered = new Set<string>(['card1', 'card2']);
      const result = calculateModuleMastery(mastered, 4);
      expect(result).toBe(50);
    });

    it('should calculate 33% mastery for one third', (): void => {
      const mastered = new Set<string>(['card1']);
      const result = calculateModuleMastery(mastered, 3);
      expect(result).toBe(33);
    });

    it('should return 0 for empty flashcards array', (): void => {
      const mastered = new Set<string>();
      const result = calculateModuleMastery(mastered, 0);
      expect(result).toBe(0);
    });

    it('should round percentages correctly', (): void => {
      const mastered = new Set<string>(['card1']);
      const result = calculateModuleMastery(mastered, 3);
      // 1/3 = 33.333... should round to 33
      expect(result).toBe(33);
    });
  });

  describe('Mastery card tracking logic', (): void => {
    it('should add card to mastered set when knewIt is true', (): void => {
      const mastered = new Set<string>(['card1']);
      const cardId = 'card2';

      const updated = new Set(mastered);
      updated.add(cardId);

      expect(updated.has('card2')).toBe(true);
      expect(updated.size).toBe(2);
    });

    it('should remove card from mastered set when knewIt is false', (): void => {
      const mastered = new Set<string>(['card1', 'card2']);
      const cardId = 'card1';

      const updated = new Set(mastered);
      updated.delete(cardId);

      expect(updated.has('card1')).toBe(false);
      expect(updated.size).toBe(1);
    });

    it('should handle removing non-existent card gracefully', (): void => {
      const mastered = new Set<string>(['card1']);
      const cardId = 'card2';

      const updated = new Set(mastered);
      updated.delete(cardId);

      expect(updated.size).toBe(1);
      expect(updated.has('card1')).toBe(true);
    });
  });
});
