import { Router, type Request, type Response } from 'express';
import { moduleFinalExamService } from '@/services/moduleFinalExamService';
import { firebaseService } from '@/services/firebase';
import { logger } from '@/utils/logger';
import { streakService } from '@/services/streakService';

const router = Router();

// Check if user can take the final exam
router.get(
  '/modules/:moduleId/can-take',
  async (req: Request, res: Response): Promise<Response> => {
    const uid: string | undefined = req.user?.uid;
    if (uid == null || uid === '') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const moduleId: string | undefined = req.params['moduleId'];
    if (moduleId == null || moduleId === '') {
      return res.status(400).json({ success: false, message: 'moduleId is required' });
    }

    try {
      const eligibility = await moduleFinalExamService.canTakeFinalExam(uid, moduleId);
      return res.json({ success: true, data: eligibility });
    } catch (error: unknown) {
      logger.error('Error checking final exam eligibility:', error);
      return res.status(500).json({ success: false, message: 'Failed to check eligibility' });
    }
  }
);

// Start a module final exam
router.post('/start', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const body = req.body as {
    moduleId: string;
    pathId: string;
    objectiveId: string;
  };

  const { moduleId, pathId, objectiveId } = body;

  if (moduleId == null || moduleId === '' || pathId == null || pathId === '' || objectiveId == null || objectiveId === '') {
    return res.status(400).json({ success: false, message: 'moduleId, pathId, and objectiveId are required' });
  }

  try {
    // Check eligibility first
    const eligibility = await moduleFinalExamService.canTakeFinalExam(uid, moduleId);
    if (!eligibility.canTake) {
      return res.status(403).json({
        success: false,
        message: eligibility.reason ?? 'Cannot take final exam',
        data: eligibility,
      });
    }

    const exam = await moduleFinalExamService.createExam(uid, moduleId, pathId, objectiveId);
    return res.status(201).json({ success: true, data: exam });
  } catch (error: unknown) {
    logger.error('Error creating module final exam:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create exam';
    return res.status(500).json({ success: false, message: errorMessage });
  }
});

// Submit module final exam
router.post('/:examId/submit', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const examId: string | undefined = req.params['examId'];
  if (examId == null || examId === '') {
    return res.status(400).json({ success: false, message: 'examId is required' });
  }

  const body = req.body as {
    answers: Array<{ questionId: string; selectedAnswer: string | number }>;
    timeSpent?: number;
  };

  const { answers, timeSpent } = body;

  if (answers == null || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ success: false, message: 'answers array is required' });
  }

  try {
    const result = await moduleFinalExamService.submitExam(examId, uid, answers, timeSpent);

    // Update streak (non-blocking)
    streakService.updateStreakOnStudy(uid).catch((error: unknown) => {
      logger.warn('Failed to update streak after module final exam', { userId: uid, error });
    });

    return res.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('Error submitting module final exam:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit exam';
    return res.status(500).json({ success: false, message: errorMessage });
  }
});

// Get exam by ID
router.get('/:examId', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const examId: string | undefined = req.params['examId'];
  if (examId == null || examId === '') {
    return res.status(400).json({ success: false, message: 'examId is required' });
  }

  try {
    const examDoc = await firebaseService.getDocument('moduleFinalExams', examId);
    if (examDoc == null) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const exam = examDoc as { userId: string };
    if (exam.userId !== uid) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return res.json({ success: true, data: { id: examId, ...examDoc } });
  } catch (error: unknown) {
    logger.error('Error getting module final exam:', error);
    return res.status(500).json({ success: false, message: 'Failed to get exam' });
  }
});

export default router;

