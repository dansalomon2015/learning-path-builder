import { Router } from 'express';
import { type Request, type Response } from 'express';
import { firebaseService } from '@/services/firebase';
import { geminiService } from '@/services/gemini';
import { adaptiveLearningService } from '@/services/adaptiveLearning';
import { type LearningPlan, type StudySession, type PerformanceMetric } from '@/types';

const router = Router();

// GET /api/learning-plans
router.get('/', async (req: Request, res: Response): Promise<Response | void> => {
  const userId: string | undefined = req.user?.uid;
  if (userId == null || userId === '') {
    return res.status(401).json({
      success: false,
      error: { message: 'User not authenticated' },
    });
  }

  const learningPlans = await firebaseService.queryDocuments('learningPlans', [
    { field: 'userId', operator: '==', value: userId },
  ]);

  return res.json({
    success: true,
    data: learningPlans,
    message: 'Learning plans retrieved successfully',
  });
});

// GET /api/learning-plans/:id
router.get('/:id', async (req: Request, res: Response): Promise<Response | void> => {
  const idParam: string | undefined = req.params['id'];
  if (idParam == null || idParam === '') {
    return res.status(400).json({
      success: false,
      error: { message: 'Learning plan ID is required' },
    });
  }
  const id: string = idParam;
  const userId: string | undefined = req.user?.uid;

  const learningPlan = await firebaseService.getDocument('learningPlans', id);

  if (learningPlan == null) {
    return res.status(404).json({
      success: false,
      error: { message: 'Learning plan not found' },
    });
  }
  const planUserId: string = (learningPlan as { userId: string }).userId;
  if (planUserId !== userId) {
    return res.status(404).json({
      success: false,
      error: { message: 'Learning plan not found' },
    });
  }

  return res.json({
    success: true,
    data: learningPlan,
    message: 'Learning plan retrieved successfully',
  });
});

// POST /api/learning-plans
router.post('/', async (req: Request, res: Response): Promise<Response | void> => {
  const userId: string | undefined = req.user?.uid;
  if (userId == null || userId === '') {
    return res.status(401).json({
      success: false,
      error: { message: 'User not authenticated' },
    });
  }

  const body = req.body as {
    title: string;
    description: string;
    topic: string;
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    cardCount?: number;
  };
  const {
    title,
    description,
    topic,
    skillLevel,
    cardCount,
  }: {
    title: string;
    description: string;
    topic: string;
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    cardCount?: number;
  } = body;

  // Generate flashcards using Gemini AI
  const cardCountValue: number = cardCount ?? 10;
  const flashcards = await geminiService.generateFlashcards(topic, skillLevel, cardCountValue);

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

  const planId: string = await firebaseService.createDocument(
    'learningPlans',
    learningPlan as unknown as Record<string, unknown>
  );

  const responseData: LearningPlan & { id: string } = { ...learningPlan, id: planId };
  return res.status(201).json({
    success: true,
    data: responseData,
    message: 'Learning plan created successfully',
  });
});

// POST /api/learning-plans/:id/study-session
router.post('/:id/study-session', async (req: Request, res: Response): Promise<Response | void> => {
  const idParam: string | undefined = req.params['id'];
  if (idParam == null || idParam === '') {
    return res.status(400).json({
      success: false,
      error: { message: 'Learning plan ID is required' },
    });
  }
  const id: string = idParam;
  const userId: string | undefined = req.user?.uid;
  const body = req.body as { mode?: 'flashcards' | 'quiz' };
  const modeParam: 'flashcards' | 'quiz' | undefined = body.mode;

  if (userId == null || userId === '') {
    return res.status(401).json({
      success: false,
      error: { message: 'User not authenticated' },
    });
  }

  if (modeParam == null) {
    return res.status(400).json({
      success: false,
      error: { message: 'Mode is required' },
    });
  }

  const learningPlan = await firebaseService.getDocument('learningPlans', id);
  if (learningPlan == null) {
    return res.status(404).json({
      success: false,
      error: { message: 'Learning plan not found' },
    });
  }
  const planUserId: string = (learningPlan as { userId: string }).userId;
  if (planUserId !== userId) {
    return res.status(404).json({
      success: false,
      error: { message: 'Learning plan not found' },
    });
  }

  // Create new study session
  const studySession: StudySession = {
    id: '',
    userId: userId,
    learningPlanId: id,
    mode: modeParam,
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

  const sessionId: string = await firebaseService.createDocument(
    'studySessions',
    studySession as unknown as Record<string, unknown>
  );

  return res.status(201).json({
    success: true,
    data: { ...studySession, id: sessionId },
    message: 'Study session started successfully',
  });
});

// POST /api/learning-plans/:id/flashcards/:cardId/review
router.post(
  '/:id/flashcards/:cardId/review',
  async (req: Request, res: Response): Promise<Response | void> => {
    const idParam: string | undefined = req.params['id'];
    const cardIdParam: string | undefined = req.params['cardId'];
    if (idParam == null || idParam === '' || cardIdParam == null || cardIdParam === '') {
      return res.status(400).json({
        success: false,
        error: { message: 'Learning plan ID and card ID are required' },
      });
    }
    const id: string = idParam;
    const cardId: string = cardIdParam;
    const userId: string | undefined = req.user?.uid;
    const body = req.body as {
      userResponse: 'correct' | 'incorrect';
      responseTime: number;
      sessionId?: string;
    };
    const {
      userResponse,
      responseTime,
      sessionId,
    }: {
      userResponse: 'correct' | 'incorrect';
      responseTime: number;
      sessionId?: string;
    } = body;

    if (userId == null || userId === '') {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    const learningPlanDoc = await firebaseService.getDocument('learningPlans', id);
    if (learningPlanDoc == null) {
      return res.status(404).json({
        success: false,
        error: { message: 'Learning plan not found' },
      });
    }
    const planUserId: string = (learningPlanDoc as { userId: string }).userId;
    if (planUserId !== userId) {
      return res.status(404).json({
        success: false,
        error: { message: 'Learning plan not found' },
      });
    }

    const learningPlan = learningPlanDoc as unknown as LearningPlan;

    // Find the flashcard
    const flashcardIndex: number = learningPlan.flashcards.findIndex(
      (card: { id: string }): boolean => card.id === cardId
    );
    if (flashcardIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { message: 'Flashcard not found' },
      });
    }

    const flashcard = learningPlan.flashcards[flashcardIndex];
    if (flashcard == null) {
      return res.status(404).json({
        success: false,
        error: { message: 'Flashcard not found' },
      });
    }

    // Update flashcard mastery using adaptive learning
    const updatedFlashcard = await adaptiveLearningService.updateFlashcardMastery(
      flashcard,
      userResponse,
      responseTime
    );

    // Update the learning plan
    learningPlan.flashcards[flashcardIndex] = updatedFlashcard;
    learningPlan.masteredCards = learningPlan.flashcards.filter(
      (card: { masteryLevel: number }): boolean => card.masteryLevel >= 80
    ).length;
    learningPlan.updatedAt = new Date();

    await firebaseService.updateDocument(
      'learningPlans',
      id,
      learningPlan as unknown as Record<string, unknown>
    );

    // Update study session
    if (sessionId != null && sessionId !== '') {
      const sessionDoc = await firebaseService.getDocument('studySessions', sessionId);
      if (sessionDoc != null) {
        const session = sessionDoc as unknown as StudySession;
        session.flashcardsReviewed += 1;
        await firebaseService.updateDocument(
          'studySessions',
          sessionId,
          session as unknown as Record<string, unknown>
        );
      }
    }

    return res.json({
      success: true,
      data: updatedFlashcard,
      message: 'Flashcard review recorded successfully',
    });
  }
);

// GET /api/learning-plans/:id/quiz-questions
router.get('/:id/quiz-questions', async (req: Request, res: Response): Promise<Response | void> => {
  const idParam: string | undefined = req.params['id'];
  if (idParam == null || idParam === '') {
    return res.status(400).json({
      success: false,
      error: { message: 'Learning plan ID is required' },
    });
  }
  const id: string = idParam;
  const userId: string | undefined = req.user?.uid;
  const countParam: unknown = req.query['count'];
  const count: number = typeof countParam === 'string' ? parseInt(countParam, 10) : 5;

  if (userId == null || userId === '') {
    return res.status(401).json({
      success: false,
      error: { message: 'User not authenticated' },
    });
  }

  const learningPlanDoc = await firebaseService.getDocument('learningPlans', id);
  if (learningPlanDoc == null) {
    return res.status(404).json({
      success: false,
      error: { message: 'Learning plan not found' },
    });
  }
  const planUserId: string = (learningPlanDoc as { userId: string }).userId;
  if (planUserId !== userId) {
    return res.status(404).json({
      success: false,
      error: { message: 'Learning plan not found' },
    });
  }

  const learningPlan = learningPlanDoc as unknown as LearningPlan;

  // Get user's recent performance for adaptive questions
  const recentSessions = await firebaseService.queryDocuments('studySessions', [
    { field: 'userId', operator: '==', value: userId },
    { field: 'learningPlanId', operator: '==', value: id },
    { field: 'isCompleted', operator: '==', value: true },
  ]);

  const recentSessionsSlice = recentSessions.slice(-10);
  const sessionsAsStudySessions: StudySession[] = recentSessionsSlice.map(
    (session: Record<string, unknown>): StudySession => {
      return session as unknown as StudySession;
    }
  );
  const adaptiveDifficulty = await adaptiveLearningService.calculateAdaptiveDifficulty(
    userId,
    id,
    sessionsAsStudySessions
  );

  // Generate adaptive quiz questions
  const performanceHistory: PerformanceMetric[] = recentSessions.map(
    (session: Record<string, unknown>): PerformanceMetric => {
      const sessionObj = session as unknown as StudySession;
      const score: number = sessionObj.score ?? 0;
      const responseTime: number = sessionObj.performance.averageResponseTime;
      return {
        date: sessionObj.startTime,
        score,
        responseTime,
        difficulty: adaptiveDifficulty,
        category: learningPlan.topic,
      };
    }
  );

  const quizQuestions = await geminiService.generateAdaptiveQuestions(
    learningPlan.topic,
    performanceHistory as unknown as Array<Record<string, unknown>>,
    adaptiveDifficulty
  );

  const allPerformanceMetrics: PerformanceMetric[] = recentSessions.flatMap(
    (session: Record<string, unknown>): PerformanceMetric[] => {
      const sessionObj = session as unknown as StudySession;
      const difficultyProgression: string[] = sessionObj.performance.difficultyProgression;
      const score: number = sessionObj.score ?? 0;
      const responseTime: number = sessionObj.performance.averageResponseTime;
      return difficultyProgression.map(
        (difficulty: string): PerformanceMetric => ({
          date: sessionObj.startTime,
          score,
          responseTime,
          difficulty,
          category: learningPlan.topic,
        })
      );
    }
  );

  const adaptiveRecommendations = await adaptiveLearningService.generatePersonalizedRecommendations(
    userId,
    id,
    allPerformanceMetrics
  );

  return res.json({
    success: true,
    data: {
      questions: quizQuestions.slice(0, count),
      difficulty: adaptiveDifficulty,
      adaptiveRecommendations,
    },
    message: 'Quiz questions generated successfully',
  });
});

// POST /api/learning-plans/:id/quiz-submit
router.post('/:id/quiz-submit', async (req: Request, res: Response): Promise<Response | void> => {
  const idParam: string | undefined = req.params['id'];
  if (idParam == null || idParam === '') {
    return res.status(400).json({
      success: false,
      error: { message: 'Learning plan ID is required' },
    });
  }
  const id: string = idParam;
  const userId: string | undefined = req.user?.uid;
  const body = req.body as {
    answers: Array<{ questionId: string; userAnswer: string }>;
    sessionId?: string;
  };
  const {
    answers,
    sessionId,
  }: {
    answers: Array<{ questionId: string; userAnswer: string }>;
    sessionId?: string;
  } = body;

  if (userId == null || userId === '') {
    return res.status(401).json({
      success: false,
      error: { message: 'User not authenticated' },
    });
  }

  const learningPlanDoc = await firebaseService.getDocument('learningPlans', id);
  if (learningPlanDoc == null) {
    return res.status(404).json({
      success: false,
      error: { message: 'Learning plan not found' },
    });
  }
  const planUserId: string = (learningPlanDoc as { userId: string }).userId;
  if (planUserId !== userId) {
    return res.status(404).json({
      success: false,
      error: { message: 'Learning plan not found' },
    });
  }

  const learningPlan = learningPlanDoc as unknown as LearningPlan;

  // Calculate score and provide explanations
  let correctAnswers = 0;
  const explanations: string[] = [];

  const explanationPromises: Promise<void>[] = [];
  for (const answer of answers) {
    const question = learningPlan.flashcards.find(
      (card: { id: string }): boolean => card.id === answer.questionId
    );
    if (question != null && answer.userAnswer === question.answer) {
      correctAnswers++;
    } else if (question != null) {
      // Generate explanation for incorrect answer
      explanationPromises.push(
        geminiService
          .generateExplanation(question.question, answer.userAnswer, question.answer)
          .then((explanation: string): void => {
            explanations.push(explanation);
          })
      );
    }
  }
  await Promise.all(explanationPromises);

  const totalQuestions: number = answers.length;
  const score: number = Math.round((correctAnswers / totalQuestions) * 100);

  // Update study session
  if (sessionId != null && sessionId !== '') {
    const sessionDoc = await firebaseService.getDocument('studySessions', sessionId);
    if (sessionDoc != null) {
      const session = sessionDoc as unknown as StudySession;
      session.endTime = new Date();
      const startTime: Date = session.startTime;
      const endTime: Date = session.endTime;
      session.duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      session.score = score;
      session.totalQuestions = totalQuestions;
      session.correctAnswers = correctAnswers;
      session.isCompleted = true;

      await firebaseService.updateDocument(
        'studySessions',
        sessionId,
        session as unknown as Record<string, unknown>
      );
    }
  }

  const recommendations = await adaptiveLearningService.generatePersonalizedRecommendations(
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
  );

  return res.json({
    success: true,
    data: {
      score,
      correctAnswers,
      totalQuestions,
      explanations,
      recommendations,
    },
    message: 'Quiz submitted successfully',
  });
});

// PUT /api/learning-plans/:id
router.put('/:id', async (req: Request, res: Response): Promise<Response | void> => {
  const idParam: string | undefined = req.params['id'];
  if (idParam == null || idParam === '') {
    return res.status(400).json({
      success: false,
      error: { message: 'Learning plan ID is required' },
    });
  }
  const id: string = idParam;
  const userId: string | undefined = req.user?.uid;
  const updateData = req.body as Record<string, unknown>;

  if (userId == null || userId === '') {
    return res.status(401).json({
      success: false,
      error: { message: 'User not authenticated' },
    });
  }

  const learningPlanDoc = await firebaseService.getDocument('learningPlans', id);
  if (learningPlanDoc == null) {
    return res.status(404).json({
      success: false,
      error: { message: 'Learning plan not found' },
    });
  }
  const planUserId: string = (learningPlanDoc as { userId: string }).userId;
  if (planUserId !== userId) {
    return res.status(404).json({
      success: false,
      error: { message: 'Learning plan not found' },
    });
  }

  await firebaseService.updateDocument('learningPlans', id, {
    ...updateData,
    updatedAt: new Date(),
  });

  return res.json({
    success: true,
    data: { id, ...updateData },
    message: 'Learning plan updated successfully',
  });
});

// DELETE /api/learning-plans/:id
router.delete('/:id', async (req: Request, res: Response): Promise<Response | void> => {
  const idParam: string | undefined = req.params['id'];
  if (idParam == null || idParam === '') {
    return res.status(400).json({
      success: false,
      error: { message: 'Learning plan ID is required' },
    });
  }
  const id: string = idParam;
  const userId: string | undefined = req.user?.uid;

  if (userId == null || userId === '') {
    return res.status(401).json({
      success: false,
      error: { message: 'User not authenticated' },
    });
  }

  const learningPlanDoc = await firebaseService.getDocument('learningPlans', id);
  if (learningPlanDoc == null) {
    return res.status(404).json({
      success: false,
      error: { message: 'Learning plan not found' },
    });
  }
  const planUserId: string = (learningPlanDoc as { userId: string }).userId;
  if (planUserId !== userId) {
    return res.status(404).json({
      success: false,
      error: { message: 'Learning plan not found' },
    });
  }

  await firebaseService.deleteDocument('learningPlans', id);

  return res.json({
    success: true,
    message: 'Learning plan deleted successfully',
  });
});

export const learningPlanRoutes = router;
