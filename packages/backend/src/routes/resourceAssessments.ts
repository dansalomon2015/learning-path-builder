import { Router, type Request, type Response } from 'express';
import { resourceAssessmentService } from '@/services/resourceAssessmentService';
import { logger } from '@/utils/logger';
import { streakService } from '@/services/streakService';

const router = Router();

// IMPORTANT: Specific routes must be defined BEFORE parameterized routes
// Otherwise /:assessmentId will match /start

// GET /api/resource-assessments/resource/:resourceId/status
router.get('/resource/:resourceId/status', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const resourceId: string | undefined = req.params['resourceId'];
  if (resourceId == null || resourceId === '') {
    return res.status(400).json({ success: false, message: 'resourceId is required' });
  }

  try {
    const status = await resourceAssessmentService.getResourceStatus(uid, resourceId);
    return res.json({
      success: true,
      data: status,
    });
  } catch (error: unknown) {
    logger.error('Error getting resource status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: { message: errorMessage },
    });
  }
});

// GET /api/resource-assessments/resource/:resourceId/history
router.get('/resource/:resourceId/history', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const resourceId: string | undefined = req.params['resourceId'];
  if (resourceId == null || resourceId === '') {
    return res.status(400).json({ success: false, message: 'resourceId is required' });
  }

  try {
    const history = await resourceAssessmentService.getResourceAssessmentHistory(uid, resourceId);
    return res.json({
      success: true,
      data: history,
    });
  } catch (error: unknown) {
    logger.error('Error getting resource assessment history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: { message: errorMessage },
    });
  }
});

// POST /api/resource-assessments/start
router.post('/start', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const body = req.body as {
    resourceId: string;
    moduleId: string;
    objectiveId: string;
    questionCount?: number;
    forceNew?: boolean;
  };

  const resourceId: string = body.resourceId;
  const moduleId: string = body.moduleId;
  const objectiveId: string = body.objectiveId;
  const questionCount: number = body.questionCount ?? 5;
  const forceNew: boolean = body.forceNew ?? false;

  if (resourceId == null || resourceId === '') {
    return res.status(400).json({ success: false, message: 'resourceId is required' });
  }

  if (moduleId == null || moduleId === '') {
    return res.status(400).json({ success: false, message: 'moduleId is required' });
  }

  if (objectiveId == null || objectiveId === '') {
    return res.status(400).json({ success: false, message: 'objectiveId is required' });
  }

  try {
    // If forcing new, create directly; otherwise get or create
    const assessment = forceNew
      ? await resourceAssessmentService.createAssessment(uid, resourceId, moduleId, objectiveId, questionCount)
      : await resourceAssessmentService.getOrCreateAssessment(uid, resourceId, moduleId, objectiveId, false, questionCount);
    return res.json({
      success: true,
      data: assessment,
      message: 'Resource assessment created successfully',
    });
  } catch (error: unknown) {
    logger.error('Error creating resource assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Cooldown error - return 429 (Too Many Requests)
    if (errorMessage.includes('attendre')) {
      return res.status(429).json({
        success: false,
        error: { message: errorMessage },
      });
    }

    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('Unauthorized') ||
      errorMessage.includes('Forbidden')
    ) {
      return res.status(404).json({
        success: false,
        error: { message: errorMessage },
      });
    }

    return res.status(500).json({
      success: false,
      error: { message: errorMessage },
    });
  }
});

// POST /api/resource-assessments/:assessmentId/submit
router.post('/:assessmentId/submit', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const assessmentId: string | undefined = req.params['assessmentId'];
  if (assessmentId == null || assessmentId === '') {
    return res.status(400).json({ success: false, message: 'assessmentId is required' });
  }

  const body = req.body as {
    answers: Array<{ questionId: string; selectedAnswer: string | number }>;
    timeSpent?: number;
  };

  const answers: Array<{ questionId: string; selectedAnswer: string | number }> = body.answers;
  const timeSpent: number | undefined = body.timeSpent;

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ success: false, message: 'answers array is required' });
  }

  try {
    const result = await resourceAssessmentService.submitAssessment(
      assessmentId,
      uid,
      answers,
      timeSpent
    );

    // Update streak (non-blocking)
    streakService.updateStreakOnStudy(uid).catch((error: unknown) => {
      logger.warn('Failed to update streak after resource assessment', { userId: uid, error });
    });

    return res.json({
      success: true,
      data: result,
      message: result.passed ? 'Assessment passed!' : 'Assessment failed. Score below 70%.',
    });
  } catch (error: unknown) {
    logger.error('Error submitting resource assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('Unauthorized') ||
      errorMessage.includes('already completed')
    ) {
      return res.status(400).json({
        success: false,
        error: { message: errorMessage },
      });
    }

    return res.status(500).json({
      success: false,
      error: { message: errorMessage },
    });
  }
});

// GET /api/resource-assessments/:assessmentId
// This must be AFTER specific routes like /start and /resource/:resourceId/*
router.get('/:assessmentId', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const assessmentId: string | undefined = req.params['assessmentId'];
  if (assessmentId == null || assessmentId === '') {
    return res.status(400).json({ success: false, message: 'assessmentId is required' });
  }

  try {
    // We need to fetch from Firestore directly since we don't have a getAssessment method
    // For now, return a simple response - this can be enhanced later
    return res.status(501).json({
      success: false,
      message: 'Get assessment endpoint not yet implemented',
    });
  } catch (error: unknown) {
    logger.error('Error getting resource assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: { message: errorMessage },
    });
  }
});

export default router;

