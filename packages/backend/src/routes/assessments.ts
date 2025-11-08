import { Router, type Request, type Response } from 'express';
import { firebaseService } from '@/services/firebase';
import { geminiService } from '@/services/gemini';
import { logger } from '@/utils/logger';
import { type QuizQuestion } from '@/types';
import { streakService } from '@/services/streakService';

const router = Router();

/**
 * Get default assessment question count from environment variable
 * Default: 25 questions
 */
const getDefaultQuestionCount = (): number => {
  const questionCountEnv = process.env['ASSESSMENT_QUESTION_COUNT'];
  if (questionCountEnv != null && questionCountEnv !== '') {
    const parsed = Number.parseInt(questionCountEnv, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 25; // Default: 25 questions
};

// Start an assessment for an objective: generate AI-powered questions
router.post('/start', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const body = req.body as {
    objectiveId: string;
    count?: number;
  };
  const objectiveId: string = body.objectiveId;
  const count: number = body.count ?? getDefaultQuestionCount();

  if (objectiveId === '') {
    return res.status(400).json({ success: false, message: 'objectiveId is required' });
  }

  try {
    // Fetch the objective details
    const objectiveDoc = await firebaseService.getDocument('objectives', objectiveId);

    if (objectiveDoc == null) {
      return res.status(404).json({ success: false, message: 'Objective not found' });
    }

    const objectiveUserId: string = (objectiveDoc as { userId: string }).userId;
    if (objectiveUserId !== uid) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Update objective status to 'in_progress' if it's still in 'planning'
    const objective = objectiveDoc as Record<string, unknown>;
    const objectiveStatus: string = (objective['status'] as string) ?? 'planning';
    if (objectiveStatus === 'planning') {
      try {
        await firebaseService.updateDocument('objectives', objectiveId, {
          status: 'in_progress',
          updatedAt: new Date().toISOString(),
        });
        logger.info(`Objective ${objectiveId} status updated from 'planning' to 'in_progress'`);
      } catch (updateError: unknown) {
        // Log but don't fail the assessment creation if status update fails
        logger.warn('Failed to update objective status to in_progress:', updateError);
      }
    }

    // Generate AI-powered questions based on objective using Gemini
    let questions: QuizQuestion[];
    try {
      const objectiveData = objectiveDoc as {
        title: string;
        description: string;
        category: string;
        targetRole: string;
        currentLevel: string;
        targetLevel: string;
      };
      questions = await geminiService.generateAssessment(
        {
          title: objectiveData.title,
          description: objectiveData.description,
          category: objectiveData.category,
          targetRole: objectiveData.targetRole,
          currentLevel: objectiveData.currentLevel,
          targetLevel: objectiveData.targetLevel,
        },
        count
      );
    } catch (geminiError: unknown) {
      logger.error('Gemini assessment generation failed, using fallback:', geminiError);

      // Fallback to basic questions if Gemini fails
      const objectiveData = objectiveDoc as {
        title: string;
        category: string;
        targetLevel: string;
      };
      const questionCount: number = Math.max(3, Math.min(20, count));
      questions = Array.from({ length: questionCount }).map(
        (_item: unknown, i: number): QuizQuestion => ({
          id: `q${i + 1}`,
          question: `Question ${i + 1} about ${objectiveData.title}?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          explanation: 'Sample explanation for learning purposes.',
          difficulty:
            objectiveData.targetLevel === 'advanced'
              ? 'hard'
              : objectiveData.targetLevel === 'intermediate'
              ? 'medium'
              : 'easy',
          category: objectiveData.category,
          skills: [objectiveData.category],
        })
      );
    }

    const now: string = new Date().toISOString();
    const objectiveData = objectiveDoc as {
      title: string;
      targetRole: string;
      category: string;
      currentLevel: string;
    };
    const assessment = {
      userId: uid,
      objectiveId,
      title: `Assessment: ${objectiveData.title}`,
      description: `Skill evaluation for ${objectiveData.targetRole}`,
      category: objectiveData.category,
      skillLevel: objectiveData.currentLevel,
      questions,
      duration: 10,
      createdAt: now,
      status: 'in_progress' as const,
    };

    const id: string = await firebaseService.createDocument('assessments', assessment);
    return res.status(201).json({ success: true, data: { id, ...assessment } });
  } catch (error: unknown) {
    logger.error('Error creating assessment:', error);
    return res.status(500).json({ success: false, message: 'Failed to create assessment' });
  }
});

// Helper function to calculate score
const calculateScore = (
  answers: { questionId: string; selectedAnswer: number }[],
  correctMap: Map<string, number>
): { correctAnswers: number; totalQuestions: number; score: number } => {
  let correctAnswers: number = 0;
  for (const a of answers) {
    const correctAnswer: number | undefined = correctMap.get(a.questionId);
    if (correctAnswer !== undefined && correctAnswer === a.selectedAnswer) {
      correctAnswers++;
    }
  }
  const totalQuestions: number = correctMap.size;
  const score: number = Math.round((correctAnswers / totalQuestions) * 100);
  return { correctAnswers, totalQuestions, score };
};

// Helper function to determine skill level
const determineSkillLevel = (score: number): 'beginner' | 'intermediate' | 'advanced' => {
  if (score >= 80) {
    return 'advanced';
  }
  if (score >= 60) {
    return 'intermediate';
  }
  return 'beginner';
};

// Helper function to get recommendations
const getRecommendations = (score: number): string[] => {
  if (score >= 80) {
    return ['Proceed to advanced modules'];
  }
  if (score >= 60) {
    return ['Reinforce intermediate topics'];
  }
  return ['Focus on fundamentals'];
};

// Submit assessment answers and compute result
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
    answers: { questionId: string; selectedAnswer: number }[];
    timeSpent?: number;
  };
  const answers: { questionId: string; selectedAnswer: number }[] = body.answers;
  const timeSpent: number = body.timeSpent ?? 0;

  const assessment = await firebaseService.getDocument('assessments', assessmentId);
  if (assessment == null) {
    return res.status(404).json({ success: false, message: 'Assessment not found' });
  }
  const assessmentUserId: string = (assessment as { userId: string }).userId;
  if (assessmentUserId !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const assessmentQuestions = (assessment as { questions: QuizQuestion[] }).questions;
  const correctMap = new Map<string, number>(
    assessmentQuestions.map((q: QuizQuestion): [string, number] => [q.id, q.correctAnswer])
  );
  const {
    correctAnswers,
    totalQuestions,
    score,
  }: {
    correctAnswers: number;
    totalQuestions: number;
    score: number;
  } = calculateScore(answers, correctMap);
  const skillLevel: 'beginner' | 'intermediate' | 'advanced' = determineSkillLevel(score);

  const assessmentObjectiveId: string = (assessment as { objectiveId: string }).objectiveId;
  const completedAt: string = new Date().toISOString();
  const result = {
    userId: uid,
    assessmentId,
    objectiveId: assessmentObjectiveId,
    score,
    totalQuestions,
    correctAnswers,
    timeSpent,
    completedAt,
    skillLevel,
    recommendations: getRecommendations(score),
  };

  const resultId: string = await firebaseService.createDocument('assessmentResults', result);
  await firebaseService.updateDocument('assessments', assessmentId, { status: 'completed' });
  // Persist last assessment summary onto objective for quick display
  try {
    await firebaseService.updateDocument('objectives', assessmentObjectiveId, {
      lastAssessment: {
        score,
        skillLevel,
        completedAt,
      },
    });
  } catch (error: unknown) {
    logger.warn('Failed to update objective with assessment result', {
      error,
      objectiveId: assessmentObjectiveId,
    });
  }

  // Update streak (non-blocking)
  streakService.updateStreakOnStudy(uid).catch((error: unknown) => {
    logger.warn('Failed to update streak after assessment', { userId: uid, error });
  });

  return res.json({ success: true, data: { id: resultId, ...result } });
});

// Get assessment result
router.get('/results/:resultId', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const resultId: string | undefined = req.params['resultId'];
  if (resultId == null || resultId === '') {
    return res.status(400).json({ success: false, message: 'resultId is required' });
  }
  const data = await firebaseService.getDocument('assessmentResults', resultId);
  if (data == null) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  const dataUserId: string = (data as { userId: string }).userId;
  if (dataUserId !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  return res.json({ success: true, data: { id: resultId, ...data } });
});

export default router;
