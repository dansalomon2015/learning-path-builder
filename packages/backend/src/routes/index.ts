import { Router, type Request, type Response } from 'express';
import { learningPlanRoutes } from './learningPlan';
import { documentRoutes } from './document';
import { userRoutes } from './user';
import { analyticsRoutes } from './analytics';
import streakRoutes from './streak';
import resourceAssessmentsRoutes from './resourceAssessments';
import moduleFinalExamsRoutes from './moduleFinalExams';

const router = Router();

// Mount route modules
router.use('/learning-plans', learningPlanRoutes);
router.use('/documents', documentRoutes);
router.use('/users', userRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/streak', streakRoutes);
router.use('/resource-assessments', resourceAssessmentsRoutes);
router.use('/module-final-exams', moduleFinalExamsRoutes);

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
      streak: '/api/streak',
      resourceAssessments: '/api/resource-assessments',
      moduleFinalExams: '/api/module-final-exams',
      health: '/health',
    },
  });
});

export default router;
