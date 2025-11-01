import { Router, type Request, type Response } from 'express';
import { learningPlanRoutes } from './learningPlan';
import { documentRoutes } from './document';
import { userRoutes } from './user';
import { analyticsRoutes } from './analytics';

const router = Router();

// Mount route modules
router.use('/learning-plans', learningPlanRoutes);
router.use('/documents', documentRoutes);
router.use('/users', userRoutes);
router.use('/analytics', analyticsRoutes);

// API info endpoint
router.get('/', (_req: Request, res: Response): Response => {
  return res.json({
    message: 'FlashLearn AI API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      learningPlans: '/api/learning-plans',
      documents: '/api/documents',
      users: '/api/users',
      analytics: '/api/analytics',
      health: '/health',
    },
  });
});

export default router;
