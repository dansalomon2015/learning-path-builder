import { Router } from 'express';
import { Request, Response } from 'express';
import { analyticsService } from '@/services/analytics';
import { logger } from '@/utils/logger';

const router = Router();

// GET /api/analytics/user/:userId
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { timeRange = 'month' } = req.query;

    // Verify user can access this data
    if (req.user?.uid !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      });
    }

    const analytics = await analyticsService.getUserAnalytics(
      userId,
      timeRange as 'week' | 'month' | 'all'
    );

    return res.json({
      success: true,
      data: analytics,
      message: 'User analytics retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting user analytics:', error);
    throw error;
  }
});

// GET /api/analytics/patterns/:userId
router.get('/patterns/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user can access this data
    if (req.user?.uid !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      });
    }

    const patterns = await analyticsService.getStudyPatterns(userId);

    return res.json({
      success: true,
      data: patterns,
      message: 'Study patterns retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting study patterns:', error);
    throw error;
  }
});

// GET /api/analytics/recommendations/:userId
router.get('/recommendations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { timeRange = 'month' } = req.query;

    // Verify user can access this data
    if (req.user?.uid !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      });
    }

    const analytics = await analyticsService.getUserAnalytics(
      userId,
      timeRange as 'week' | 'month' | 'all'
    );

    const recommendations = await analyticsService.generateRecommendations(userId, analytics);

    return res.json({
      success: true,
      data: {
        recommendations,
        analytics,
      },
      message: 'Personalized recommendations generated successfully',
    });
  } catch (error) {
    logger.error('Error generating recommendations:', error);
    throw error;
  }
});

// GET /api/analytics/dashboard/:userId
router.get('/dashboard/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verify user can access this data
    if (req.user?.uid !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      });
    }

    // Get comprehensive dashboard data
    const [analytics, patterns, recommendations] = await Promise.all([
      analyticsService.getUserAnalytics(userId, 'month'),
      analyticsService.getStudyPatterns(userId),
      analyticsService.generateRecommendations(userId, {}),
    ]);

    return res.json({
      success: true,
      data: {
        analytics,
        patterns,
        recommendations,
        lastUpdated: new Date().toISOString(),
      },
      message: 'Dashboard data retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting dashboard data:', error);
    throw error;
  }
});

export const analyticsRoutes = router;
