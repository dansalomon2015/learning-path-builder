import { Router, type Request, type Response } from 'express';
import { firebaseService } from '@/services/firebase';
import { logger } from '@/utils/logger';
import rateLimit from 'express-rate-limit';
import { geminiService } from '@/services/gemini';
import { type Flashcard, type QuizQuestion } from '@/types';
import {
  calculateProgress,
  activateNextModule,
  updatePathProgressAndCheckCompletion,
  activateNextPath,
  completeModuleAndUpdateProgress,
  calculateModuleProgressWeights,
  calculateModuleProgress,
} from '@/utils/progressHelpers';
import { streakService } from '@/services/streakService';
import { moduleProgressService } from '@/services/moduleProgressService';

const router = Router();

// Helper functions for path generation
const buildPathFromAI = (
  p: Record<string, unknown>,
  idx: number,
  objectiveId: string,
  existingCount: number
): Record<string, unknown> => {
  const pTitle: unknown = p['title'];
  const pDescription: unknown = p['description'];
  const pCategory: unknown = p['category'];
  const pDifficulty: unknown = p['difficulty'];
  const pEstimatedDuration: unknown = p['estimatedDuration'];
  const pPrerequisites: unknown = p['prerequisites'];
  const pSkills: unknown = p['skills'];
  const now: string = new Date().toISOString();
  return {
    id: `path_${Date.now()}_${idx + 1}`,
    objectiveId,
    title: typeof pTitle === 'string' ? pTitle : '',
    description: typeof pDescription === 'string' ? pDescription : '',
    category: typeof pCategory === 'string' ? pCategory : '',
    difficulty: typeof pDifficulty === 'string' ? pDifficulty : 'medium',
    estimatedDuration: typeof pEstimatedDuration === 'number' ? pEstimatedDuration : 0,
    prerequisites: Array.isArray(pPrerequisites) ? (pPrerequisites as string[]) : [],
    skills: Array.isArray(pSkills) ? (pSkills as string[]) : [],
    modules: [],
    isCompleted: false,
    isEnabled: existingCount === 0 && idx === 0,
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };
};

const filterUniquePaths = (
  paths: Array<Record<string, unknown>>,
  existingTitles: Set<string>,
  existingIds: Set<string>
): Array<Record<string, unknown>> => {
  return paths.filter((p: Record<string, unknown>): boolean => {
    const pTitle: unknown = p['title'];
    const pId: unknown = p['id'];
    const titleKey: string = String(pTitle ?? '')
      .trim()
      .toLowerCase();
    const pIdStr: string = typeof pId === 'string' ? pId : '';
    if (existingIds.has(pIdStr)) {
      return false;
    }
    if (existingTitles.has(titleKey)) {
      return false;
    }
    return true;
  });
};

const buildModulesFromAI = (
  aiModules: Array<Record<string, unknown>>,
  existingModules: Array<Record<string, unknown>>,
  existingTitles: Set<string>
): Array<Record<string, unknown>> => {
  const now = new Date();
  const addDays = (d: number): string => {
    const next = new Date(now);
    next.setDate(now.getDate() + d);
    return next.toISOString();
  };
  const existingModulesCount: number = existingModules.length;

  return aiModules
    .filter((m: Record<string, unknown>): boolean => {
      const mTitle: unknown = m['title'];
      return !existingTitles.has(
        String((typeof mTitle === 'string' ? mTitle : null) ?? '')
          .trim()
          .toLowerCase()
      );
    })
    .map((m: Record<string, unknown>, i: number): Record<string, unknown> => {
      const mTitle: unknown = m['title'];
      const mDescription: unknown = m['description'];
      const mType: unknown = m['type'];
      const mDuration: unknown = m['duration'];
      return {
        id: `mod_${Date.now()}_${i + 1}`,
        title: typeof mTitle === 'string' ? mTitle : '',
        description: typeof mDescription === 'string' ? mDescription : '',
        type: typeof mType === 'string' ? mType : '',
        duration: typeof mDuration === 'number' ? mDuration : 0,
        flashcards: [],
        isCompleted: false,
        isEnabled: existingModulesCount === 0 && i === 0,
        hasFlashcards: false,
        hasValidationQuiz: false,
        hasSuggestedResources: false,
        progress: 0,
        order: existingModules.length + i + 1,
        dueDate: addDays(7 * (i + 1)),
      };
    });
};

// Helper functions for route handlers
const getExistingTitlesSet = (items: Array<Record<string, unknown>>): Set<string> => {
  return new Set(
    items.map((item: Record<string, unknown>): string => {
      const title: unknown = item['title'];
      return String(title ?? '')
        .trim()
        .toLowerCase();
    })
  );
};

const getExistingIdsSet = (items: Array<Record<string, unknown>>): Set<string> => {
  return new Set(
    items.map((item: Record<string, unknown>): string => {
      const id: unknown = item['id'];
      return String(id ?? '');
    })
  );
};

const extractObjectiveData = (
  objective: Record<string, unknown>
): {
  title: string;
  description: string;
  category: string;
  targetRole: string;
  currentLevel: string;
  targetLevel: string;
} => {
  const objectiveTitle: unknown = objective['title'];
  const objectiveDescription: unknown = objective['description'];
  const objectiveCategory: unknown = objective['category'];
  const objectiveTargetRole: unknown = objective['targetRole'];
  const objectiveCurrentLevel: unknown = objective['currentLevel'];
  const objectiveTargetLevel: unknown = objective['targetLevel'];
  return {
    title: typeof objectiveTitle === 'string' ? objectiveTitle : '',
    description: typeof objectiveDescription === 'string' ? objectiveDescription : '',
    category: typeof objectiveCategory === 'string' ? objectiveCategory : '',
    targetRole: typeof objectiveTargetRole === 'string' ? objectiveTargetRole : '',
    currentLevel: typeof objectiveCurrentLevel === 'string' ? objectiveCurrentLevel : '',
    targetLevel: typeof objectiveTargetLevel === 'string' ? objectiveTargetLevel : '',
  };
};

const buildContextForGemini = (
  objective: Record<string, unknown>,
  path: Record<string, unknown>
): {
  objectiveTitle: string;
  objectiveCategory: string;
  targetRole: string;
  pathTitle: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
} => {
  const objectiveTitle: unknown = objective['title'];
  const objectiveCategory: unknown = objective['category'];
  const objectiveTargetRole: unknown = objective['targetRole'];
  const pathTitle: unknown = path['title'];
  const pathDifficulty: unknown = path['difficulty'];
  const pathDifficultyStr: string = typeof pathDifficulty === 'string' ? pathDifficulty : 'medium';
  const pathDifficultyValue: 'beginner' | 'intermediate' | 'advanced' =
    pathDifficultyStr === 'beginner' ||
    pathDifficultyStr === 'intermediate' ||
    pathDifficultyStr === 'advanced'
      ? pathDifficultyStr
      : 'intermediate';
  return {
    objectiveTitle: typeof objectiveTitle === 'string' ? objectiveTitle : '',
    objectiveCategory: typeof objectiveCategory === 'string' ? objectiveCategory : '',
    targetRole: typeof objectiveTargetRole === 'string' ? objectiveTargetRole : '',
    pathTitle: typeof pathTitle === 'string' ? pathTitle : '',
    difficulty: pathDifficultyValue,
  };
};

const calculateQuizScore = (
  validationQuiz: Array<Record<string, unknown>>,
  answers: Array<{ questionId: string; selectedAnswer: string | number }>
): {
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  feedback: Array<{ questionId: string; correct: boolean; explanation?: string }>;
} => {
  let correctAnswers = 0;
  const feedback: Array<{ questionId: string; correct: boolean; explanation?: string }> = [];
  validationQuiz.forEach((question: Record<string, unknown>, index: number): void => {
    const questionIdUnknown: unknown = question['id'];
    const questionId: string =
      typeof questionIdUnknown === 'string' ? questionIdUnknown : `q${index}`;
    const userAnswer = answers.find(
      (a: { questionId: string; selectedAnswer: string | number }): boolean =>
        a.questionId === questionId || a.questionId === `q${index}`
    );
    const correctAnswerUnknown: unknown = question['correctAnswer'];
    const correctAnswer: number | string =
      typeof correctAnswerUnknown === 'number'
        ? correctAnswerUnknown
        : typeof correctAnswerUnknown === 'string'
        ? correctAnswerUnknown
        : 0;
    const isCorrect: boolean = userAnswer != null && userAnswer.selectedAnswer === correctAnswer;
    if (isCorrect) {
      correctAnswers++;
    }
    const explanationUnknown: unknown = question['explanation'];
    feedback.push({
      questionId,
      correct: isCorrect,
      ...(explanationUnknown != null &&
        typeof explanationUnknown === 'string' && { explanation: explanationUnknown }),
    });
  });
  const totalQuestions: number = validationQuiz.length;
  const score: number = Math.round((correctAnswers / totalQuestions) * 100);
  return { correctAnswers, totalQuestions, score, feedback };
};

// calculateProgress moved to @/utils/progressHelpers

const cleanModules = (modules: Array<Record<string, unknown>>): Array<Record<string, unknown>> => {
  return modules.map((mod: Record<string, unknown>): Record<string, unknown> => {
    const cleaned: Record<string, unknown> = { ...mod };
    const validationQuiz: unknown = cleaned['validationQuiz'];
    if (validationQuiz === undefined) {
      delete cleaned['validationQuiz'];
    }
    const suggestedResources: unknown = cleaned['suggestedResources'];
    if (suggestedResources === undefined) {
      delete cleaned['suggestedResources'];
    }
    return cleaned;
  });
};

const updateModuleAfterValidation = (
  module: Record<string, unknown>,
  validationData: {
    performanceHistory: Array<Record<string, unknown>>;
    trend: 'progression' | 'regression' | 'stable';
    score: number;
    previousAttemptScore: number | undefined;
    passed: boolean;
  }
): Record<string, unknown> => {
  const baseUpdate: Record<string, unknown> = {
    ...module,
    performanceHistory: validationData.performanceHistory,
    trend: validationData.trend,
    lastAttemptScore: validationData.score,
    ...(validationData.previousAttemptScore !== undefined && {
      previousAttemptScore: validationData.previousAttemptScore,
    }),
  };
  if (validationData.passed) {
    baseUpdate['isCompleted'] = true;
    baseUpdate['progress'] = 100;
  }
  return baseUpdate;
};

// activateNextModule moved to @/utils/progressHelpers

// updatePathProgressAndCheckCompletion moved to @/utils/progressHelpers

// activateNextPath moved to @/utils/progressHelpers

// completeModuleAndUpdateProgress moved to @/utils/progressHelpers

const parseModuleType = (moduleType: unknown): 'theory' | 'practice' | 'project' | 'assessment' => {
  const moduleTypeStr: string = typeof moduleType === 'string' ? moduleType : '';
  return moduleTypeStr === 'theory' ||
    moduleTypeStr === 'practice' ||
    moduleTypeStr === 'project' ||
    moduleTypeStr === 'assessment'
    ? moduleTypeStr
    : 'theory';
};

const generateModuleContent = async (
  module: Record<string, unknown>,
  context: {
    objectiveTitle: string;
    objectiveCategory: string;
    targetRole: string;
    pathTitle: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }
): Promise<{ flashcards: Flashcard[]; resources: Array<Record<string, unknown>> }> => {
  const moduleTitle: unknown = module['title'];
  const moduleDescription: unknown = module['description'];
  const moduleType: unknown = module['type'];
  const moduleDuration: unknown = module['duration'];
  const moduleTypeValue: 'theory' | 'practice' | 'project' | 'assessment' =
    parseModuleType(moduleType);
  const [flashcardsResult, resourcesResult]: [Flashcard[], Array<Record<string, unknown>>] =
    await Promise.all([
      geminiService.generateModuleFlashcards(
        {
          title: typeof moduleTitle === 'string' ? moduleTitle : '',
          description: typeof moduleDescription === 'string' ? moduleDescription : '',
          type: moduleTypeValue,
          duration: typeof moduleDuration === 'number' ? moduleDuration : 0,
        },
        context
      ),
      geminiService.generateSuggestedResources(
        {
          title: typeof moduleTitle === 'string' ? moduleTitle : '',
          description: typeof moduleDescription === 'string' ? moduleDescription : '',
          type: moduleTypeValue,
        },
        context
      ),
    ]);
  return { flashcards: flashcardsResult, resources: resourcesResult };
};

// Helper function to recursively remove undefined values from objects and arrays
// Firestore does not accept undefined values
const removeUndefinedValues = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item: unknown): unknown => removeUndefinedValues(item));
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    const objRecord = obj as Record<string, unknown>;
    for (const key in objRecord) {
      if (Object.prototype.hasOwnProperty.call(objRecord, key)) {
        const value: unknown = objRecord[key];
        if (value !== undefined) {
          cleaned[key] = removeUndefinedValues(value);
        }
        // Skip undefined values - don't add them to cleaned object
      }
    }
    return cleaned;
  }

  return obj;
};

// Create objective
router.post('/', async (req: Request, res: Response): Promise<Response | void> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const body = req.body as {
    title: string;
    description: string;
    category: string;
    targetRole: string;
    targetTimeline: string;
    currentLevel: string;
    targetLevel: string;
  };
  const title: string = body.title;
  const description: string = body.description;
  const category: string = body.category;
  const targetRole: string = body.targetRole;
  const targetTimeline: string = body.targetTimeline;
  const currentLevel: string = body.currentLevel;
  const targetLevel: string = body.targetLevel;

  const now: string = new Date().toISOString();
  const objective = {
    userId: uid,
    title,
    description,
    category,
    targetRole,
    targetTimeline,
    currentLevel,
    targetLevel,
    status: 'planning',
    progress: 0,
    milestones: [],
    learningPaths: [],
    createdAt: now,
    updatedAt: now,
  };

  const id: string = await firebaseService.createDocument('objectives', objective);
  return res.status(201).json({ success: true, data: { id, ...objective } });
});

// List objectives for current user
router.get('/', async (req: Request, res: Response): Promise<Response | void> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const objectives = await firebaseService.queryDocuments('objectives', [
    { field: 'userId', operator: '==', value: uid },
  ]);

  const items = objectives
    .map((doc: Record<string, unknown>): Record<string, unknown> => {
      const docData: unknown = doc;
      return docData as Record<string, unknown>;
    })
    .sort((a: Record<string, unknown>, b: Record<string, unknown>): number => {
      const aCreatedAt: unknown = a['createdAt'];
      const bCreatedAt: unknown = b['createdAt'];
      const aCreatedAtStr: string = typeof aCreatedAt === 'string' ? aCreatedAt : '';
      const bCreatedAtStr: string = typeof bCreatedAt === 'string' ? bCreatedAt : '';
      return bCreatedAtStr.localeCompare(aCreatedAtStr);
    });
  return res.json({ success: true, data: items });
});

// Get objective by id
router.get('/:id', async (req: Request, res: Response): Promise<Response | void> => {
  const uid: string | undefined = req.user?.uid;
  const idParam: string | undefined = req.params['id'];
  if (idParam == null || idParam === '') {
    return res.status(400).json({ success: false, message: 'Objective ID is required' });
  }
  const id: string = idParam;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const doc = await firebaseService.getDocument('objectives', id);
  if (doc == null) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  const data: Record<string, unknown> = doc;
  const dataUserId: unknown = data['userId'];
  if (dataUserId !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  return res.json({ success: true, data: { id, ...data } });
});

// Update objective
router.patch('/:id', async (req: Request, res: Response): Promise<Response | void> => {
  const uid: string | undefined = req.user?.uid;
  const idParam: string | undefined = req.params['id'];
  if (idParam == null || idParam === '') {
    return res.status(400).json({ success: false, message: 'Objective ID is required' });
  }
  const id: string = idParam;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const doc = await firebaseService.getDocument('objectives', id);
  if (doc == null) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  const data: Record<string, unknown> = doc;
  const dataUserId: unknown = data['userId'];
  if (dataUserId !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const updateData: Record<string, unknown> = req.body as Record<string, unknown>;
  const update = { ...updateData, updatedAt: new Date().toISOString() };
  await firebaseService.updateDocument('objectives', id, update);
  const updated = await firebaseService.getDocument('objectives', id);
  return res.json({ success: true, data: { id, ...(updated as Record<string, unknown>) } });
});

// Delete objective
router.delete('/:id', async (req: Request, res: Response): Promise<Response | void> => {
  const uid: string | undefined = req.user?.uid;
  const idParam: string | undefined = req.params['id'];
  if (idParam == null || idParam === '') {
    return res.status(400).json({ success: false, message: 'Objective ID is required' });
  }
  const id: string = idParam;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const doc = await firebaseService.getDocument('objectives', id);
  if (doc == null) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  const data: Record<string, unknown> = doc;
  const dataUserId: unknown = data['userId'];
  if (dataUserId !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  await firebaseService.deleteDocument('objectives', id);
  return res.json({ success: true });
});

// Generate learning paths for an objective
// Tight rate-limit for learning path generation
const generatePathsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many path generations, please try again later.',
});

router.post(
  '/:id/generate-paths',
  generatePathsLimiter,
  async (req: Request, res: Response): Promise<Response | void> => {
    const uid: string | undefined = req.user?.uid;
    if (uid == null || uid === '') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const idParam: string | undefined = req.params['id'];
    if (idParam == null || idParam === '') {
      return res.status(400).json({ success: false, message: 'Objective ID is required' });
    }
    const id: string = idParam;

    const objectiveDoc = await firebaseService.getDocument('objectives', id);
    if (objectiveDoc == null) {
      return res.status(404).json({ success: false, message: 'Objective not found' });
    }
    const objective: Record<string, unknown> = objectiveDoc;
    const objectiveUserId: unknown = objective['userId'];
    if (objectiveUserId !== uid) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // AI-generated learning paths
    const existingPaths: unknown = objective['learningPaths'];
    const existing: Array<Record<string, unknown>> = Array.isArray(existingPaths)
      ? (existingPaths as Array<Record<string, unknown>>)
      : [];
    const existingCount: number = existing.length;

    const objectiveData = extractObjectiveData(objective);
    let aiPaths: Array<Record<string, unknown>>;
    try {
      logger.info(`Generating learning paths for objective ${id}...`);
      aiPaths = await geminiService.generateLearningPaths(objectiveData, 3);
      logger.info(`Successfully generated ${aiPaths.length} learning paths for objective ${id}`);
    } catch (error: unknown) {
      logger.error('Failed to generate learning paths from Gemini:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate learning paths: ${errorMessage}`);
    }

    const paths: Array<Record<string, unknown>> = aiPaths.map(
      (p: Record<string, unknown>, idx: number): Record<string, unknown> =>
        buildPathFromAI(p, idx, id, existingCount)
    );

    const existingTitles: Set<string> = getExistingTitlesSet(existing);
    const existingIds: Set<string> = getExistingIdsSet(existing);

    const newUnique: Array<Record<string, unknown>> = filterUniquePaths(
      paths,
      existingTitles,
      existingIds
    );

    const updatedPaths: Array<Record<string, unknown>> =
      newUnique.length > 0 ? [...existing, ...newUnique] : existing;
    await firebaseService.updateDocument('objectives', id, { learningPaths: updatedPaths });

    return res.status(201).json({ success: true, data: updatedPaths });
  }
);

// Helper to generate and merge modules
const generateAndMergeModules = async (
  objective: Record<string, unknown>,
  path: Record<string, unknown>,
  existingModules: Array<Record<string, unknown>>,
  pathId: string
): Promise<Array<Record<string, unknown>>> => {
  const existingTitles: Set<string> = getExistingTitlesSet(existingModules);
  const objectiveData = extractObjectiveData(objective);
  const pathTitle: unknown = path['title'];
  let aiModules: Array<Record<string, unknown>>;
  try {
    logger.info(`Generating modules for path ${pathId} (no existing modules found)...`);
    aiModules = await geminiService.generatePathModules(
      {
        title: objectiveData.title,
        category: objectiveData.category,
        targetRole: objectiveData.targetRole,
      },
      typeof pathTitle === 'string' ? pathTitle : '',
      4
    );
    logger.info(`Successfully generated ${aiModules.length} modules for path ${pathId}`);
  } catch (error: unknown) {
    logger.error('Failed to generate modules from Gemini:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate modules: ${errorMessage}`);
  }
  const newModules: Array<Record<string, unknown>> = buildModulesFromAI(
    aiModules,
    existingModules,
    existingTitles
  );
  const merged: Array<Record<string, unknown>> =
    newModules.length > 0 ? [...existingModules, ...newModules] : existingModules;
  return cleanModules(merged);
};

// Generate modules for a learning path (idempotent by module title)
router.post(
  '/:id/paths/:pathId/generate-modules',
  generatePathsLimiter,
  async (req: Request, res: Response): Promise<Response | void> => {
    const uid: string | undefined = req.user?.uid;
    if (uid == null || uid === '') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const idParam: string | undefined = req.params['id'];
    const pathIdParam: string | undefined = req.params['pathId'];
    if (idParam == null || idParam === '' || pathIdParam == null || pathIdParam === '') {
      return res
        .status(400)
        .json({ success: false, message: 'Objective ID and path ID are required' });
    }
    const id: string = idParam;
    const pathId: string = pathIdParam;

    const objectiveDoc = await firebaseService.getDocument('objectives', id);
    if (objectiveDoc == null) {
      return res.status(404).json({ success: false, message: 'Objective not found' });
    }
    const objective: Record<string, unknown> = objectiveDoc;
    const objectiveUserId: unknown = objective['userId'];
    if (objectiveUserId !== uid) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const learningPathsUnknown: unknown = objective['learningPaths'];
    const learningPaths: Array<Record<string, unknown>> = Array.isArray(learningPathsUnknown)
      ? (learningPathsUnknown as Array<Record<string, unknown>>)
      : [];
    const pathIndex: number = learningPaths.findIndex((p: Record<string, unknown>): boolean => {
      const pId: unknown = p['id'];
      return pId === pathId;
    });
    if (pathIndex === -1) {
      return res.status(404).json({ success: false, message: 'Path not found' });
    }

    const pathUnknown: unknown = learningPaths[pathIndex];
    const path: Record<string, unknown> =
      pathUnknown != null ? (pathUnknown as Record<string, unknown>) : {};
    const modulesUnknown: unknown = path['modules'];
    const existingModules: Array<Record<string, unknown>> = Array.isArray(modulesUnknown)
      ? (modulesUnknown as Array<Record<string, unknown>>)
      : [];

    // Si des modules existent déjà, retourner immédiatement (idempotent)
    if (existingModules.length > 0) {
      logger.info(
        `Modules already exist for path ${pathId} (${existingModules.length} modules). Skipping generation.`
      );
      return res.json({
        success: true,
        data: learningPaths[pathIndex],
        message: 'Modules already exist',
      });
    }

    const cleanedModules: Array<Record<string, unknown>> = await generateAndMergeModules(
      objective,
      path,
      existingModules,
      pathId
    );

    learningPaths[pathIndex] = { ...path, modules: cleanedModules };
    await firebaseService.updateDocument('objectives', id, { learningPaths });

    return res.status(201).json({ success: true, data: learningPaths[pathIndex] });
  }
);

// Complete a learning path and activate the next one
router.patch(
  '/:id/paths/:pathId/complete',
  async (req: Request, res: Response): Promise<Response | void> => {
    const uid: string | undefined = req.user?.uid;
    if (uid == null || uid === '') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const idParam: string | undefined = req.params['id'];
    const pathIdParam: string | undefined = req.params['pathId'];
    if (idParam == null || idParam === '' || pathIdParam == null || pathIdParam === '') {
      return res
        .status(400)
        .json({ success: false, message: 'Objective ID and path ID are required' });
    }
    const id: string = idParam;
    const pathId: string = pathIdParam;

    const objectiveDoc = await firebaseService.getDocument('objectives', id);
    if (objectiveDoc == null) {
      return res.status(404).json({ success: false, message: 'Objective not found' });
    }
    const objective: Record<string, unknown> = objectiveDoc;
    const objectiveUserId: unknown = objective['userId'];
    if (objectiveUserId !== uid) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const learningPathsUnknown: unknown = objective['learningPaths'];
    const learningPaths: Array<Record<string, unknown>> = Array.isArray(learningPathsUnknown)
      ? (learningPathsUnknown as Array<Record<string, unknown>>)
      : [];
    const pathIndex: number = learningPaths.findIndex((p: Record<string, unknown>): boolean => {
      const pId: unknown = p['id'];
      return pId === pathId;
    });
    if (pathIndex === -1) {
      return res.status(404).json({ success: false, message: 'Path not found' });
    }

    const pathUnknown: unknown = learningPaths[pathIndex];
    const path: Record<string, unknown> =
      pathUnknown != null ? (pathUnknown as Record<string, unknown>) : {};

    // Marquer le path comme complété
    learningPaths[pathIndex] = {
      ...path,
      isCompleted: true,
      progress: 100,
      updatedAt: new Date().toISOString(),
    };

    // Activer le path suivant s'il existe (même objective, order suivant basé sur l'index)
    const nextPathIndex: number = pathIndex + 1;
    if (nextPathIndex < learningPaths.length) {
      const nextPathUnknown: unknown = learningPaths[nextPathIndex];
      const nextPath: Record<string, unknown> =
        nextPathUnknown != null ? (nextPathUnknown as Record<string, unknown>) : {};
      learningPaths[nextPathIndex] = {
        ...nextPath,
        isEnabled: true,
        updatedAt: new Date().toISOString(),
      };
      logger.info(
        `Activated next path: ${String(nextPath['id'])} after completing path: ${pathId}`
      );
    }

    // Recalculer le progress de l'objective
    const objectiveProgress: number = calculateProgress(learningPaths, 'isCompleted');

    // Mettre à jour l'objective
    await firebaseService.updateDocument('objectives', id, {
      learningPaths,
      progress: objectiveProgress,
      updatedAt: new Date().toISOString(),
    });

    return res.json({ success: true, data: { learningPaths, objectiveProgress } });
  }
);

// Helper function to find and update module
const findAndUpdateModule = (
  learningPaths: Array<Record<string, unknown>>,
  pathIndex: number,
  moduleId: string
): { moduleIndex: number; module: Record<string, unknown> } | null => {
  const pathUnknown: unknown = learningPaths[pathIndex];
  if (pathUnknown == null) {
    return null;
  }
  const path: Record<string, unknown> = pathUnknown as Record<string, unknown>;
  const modulesUnknown: unknown = path['modules'];
  const modules: Array<Record<string, unknown>> = Array.isArray(modulesUnknown)
    ? (modulesUnknown as Array<Record<string, unknown>>)
    : [];
  const moduleIndex: number = modules.findIndex((m: Record<string, unknown>): boolean => {
    const mId: unknown = m['id'];
    return mId === moduleId;
  });
  if (moduleIndex === -1) {
    return null;
  }
  const moduleUnknown: unknown = modules[moduleIndex];
  const module: Record<string, unknown> =
    moduleUnknown != null ? (moduleUnknown as Record<string, unknown>) : {};
  return { moduleIndex, module };
};

const validateAndExtractModuleParams = async (
  req: Request,
  uid: string
): Promise<{
  id: string;
  pathId: string;
  moduleId: string;
  objective: Record<string, unknown>;
  learningPaths: Array<Record<string, unknown>>;
  pathIndex: number;
  moduleInfo: { moduleIndex: number; module: Record<string, unknown> };
  path: Record<string, unknown>;
  modules: Array<Record<string, unknown>>;
}> => {
  const idParam: string | undefined = req.params['id'];
  const pathIdParam: string | undefined = req.params['pathId'];
  const moduleIdParam: string | undefined = req.params['moduleId'];
  if (
    idParam == null ||
    idParam === '' ||
    pathIdParam == null ||
    pathIdParam === '' ||
    moduleIdParam == null ||
    moduleIdParam === ''
  ) {
    throw new Error('Objective ID, path ID and module ID are required');
  }
  const id: string = idParam;
  const pathId: string = pathIdParam;
  const moduleId: string = moduleIdParam;

  const objectiveDoc = await firebaseService.getDocument('objectives', id);
  if (objectiveDoc == null) {
    throw new Error('Objective not found');
  }
  const objective: Record<string, unknown> = objectiveDoc;
  const objectiveUserId: unknown = objective['userId'];
  if (objectiveUserId !== uid) {
    throw new Error('Forbidden');
  }

  const learningPathsUnknown: unknown = objective['learningPaths'];
  const learningPaths: Array<Record<string, unknown>> = Array.isArray(learningPathsUnknown)
    ? (learningPathsUnknown as Array<Record<string, unknown>>)
    : [];
  const pathIndex: number = learningPaths.findIndex((p: Record<string, unknown>): boolean => {
    const pId: unknown = p['id'];
    return pId === pathId;
  });
  if (pathIndex === -1) {
    throw new Error('Path not found');
  }

  const moduleInfo = findAndUpdateModule(learningPaths, pathIndex, moduleId);
  if (moduleInfo == null) {
    throw new Error('Module not found');
  }

  const pathUnknown: unknown = learningPaths[pathIndex];
  const path: Record<string, unknown> =
    pathUnknown != null ? (pathUnknown as Record<string, unknown>) : {};
  const modulesUnknown: unknown = path['modules'];
  const modules: Array<Record<string, unknown>> = Array.isArray(modulesUnknown)
    ? (modulesUnknown as Array<Record<string, unknown>>)
    : [];

  return {
    id,
    pathId,
    moduleId,
    objective,
    learningPaths,
    pathIndex,
    moduleInfo,
    path,
    modules,
  };
};

// Complete a module and activate the next one
router.patch(
  '/:id/paths/:pathId/modules/:moduleId/complete',
  async (req: Request, res: Response): Promise<Response | void> => {
    const uid: string | undefined = req.user?.uid;
    if (uid == null || uid === '') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
      const {
        id,
        learningPaths,
        pathIndex,
        path,
        modules,
        moduleInfo,
      }: {
        id: string;
        learningPaths: Array<Record<string, unknown>>;
        pathIndex: number;
        path: Record<string, unknown>;
        modules: Array<Record<string, unknown>>;
        moduleInfo: { moduleIndex: number; module: Record<string, unknown> };
      } = await validateAndExtractModuleParams(req, uid);
      const moduleIndex: number = moduleInfo.moduleIndex;
      const module: Record<string, unknown> = moduleInfo.module;

      const { objectiveProgress }: { objectiveProgress: number } = completeModuleAndUpdateProgress({
        learningPaths,
        pathIndex,
        path,
        modules,
        moduleIndex,
        module,
        context: 'after manual completion',
      });

      await firebaseService.updateDocument('objectives', id, {
        learningPaths,
        progress: objectiveProgress,
        updatedAt: new Date().toISOString(),
      });

      // Update streak (non-blocking)
      streakService.updateStreakOnStudy(uid).catch((error: unknown) => {
        logger.warn('Failed to update streak after module completion', { userId: uid, error });
      });

      return res.json({
        success: true,
        data: { path: learningPaths[pathIndex], objectiveProgress },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Objective ID, path ID and module ID are required') {
        return res.status(400).json({ success: false, message: errorMessage });
      }
      if (
        errorMessage === 'Objective not found' ||
        errorMessage === 'Path not found' ||
        errorMessage === 'Module not found'
      ) {
        return res.status(404).json({ success: false, message: errorMessage });
      }
      if (errorMessage === 'Forbidden') {
        return res.status(403).json({ success: false, message: errorMessage });
      }
      throw error;
    }
  }
);

// Helper function to check module flashcards
const checkModuleFlashcards = (module: Record<string, unknown>): boolean => {
  const hasFlashcards: unknown = module['hasFlashcards'];
  if (hasFlashcards !== true) {
    return false;
  }
  const flashcards: unknown = module['flashcards'];
  if (!Array.isArray(flashcards)) {
    return false;
  }
  return flashcards.length > 0;
};

// Helper function to check module validation quiz
const checkModuleValidationQuiz = (module: Record<string, unknown>): boolean => {
  const hasValidationQuiz: unknown = module['hasValidationQuiz'];
  if (hasValidationQuiz !== true) {
    return false;
  }
  const validationQuiz: unknown = module['validationQuiz'];
  if (!Array.isArray(validationQuiz)) {
    return false;
  }
  return validationQuiz.length > 0;
};

// Helper function to generate and update module content
const generateAndUpdateModuleContent = async (params: {
  id: string;
  moduleId: string;
  objective: Record<string, unknown>;
  path: Record<string, unknown>;
  learningPaths: Array<Record<string, unknown>>;
  pathIndex: number;
  module: Record<string, unknown>;
  moduleIndex: number;
  modules: Array<Record<string, unknown>>;
}): Promise<{
  generatedFlashcards: Flashcard[];
  generatedResources: Array<Record<string, unknown>>;
}> => {
  const {
    id,
    moduleId,
    objective,
    path,
    learningPaths,
    pathIndex,
    module,
    moduleIndex,
    modules,
  }: {
    id: string;
    moduleId: string;
    objective: Record<string, unknown>;
    path: Record<string, unknown>;
    learningPaths: Array<Record<string, unknown>>;
    pathIndex: number;
    module: Record<string, unknown>;
    moduleIndex: number;
    modules: Array<Record<string, unknown>>;
  } = params;

  // Check that the module is enabled
  const isEnabled: unknown = module['isEnabled'];
  if (isEnabled !== true) {
    throw new Error('Module is not enabled yet');
  }

  // Check that flashcards haven't already been generated
  if (checkModuleFlashcards(module)) {
    const flashcards: unknown = module['flashcards'];
    const suggestedResources: unknown = module['suggestedResources'];
    return {
      generatedFlashcards: Array.isArray(flashcards) ? (flashcards as Flashcard[]) : [],
      generatedResources: Array.isArray(suggestedResources)
        ? (suggestedResources as Array<Record<string, unknown>>)
        : [],
    };
  }

  const context = buildContextForGemini(objective, path);

  // Generate flashcards and resources
  let generatedFlashcards: Flashcard[];
  let generatedResources: Array<Record<string, unknown>>;
  try {
    logger.info(`Generating flashcards and resources for module ${moduleId}...`);
    const result = await generateModuleContent(module, context);
    generatedFlashcards = result.flashcards;
    generatedResources = result.resources;
    logger.info(
      `Successfully generated ${generatedFlashcards.length} flashcards and ${generatedResources.length} resources for module ${moduleId}`
    );
  } catch (error: unknown) {
    logger.error('Failed to generate module content from Gemini:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate module content: ${errorMessage}`);
  }

  // Mettre à jour le module avec flashcards et ressources générées
  modules[moduleIndex] = {
    ...module,
    flashcards: generatedFlashcards,
    suggestedResources: generatedResources,
    hasFlashcards: true,
    hasSuggestedResources: true,
  };

  learningPaths[pathIndex] = {
    ...path,
    modules,
    updatedAt: new Date().toISOString(),
  };

  await firebaseService.updateDocument('objectives', id, { learningPaths });

  return { generatedFlashcards, generatedResources };
};

// Generate flashcards and suggested resources for a module (called when user starts a module)
router.post(
  '/:id/paths/:pathId/modules/:moduleId/generate-content',
  async (req: Request, res: Response): Promise<Response | void> => {
    const uid: string | undefined = req.user?.uid;
    if (uid == null || uid === '') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
      const {
        id,
        moduleId,
        objective,
        learningPaths,
        pathIndex,
        path,
        modules,
        moduleInfo,
      }: {
        id: string;
        moduleId: string;
        objective: Record<string, unknown>;
        learningPaths: Array<Record<string, unknown>>;
        pathIndex: number;
        path: Record<string, unknown>;
        modules: Array<Record<string, unknown>>;
        moduleInfo: { moduleIndex: number; module: Record<string, unknown> };
      } = await validateAndExtractModuleParams(req, uid);
      const moduleIndex: number = moduleInfo.moduleIndex;
      const module: Record<string, unknown> = moduleInfo.module;

      const {
        generatedFlashcards,
        generatedResources,
      }: {
        generatedFlashcards: Flashcard[];
        generatedResources: Array<Record<string, unknown>>;
      } = await generateAndUpdateModuleContent({
        id,
        moduleId,
        objective,
        path,
        learningPaths,
        pathIndex,
        module,
        moduleIndex,
        modules,
      });

      // Si les flashcards étaient déjà générées, retourner le module existant
      if (checkModuleFlashcards(module)) {
        const flashcards: unknown = module['flashcards'];
        const suggestedResources: unknown = module['suggestedResources'];
        return res.json({
          success: true,
          data: {
            module,
            flashcards: Array.isArray(flashcards) ? flashcards : [],
            suggestedResources: Array.isArray(suggestedResources) ? suggestedResources : [],
            message: 'Flashcards already generated',
          },
        });
      }

      return res.json({
        success: true,
        data: {
          module: modules[moduleIndex],
          flashcards: generatedFlashcards,
          suggestedResources: generatedResources,
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Objective ID, path ID and module ID are required') {
        return res.status(400).json({ success: false, message: errorMessage });
      }
      if (
        errorMessage === 'Objective not found' ||
        errorMessage === 'Path not found' ||
        errorMessage === 'Module not found'
      ) {
        return res.status(404).json({ success: false, message: errorMessage });
      }
      if (errorMessage === 'Forbidden') {
        return res.status(403).json({ success: false, message: errorMessage });
      }
      if (errorMessage === 'Module is not enabled yet') {
        return res.status(400).json({ success: false, message: errorMessage });
      }
      logger.error('Error in generate-content:', error);
      return res.status(500).json({
        success: false,
        message: errorMessage.includes('Failed to generate module content')
          ? errorMessage
          : 'Internal server error',
      });
    }
  }
);

// Helper function to generate and update validation quiz
const generateAndUpdateValidationQuiz = async (params: {
  id: string;
  moduleId: string;
  objective: Record<string, unknown>;
  path: Record<string, unknown>;
  learningPaths: Array<Record<string, unknown>>;
  pathIndex: number;
  module: Record<string, unknown>;
  moduleIndex: number;
  modules: Array<Record<string, unknown>>;
}): Promise<QuizQuestion[]> => {
  const {
    id,
    moduleId,
    objective,
    path,
    learningPaths,
    pathIndex,
    module,
    moduleIndex,
    modules,
  }: {
    id: string;
    moduleId: string;
    objective: Record<string, unknown>;
    path: Record<string, unknown>;
    learningPaths: Array<Record<string, unknown>>;
    pathIndex: number;
    module: Record<string, unknown>;
    moduleIndex: number;
    modules: Array<Record<string, unknown>>;
  } = params;

  // Vérifier que les flashcards ont été générées
  if (!checkModuleFlashcards(module)) {
    throw new Error('Flashcards must be generated before creating validation quiz');
  }

  // Vérifier que le quiz n'a pas déjà été généré
  if (checkModuleValidationQuiz(module)) {
    const validationQuiz: unknown = module['validationQuiz'];
    return Array.isArray(validationQuiz) ? (validationQuiz as QuizQuestion[]) : [];
  }

  // Générer le quiz de validation
  const context = buildContextForGemini(objective, path);
  const moduleTitle: unknown = module['title'];
  const moduleDescription: unknown = module['description'];
  const moduleType: unknown = module['type'];
  const flashcards: unknown = module['flashcards'];
  const moduleTypeValue: 'theory' | 'practice' | 'project' | 'assessment' =
    parseModuleType(moduleType);
  let generatedQuiz: QuizQuestion[];
  try {
    logger.info(`Generating validation quiz for module ${moduleId}...`);
    generatedQuiz = await geminiService.generateModuleValidationQuiz(
      {
        title: typeof moduleTitle === 'string' ? moduleTitle : '',
        description: typeof moduleDescription === 'string' ? moduleDescription : '',
        type: moduleTypeValue,
      },
      Array.isArray(flashcards) ? (flashcards as Flashcard[]) : [],
      context
    );
    logger.info(
      `Successfully generated ${generatedQuiz.length} validation quiz questions for module ${moduleId}`
    );
  } catch (error: unknown) {
    logger.error('Failed to generate validation quiz from Gemini:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate validation quiz: ${errorMessage}`);
  }

  // Mettre à jour le module avec le quiz généré
  modules[moduleIndex] = {
    ...module,
    validationQuiz: generatedQuiz,
    hasValidationQuiz: true,
  };

  learningPaths[pathIndex] = {
    ...path,
    modules,
    updatedAt: new Date().toISOString(),
  };

  await firebaseService.updateDocument('objectives', id, { learningPaths });

  return generatedQuiz;
};

// Generate validation quiz for a module
router.post(
  '/:id/paths/:pathId/modules/:moduleId/generate-validation-quiz',
  async (req: Request, res: Response): Promise<Response | void> => {
    const uid: string | undefined = req.user?.uid;
    if (uid == null || uid === '') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
      const {
        id,
        moduleId,
        objective,
        learningPaths,
        pathIndex,
        path,
        modules,
        moduleInfo,
      }: {
        id: string;
        moduleId: string;
        objective: Record<string, unknown>;
        learningPaths: Array<Record<string, unknown>>;
        pathIndex: number;
        path: Record<string, unknown>;
        modules: Array<Record<string, unknown>>;
        moduleInfo: { moduleIndex: number; module: Record<string, unknown> };
      } = await validateAndExtractModuleParams(req, uid);
      const moduleIndex: number = moduleInfo.moduleIndex;
      const module: Record<string, unknown> = moduleInfo.module;

      const generatedQuiz: QuizQuestion[] = await generateAndUpdateValidationQuiz({
        id,
        moduleId,
        objective,
        path,
        learningPaths,
        pathIndex,
        module,
        moduleIndex,
        modules,
      });

      // Si le quiz était déjà généré, retourner le module existant
      if (checkModuleValidationQuiz(module)) {
        const validationQuiz: unknown = module['validationQuiz'];
        return res.json({
          success: true,
          data: {
            module,
            validationQuiz: Array.isArray(validationQuiz) ? validationQuiz : [],
            message: 'Validation quiz already generated',
          },
        });
      }

      return res.json({
        success: true,
        data: {
          module: modules[moduleIndex],
          validationQuiz: generatedQuiz,
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Objective ID, path ID and module ID are required') {
        return res.status(400).json({ success: false, message: errorMessage });
      }
      if (
        errorMessage === 'Objective not found' ||
        errorMessage === 'Path not found' ||
        errorMessage === 'Module not found'
      ) {
        return res.status(404).json({ success: false, message: errorMessage });
      }
      if (errorMessage === 'Forbidden') {
        return res.status(403).json({ success: false, message: errorMessage });
      }
      if (errorMessage === 'Flashcards must be generated before creating validation quiz') {
        return res.status(400).json({ success: false, message: errorMessage });
      }
      logger.error('Error in generate-validation-quiz:', error);
      return res.status(500).json({
        success: false,
        message: errorMessage.includes('Failed to generate validation quiz')
          ? errorMessage
          : 'Internal server error',
      });
    }
  }
);

// Helper function to calculate trend
const calculateTrend = (
  currentScore: number,
  previousScore: number | undefined
): 'progression' | 'regression' | 'stable' => {
  if (previousScore === undefined) {
    return 'stable';
  }
  const scoreDiff: number = currentScore - previousScore;
  if (scoreDiff > 5) {
    return 'progression'; // Improved by more than 5%
  }
  if (scoreDiff < -5) {
    return 'regression'; // Decreased by more than 5%
  }
  return 'stable'; // Within 5% of previous score
};

// Helper function to process validation quiz submission
const processValidationQuiz = async (params: {
  id: string;
  module: Record<string, unknown>;
  answers: Array<{ questionId: string; selectedAnswer: string | number }>;
  timeSpent: number | undefined;
  learningPaths: Array<Record<string, unknown>>;
  pathIndex: number;
  path: Record<string, unknown>;
  modules: Array<Record<string, unknown>>;
  moduleIndex: number;
}): Promise<{
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  feedback: Array<{ questionId: string; correct: boolean; explanation?: string }>;
}> => {
  const {
    id,
    module,
    answers,
    timeSpent,
    learningPaths,
    pathIndex,
    path,
    modules,
    moduleIndex,
  }: {
    id: string;
    module: Record<string, unknown>;
    answers: Array<{ questionId: string; selectedAnswer: string | number }>;
    timeSpent: number | undefined;
    learningPaths: Array<Record<string, unknown>>;
    pathIndex: number;
    path: Record<string, unknown>;
    modules: Array<Record<string, unknown>>;
    moduleIndex: number;
  } = params;

  // Calculer le score
  const validationQuizUnknown: unknown = module['validationQuiz'];
  const validationQuiz: Array<Record<string, unknown>> = Array.isArray(validationQuizUnknown)
    ? (validationQuizUnknown as Array<Record<string, unknown>>)
    : [];
  const {
    correctAnswers,
    totalQuestions,
    score,
    feedback,
  }: {
    correctAnswers: number;
    totalQuestions: number;
    score: number;
    feedback: Array<{ questionId: string; correct: boolean; explanation?: string }>;
  } = calculateQuizScore(validationQuiz, answers);
  const passingScore = 70; // 70% minimum to pass
  const passed: boolean = score >= passingScore;

  // Track performance history and calculate trend
  const performanceHistoryUnknown: unknown = module['performanceHistory'];
  const performanceHistory: Array<Record<string, unknown>> = Array.isArray(
    performanceHistoryUnknown
  )
    ? (performanceHistoryUnknown as Array<Record<string, unknown>>)
    : [];
  const lastAttemptScoreUnknown: unknown = module['lastAttemptScore'];
  const previousAttemptScore: number | undefined =
    typeof lastAttemptScoreUnknown === 'number' ? lastAttemptScoreUnknown : undefined;
  const attemptNumber: number = performanceHistory.length + 1;

  // Add new performance entry (only include timeSpent if it's provided)
  const newPerformanceEntry: Record<string, unknown> = {
    attemptNumber,
    timestamp: new Date().toISOString(),
    quizScore: score,
    passed,
  };

  // Only add timeSpent if it's provided and valid
  if (timeSpent != null && typeof timeSpent === 'number') {
    newPerformanceEntry['timeSpent'] = timeSpent;
  }

  performanceHistory.push(newPerformanceEntry);

  // Calculate trend: progression, regression, or stable
  const trend: 'progression' | 'regression' | 'stable' = calculateTrend(
    score,
    previousAttemptScore
  );

  // Mettre à jour le module selon si passé ou non
  modules[moduleIndex] = updateModuleAfterValidation(module, {
    performanceHistory,
    trend,
    score,
    previousAttemptScore,
    passed,
  });

  // Si passé, activer le module suivant
  if (passed) {
    activateNextModule(modules, moduleIndex, 'after validation passed');
  }

  // Recalculer le progress du path (only if module was passed and completed)
  if (passed) {
    const moduleIsCompleted: unknown = modules[moduleIndex]['isCompleted'];
    if (moduleIsCompleted === true) {
      const { allModulesCompleted }: { allModulesCompleted: boolean } =
        updatePathProgressAndCheckCompletion(learningPaths, pathIndex, path, modules);

      // Si le path est complété, activer le path suivant
      if (allModulesCompleted) {
        activateNextPath(learningPaths, pathIndex);
      }

      // Recalculer le progress de l'objective
      const objectiveProgress: number = calculateProgress(learningPaths, 'isCompleted');

      // Nettoyer les valeurs undefined avant de sauvegarder dans Firestore
      const cleanedLearningPaths1: unknown = removeUndefinedValues(learningPaths);
      await firebaseService.updateDocument('objectives', id, {
        learningPaths: cleanedLearningPaths1 as Array<Record<string, unknown>>,
        progress: objectiveProgress,
        updatedAt: new Date().toISOString(),
      });
    }
  } else {
    // Still update the path with the updated module even if not completed
    learningPaths[pathIndex] = {
      ...path,
      modules,
      updatedAt: new Date().toISOString(),
    };
    // Nettoyer les valeurs undefined avant de sauvegarder dans Firestore
    const cleanedLearningPaths2: unknown = removeUndefinedValues(learningPaths);
    await firebaseService.updateDocument('objectives', id, {
      learningPaths: cleanedLearningPaths2 as Array<Record<string, unknown>>,
    });
  }

  return { score, passed, correctAnswers, totalQuestions, feedback };
};

// Validate module by submitting validation quiz
router.post(
  '/:id/paths/:pathId/modules/:moduleId/validate',
  async (req: Request, res: Response): Promise<Response | void> => {
    const uid: string | undefined = req.user?.uid;
    if (uid == null || uid === '') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const body = req.body as {
      answers: Array<{ questionId: string; selectedAnswer: string | number }>;
      timeSpent?: number; // minutes
    };
    const answers: Array<{ questionId: string; selectedAnswer: string | number }> | undefined =
      body.answers;
    const timeSpent: number | undefined = body.timeSpent;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'answers array is required' });
    }

    try {
      const {
        id,
        learningPaths,
        pathIndex,
        path,
        modules,
        moduleInfo,
      }: {
        id: string;
        learningPaths: Array<Record<string, unknown>>;
        pathIndex: number;
        path: Record<string, unknown>;
        modules: Array<Record<string, unknown>>;
        moduleInfo: { moduleIndex: number; module: Record<string, unknown> };
      } = await validateAndExtractModuleParams(req, uid);
      const moduleIndex: number = moduleInfo.moduleIndex;
      const module: Record<string, unknown> = moduleInfo.module;

      // Vérifier que le quiz existe
      if (!checkModuleValidationQuiz(module)) {
        return res.status(400).json({
          success: false,
          message: 'Validation quiz must be generated before validation',
        });
      }

      const {
        score,
        passed,
        correctAnswers,
        totalQuestions,
        feedback,
      }: {
        score: number;
        passed: boolean;
        correctAnswers: number;
        totalQuestions: number;
        feedback: Array<{ questionId: string; correct: boolean; explanation?: string }>;
      } = await processValidationQuiz({
        id,
        module,
        answers,
        timeSpent,
        learningPaths,
        pathIndex,
        path,
        modules,
        moduleIndex,
      });

      // Update streak if validation passed (non-blocking)
      if (passed) {
        streakService.updateStreakOnStudy(uid).catch((error: unknown) => {
          logger.warn('Failed to update streak after module validation', { userId: uid, error });
        });
      }

      return res.json({
        success: true,
        data: {
          score,
          passed,
          correctAnswers,
          totalQuestions,
          feedback,
          module: modules[moduleIndex],
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Objective ID, path ID and module ID are required') {
        return res.status(400).json({ success: false, message: errorMessage });
      }
      if (
        errorMessage === 'Objective not found' ||
        errorMessage === 'Path not found' ||
        errorMessage === 'Module not found'
      ) {
        return res.status(404).json({ success: false, message: errorMessage });
      }
      if (errorMessage === 'Forbidden') {
        return res.status(403).json({ success: false, message: errorMessage });
      }
      logger.error('Error in validate:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Helper function to process flashcard session
const processFlashcardSession = async (params: {
  id: string;
  flashcardMastery: number;
  masteredCardIds: string[] | undefined;
  timeSpent: number | undefined;
  module: Record<string, unknown>;
  learningPaths: Array<Record<string, unknown>>;
  pathIndex: number;
  path: Record<string, unknown>;
  modules: Array<Record<string, unknown>>;
  moduleIndex: number;
}): Promise<{ trend: 'progression' | 'regression' | 'stable' }> => {
  const {
    id,
    flashcardMastery,
    masteredCardIds,
    timeSpent,
    module,
    learningPaths,
    pathIndex,
    path,
    modules,
    moduleIndex,
  }: {
    id: string;
    flashcardMastery: number;
    masteredCardIds: string[] | undefined;
    timeSpent: number | undefined;
    module: Record<string, unknown>;
    learningPaths: Array<Record<string, unknown>>;
    pathIndex: number;
    path: Record<string, unknown>;
    modules: Array<Record<string, unknown>>;
    moduleIndex: number;
  } = params;

  // Track performance history for flashcard study
  const performanceHistoryUnknown: unknown = module['performanceHistory'];
  const performanceHistory: Array<Record<string, unknown>> = Array.isArray(
    performanceHistoryUnknown
  )
    ? (performanceHistoryUnknown as Array<Record<string, unknown>>)
    : [];
  const lastHistoryEntry: Record<string, unknown> | undefined =
    performanceHistory.length > 0 ? performanceHistory[performanceHistory.length - 1] : undefined;
  const previousMasteryUnknown: unknown =
    lastHistoryEntry != null ? lastHistoryEntry['flashcardMastery'] : undefined;
  const previousMastery: number | undefined =
    typeof previousMasteryUnknown === 'number' ? previousMasteryUnknown : undefined;
  const attemptNumber: number = performanceHistory.length + 1;

  // Add new performance entry (only include timeSpent if it's provided)
  const newPerformanceEntry: Record<string, unknown> = {
    attemptNumber,
    timestamp: new Date().toISOString(),
    flashcardMastery: Math.max(0, Math.min(100, flashcardMastery)),
  };

  // Only add timeSpent if it's provided and valid
  if (timeSpent != null && typeof timeSpent === 'number') {
    newPerformanceEntry['timeSpent'] = timeSpent;
  }

  performanceHistory.push(newPerformanceEntry);

  // Calculate trend based on flashcard mastery
  const trend: 'progression' | 'regression' | 'stable' = calculateTrend(
    flashcardMastery,
    previousMastery
  );

  // Update module with performance history and progress
  const masteredCardIdsUnknown: unknown = module['masteredCardIds'];
  const currentMasteredCardIds: string[] = Array.isArray(masteredCardIdsUnknown)
    ? (masteredCardIdsUnknown as string[])
    : [];
  modules[moduleIndex] = {
    ...module,
    performanceHistory,
    trend,
    progress: flashcardMastery, // Mettre à jour le progress avec le pourcentage de maîtrise
    masteredCardIds:
      masteredCardIds != null && Array.isArray(masteredCardIds)
        ? masteredCardIds
        : currentMasteredCardIds, // Sauvegarder les IDs des cartes maîtrisées
  };

  learningPaths[pathIndex] = {
    ...path,
    modules,
    updatedAt: new Date().toISOString(),
  };

  // Nettoyer les valeurs undefined avant de sauvegarder dans Firestore
  const cleanedLearningPaths: unknown = removeUndefinedValues(learningPaths);
  await firebaseService.updateDocument('objectives', id, {
    learningPaths: cleanedLearningPaths as Array<Record<string, unknown>>,
  });

  return { trend };
};

// Track flashcard study session completion
router.post(
  '/:id/paths/:pathId/modules/:moduleId/flashcard-session',
  async (req: Request, res: Response): Promise<Response | void> => {
    const uid: string | undefined = req.user?.uid;
    if (uid == null || uid === '') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const body = req.body as {
      flashcardMastery: number; // 0-100, percentage of mastered flashcards
      masteredCardIds?: string[]; // IDs of mastered flashcards
      timeSpent?: number; // minutes
    };
    const flashcardMastery: number | undefined = body.flashcardMastery;
    const masteredCardIds: string[] | undefined = body.masteredCardIds;
    const timeSpent: number | undefined = body.timeSpent;

    if (typeof flashcardMastery !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'flashcardMastery is required (0-100)',
      });
    }

    try {
      const {
        id,
        learningPaths,
        pathIndex,
        path,
        modules,
        moduleInfo,
      }: {
        id: string;
        learningPaths: Array<Record<string, unknown>>;
        pathIndex: number;
        path: Record<string, unknown>;
        modules: Array<Record<string, unknown>>;
        moduleInfo: { moduleIndex: number; module: Record<string, unknown> };
      } = await validateAndExtractModuleParams(req, uid);
      const moduleIndex: number = moduleInfo.moduleIndex;
      const module: Record<string, unknown> = moduleInfo.module;

      const { trend }: { trend: 'progression' | 'regression' | 'stable' } =
        await processFlashcardSession({
          id,
          flashcardMastery,
          masteredCardIds,
          timeSpent,
          module,
          learningPaths,
          pathIndex,
          path,
          modules,
          moduleIndex,
        });

      return res.json({
        success: true,
        data: {
          module: modules[moduleIndex],
          trend,
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Objective ID, path ID and module ID are required') {
        return res.status(400).json({ success: false, message: errorMessage });
      }
      if (
        errorMessage === 'Objective not found' ||
        errorMessage === 'Path not found' ||
        errorMessage === 'Module not found'
      ) {
        return res.status(404).json({ success: false, message: errorMessage });
      }
      if (errorMessage === 'Forbidden') {
        return res.status(403).json({ success: false, message: errorMessage });
      }
      logger.error('Error in flashcard-session:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Get detailed module progress
router.get('/:id/paths/:pathId/modules/:moduleId/progress', async (req: Request, res: Response): Promise<Response> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const objectiveId: string | undefined = req.params['id'];
  const pathId: string | undefined = req.params['pathId'];
  const moduleId: string | undefined = req.params['moduleId'];

  if (objectiveId == null || pathId == null || moduleId == null) {
    return res.status(400).json({
      success: false,
      message: 'objectiveId, pathId, and moduleId are required',
    });
  }

  try {
    // Verify objective ownership
    const objectiveDoc = await firebaseService.getDocument('objectives', objectiveId);
    if (objectiveDoc == null) {
      return res.status(404).json({ success: false, message: 'Objective not found' });
    }

    const objective = objectiveDoc as Record<string, unknown>;
    const objectiveUserId: unknown = objective['userId'];
    if (objectiveUserId !== uid) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Get module
    const learningPaths = (objective['learningPaths'] as Array<Record<string, unknown>>) ?? [];
    const path = learningPaths.find((p: Record<string, unknown>): boolean => p['id'] === pathId);
    if (path == null) {
      return res.status(404).json({ success: false, message: 'Path not found' });
    }

    const modules = (path['modules'] as Array<Record<string, unknown>>) ?? [];
    const module = modules.find((m: Record<string, unknown>): boolean => m['id'] === moduleId);
    if (module == null) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    // Get completed resources and final exam status
    const completedResourceIds = await moduleProgressService.getCompletedResourceIds(uid, moduleId);
    const finalExamPassed = await moduleProgressService.isFinalExamPassed(uid, moduleId);

    // Calculate weights
    const suggestedResources = (module['suggestedResources'] as Array<Record<string, unknown>>) ?? [];
    const resourceCount = suggestedResources.length;
    const { resourceWeight, finalExamWeight } = calculateModuleProgressWeights(resourceCount);

    // Calculate current progress
    const progress = calculateModuleProgress(module, completedResourceIds, finalExamPassed);

    return res.json({
      success: true,
      data: {
        progress,
        resourceWeight,
        finalExamWeight,
        resourceCount,
        completedResources: Array.from(completedResourceIds),
        completedResourceCount: completedResourceIds.size,
        finalExamPassed,
      },
    });
  } catch (error: unknown) {
    logger.error('Error getting module progress:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: { message: errorMessage },
    });
  }
});

// Cascade delete objective and related assessments/results
router.delete('/:id', async (req: Request, res: Response): Promise<Response | void> => {
  const uid: string | undefined = req.user?.uid;
  if (uid == null || uid === '') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const idParam: string | undefined = req.params['id'];
  if (idParam == null || idParam === '') {
    return res.status(400).json({ success: false, message: 'Objective ID is required' });
  }
  const id: string = idParam;

  const objectiveDoc = await firebaseService.getDocument('objectives', id);
  if (objectiveDoc == null) {
    return res.status(404).json({ success: false, message: 'Objective not found' });
  }
  const objective: Record<string, unknown> = objectiveDoc;
  const objectiveUserId: unknown = objective['userId'];
  if (objectiveUserId !== uid) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  // Collect related docs
  const assessments = await firebaseService.queryDocuments('assessments', [
    { field: 'objectiveId', operator: '==', value: id },
    { field: 'userId', operator: '==', value: uid },
  ]);
  const results = await firebaseService.queryDocuments('assessmentResults', [
    { field: 'objectiveId', operator: '==', value: id },
    { field: 'userId', operator: '==', value: uid },
  ]);

  // Batch delete
  const ops: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: Record<string, unknown>;
  }> = [];
  assessments.forEach((a: Record<string, unknown>): void => {
    const aId: unknown = a['id'];
    if (typeof aId === 'string') {
      ops.push({ type: 'delete', collection: 'assessments', docId: aId });
    }
  });
  results.forEach((r: Record<string, unknown>): void => {
    const rId: unknown = r['id'];
    if (typeof rId === 'string') {
      ops.push({ type: 'delete', collection: 'assessmentResults', docId: rId });
    }
  });
  ops.push({ type: 'delete', collection: 'objectives', docId: id });
  await firebaseService.batchWrite(ops);

  return res.json({
    success: true,
    data: { deletedAssessments: assessments.length, deletedResults: results.length },
  });
});

export default router;
