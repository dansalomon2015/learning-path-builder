// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

// Load .env.local from project root (monorepo root)
// Try multiple paths in order of preference to ensure it works in dev and production
const rootPath = path.resolve(process.cwd(), '.env.local');
const distPath = path.resolve(__dirname, '../../../.env.local');
const srcPath = path.resolve(__dirname, '../../.env.local');

// Try to load .env.local
let envLoaded = false;
if (existsSync(rootPath)) {
  dotenv.config({ path: rootPath });
  envLoaded = true;
} else if (existsSync(distPath)) {
  dotenv.config({ path: distPath });
  envLoaded = true;
} else if (existsSync(srcPath)) {
  dotenv.config({ path: srcPath });
  envLoaded = true;
}

// Also try .env as fallback
const rootEnvPath = path.resolve(process.cwd(), '.env');
if (!envLoaded && existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

// Verify critical environment variables are loaded (will log warnings if not set)
if (!process.env['GEMINI_API_KEY']) {
  console.warn('⚠️  WARNING: GEMINI_API_KEY not found in environment variables');
  console.warn('   Checked paths:', { rootPath, distPath, srcPath });
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { authMiddleware } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { learningPlanRoutes } from '@/routes/learningPlan';
import { documentRoutes } from '@/routes/document';
import authRoutes from '@/routes/auth';
import objectivesRoutes from '@/routes/objectives';
import assessmentsRoutes from '@/routes/assessments';
import { firebaseService } from '@/services/firebase';
import { geminiService } from '@/services/gemini';

const app = express();
const PORT = process.env['PORT'] || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/learning-plans', authMiddleware, learningPlanRoutes);
app.use('/api/documents', authMiddleware, documentRoutes);
app.use('/api/objectives', authMiddleware, objectivesRoutes);
app.use('/api/assessments', authMiddleware, assessmentsRoutes);

// Health check endpoint with service status
app.get('/health', async (_req, res) => {
  try {
    const firebaseHealthy = await firebaseService.healthCheck();
    const geminiHealthy = await geminiService.healthCheck();

    const healthStatus = {
      status: firebaseHealthy && geminiHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] ?? 'development',
      services: {
        firebase: firebaseHealthy,
        gemini: geminiHealthy,
        firestore: firebaseHealthy,
      },
      version: process.env['npm_package_version'] ?? '1.0.0',
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server with extended timeouts for long-running requests (e.g., AI generation)
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env['NODE_ENV'] ?? 'development'}`);
  logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
});

// Increase default Node HTTP server timeouts
// Timeouts (in ms)
const REQUEST_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const HEADERS_TIMEOUT_MS = REQUEST_TIMEOUT_MS + 30 * 1000; // headers timeout slightly above
const KEEP_ALIVE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes keep-alive

// Allow long processing before timing out the socket
server.setTimeout(REQUEST_TIMEOUT_MS);
// Time allowed for the server to receive HTTP headers
// @ts-ignore node types may vary across versions
server.headersTimeout = HEADERS_TIMEOUT_MS;
// How long to keep idle keep-alive connections open
// @ts-ignore node types may vary across versions
server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
