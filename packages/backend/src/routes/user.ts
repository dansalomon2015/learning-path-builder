import { Request, Response } from 'express';
import { firebaseService } from '@/services/firebase';
import { adaptiveLearningService } from '@/services/adaptiveLearning';
import { User, LearningPlan, StudySession, LearningProgress } from '@/types';
import { logger } from '@/utils/logger';

const router = require('express').Router();

// GET /api/users/profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const user = await firebaseService.getDocument('users', userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User profile not found' },
      });
    }

    // Get user's learning progress
    const progress = await adaptiveLearningService.getUserProgress(userId);

    res.json({
      success: true,
      data: {
        ...user,
        progress,
      },
      message: 'User profile retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting user profile:', error);
    throw error;
  }
});

// PUT /api/users/profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const updateData = req.body;

    // Update user profile
    await firebaseService.updateDocument('users', userId, {
      ...updateData,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      data: { id: userId, ...updateData },
      message: 'User profile updated successfully',
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    throw error;
  }
});

// GET /api/users/learning-progress
router.get('/learning-progress', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const progress = await adaptiveLearningService.getUserProgress(userId);

    res.json({
      success: true,
      data: progress,
      message: 'Learning progress retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting learning progress:', error);
    throw error;
  }
});

// GET /api/users/study-sessions
router.get('/study-sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { limit = 10, offset = 0 } = req.query;

    if (!userId) {
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
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      }
    );

    res.json({
      success: true,
      data: sessions,
      message: 'Study sessions retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting study sessions:', error);
    throw error;
  }
});

// GET /api/users/statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
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
    const totalPlans = learningPlans.length;
    const totalSessions = studySessions.length;
    const totalCards = learningPlans.reduce((sum, plan) => sum + plan.totalCards, 0);
    const masteredCards = learningPlans.reduce((sum, plan) => sum + plan.masteredCards, 0);
    const averageScore =
      studySessions.length > 0
        ? studySessions.reduce((sum, session) => sum + (session.score || 0), 0) /
          studySessions.length
        : 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSessions = studySessions.filter(
      session => new Date(session.startTime) >= sevenDaysAgo
    );

    const statistics = {
      totalPlans,
      totalSessions,
      totalCards,
      masteredCards,
      masteryPercentage: totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0,
      averageScore: Math.round(averageScore),
      recentActivity: recentSessions.length,
      streak: await adaptiveLearningService.calculateStreak(userId),
    };

    res.json({
      success: true,
      data: statistics,
      message: 'User statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting user statistics:', error);
    throw error;
  }
});

// POST /api/users/delete-account
router.post('/delete-account', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
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

    learningPlans.forEach(plan => {
      batch.delete(firebaseService.getDocRef('learningPlans', plan.id));
    });

    // Delete study sessions
    const studySessions = await firebaseService.queryDocuments('studySessions', [
      { field: 'userId', operator: '==', value: userId },
    ]);

    studySessions.forEach(session => {
      batch.delete(firebaseService.getDocRef('studySessions', session.id));
    });

    // Delete document uploads
    const documentUploads = await firebaseService.queryDocuments('documentUploads', [
      { field: 'userId', operator: '==', value: userId },
    ]);

    documentUploads.forEach(upload => {
      batch.delete(firebaseService.getDocRef('documentUploads', upload.id));
    });

    // Delete user profile
    batch.delete(firebaseService.getDocRef('users', userId));

    // Commit the batch
    await batch.commit();

    logger.info(`User account deleted: ${userId}`);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting user account:', error);
    throw error;
  }
});

export const userRoutes = router;
