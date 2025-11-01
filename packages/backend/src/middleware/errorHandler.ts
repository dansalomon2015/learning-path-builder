import { type Request, type Response, type NextFunction } from 'express';
import { logger } from '@/utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode: number = error.statusCode ?? 500;
  const message: string = error.message !== '' ? error.message : 'Internal Server Error';

  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  // Don't leak error details in production
  const responseMessage =
    process.env['NODE_ENV'] === 'production'
      ? statusCode === 500
        ? 'Internal Server Error'
        : message
      : message;

  res.status(statusCode).json({
    success: false,
    error: {
      message: responseMessage,
      ...(process.env['NODE_ENV'] !== 'production' && { stack: error.stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.url,
  });
};
