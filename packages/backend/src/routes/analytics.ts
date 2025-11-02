import { Router } from 'express';
import { type Request, type Response } from 'express';
import { analyticsService } from '@/services/analytics';
import { logger } from '@/utils/logger';

const router = Router();

// GET /api/analytics/user/:userId
router.get('/user/:userId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userIdParam: string | undefined = req.params['userId'];
    if (userIdParam == null || userIdParam === '') {
      return res.status(400).json({
        success: false,
        error: { message: 'userId is required' },
      });
    }
    const userId: string = userIdParam;
    const timeRangeParam: unknown = req.query['timeRange'];
    const timeRange: string =
      (typeof timeRangeParam === 'string' ? timeRangeParam : undefined) ?? 'month';

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
  } catch (error: unknown) {
    logger.error('Error getting user analytics:', error);
    throw error;
  }
});

// GET /api/analytics/patterns/:userId
router.get('/patterns/:userId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userIdParam: string | undefined = req.params['userId'];
    if (userIdParam == null || userIdParam === '') {
      return res.status(400).json({
        success: false,
        error: { message: 'userId is required' },
      });
    }
    const userId: string = userIdParam;

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
  } catch (error: unknown) {
    logger.error('Error getting study patterns:', error);
    throw error;
  }
});

// GET /api/analytics/recommendations/:userId
router.get('/recommendations/:userId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userIdParam: string | undefined = req.params['userId'];
    if (userIdParam == null || userIdParam === '') {
      return res.status(400).json({
        success: false,
        error: { message: 'userId is required' },
      });
    }
    const userId: string = userIdParam;
    const timeRangeParam: unknown = req.query['timeRange'];
    const timeRange: string =
      (typeof timeRangeParam === 'string' ? timeRangeParam : undefined) ?? 'month';

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
  } catch (error: unknown) {
    logger.error('Error generating recommendations:', error);
    throw error;
  }
});

// GET /api/analytics/dashboard/:userId
router.get('/dashboard/:userId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const userIdParam: string | undefined = req.params['userId'];
    if (userIdParam == null || userIdParam === '') {
      return res.status(400).json({
        success: false,
        error: { message: 'userId is required' },
      });
    }
    const userId: string = userIdParam;

    // Verify user can access this data
    if (req.user?.uid !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' },
      });
    }

    // Get comprehensive dashboard data
    const analyticsPromise = analyticsService.getUserAnalytics(userId, 'month');
    const patternsPromise = analyticsService.getStudyPatterns(userId);
    const recommendationsPromise = analyticsService.generateRecommendations(userId, {});
    const [analytics, patterns, recommendations]: [
      Awaited<typeof analyticsPromise>,
      Awaited<typeof patternsPromise>,
      Awaited<typeof recommendationsPromise>
    ] = await Promise.all([analyticsPromise, patternsPromise, recommendationsPromise]);

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
  } catch (error: unknown) {
    logger.error('Error getting dashboard data:', error);
    throw error;
  }
});

// GET /api/analytics/objective/:objectiveId
router.get('/objective/:objectiveId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const objectiveIdParam: string | undefined = req.params['objectiveId'];
    if (objectiveIdParam == null || objectiveIdParam === '') {
      return res.status(400).json({
        success: false,
        error: { message: 'objectiveId is required' },
      });
    }
    const objectiveId: string = objectiveIdParam;
    const userIdParam: string | undefined = req.user?.uid;
    if (userIdParam == null || userIdParam === '') {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }
    const userId: string = userIdParam;
    const timeRangeParam: unknown = req.query['timeRange'];
    const timeRange: string =
      (typeof timeRangeParam === 'string' ? timeRangeParam : undefined) ?? 'month';

    const analytics = await analyticsService.getObjectiveAnalytics(
      userId,
      objectiveId,
      timeRange as 'week' | 'month' | 'all'
    );

    return res.json({
      success: true,
      data: analytics,
      message: 'Objective analytics retrieved successfully',
    });
  } catch (error: unknown) {
    logger.error('Error getting objective analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('not found') || errorMessage.includes('Access denied')) {
      return res.status(404).json({
        success: false,
        error: { message: errorMessage },
      });
    }
    throw error;
  }
});

export const analyticsRoutes = router;
