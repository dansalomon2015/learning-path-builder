import express from 'express';
import { firebaseService } from '@/services/firebase';
import { logger } from '@/utils/logger';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Create user in Firebase Auth
    const userRecord = await firebaseService.auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Create user profile in Firestore
    await firebaseService.createDocument(
      'users',
      {
        uid: userRecord.uid,
        name,
        email,
        learningObjectives: [],
        preferences: {
          studyMode: 'mixed',
          difficultyAdjustment: 'automatic',
          sessionLength: 15,
          notifications: true,
          language: 'fr',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      userRecord.uid
    );

    // Generate JWT token
    const token = jwt.sign(
      { uid: userRecord.uid, email },
      process.env['JWT_SECRET'] || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
      },
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
});

// Login user with password verification via Firebase Identity Toolkit REST API
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const apiKey = process.env['FIREBASE_API_KEY'];
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'FIREBASE_API_KEY not configured' });
    }

    // Verify email/password with Identity Toolkit (server-side)
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      logger.warn(`Password verification failed for ${email}: ${text}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const data = (await resp.json()) as { localId: string };
    const uid = data.localId;

    // Ensure user exists (and load basic profile fields)
    const userRecord = await firebaseService.auth.getUser(uid);

    // Issue backend JWT used for protected API access
    const jwtToken = jwt.sign(
      { uid, email: userRecord.email },
      process.env['JWT_SECRET'] || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      jwtToken,
      user: {
        id: uid,
        email: userRecord.email,
        name: userRecord.displayName,
      },
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Verify token middleware
export const verifyToken = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env['JWT_SECRET'] || 'your-secret-key') as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default router;
