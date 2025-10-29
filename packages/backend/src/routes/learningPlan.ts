import { Router } from 'express';
import { Request, Response } from 'express';
import { firebaseService } from '@/services/firebase';
import { geminiService } from '@/services/gemini';
import { adaptiveLearningService } from '@/services/adaptiveLearning';
import { LearningPlan, Flashcard, QuizQuestion, StudySession } from '@/types';

const router = Router();

// GET /api/learning-plans
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const learningPlans = await firebaseService.queryDocuments('learningPlans', [
      { field: 'userId', operator: '==', value: userId },
    ]);

    res.json({
      success: true,
      data: learningPlans,
      message: 'Learning plans retrieved successfully',
    });
  } catch (error) {
    throw error;
  }
});

// GET /api/learning-plans/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    const learningPlan = await firebaseService.getDocument('learningPlans', id);

    if (!learningPlan || learningPlan.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { message: 'Learning plan not found' },
      });
    }

    res.json({
      success: true,
      data: learningPlan,
      message: 'Learning plan retrieved successfully',
    });
  } catch (error) {
    throw error;
  }
});

// POST /api/learning-plans
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const { title, description, topic, skillLevel, mode, cardCount } = req.body;

    // Generate flashcards using Gemini AI
    const flashcards = await geminiService.generateFlashcards(topic, skillLevel, cardCount || 10);

    const learningPlan: LearningPlan = {
      id: '', // Will be set by Firestore
      userId,
      title,
      description,
      topic,
      skillLevel,
      flashcards,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      totalCards: flashcards.length,
      masteredCards: 0,
    };

    const planId = await firebaseService.createDocument('learningPlans', learningPlan);

    res.status(201).json({
      success: true,
      data: { id: planId, ...learningPlan },
      message: 'Learning plan created successfully',
    });
  } catch (error) {
    throw error;
  }
});

// POST /api/learning-plans/:id/study-session
router.post('/:id/study-session', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    const { mode } = req.body; // 'flashcards' or 'quiz'

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const learningPlan = await firebaseService.getDocument('learningPlans', id);
    if (!learningPlan || learningPlan.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { message: 'Learning plan not found' },
      });
    }

    // Create new study session
    const studySession: StudySession = {
      id: '',
      userId: userId!,
      learningPlanId: id,
      mode: mode!,
      startTime: new Date(),
      flashcardsReviewed: 0,
      isCompleted: false,
      performance: {
        averageResponseTime: 0,
        difficultyProgression: [],
        weakAreas: [],
        strongAreas: [],
        recommendations: [],
      },
    };

    const sessionId = await firebaseService.createDocument('studySessions', studySession);

    res.status(201).json({
      success: true,
      data: { ...studySession, id: sessionId },
      message: 'Study session started successfully',
    });
  } catch (error) {
    throw error;
  }
});

// POST /api/learning-plans/:id/flashcards/:cardId/review
router.post('/:id/flashcards/:cardId/review', async (req: Request, res: Response) => {
  try {
    const { id, cardId } = req.params;
    const userId = req.user?.uid;
    const { userResponse, responseTime, sessionId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const learningPlan = await firebaseService.getDocument('learningPlans', id);
    if (!learningPlan || learningPlan.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { message: 'Learning plan not found' },
      });
    }

    // Find the flashcard
    const flashcardIndex = learningPlan.flashcards.findIndex(card => card.id === cardId);
    if (flashcardIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { message: 'Flashcard not found' },
      });
    }

    // Update flashcard mastery using adaptive learning
    const updatedFlashcard = await adaptiveLearningService.updateFlashcardMastery(
      learningPlan.flashcards[flashcardIndex],
      userResponse,
      responseTime
    );

    // Update the learning plan
    learningPlan.flashcards[flashcardIndex] = updatedFlashcard;
    learningPlan.masteredCards = learningPlan.flashcards.filter(
      card => card.masteryLevel >= 80
    ).length;
    learningPlan.updatedAt = new Date();

    await firebaseService.updateDocument('learningPlans', id, learningPlan);

    // Update study session
    if (sessionId) {
      const session = await firebaseService.getDocument('studySessions', sessionId);
      if (session) {
        session.flashcardsReviewed += 1;
        await firebaseService.updateDocument('studySessions', sessionId, session);
      }
    }

    res.json({
      success: true,
      data: updatedFlashcard,
      message: 'Flashcard review recorded successfully',
    });
  } catch (error) {
    throw error;
  }
});

// GET /api/learning-plans/:id/quiz-questions
router.get('/:id/quiz-questions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    const { count = 5 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const learningPlan = await firebaseService.getDocument('learningPlans', id);
    if (!learningPlan || learningPlan.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { message: 'Learning plan not found' },
      });
    }

    // Get user's recent performance for adaptive questions
    const recentSessions = await firebaseService.queryDocuments('studySessions', [
      { field: 'userId', operator: '==', value: userId },
      { field: 'learningPlanId', operator: '==', value: id },
      { field: 'isCompleted', operator: '==', value: true },
    ]);

    const adaptiveDifficulty = await adaptiveLearningService.calculateAdaptiveDifficulty(
      userId,
      id,
      recentSessions.slice(-10) // Last 10 sessions
    );

    // Generate adaptive quiz questions
    const quizQuestions = await geminiService.generateAdaptiveQuestions(
      learningPlan.topic,
      recentSessions.map(session => ({
        score: session.score || 0,
        difficulty: adaptiveDifficulty,
        responseTime: session.performance.averageResponseTime,
        category: learningPlan.topic,
      })),
      adaptiveDifficulty
    );

    res.json({
      success: true,
      data: {
        questions: quizQuestions.slice(0, parseInt(count as string)),
        difficulty: adaptiveDifficulty,
        adaptiveRecommendations: await adaptiveLearningService.generatePersonalizedRecommendations(
          userId,
          id,
          recentSessions.flatMap(session =>
            session.performance.difficultyProgression.map(difficulty => ({
              date: session.startTime,
              score: session.score || 0,
              responseTime: session.performance.averageResponseTime,
              difficulty,
              category: learningPlan.topic,
            }))
          )
        ),
      },
      message: 'Quiz questions generated successfully',
    });
  } catch (error) {
    throw error;
  }
});

// POST /api/learning-plans/:id/quiz-submit
router.post('/:id/quiz-submit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    const { answers, sessionId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const learningPlan = await firebaseService.getDocument('learningPlans', id);
    if (!learningPlan || learningPlan.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { message: 'Learning plan not found' },
      });
    }

    // Calculate score and provide explanations
    let correctAnswers = 0;
    const explanations: string[] = [];

    for (const answer of answers) {
      const question = learningPlan.flashcards.find(card => card.id === answer.questionId);
      if (question && answer.userAnswer === question.answer) {
        correctAnswers++;
      } else if (question) {
        // Generate explanation for incorrect answer
        const explanation = await geminiService.generateExplanation(
          question.question,
          answer.userAnswer,
          question.answer
        );
        explanations.push(explanation);
      }
    }

    const score = Math.round((correctAnswers / answers.length) * 100);

    // Update study session
    if (sessionId) {
      const session = await firebaseService.getDocument('studySessions', sessionId);
      if (session) {
        session.endTime = new Date();
        session.duration = Math.floor(
          (session.endTime.getTime() - session.startTime.getTime()) / 1000
        );
        session.score = score;
        session.totalQuestions = answers.length;
        session.correctAnswers = correctAnswers;
        session.isCompleted = true;

        await firebaseService.updateDocument('studySessions', sessionId, session);
      }
    }

    res.json({
      success: true,
      data: {
        score,
        correctAnswers,
        totalQuestions: answers.length,
        explanations,
        recommendations: await adaptiveLearningService.generatePersonalizedRecommendations(
          userId,
          id,
          [
            {
              date: new Date(),
              score,
              responseTime: 30, // Average response time
              difficulty: 'medium',
              category: learningPlan.topic,
            },
          ]
        ),
      },
      message: 'Quiz submitted successfully',
    });
  } catch (error) {
    throw error;
  }
});

// PUT /api/learning-plans/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    const updateData = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const learningPlan = await firebaseService.getDocument('learningPlans', id);
    if (!learningPlan || learningPlan.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { message: 'Learning plan not found' },
      });
    }

    await firebaseService.updateDocument('learningPlans', id, {
      ...updateData,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      data: { id, ...updateData },
      message: 'Learning plan updated successfully',
    });
  } catch (error) {
    throw error;
  }
});

// DELETE /api/learning-plans/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const learningPlan = await firebaseService.getDocument('learningPlans', id);
    if (!learningPlan || learningPlan.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { message: 'Learning plan not found' },
      });
    }

    await firebaseService.deleteDocument('learningPlans', id);

    res.json({
      success: true,
      message: 'Learning plan deleted successfully',
    });
  } catch (error) {
    throw error;
  }
});

export const learningPlanRoutes = router;
