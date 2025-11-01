import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '@/utils/logger';

// Extend Express Request interface to include user
// Namespace is required for Express type augmentation
/* eslint-disable @typescript-eslint/no-namespace */
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
/* eslint-enable @typescript-eslint/no-namespace */

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader == null || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { message: 'No authorization token provided', code: 'MISSING_TOKEN' },
      });
      return;
    }

    const token = authHeader.substring('Bearer '.length).trim();
    if (token === '') {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid authorization token format', code: 'INVALID_TOKEN_FORMAT' },
      });
      return;
    }

    const secret = process.env['JWT_SECRET'];
    if (secret == null || secret === '') {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({ success: false, error: { message: 'Server misconfiguration' } });
      return;
    }

    const decoded = jwt.verify(token, secret) as { uid: string; email?: string; name?: string };

    req.user = {
      uid: decoded.uid,
      ...(decoded.email !== undefined && { email: decoded.email }),
      ...(decoded.name !== undefined && { name: decoded.name }),
    };

    logger.info(`Authenticated user: ${decoded.uid}`, {
      email: decoded.email,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('JWT validation error', { message: errorMessage });
    res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' },
    });
  }
};

// Optional auth middleware for routes that can work with or without authentication
export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader != null && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring('Bearer '.length).trim();
      const secret = process.env['JWT_SECRET'];
      if (secret != null && secret !== '' && token !== '') {
        try {
          const decoded = jwt.verify(token, secret) as {
            uid: string;
            email?: string;
            name?: string;
          };
          req.user = {
            uid: decoded.uid,
            ...(decoded.email !== undefined && { email: decoded.email }),
            ...(decoded.name !== undefined && { name: decoded.name }),
          };
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          logger.warn('Invalid token in optional auth', { message: errorMessage });
        }
      }
    }
    next();
  } catch (error: unknown) {
    logger.error('Optional auth error:', error);
    next();
  }
};
