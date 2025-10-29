import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '@/utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        name?: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { message: 'No authorization token provided', code: 'MISSING_TOKEN' },
      });
      return;
    }

    const token = authHeader.substring('Bearer '.length).trim();
    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid authorization token format', code: 'INVALID_TOKEN_FORMAT' },
      });
      return;
    }

    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({ success: false, error: { message: 'Server misconfiguration' } });
      return;
    }

    const decoded = jwt.verify(token, secret) as { uid: string; email?: string; name?: string };

    req.user = { uid: decoded.uid, email: decoded.email, name: decoded.name };

    logger.info(`Authenticated user: ${decoded.uid}`, {
      email: decoded.email,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error: any) {
    logger.warn('JWT validation error', { message: error?.message });
    res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' },
    });
  }
};

// Optional auth middleware for routes that can work with or without authentication
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring('Bearer '.length).trim();
      const secret = process.env['JWT_SECRET'];
      if (secret && token) {
        try {
          const decoded = jwt.verify(token, secret) as {
            uid: string;
            email?: string;
            name?: string;
          };
          req.user = { uid: decoded.uid, email: decoded.email, name: decoded.name };
        } catch (err: any) {
          logger.warn('Invalid token in optional auth', { message: err?.message });
        }
      }
    }
    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};
