import { Router } from 'express';
import { firebaseService } from '@/services/firebase';
import { logger } from '@/utils/logger';
import rateLimit from 'express-rate-limit';
import { geminiService } from '@/services/gemini';

const router = Router();

// Helper function to recursively remove undefined values from objects and arrays
// Firestore does not accept undefined values
const removeUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item));
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
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
router.post('/', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { title, description, category, targetRole, targetTimeline, currentLevel, targetLevel } =
    req.body;

  const now = new Date().toISOString();
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

  const id = await firebaseService.createDocument('objectives', objective);
  return res.status(201).json({ success: true, data: { id, ...objective } });
});

// List objectives for current user
router.get('/', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const snapshot = await firebaseService.firestore
    .collection('objectives')
    .where('userId', '==', uid)
    .get();

  const items = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return res.json({ success: true, data: items });
});

// Get objective by id
router.get('/:id', async (req: any, res) => {
  const uid = req.user?.uid;
  const id = req.params.id;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const doc = await firebaseService.firestore.collection('objectives').doc(id).get();
  if (!doc.exists) return res.status(404).json({ success: false, message: 'Not found' });
  const data = doc.data();
  if (data?.userId !== uid) return res.status(403).json({ success: false, message: 'Forbidden' });
  return res.json({ success: true, data: { id, ...data } });
});

// Update objective
router.patch('/:id', async (req: any, res) => {
  const uid = req.user?.uid;
  const id = req.params.id;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const ref = firebaseService.firestore.collection('objectives').doc(id);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ success: false, message: 'Not found' });
  const data = doc.data();
  if (data?.userId !== uid) return res.status(403).json({ success: false, message: 'Forbidden' });

  const update = { ...req.body, updatedAt: new Date().toISOString() };
  await ref.update(update);
  const updated = await ref.get();
  return res.json({ success: true, data: { id, ...updated.data() } });
});

// Delete objective
router.delete('/:id', async (req: any, res) => {
  const uid = req.user?.uid;
  const id = req.params.id;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const ref = firebaseService.firestore.collection('objectives').doc(id);
  const doc = await ref.get();
  if (!doc.exists) return res.status(404).json({ success: false, message: 'Not found' });
  const data = doc.data();
  if (data?.userId !== uid) return res.status(403).json({ success: false, message: 'Forbidden' });
  await ref.delete();
  return res.json({ success: true });
});

export default router;

// Generate learning paths for an objective
// Tight rate-limit for learning path generation
const generatePathsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many path generations, please try again later.',
});

router.post('/:id/generate-paths', generatePathsLimiter, async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { id } = req.params as { id: string };

  try {
    const objective = await firebaseService.getDocument('objectives', id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found' });
    if (objective['userId'] !== uid)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    // AI-generated learning paths
    let aiPaths;
    try {
      logger.info(`Generating learning paths for objective ${id}...`);
      aiPaths = await geminiService.generateLearningPaths(
        {
          title: objective['title'],
          description: objective['description'],
          category: objective['category'],
          targetRole: objective['targetRole'],
          currentLevel: objective['currentLevel'],
          targetLevel: objective['targetLevel'],
        },
        3
      );
      logger.info(`Successfully generated ${aiPaths.length} learning paths for objective ${id}`);
    } catch (error) {
      logger.error('Failed to generate learning paths from Gemini:', error);
      // Fallback: return empty array or throw to surface error
      throw new Error(
        `Failed to generate learning paths: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
    const now = new Date().toISOString();
    // Idempotent merge: avoid duplicates by title (case-insensitive) and id
    const existing = Array.isArray(objective['learningPaths']) ? objective['learningPaths'] : [];
    const existingCount = existing.length;

    const paths = aiPaths.map((p: any, idx: number) => ({
      id: `path_${Date.now()}_${idx + 1}`,
      objectiveId: id,
      title: p.title,
      description: p.description,
      category: p.category,
      difficulty: p.difficulty,
      estimatedDuration: p.estimatedDuration,
      prerequisites: p.prerequisites,
      skills: p.skills,
      modules: [],
      isCompleted: false,
      isEnabled: existingCount === 0 && idx === 0, // Activer uniquement le premier si aucun path n'existe
      progress: 0,
      createdAt: now,
      updatedAt: now,
    }));

    const existingTitles = new Set(
      existing.map((p: any) =>
        String(p.title || '')
          .trim()
          .toLowerCase()
      )
    );
    const existingIds = new Set(existing.map((p: any) => String(p.id || '')));

    const newUnique = paths.filter((p: any) => {
      const titleKey = String(p.title || '')
        .trim()
        .toLowerCase();
      if (existingIds.has(p.id)) return false;
      if (existingTitles.has(titleKey)) return false;
      return true;
    });

    const updatedPaths = newUnique.length > 0 ? [...existing, ...newUnique] : existing;
    await firebaseService.updateDocument('objectives', id, { learningPaths: updatedPaths });

    return res.status(201).json({ success: true, data: updatedPaths });
  } catch (error) {
    logger.error('Failed to generate learning paths:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Failed to generate learning paths';
    return res.status(500).json({
      success: false,
      error: { message: errorMessage },
      message: errorMessage,
    });
  }
});

// Generate modules for a learning path (idempotent by module title)
router.post('/:id/paths/:pathId/generate-modules', generatePathsLimiter, async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { id, pathId } = req.params as { id: string; pathId: string };

  try {
    const objective = await firebaseService.getDocument('objectives', id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found' });
    if (objective['userId'] !== uid)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const learningPaths = Array.isArray(objective['learningPaths'])
      ? objective['learningPaths']
      : [];
    const pathIndex = learningPaths.findIndex((p: any) => p.id === pathId);
    if (pathIndex === -1)
      return res.status(404).json({ success: false, message: 'Path not found' });

    const path = learningPaths[pathIndex] || {};
    const existingModules = Array.isArray(path.modules) ? path.modules : [];

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

    const existingTitles = new Set(
      existingModules.map((m: any) =>
        String(m.title || '')
          .trim()
          .toLowerCase()
      )
    );

    const now = new Date();
    const addDays = (d: number) => {
      const next = new Date(now);
      next.setDate(now.getDate() + d);
      return next.toISOString();
    };

    // Générer les modules uniquement s'il n'y en a pas
    let aiModules;
    try {
      logger.info(`Generating modules for path ${pathId} (no existing modules found)...`);
      aiModules = await geminiService.generatePathModules(
        {
          title: objective['title'],
          category: objective['category'],
          targetRole: objective['targetRole'],
        },
        path.title,
        4
      );
      logger.info(`Successfully generated ${aiModules.length} modules for path ${pathId}`);
    } catch (error) {
      logger.error('Failed to generate modules from Gemini:', error);
      throw new Error(
        `Failed to generate modules: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    const existingModulesCount = existingModules.length;

    const newModules = aiModules
      .filter((m: any) => !existingTitles.has(String(m.title).trim().toLowerCase()))
      .map((m: any, i: number) => {
        const module: any = {
          id: `mod_${Date.now()}_${i + 1}`,
          title: m.title,
          description: m.description,
          type: m.type,
          duration: m.duration,
          flashcards: [],
          isCompleted: false,
          isEnabled: existingModulesCount === 0 && i === 0, // Activer uniquement le premier si aucun module n'existe
          hasFlashcards: false, // Pas de flashcards générées initialement
          hasValidationQuiz: false,
          hasSuggestedResources: false,
          progress: 0,
          order: existingModules.length + i + 1,
          dueDate: addDays(7 * (i + 1)),
        };
        // Ne pas inclure validationQuiz et suggestedResources s'ils sont undefined (Firestore n'accepte pas undefined)
        // Ils seront créés plus tard quand l'utilisateur démarre le module
        return module;
      });
    const merged = newModules.length > 0 ? [...existingModules, ...newModules] : existingModules;

    // Nettoyer les modules pour retirer les champs undefined (Firestore n'accepte pas undefined)
    const cleanedModules = merged.map((mod: any) => {
      const cleaned: any = { ...mod };
      // Retirer les champs undefined
      if (cleaned.validationQuiz === undefined) {
        delete cleaned.validationQuiz;
      }
      if (cleaned.suggestedResources === undefined) {
        delete cleaned.suggestedResources;
      }
      return cleaned;
    });

    learningPaths[pathIndex] = { ...path, modules: cleanedModules };
    await firebaseService.updateDocument('objectives', id, { learningPaths });

    return res.status(201).json({ success: true, data: learningPaths[pathIndex] });
  } catch (error) {
    logger.error('Failed to generate modules:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate modules' });
  }
});

// Complete a learning path and activate the next one
router.patch('/:id/paths/:pathId/complete', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { id, pathId } = req.params as { id: string; pathId: string };

  try {
    const objective = await firebaseService.getDocument('objectives', id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found' });
    if (objective['userId'] !== uid)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const learningPaths = Array.isArray(objective['learningPaths'])
      ? objective['learningPaths']
      : [];
    const pathIndex = learningPaths.findIndex((p: any) => p.id === pathId);
    if (pathIndex === -1)
      return res.status(404).json({ success: false, message: 'Path not found' });

    const path = learningPaths[pathIndex];

    // Marquer le path comme complété
    learningPaths[pathIndex] = {
      ...path,
      isCompleted: true,
      progress: 100,
      updatedAt: new Date().toISOString(),
    };

    // Activer le path suivant s'il existe (même objective, order suivant basé sur l'index)
    const nextPathIndex = pathIndex + 1;
    if (nextPathIndex < learningPaths.length) {
      const nextPath = learningPaths[nextPathIndex];
      learningPaths[nextPathIndex] = {
        ...nextPath,
        isEnabled: true,
        updatedAt: new Date().toISOString(),
      };
      logger.info(`Activated next path: ${nextPath.id} after completing path: ${pathId}`);
    }

    // Recalculer le progress de l'objective
    const completedPaths = learningPaths.filter((p: any) => p.isCompleted).length;
    const objectiveProgress =
      learningPaths.length > 0 ? Math.round((completedPaths / learningPaths.length) * 100) : 0;

    // Mettre à jour l'objective
    await firebaseService.updateDocument('objectives', id, {
      learningPaths,
      progress: objectiveProgress,
      updatedAt: new Date().toISOString(),
    });

    return res.json({ success: true, data: { learningPaths, objectiveProgress } });
  } catch (error) {
    logger.error('Failed to complete learning path:', error);
    return res.status(500).json({ success: false, message: 'Failed to complete learning path' });
  }
});

// Complete a module and activate the next one
router.patch('/:id/paths/:pathId/modules/:moduleId/complete', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { id, pathId, moduleId } = req.params as { id: string; pathId: string; moduleId: string };

  try {
    const objective = await firebaseService.getDocument('objectives', id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found' });
    if (objective['userId'] !== uid)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const learningPaths = Array.isArray(objective['learningPaths'])
      ? objective['learningPaths']
      : [];
    const pathIndex = learningPaths.findIndex((p: any) => p.id === pathId);
    if (pathIndex === -1)
      return res.status(404).json({ success: false, message: 'Path not found' });

    const path = learningPaths[pathIndex];
    const modules = Array.isArray(path.modules) ? path.modules : [];
    const moduleIndex = modules.findIndex((m: any) => m.id === moduleId);
    if (moduleIndex === -1)
      return res.status(404).json({ success: false, message: 'Module not found' });

    const module = modules[moduleIndex];

    // Marquer le module comme complété
    modules[moduleIndex] = {
      ...module,
      isCompleted: true,
      progress: 100,
    };

    // Activer le module suivant s'il existe (même path, order suivant)
    const nextModuleIndex = moduleIndex + 1;
    if (nextModuleIndex < modules.length) {
      const nextModule = modules[nextModuleIndex];
      modules[nextModuleIndex] = {
        ...nextModule,
        isEnabled: true,
      };
      logger.info(`Activated next module: ${nextModule.id} after completing module: ${moduleId}`);
    }

    // Recalculer le progress du path
    const completedModules = modules.filter((m: any) => m.isCompleted).length;
    const pathProgress =
      modules.length > 0 ? Math.round((completedModules / modules.length) * 100) : 0;

    // Vérifier si tous les modules sont complétés pour marquer le path comme complété
    const allModulesCompleted = modules.every((m: any) => m.isCompleted);

    learningPaths[pathIndex] = {
      ...path,
      modules,
      progress: pathProgress,
      isCompleted: allModulesCompleted,
      updatedAt: new Date().toISOString(),
    };

    // Si le path est complété, activer le path suivant
    if (allModulesCompleted) {
      const nextPathIndex = pathIndex + 1;
      if (nextPathIndex < learningPaths.length) {
        const nextPath = learningPaths[nextPathIndex];
        learningPaths[nextPathIndex] = {
          ...nextPath,
          isEnabled: true,
          updatedAt: new Date().toISOString(),
        };
        logger.info(
          `Activated next path: ${nextPath.id} after completing all modules in path: ${pathId}`
        );
      }
    }

    // Recalculer le progress de l'objective
    const completedPaths = learningPaths.filter((p: any) => p.isCompleted).length;
    const objectiveProgress =
      learningPaths.length > 0 ? Math.round((completedPaths / learningPaths.length) * 100) : 0;

    await firebaseService.updateDocument('objectives', id, {
      learningPaths,
      progress: objectiveProgress,
      updatedAt: new Date().toISOString(),
    });

    return res.json({ success: true, data: { path: learningPaths[pathIndex], objectiveProgress } });
  } catch (error) {
    logger.error('Failed to complete module:', error);
    return res.status(500).json({ success: false, message: 'Failed to complete module' });
  }
});

// Generate flashcards and suggested resources for a module (called when user starts a module)
router.post('/:id/paths/:pathId/modules/:moduleId/generate-content', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { id, pathId, moduleId } = req.params as { id: string; pathId: string; moduleId: string };

  try {
    const objective = await firebaseService.getDocument('objectives', id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found' });
    if (objective['userId'] !== uid)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const learningPaths = Array.isArray(objective['learningPaths'])
      ? objective['learningPaths']
      : [];
    const pathIndex = learningPaths.findIndex((p: any) => p.id === pathId);
    if (pathIndex === -1)
      return res.status(404).json({ success: false, message: 'Path not found' });

    const path = learningPaths[pathIndex];
    const modules = Array.isArray(path.modules) ? path.modules : [];
    const moduleIndex = modules.findIndex((m: any) => m.id === moduleId);
    if (moduleIndex === -1)
      return res.status(404).json({ success: false, message: 'Module not found' });

    const module = modules[moduleIndex];

    // Vérifier que le module est activé
    if (!module.isEnabled) {
      return res.status(400).json({ success: false, message: 'Module is not enabled yet' });
    }

    // Vérifier que les flashcards n'ont pas déjà été générées
    if (module.hasFlashcards && Array.isArray(module.flashcards) && module.flashcards.length > 0) {
      return res.json({
        success: true,
        data: {
          module,
          flashcards: module.flashcards,
          suggestedResources: module.suggestedResources || [],
          message: 'Flashcards already generated',
        },
      });
    }

    const context = {
      objectiveTitle: objective['title'],
      objectiveCategory: objective['category'],
      targetRole: objective['targetRole'],
      pathTitle: path.title,
      difficulty: path.difficulty,
    };

    // Générer flashcards et ressources en parallèle
    let generatedFlashcards, generatedResources;
    try {
      logger.info(`Generating flashcards and resources for module ${moduleId}...`);
      const [flashcardsResult, resourcesResult] = await Promise.all([
        geminiService.generateModuleFlashcards(
          {
            title: module.title,
            description: module.description,
            type: module.type,
            duration: module.duration,
          },
          context
        ),
        geminiService.generateSuggestedResources(
          {
            title: module.title,
            description: module.description,
            type: module.type,
          },
          context
        ),
      ]);

      generatedFlashcards = flashcardsResult;
      generatedResources = resourcesResult;

      logger.info(
        `Successfully generated ${generatedFlashcards.length} flashcards and ${generatedResources.length} resources for module ${moduleId}`
      );
    } catch (error) {
      logger.error('Failed to generate module content from Gemini:', error);
      throw new Error(
        `Failed to generate module content: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
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

    return res.json({
      success: true,
      data: {
        module: modules[moduleIndex],
        flashcards: generatedFlashcards,
        suggestedResources: generatedResources,
      },
    });
  } catch (error) {
    logger.error('Failed to generate module content:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Failed to generate module content';
    return res.status(500).json({
      success: false,
      error: { message: errorMessage },
      message: errorMessage,
    });
  }
});

// Generate validation quiz for a module
router.post(
  '/:id/paths/:pathId/modules/:moduleId/generate-validation-quiz',
  async (req: any, res) => {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id, pathId, moduleId } = req.params as { id: string; pathId: string; moduleId: string };

    try {
      const objective = await firebaseService.getDocument('objectives', id);
      if (!objective)
        return res.status(404).json({ success: false, message: 'Objective not found' });
      if (objective['userId'] !== uid)
        return res.status(403).json({ success: false, message: 'Forbidden' });

      const learningPaths = Array.isArray(objective['learningPaths'])
        ? objective['learningPaths']
        : [];
      const pathIndex = learningPaths.findIndex((p: any) => p.id === pathId);
      if (pathIndex === -1)
        return res.status(404).json({ success: false, message: 'Path not found' });

      const path = learningPaths[pathIndex];
      const modules = Array.isArray(path.modules) ? path.modules : [];
      const moduleIndex = modules.findIndex((m: any) => m.id === moduleId);
      if (moduleIndex === -1)
        return res.status(404).json({ success: false, message: 'Module not found' });

      const module = modules[moduleIndex];

      // Vérifier que les flashcards ont été générées
      if (
        !module.hasFlashcards ||
        !Array.isArray(module.flashcards) ||
        module.flashcards.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Flashcards must be generated before creating validation quiz',
        });
      }

      // Vérifier que le quiz n'a pas déjà été généré
      if (
        module.hasValidationQuiz &&
        Array.isArray(module.validationQuiz) &&
        module.validationQuiz.length > 0
      ) {
        return res.json({
          success: true,
          data: {
            module,
            validationQuiz: module.validationQuiz,
            message: 'Validation quiz already generated',
          },
        });
      }

      // Générer le quiz de validation
      let generatedQuiz;
      try {
        logger.info(`Generating validation quiz for module ${moduleId}...`);
        generatedQuiz = await geminiService.generateModuleValidationQuiz(
          {
            title: module.title,
            description: module.description,
            type: module.type,
          },
          module.flashcards,
          {
            objectiveTitle: objective['title'],
            objectiveCategory: objective['category'],
            targetRole: objective['targetRole'],
            pathTitle: path.title,
            difficulty: path.difficulty,
          }
        );
        logger.info(
          `Successfully generated ${generatedQuiz.length} validation quiz questions for module ${moduleId}`
        );
      } catch (error) {
        logger.error('Failed to generate validation quiz from Gemini:', error);
        throw new Error(
          `Failed to generate validation quiz: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
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

      return res.json({
        success: true,
        data: {
          module: modules[moduleIndex],
          validationQuiz: generatedQuiz,
        },
      });
    } catch (error) {
      logger.error('Failed to generate validation quiz:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
          ? error
          : 'Failed to generate validation quiz';
      return res.status(500).json({
        success: false,
        error: { message: errorMessage },
        message: errorMessage,
      });
    }
  }
);

// Validate module by submitting validation quiz
router.post('/:id/paths/:pathId/modules/:moduleId/validate', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { id, pathId, moduleId } = req.params as { id: string; pathId: string; moduleId: string };
  const { answers } = req.body as {
    answers: Array<{ questionId: string; selectedAnswer: string | number }>;
    timeSpent?: number; // minutes
  };

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ success: false, message: 'answers array is required' });
  }

  try {
    const objective = await firebaseService.getDocument('objectives', id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found' });
    if (objective['userId'] !== uid)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const learningPaths = Array.isArray(objective['learningPaths'])
      ? objective['learningPaths']
      : [];
    const pathIndex = learningPaths.findIndex((p: any) => p.id === pathId);
    if (pathIndex === -1)
      return res.status(404).json({ success: false, message: 'Path not found' });

    const path = learningPaths[pathIndex];
    const modules = Array.isArray(path.modules) ? path.modules : [];
    const moduleIndex = modules.findIndex((m: any) => m.id === moduleId);
    if (moduleIndex === -1)
      return res.status(404).json({ success: false, message: 'Module not found' });

    const module = modules[moduleIndex];

    // Vérifier que le quiz existe
    if (
      !module.hasValidationQuiz ||
      !Array.isArray(module.validationQuiz) ||
      module.validationQuiz.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Validation quiz must be generated before validation',
      });
    }

    // Calculer le score
    let correctAnswers = 0;
    const feedback: Array<{ questionId: string; correct: boolean; explanation?: string }> = [];

    module.validationQuiz.forEach((question: any, index: number) => {
      // Utiliser l'index si questionId n'est pas présent
      const questionId = question.id || `q${index}`;
      const userAnswer = answers.find(
        a => a.questionId === questionId || a.questionId === `q${index}`
      );
      const isCorrect = userAnswer && userAnswer.selectedAnswer === question.correctAnswer;

      if (isCorrect) {
        correctAnswers++;
      }

      feedback.push({
        questionId: questionId,
        correct: isCorrect || false,
        explanation: question.explanation,
      });
    });

    const totalQuestions = module.validationQuiz.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passingScore = 70; // 70% minimum to pass
    const passed = score >= passingScore;

    // Track performance history and calculate trend
    const performanceHistory = Array.isArray(module.performanceHistory)
      ? module.performanceHistory
      : [];
    const previousAttemptScore = module.lastAttemptScore || undefined;
    const attemptNumber = performanceHistory.length + 1;

    // Add new performance entry (only include timeSpent if it's provided)
    const newPerformanceEntry: any = {
      attemptNumber,
      timestamp: new Date().toISOString(),
      quizScore: score,
      passed,
    };

    // Only add timeSpent if it's provided and valid
    if (req.body.timeSpent !== undefined && req.body.timeSpent !== null) {
      newPerformanceEntry.timeSpent = req.body.timeSpent;
    }

    performanceHistory.push(newPerformanceEntry);

    // Calculate trend: progression, regression, or stable
    let trend: 'progression' | 'regression' | 'stable' = 'stable';
    if (previousAttemptScore !== undefined) {
      const scoreDiff = score - previousAttemptScore;
      if (scoreDiff > 5) {
        trend = 'progression'; // Improved by more than 5%
      } else if (scoreDiff < -5) {
        trend = 'regression'; // Decreased by more than 5%
      } else {
        trend = 'stable'; // Within 5% of previous score
      }
    } else if (performanceHistory.length === 1) {
      // First attempt, no comparison possible
      trend = 'stable';
    }

    // Si passé, marquer le module comme complété et activer le suivant
    if (passed) {
      modules[moduleIndex] = {
        ...module,
        isCompleted: true,
        progress: 100,
        performanceHistory,
        trend,
        lastAttemptScore: score,
        previousAttemptScore,
      };

      // Activer le module suivant
      const nextModuleIndex = moduleIndex + 1;
      if (nextModuleIndex < modules.length) {
        const nextModule = modules[nextModuleIndex];
        modules[nextModuleIndex] = {
          ...nextModule,
          isEnabled: true,
        };
        logger.info(`Activated next module: ${nextModule.id} after validation passed`);
      }
    } else {
      // Module not passed, but still update performance history and trend
      modules[moduleIndex] = {
        ...module,
        performanceHistory,
        trend,
        lastAttemptScore: score,
        previousAttemptScore,
      };
    }

    // Recalculer le progress du path (only if module was passed and completed)
    if (passed && modules[moduleIndex].isCompleted) {
      const completedModules = modules.filter((m: any) => m.isCompleted).length;
      const pathProgress =
        modules.length > 0 ? Math.round((completedModules / modules.length) * 100) : 0;
      const allModulesCompleted = modules.every((m: any) => m.isCompleted);

      learningPaths[pathIndex] = {
        ...path,
        modules,
        progress: pathProgress,
        isCompleted: allModulesCompleted,
        updatedAt: new Date().toISOString(),
      };

      // Si le path est complété, activer le path suivant
      if (allModulesCompleted) {
        const nextPathIndex = pathIndex + 1;
        if (nextPathIndex < learningPaths.length) {
          const nextPath = learningPaths[nextPathIndex];
          learningPaths[nextPathIndex] = {
            ...nextPath,
            isEnabled: true,
            updatedAt: new Date().toISOString(),
          };
          logger.info(`Activated next path: ${nextPath.id} after completing all modules`);
        }
      }

      // Recalculer le progress de l'objective
      const completedPaths = learningPaths.filter((p: any) => p.isCompleted).length;
      const objectiveProgress =
        learningPaths.length > 0 ? Math.round((completedPaths / learningPaths.length) * 100) : 0;

      // Nettoyer les valeurs undefined avant de sauvegarder dans Firestore
      const cleanedLearningPaths1 = removeUndefinedValues(learningPaths);
      await firebaseService.updateDocument('objectives', id, {
        learningPaths: cleanedLearningPaths1,
        progress: objectiveProgress,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Still update the path with the updated module even if not completed
      learningPaths[pathIndex] = {
        ...path,
        modules,
        updatedAt: new Date().toISOString(),
      };
      // Nettoyer les valeurs undefined avant de sauvegarder dans Firestore
      const cleanedLearningPaths2 = removeUndefinedValues(learningPaths);
      await firebaseService.updateDocument('objectives', id, {
        learningPaths: cleanedLearningPaths2,
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
  } catch (error) {
    logger.error('Failed to validate module:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Failed to validate module';
    return res.status(500).json({
      success: false,
      error: { message: errorMessage },
      message: errorMessage,
    });
  }
});

// Track flashcard study session completion
router.post('/:id/paths/:pathId/modules/:moduleId/flashcard-session', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { id, pathId, moduleId } = req.params as { id: string; pathId: string; moduleId: string };
  const { flashcardMastery, masteredCardIds, timeSpent } = req.body as {
    flashcardMastery: number; // 0-100, percentage of mastered flashcards
    masteredCardIds?: string[]; // IDs of mastered flashcards
    timeSpent?: number; // minutes
  };

  if (flashcardMastery === undefined) {
    return res.status(400).json({
      success: false,
      message: 'flashcardMastery is required (0-100)',
    });
  }

  try {
    const objective = await firebaseService.getDocument('objectives', id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found' });
    if (objective['userId'] !== uid)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const learningPaths = Array.isArray(objective['learningPaths'])
      ? objective['learningPaths']
      : [];
    const pathIndex = learningPaths.findIndex((p: any) => p.id === pathId);
    if (pathIndex === -1)
      return res.status(404).json({ success: false, message: 'Path not found' });

    const path = learningPaths[pathIndex];
    const modules = Array.isArray(path.modules) ? path.modules : [];
    const moduleIndex = modules.findIndex((m: any) => m.id === moduleId);
    if (moduleIndex === -1)
      return res.status(404).json({ success: false, message: 'Module not found' });

    const module = modules[moduleIndex];

    // Track performance history for flashcard study
    const performanceHistory = Array.isArray(module.performanceHistory)
      ? module.performanceHistory
      : [];
    const previousMastery =
      performanceHistory.length > 0
        ? performanceHistory[performanceHistory.length - 1].flashcardMastery
        : undefined;
    const attemptNumber = performanceHistory.length + 1;

    // Add new performance entry (only include timeSpent if it's provided)
    const newPerformanceEntry: any = {
      attemptNumber,
      timestamp: new Date().toISOString(),
      flashcardMastery: Math.max(0, Math.min(100, flashcardMastery)),
    };

    // Only add timeSpent if it's provided and valid
    if (timeSpent !== undefined && timeSpent !== null) {
      newPerformanceEntry.timeSpent = timeSpent;
    }

    performanceHistory.push(newPerformanceEntry);

    // Calculate trend based on flashcard mastery
    let trend: 'progression' | 'regression' | 'stable' = 'stable';
    if (previousMastery !== undefined) {
      const masteryDiff = flashcardMastery - previousMastery;
      if (masteryDiff > 5) {
        trend = 'progression'; // Improved by more than 5%
      } else if (masteryDiff < -5) {
        trend = 'regression'; // Decreased by more than 5%
      } else {
        trend = 'stable'; // Within 5% of previous mastery
      }
    } else if (performanceHistory.length === 1) {
      trend = 'stable';
    }

    // Update module with performance history and progress
    modules[moduleIndex] = {
      ...module,
      performanceHistory,
      trend,
      progress: flashcardMastery, // Mettre à jour le progress avec le pourcentage de maîtrise
      masteredCardIds: masteredCardIds || module.masteredCardIds || [], // Sauvegarder les IDs des cartes maîtrisées
    };

    learningPaths[pathIndex] = {
      ...path,
      modules,
      updatedAt: new Date().toISOString(),
    };

    // Nettoyer les valeurs undefined avant de sauvegarder dans Firestore
    const cleanedLearningPaths = removeUndefinedValues(learningPaths);
    await firebaseService.updateDocument('objectives', id, { learningPaths: cleanedLearningPaths });

    return res.json({
      success: true,
      data: {
        module: modules[moduleIndex],
        trend,
      },
    });
  } catch (error) {
    logger.error('Failed to track flashcard session:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Failed to track flashcard session';
    return res.status(500).json({
      success: false,
      error: { message: errorMessage },
      message: errorMessage,
    });
  }
});

// Cascade delete objective and related assessments/results
router.delete('/:id', async (req: any, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const { id } = req.params as { id: string };

  try {
    const objective = await firebaseService.getDocument('objectives', id);
    if (!objective) return res.status(404).json({ success: false, message: 'Objective not found' });
    if (objective['userId'] !== uid)
      return res.status(403).json({ success: false, message: 'Forbidden' });

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
    const ops: any[] = [];
    assessments.forEach((a: any) =>
      ops.push({ type: 'delete', collection: 'assessments', docId: a.id })
    );
    results.forEach((r: any) =>
      ops.push({ type: 'delete', collection: 'assessmentResults', docId: r.id })
    );
    ops.push({ type: 'delete', collection: 'objectives', docId: id });
    await firebaseService.batchWrite(ops);

    return res.json({
      success: true,
      data: { deletedAssessments: assessments.length, deletedResults: results.length },
    });
  } catch (error) {
    logger.error('Failed to delete objective and related data:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete objective' });
  }
});
