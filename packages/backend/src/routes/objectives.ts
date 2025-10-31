import { Router } from 'express';
import { firebaseService } from '@/services/firebase';
import { logger } from '@/utils/logger';
import rateLimit from 'express-rate-limit';
import { geminiService } from '@/services/gemini';

const router = Router();

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
      progress: 0,
      createdAt: now,
      updatedAt: now,
    }));

    // Idempotent merge: avoid duplicates by title (case-insensitive) and id
    const existing = Array.isArray(objective['learningPaths']) ? objective['learningPaths'] : [];
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

    // AI modules
    let aiModules;
    try {
      logger.info(`Generating modules for path ${pathId}...`);
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

    const newModules = aiModules
      .filter((m: any) => !existingTitles.has(String(m.title).trim().toLowerCase()))
      .map((m: any, i: number) => ({
        id: `mod_${Date.now()}_${i + 1}`,
        title: m.title,
        description: m.description,
        type: m.type,
        duration: m.duration,
        content: [],
        isCompleted: false,
        order: existingModules.length + i + 1,
        dueDate: addDays(7 * (i + 1)),
      }));
    const merged = newModules.length > 0 ? [...existingModules, ...newModules] : existingModules;

    learningPaths[pathIndex] = { ...path, modules: merged };
    await firebaseService.updateDocument('objectives', id, { learningPaths });

    return res.status(201).json({ success: true, data: learningPaths[pathIndex] });
  } catch (error) {
    logger.error('Failed to generate modules:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate modules' });
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
