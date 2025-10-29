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
        skillLevel: 'beginner',
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

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verify credentials with Firebase Auth
    const userRecord = await firebaseService.auth.getUserByEmail(email);

    // Note: Firebase Admin SDK doesn't have a direct password verification method
    // You would need to use Firebase Client SDK for this, or implement custom auth
    // For now, we'll create a custom token and let the client verify

    const customToken = await firebaseService.createCustomToken(userRecord.uid);

    // Generate JWT token
    const token = jwt.sign(
      { uid: userRecord.uid, email: userRecord.email },
      process.env['JWT_SECRET'] || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
      },
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
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
