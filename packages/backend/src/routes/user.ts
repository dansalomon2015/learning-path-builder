import express, { type Request, type Response } from 'express';
import { firebaseService } from '@/services/firebase';
import { adaptiveLearningService } from '@/services/adaptiveLearning';
import { logger } from '@/utils/logger';
import type { Flashcard } from '@/types';

const router = express.Router();

// GET /api/users/profile
router.get('/profile', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId: string | undefined = req.user?.uid;
    if (userId == null || userId === '') {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const user = await firebaseService.getDocument('users', userId);
    if (user == null) {
      return res.status(404).json({
        success: false,
        error: { message: 'User profile not found' },
      });
    }

    // Get user's learning progress - Note: getUserProgress doesn't exist, using calculateLearningProgress instead
    const learningPlans = await firebaseService.queryDocuments('learningPlans', [
      { field: 'userId', operator: '==', value: userId },
    ]);
    const flashcards: Array<Record<string, unknown>> = [];
    let firstPlanId = '';
    for (const plan of learningPlans) {
      if (firstPlanId === '') {
        const planId: unknown = plan['id'];
        if (typeof planId === 'string') {
          firstPlanId = planId;
        }
      }
      const planFlashcards: unknown = plan['flashcards'];
      if (Array.isArray(planFlashcards)) {
        flashcards.push(...(planFlashcards as Array<Record<string, unknown>>));
      }
    }
    const progress = await adaptiveLearningService.calculateLearningProgress(
      firstPlanId !== '' ? firstPlanId : '',
      flashcards as unknown as Flashcard[]
    );

    return res.json({
      success: true,
      data: {
        ...user,
        progress,
      },
      message: 'User profile retrieved successfully',
    });
  } catch (error: unknown) {
    logger.error('Error getting user profile:', error);
    throw error;
  }
});

// PUT /api/users/profile
router.put('/profile', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId: string | undefined = req.user?.uid;
    if (userId == null || userId === '') {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const updateData: Record<string, unknown> = req.body as Record<string, unknown>;

    // Update user profile
    await firebaseService.updateDocument('users', userId, {
      ...updateData,
      updatedAt: new Date(),
    });

    return res.json({
      success: true,
      data: { id: userId, ...updateData },
      message: 'User profile updated successfully',
    });
  } catch (error: unknown) {
    logger.error('Error updating user profile:', error);
    throw error;
  }
});

// GET /api/users/learning-progress
router.get('/learning-progress', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId: string | undefined = req.user?.uid;
    if (userId == null || userId === '') {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    // Calculate learning progress from all flashcards
    const learningPlans = await firebaseService.queryDocuments('learningPlans', [
      { field: 'userId', operator: '==', value: userId },
    ]);
    const flashcards: Array<Record<string, unknown>> = [];
    let firstPlanId = '';
    for (const plan of learningPlans) {
      if (firstPlanId === '') {
        const planId: unknown = plan['id'];
        if (typeof planId === 'string') {
          firstPlanId = planId;
        }
      }
      const planFlashcards: unknown = plan['flashcards'];
      if (Array.isArray(planFlashcards)) {
        flashcards.push(...(planFlashcards as Array<Record<string, unknown>>));
      }
    }
    const progress = await adaptiveLearningService.calculateLearningProgress(
      firstPlanId !== '' ? firstPlanId : '',
      flashcards as unknown as Flashcard[]
    );

    return res.json({
      success: true,
      data: progress,
      message: 'Learning progress retrieved successfully',
    });
  } catch (error: unknown) {
    logger.error('Error getting learning progress:', error);
    throw error;
  }
});

// GET /api/users/study-sessions
router.get('/study-sessions', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId: string | undefined = req.user?.uid;
    const limitValue: unknown = req.query['limit'];
    const offsetValue: unknown = req.query['offset'];
    const limit: number =
      typeof limitValue === 'string'
        ? parseInt(limitValue, 10)
        : typeof limitValue === 'number'
        ? limitValue
        : 10;
    const offset: number =
      typeof offsetValue === 'string'
        ? parseInt(offsetValue, 10)
        : typeof offsetValue === 'number'
        ? offsetValue
        : 0;

    if (userId == null || userId === '') {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const sessions = await firebaseService.queryDocuments(
      'studySessions',
      [{ field: 'userId', operator: '==', value: userId }],
      {
        orderBy: 'startTime',
        orderDirection: 'desc',
        limit,
        offset,
      }
    );

    return res.json({
      success: true,
      data: sessions,
      message: 'Study sessions retrieved successfully',
    });
  } catch (error: unknown) {
    logger.error('Error getting study sessions:', error);
    throw error;
  }
});

// GET /api/users/statistics
router.get('/statistics', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId: string | undefined = req.user?.uid;
    if (userId == null || userId === '') {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    // Get user's learning plans
    const learningPlans = await firebaseService.queryDocuments('learningPlans', [
      { field: 'userId', operator: '==', value: userId },
    ]);

    // Get user's study sessions
    const studySessions = await firebaseService.queryDocuments('studySessions', [
      { field: 'userId', operator: '==', value: userId },
      { field: 'isCompleted', operator: '==', value: true },
    ]);

    // Calculate statistics
    const totalPlans: number = learningPlans.length;
    const totalSessions: number = studySessions.length;
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
    const averageScore: number =
      studySessions.length > 0
        ? studySessions.reduce((sum: number, session: Record<string, unknown>): number => {
            const scoreValue: unknown = session['score'];
            return sum + (typeof scoreValue === 'number' ? scoreValue : 0);
          }, 0) / studySessions.length
        : 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSessions = studySessions.filter((session: Record<string, unknown>): boolean => {
      const startTimeValue: unknown = session['startTime'];
      if (
        startTimeValue instanceof Date ||
        typeof startTimeValue === 'string' ||
        typeof startTimeValue === 'number'
      ) {
        return new Date(startTimeValue) >= sevenDaysAgo;
      }
      return false;
    });

    // Note: calculateStreak doesn't exist, using 0 as placeholder
    const statistics = {
      totalPlans,
      totalSessions,
      totalCards,
      masteredCards,
      masteryPercentage: totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0,
      averageScore: Math.round(averageScore),
      recentActivity: recentSessions.length,
      streak: 0,
    };

    return res.json({
      success: true,
      data: statistics,
      message: 'User statistics retrieved successfully',
    });
  } catch (error: unknown) {
    logger.error('Error getting user statistics:', error);
    throw error;
  }
});

// POST /api/users/delete-account
router.post('/delete-account', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId: string | undefined = req.user?.uid;
    if (userId == null || userId === '') {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    // Delete all user data
    const batch = firebaseService.getBatch();

    // Delete learning plans
    const learningPlans = await firebaseService.queryDocuments('learningPlans', [
      { field: 'userId', operator: '==', value: userId },
    ]);

    learningPlans.forEach((plan: Record<string, unknown>): void => {
      const planId: unknown = plan['id'];
      if (typeof planId === 'string') {
        batch.delete(firebaseService.getDocRef('learningPlans', planId));
      }
    });

    // Delete study sessions
    const studySessions = await firebaseService.queryDocuments('studySessions', [
      { field: 'userId', operator: '==', value: userId },
    ]);

    studySessions.forEach((session: Record<string, unknown>): void => {
      const sessionId: unknown = session['id'];
      if (typeof sessionId === 'string') {
        batch.delete(firebaseService.getDocRef('studySessions', sessionId));
      }
    });

    // Delete document uploads
    const documentUploads = await firebaseService.queryDocuments('documentUploads', [
      { field: 'userId', operator: '==', value: userId },
    ]);

    documentUploads.forEach((upload: Record<string, unknown>): void => {
      const uploadId: unknown = upload['id'];
      if (typeof uploadId === 'string') {
        batch.delete(firebaseService.getDocRef('documentUploads', uploadId));
      }
    });

    // Delete user profile
    batch.delete(firebaseService.getDocRef('users', userId));

    // Commit the batch
    await batch.commit();

    logger.info(`User account deleted: ${userId}`);

    return res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: unknown) {
    logger.error('Error deleting user account:', error);
    throw error;
  }
});

export const userRoutes = router;
