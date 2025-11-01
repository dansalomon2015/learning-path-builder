import { Router } from 'express';
import { firebaseService } from '@/services/firebase';
import { geminiService } from '@/services/gemini';
import { logger } from '@/utils/logger';

const router = Router();

// Start an assessment for an objective: generate AI-powered questions
router.post('/start', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { objectiveId, count = 25 } = req.body as {
    objectiveId: string;
    count?: number;
  };

  if (!objectiveId) {
    return res.status(400).json({ success: false, message: 'objectiveId is required' });
  }

  try {
    // Fetch the objective details
    const objectiveDoc = await firebaseService.getDocument('objectives', objectiveId);

    if (!objectiveDoc) {
      return res.status(404).json({ success: false, message: 'Objective not found' });
    }

    if (objectiveDoc['userId'] !== uid) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Generate AI-powered questions based on objective using Gemini
    let questions;
    try {
      questions = await geminiService.generateAssessment(
        {
          title: objectiveDoc['title'],
          description: objectiveDoc['description'],
          category: objectiveDoc['category'],
          targetRole: objectiveDoc['targetRole'],
          currentLevel: objectiveDoc['currentLevel'],
          targetLevel: objectiveDoc['targetLevel'],
        },
        count
      );
    } catch (geminiError) {
      logger.error('Gemini assessment generation failed, using fallback:', geminiError);

      // Fallback to basic questions if Gemini fails
      questions = Array.from({ length: Math.max(3, Math.min(20, count)) }).map((_, i) => ({
        id: `q${i + 1}`,
        question: `Question ${i + 1} about ${objectiveDoc['title']}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: 'Sample explanation for learning purposes.',
        difficulty:
          objectiveDoc['targetLevel'] === 'advanced'
            ? 'hard'
            : objectiveDoc['targetLevel'] === 'intermediate'
            ? 'medium'
            : 'easy',
        category: objectiveDoc['category'],
        skills: [objectiveDoc['category']],
      }));
    }

    const now = new Date().toISOString();
    const assessment = {
      userId: uid,
      objectiveId,
      title: `Assessment: ${objectiveDoc['title']}`,
      description: `Skill evaluation for ${objectiveDoc['targetRole']}`,
      category: objectiveDoc['category'],
      skillLevel: objectiveDoc['currentLevel'],
      questions,
      duration: 10,
      createdAt: now,
      status: 'in_progress',
    };

    const id = await firebaseService.createDocument('assessments', assessment);
    return res.status(201).json({ success: true, data: { id, ...assessment } });
  } catch (error) {
    logger.error('Error creating assessment:', error);
    return res.status(500).json({ success: false, message: 'Failed to create assessment' });
  }
});

// Submit assessment answers and compute result
router.post('/:assessmentId/submit', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { assessmentId } = req.params as { assessmentId: string };
  const { answers = [], timeSpent = 0 } = req.body as {
    answers: { questionId: string; selectedAnswer: number }[];
    timeSpent?: number;
  };

  const assessment = await firebaseService.getDocument('assessments', assessmentId);
  if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
  if (assessment['userId'] !== uid)
    return res.status(403).json({ success: false, message: 'Forbidden' });

  const correctMap = new Map<string, number>(
    assessment['questions'].map((q: any) => [q.id, q.correctAnswer])
  );
  let correctAnswers = 0;
  for (const a of answers) {
    if (correctMap.get(a.questionId) === a.selectedAnswer) correctAnswers++;
  }

  const totalQuestions = assessment['questions'].length;
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  let skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  if (score >= 80) skillLevel = 'advanced';
  else if (score >= 60) skillLevel = 'intermediate';

  const result = {
    userId: uid,
    assessmentId,
    objectiveId: assessment['objectiveId'],
    score,
    totalQuestions,
    correctAnswers,
    timeSpent,
    completedAt: new Date().toISOString(),
    skillLevel,
    recommendations:
      score >= 80
        ? ['Proceed to advanced modules']
        : score >= 60
        ? ['Reinforce intermediate topics']
        : ['Focus on fundamentals'],
  };

  const resultId = await firebaseService.createDocument('assessmentResults', result);
  await firebaseService.updateDocument('assessments', assessmentId, { status: 'completed' });
  // Persist last assessment summary onto objective for quick display
  try {
    await firebaseService.updateDocument('objectives', assessment['objectiveId'], {
      lastAssessment: {
        score,
        skillLevel,
        completedAt: result.completedAt,
      },
    });
  } catch {}
  return res.json({ success: true, data: { id: resultId, ...result } });
});

// Get assessment result
router.get('/results/:resultId', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { resultId } = req.params as { resultId: string };
  const data = await firebaseService.getDocument('assessmentResults', resultId);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  if (data['userId'] !== uid) return res.status(403).json({ success: false, message: 'Forbidden' });
  return res.json({ success: true, data: { id: resultId, ...data } });
});

export default router;
