import { Router, type Request, type Response } from 'express';
import { streakService } from '@/services/streakService';
import { logger } from '@/utils/logger';

const router = Router();

// GET /api/streak/:userId/missed-days (must be before /:userId to avoid route conflicts)
router.get('/:userId/missed-days', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  const userIdParam: string | undefined = req.params['userId'];

  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (userIdParam == null || userIdParam === '' || userIdParam !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    const { missedDays, lastStudyDate } = await streakService.calculateMissedDays(uid);
    return res.json({
      success: true,
      data: { missedDays, lastStudyDate },
      message: 'Missed days calculated successfully',
    });
  } catch (error: unknown) {
    logger.error('Error calculating missed days:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: { message: errorMessage },
    });
  }
});

// GET /api/streak/:userId/active-objectives
router.get('/:userId/active-objectives', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  const userIdParam: string | undefined = req.params['userId'];

  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (userIdParam == null || userIdParam === '' || userIdParam !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    const objectives = await streakService.getActiveObjectivesForRecovery(uid);
    return res.json({
      success: true,
      data: objectives,
      message: 'Active objectives retrieved successfully',
    });
  } catch (error: unknown) {
    logger.error('Error getting active objectives:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: { message: errorMessage },
    });
  }
});

// POST /api/streak/recovery/generate
router.post('/recovery/generate', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const body = req.body as {
    objectiveId: string;
    missedDays: number;
  };

  const objectiveId: string = body.objectiveId;
  const missedDays: number = body.missedDays;

  if (objectiveId == null || objectiveId === '') {
    return res.status(400).json({ success: false, message: 'objectiveId is required' });
  }

  if (typeof missedDays !== 'number' || missedDays <= 0) {
    return res
      .status(400)
      .json({ success: false, message: 'missedDays must be a positive number' });
  }

  try {
    const assessment = await streakService.generateRecoveryAssessment(uid, objectiveId, missedDays);
    return res.json({
      success: true,
      data: assessment,
      message: 'Recovery assessment generated successfully',
    });
  } catch (error: unknown) {
    logger.error('Error generating recovery assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Cooldown error - return 429 (Too Many Requests)
    if (errorMessage.includes('attendre')) {
      return res.status(429).json({
        success: false,
        error: { message: errorMessage },
      });
    }

    if (errorMessage.includes('not found') || errorMessage.includes('Unauthorized')) {
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

// POST /api/streak/recovery/submit
router.post('/recovery/submit', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const body = req.body as {
    assessmentId: string;
    answers: Array<{ questionId: string; selectedAnswer: string | number }>;
    timeSpent?: number; // in seconds
  };

  const assessmentId: string = body.assessmentId;
  const answers: Array<{ questionId: string; selectedAnswer: string | number }> = body.answers;
  const timeSpent: number | undefined = body.timeSpent;

  if (assessmentId == null || assessmentId === '') {
    return res.status(400).json({ success: false, message: 'assessmentId is required' });
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ success: false, message: 'answers array is required' });
  }

  try {
    const result = await streakService.validateRecoveryAssessment(assessmentId, answers, timeSpent);
    return res.json({
      success: true,
      data: result,
      message: result.passed ? 'Recovery successful!' : 'Recovery failed. Score below 70%.',
    });
  } catch (error: unknown) {
    logger.error('Error validating recovery assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('expired') ||
      errorMessage.includes('completed')
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

// GET /api/streak/:userId (must be after specific routes to avoid conflicts)
router.get('/:userId', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  const userIdParam: string | undefined = req.params['userId'];

  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (userIdParam == null || userIdParam === '' || userIdParam !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    const streak = await streakService.getStreak(uid);
    if (streak == null) {
      return res.status(404).json({
        success: false,
        error: { message: 'Streak not found' },
      });
    }
    // Convert Date objects to ISO strings for JSON serialization
    const streakData = {
      ...streak,
      lastStudyDate: streak.lastStudyDate instanceof Date ? streak.lastStudyDate.toISOString() : streak.lastStudyDate,
      updatedAt: streak.updatedAt instanceof Date ? streak.updatedAt.toISOString() : streak.updatedAt,
      recoveryHistory: streak.recoveryHistory.map((entry) => ({
        ...entry,
        date: entry.date instanceof Date ? entry.date.toISOString() : entry.date,
      })),
    };
    return res.json({
      success: true,
      data: streakData,
      message: 'Streak retrieved successfully',
    });
  } catch (error: unknown) {
    logger.error('Error getting streak:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: { message: errorMessage },
    });
  }
});

export default router;
