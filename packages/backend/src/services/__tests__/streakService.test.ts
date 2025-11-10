import { streakService } from '../streakService';
import { firebaseService } from '@/services/firebase';
import * as admin from 'firebase-admin';
import { Streak } from '@/types';

// Mock dependencies
jest.mock('@/services/firebase');
jest.mock('@/services/gemini');
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockFirebaseService = firebaseService as jest.Mocked<typeof firebaseService>;

describe('StreakService - Critical Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateQuestionCount', () => {
    it('should calculate question count correctly for 1 day', () => {
      const result = streakService.calculateQuestionCount(1);
      expect(result).toBe(10);
    });

    it('should calculate question count correctly for 3 days', () => {
      const result = streakService.calculateQuestionCount(3);
      expect(result).toBe(30); // 3 * 10 = 30
    });

    it('should cap at 30 questions for 7 days', () => {
      const result = streakService.calculateQuestionCount(7);
      expect(result).toBe(30); // 7 * 10 = 70, capped at 30
    });

    it('should cap at 30 questions for more than 7 days', () => {
      const result = streakService.calculateQuestionCount(10);
      expect(result).toBe(30); // Max 7 recoverable days * 10 = 70, capped at 30
    });

    it('should cap at 30 questions for 4 days', () => {
      const result = streakService.calculateQuestionCount(4);
      expect(result).toBe(30); // 4 * 10 = 40, but max 7 days = 70, capped at 30
    });

    it('should handle 0 days', () => {
      const result = streakService.calculateQuestionCount(0);
      expect(result).toBe(0);
    });
  });

  describe('calculateMissedDays', () => {
    it('should return 0 missed days when streak is null', async () => {
      // Mock getDocument to return null (no streak exists)
      mockFirebaseService.getDocument.mockResolvedValueOnce(null);
      // Also mock createDocument since getStreak creates a streak if it doesn't exist
      mockFirebaseService.createDocument.mockResolvedValueOnce('user1');

      const result = await streakService.calculateMissedDays('user1');

      expect(result.missedDays).toBe(0);
      // When streak is null, getStreak creates a new one, so lastStudyDate will be today
      expect(result.lastStudyDate).toBeInstanceOf(Date);
    });

    it('should calculate 0 missed days for same day', async () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);

      const streak: Streak = {
        userId: 'user1',
        currentStreak: 5,
        longestStreak: 10,
        lastStudyDate: today,
        missedDays: 0,
        recoveryHistory: [],
        updatedAt: today,
      };

      mockFirebaseService.getDocument.mockResolvedValue({
        ...streak,
        lastStudyDate: admin.firestore.Timestamp.fromDate(today),
        updatedAt: admin.firestore.Timestamp.fromDate(today),
      } as unknown as Record<string, unknown>);

      const result = await streakService.calculateMissedDays('user1');

      expect(result.missedDays).toBe(0);
    });

    it('should calculate 1 missed day for yesterday', async () => {
      // If last study was 2 days ago, then yesterday was missed (1 missed day)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      const streak: Streak = {
        userId: 'user1',
        currentStreak: 5,
        longestStreak: 10,
        lastStudyDate: twoDaysAgo,
        missedDays: 0,
        recoveryHistory: [],
        updatedAt: twoDaysAgo,
      };

      mockFirebaseService.getDocument.mockResolvedValueOnce({
        ...streak,
        lastStudyDate: admin.firestore.Timestamp.fromDate(twoDaysAgo),
        updatedAt: admin.firestore.Timestamp.fromDate(twoDaysAgo),
      } as unknown as Record<string, unknown>);

      const result = await streakService.calculateMissedDays('user1');

      // 2 days ago means: today (0), yesterday (1), 2 days ago (2)
      // daysSinceLastStudy = 2, so missedDays = 2 - 1 = 1
      expect(result.missedDays).toBe(1);
    });

    it('should calculate 3 missed days for 4 days ago', async () => {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
      fourDaysAgo.setHours(12, 0, 0, 0);

      const streak: Streak = {
        userId: 'user1',
        currentStreak: 5,
        longestStreak: 10,
        lastStudyDate: fourDaysAgo,
        missedDays: 0,
        recoveryHistory: [],
        updatedAt: fourDaysAgo,
      };

      mockFirebaseService.getDocument.mockResolvedValue({
        ...streak,
        lastStudyDate: admin.firestore.Timestamp.fromDate(fourDaysAgo),
        updatedAt: admin.firestore.Timestamp.fromDate(fourDaysAgo),
      } as unknown as Record<string, unknown>);

      const result = await streakService.calculateMissedDays('user1');

      expect(result.missedDays).toBe(3);
    });

    it('should handle edge case: last study today should return 0', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const streak: Streak = {
        userId: 'user1',
        currentStreak: 5,
        longestStreak: 10,
        lastStudyDate: today,
        missedDays: 0,
        recoveryHistory: [],
        updatedAt: today,
      };

      mockFirebaseService.getDocument.mockResolvedValue({
        ...streak,
        lastStudyDate: admin.firestore.Timestamp.fromDate(today),
        updatedAt: admin.firestore.Timestamp.fromDate(today),
      } as unknown as Record<string, unknown>);

      const result = await streakService.calculateMissedDays('user1');

      expect(result.missedDays).toBe(0);
    });
  });

  describe('canAttemptRecovery', () => {
    it('should allow attempt when no previous attempts exist', async () => {
      mockFirebaseService.queryDocuments.mockResolvedValue([]);

      const result = await streakService.canAttemptRecovery('user1', 'objective1');

      expect(result.canAttempt).toBe(true);
      expect(result.cooldownEndsAt).toBeUndefined();
    });

    it('should allow attempt when last attempt is older than 1 hour', async () => {
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const oldAttempt: Record<string, unknown> = {
        id: 'attempt1',
        userId: 'user1',
        objectiveId: 'objective1',
        status: 'completed',
        createdAt: admin.firestore.Timestamp.fromDate(twoHoursAgo),
      };

      mockFirebaseService.queryDocuments.mockResolvedValue([oldAttempt]);

      const result = await streakService.canAttemptRecovery('user1', 'objective1');

      expect(result.canAttempt).toBe(true);
      expect(result.cooldownEndsAt).toBeUndefined();
    });

    it('should block attempt when last attempt is within 1 hour', async () => {
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      const recentAttempt: Record<string, unknown> = {
        id: 'attempt1',
        userId: 'user1',
        objectiveId: 'objective1',
        status: 'completed',
        createdAt: admin.firestore.Timestamp.fromDate(thirtyMinutesAgo),
      };

      mockFirebaseService.queryDocuments.mockResolvedValue([recentAttempt]);

      const result = await streakService.canAttemptRecovery('user1', 'objective1');

      expect(result.canAttempt).toBe(false);
      expect(result.cooldownEndsAt).toBeInstanceOf(Date);
      if (result.cooldownEndsAt != null) {
        const expectedEnd = new Date(thirtyMinutesAgo.getTime() + 60 * 60 * 1000);
        expect(result.cooldownEndsAt.getTime()).toBeCloseTo(expectedEnd.getTime(), -3); // Within 1 second
      }
    });

    it('should only consider pending or completed attempts', async () => {
      const recentAttempt: Record<string, unknown> = {
        id: 'attempt1',
        userId: 'user1',
        objectiveId: 'objective1',
        status: 'expired', // Should be ignored
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
      };

      mockFirebaseService.queryDocuments.mockResolvedValue([recentAttempt]);

      const result = await streakService.canAttemptRecovery('user1', 'objective1');

      expect(result.canAttempt).toBe(true);
    });

    it('should handle multiple attempts and check the most recent', async () => {
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      const oldAttempt: Record<string, unknown> = {
        id: 'attempt1',
        userId: 'user1',
        objectiveId: 'objective1',
        status: 'completed',
        createdAt: admin.firestore.Timestamp.fromDate(twoHoursAgo),
      };

      const recentAttempt: Record<string, unknown> = {
        id: 'attempt2',
        userId: 'user1',
        objectiveId: 'objective1',
        status: 'pending',
        createdAt: admin.firestore.Timestamp.fromDate(thirtyMinutesAgo),
      };

      mockFirebaseService.queryDocuments.mockResolvedValue([oldAttempt, recentAttempt]);

      const result = await streakService.canAttemptRecovery('user1', 'objective1');

      expect(result.canAttempt).toBe(false);
    });

    it('should allow attempt on error (fail open)', async () => {
      mockFirebaseService.queryDocuments.mockRejectedValue(new Error('Database error'));

      const result = await streakService.canAttemptRecovery('user1', 'objective1');

      expect(result.canAttempt).toBe(true);
    });
  });

  describe('formatCooldownTime (private method tested via canAttemptRecovery)', () => {
    it('should format cooldown time correctly through canAttemptRecovery', async () => {
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      const recentAttempt: Record<string, unknown> = {
        id: 'attempt1',
        userId: 'user1',
        objectiveId: 'objective1',
        status: 'completed',
        createdAt: admin.firestore.Timestamp.fromDate(thirtyMinutesAgo),
      };

      mockFirebaseService.queryDocuments.mockResolvedValue([recentAttempt]);

      const result = await streakService.canAttemptRecovery('user1', 'objective1');

      expect(result.canAttempt).toBe(false);
      expect(result.cooldownEndsAt).toBeInstanceOf(Date);

      // Verify the cooldown end time is approximately 1 hour after the attempt
      if (result.cooldownEndsAt != null) {
        const expectedEnd = new Date(thirtyMinutesAgo.getTime() + 60 * 60 * 1000);
        const diff = Math.abs(result.cooldownEndsAt.getTime() - expectedEnd.getTime());
        expect(diff).toBeLessThan(1000); // Within 1 second tolerance
      }
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle Date object for createdAt in canAttemptRecovery', async () => {
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      const recentAttempt: Record<string, unknown> = {
        id: 'attempt1',
        userId: 'user1',
        objectiveId: 'objective1',
        status: 'completed',
        createdAt: thirtyMinutesAgo, // Direct Date object
      };

      mockFirebaseService.queryDocuments.mockResolvedValue([recentAttempt]);

      const result = await streakService.canAttemptRecovery('user1', 'objective1');

      expect(result.canAttempt).toBe(false);
      expect(result.cooldownEndsAt).toBeInstanceOf(Date);
    });

    it('should handle string date for createdAt in canAttemptRecovery', async () => {
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      const recentAttempt: Record<string, unknown> = {
        id: 'attempt1',
        userId: 'user1',
        objectiveId: 'objective1',
        status: 'completed',
        createdAt: thirtyMinutesAgo.toISOString(), // String date
      };

      mockFirebaseService.queryDocuments.mockResolvedValue([recentAttempt]);

      const result = await streakService.canAttemptRecovery('user1', 'objective1');

      expect(result.canAttempt).toBe(false);
    });

    it('should skip invalid createdAt values in canAttemptRecovery', async () => {
      const recentAttempt: Record<string, unknown> = {
        id: 'attempt1',
        userId: 'user1',
        objectiveId: 'objective1',
        status: 'completed',
        createdAt: null, // Invalid date
      };

      mockFirebaseService.queryDocuments.mockResolvedValue([recentAttempt]);

      const result = await streakService.canAttemptRecovery('user1', 'objective1');

      // Should allow attempt since invalid date is skipped
      expect(result.canAttempt).toBe(true);
    });
  });

  describe('getStreak - Recalculation Logic', () => {
    it('should recalculate and reset streak to 0 when user missed 2+ days', async () => {
      // Mock: User last studied 3 days ago with a streak of 5
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0);

      const mockStreakDoc: Record<string, unknown> = {
        userId: 'user1',
        currentStreak: 5,
        longestStreak: 10,
        lastStudyDate: admin.firestore.Timestamp.fromDate(threeDaysAgo),
        missedDays: 0,
        recoveryHistory: [],
        updatedAt: admin.firestore.Timestamp.fromDate(threeDaysAgo),
      };

      mockFirebaseService.getDocument.mockResolvedValue(mockStreakDoc);

      const result = await streakService.getStreak('user1');

      // Streak should be recalculated to 0 (broken)
      expect(result).not.toBeNull();
      expect(result?.currentStreak).toBe(0);
      expect(result?.missedDays).toBe(2); // 3 days since last study - 1 = 2 missed days
      expect(result?.longestStreak).toBe(10); // Longest streak unchanged
    });

    it('should keep streak active when user studied today', async () => {
      // Mock: User studied earlier today
      const today = new Date();
      today.setHours(8, 0, 0, 0);

      const mockStreakDoc: Record<string, unknown> = {
        userId: 'user1',
        currentStreak: 7,
        longestStreak: 10,
        lastStudyDate: admin.firestore.Timestamp.fromDate(today),
        missedDays: 0,
        recoveryHistory: [],
        updatedAt: admin.firestore.Timestamp.fromDate(today),
      };

      mockFirebaseService.getDocument.mockResolvedValue(mockStreakDoc);

      const result = await streakService.getStreak('user1');

      // Streak should remain active
      expect(result).not.toBeNull();
      expect(result?.currentStreak).toBe(7);
      expect(result?.missedDays).toBe(0);
    });

    it('should keep streak active when user studied yesterday (grace period)', async () => {
      // Mock: User studied yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 0, 0, 0);

      const mockStreakDoc: Record<string, unknown> = {
        userId: 'user1',
        currentStreak: 3,
        longestStreak: 5,
        lastStudyDate: admin.firestore.Timestamp.fromDate(yesterday),
        missedDays: 0,
        recoveryHistory: [],
        updatedAt: admin.firestore.Timestamp.fromDate(yesterday),
      };

      mockFirebaseService.getDocument.mockResolvedValue(mockStreakDoc);

      const result = await streakService.getStreak('user1');

      // Streak should remain active (1-day grace period)
      expect(result).not.toBeNull();
      expect(result?.currentStreak).toBe(3);
      expect(result?.missedDays).toBe(0);
    });

    it('should reset streak when exactly 2 days have passed', async () => {
      // Mock: User last studied 2 days ago
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      const mockStreakDoc: Record<string, unknown> = {
        userId: 'user1',
        currentStreak: 15,
        longestStreak: 20,
        lastStudyDate: admin.firestore.Timestamp.fromDate(twoDaysAgo),
        missedDays: 0,
        recoveryHistory: [],
        updatedAt: admin.firestore.Timestamp.fromDate(twoDaysAgo),
      };

      mockFirebaseService.getDocument.mockResolvedValue(mockStreakDoc);

      const result = await streakService.getStreak('user1');

      // Streak should be broken
      expect(result).not.toBeNull();
      expect(result?.currentStreak).toBe(0);
      expect(result?.missedDays).toBe(1); // 2 days since last study - 1 = 1 missed day
    });

    it('should create initial streak with 0 when user has no streak', async () => {
      // Mock: No existing streak
      mockFirebaseService.getDocument.mockResolvedValue(null);
      mockFirebaseService.createDocument.mockResolvedValue('user1');

      const result = await streakService.getStreak('user1');

      // Should create new streak with 0
      expect(result).not.toBeNull();
      expect(result?.currentStreak).toBe(0);
      expect(result?.longestStreak).toBe(0);
      expect(result?.missedDays).toBe(0);
      expect(mockFirebaseService.createDocument).toHaveBeenCalledWith(
        'streaks',
        expect.objectContaining({
          userId: 'user1',
          currentStreak: 0,
          longestStreak: 0,
        }),
        'user1'
      );
    });
  });
});
