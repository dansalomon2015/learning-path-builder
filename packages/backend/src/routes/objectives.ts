import { Router } from 'express';
import { firebaseService } from '@/services/firebase';

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
