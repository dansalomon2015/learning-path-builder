import express, { type Request, type Response, type NextFunction } from 'express';
import { firebaseService } from '@/services/firebase';
import { logger } from '@/utils/logger';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Register new user
router.post('/register', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const body = req.body as {
      email: string;
      password: string;
      name: string;
    };
    const email: string = body.email;
    const password: string = body.password;
    const name: string = body.name;

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
    const secret: string = process.env['JWT_SECRET'] ?? 'your-secret-key';
    const token: string = jwt.sign({ uid: userRecord.uid, email }, secret, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        uid: userRecord.uid,
        email: userRecord.email ?? undefined,
        name: userRecord.displayName ?? undefined,
      },
    });
  } catch (error: unknown) {
    logger.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
});

// Login user with password verification via Firebase Identity Toolkit REST API
router.post('/login', async (req: Request, res: Response): Promise<Response> => {
  try {
    const email: string = (req.body as { email: string; password: string }).email;
    const password: string = (req.body as { email: string; password: string }).password;

    const apiKey: string | undefined = process.env['FIREBASE_API_KEY'];
    if (apiKey == null || apiKey === '') {
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
    const secret: string = process.env['JWT_SECRET'] ?? 'your-secret-key';
    const jwtToken: string = jwt.sign({ uid, email: userRecord.email ?? undefined }, secret, {
      expiresIn: '7d',
    });

    return res.json({
      success: true,
      jwtToken,
      user: {
        id: uid,
        email: userRecord.email ?? undefined,
        name: userRecord.displayName ?? undefined,
      },
    });
  } catch (error: unknown) {
    logger.error('Login error:', error);
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Verify token middleware
export const verifyToken = (req: Request, res: Response, next: NextFunction): Response | void => {
  try {
    const authHeader: string | undefined = req.headers.authorization;
    const token: string | undefined = authHeader?.replace('Bearer ', '');

    if (token == null || token === '') {
      return res.status(401).json({ message: 'No token provided' });
    }

    const secret: string = process.env['JWT_SECRET'] ?? 'your-secret-key';
    const decoded = jwt.verify(token, secret) as { uid: string; email?: string; name?: string };
    req.user = {
      uid: decoded.uid,
      ...(decoded.email !== undefined && { email: decoded.email }),
      ...(decoded.name !== undefined && { name: decoded.name }),
    };
    next();
  } catch (error: unknown) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default router;
