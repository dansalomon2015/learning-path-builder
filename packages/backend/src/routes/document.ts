import { Router } from 'express';
import { type Request, type Response } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import { firebaseService } from '@/services/firebase';
import { geminiService } from '@/services/gemini';
import { type DocumentUpload, type ExportData } from '@/types';
import { createObjectCsvWriter } from 'csv-writer';
import puppeteer from 'puppeteer';
import { logger } from '@/utils/logger';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
    const allowedMimes = ['application/pdf', 'text/plain', 'text/markdown'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, and MD files are allowed.'));
    }
  },
});

// POST /api/documents/upload
router.post(
  '/upload',
  upload.single('document'),
  async (req: Request, res: Response): Promise<Response | void> => {
    const userId: string | undefined = req.user?.uid;
    if (userId == null || userId === '') {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
    }

    if (req.file == null) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' },
      });
    }

    const body = req.body as { topic?: string };
    const topic: string | undefined = body.topic;
    const file: Express.Multer.File = req.file;

    // Extract text content based on file type
    let content = '';
    if (file.mimetype === 'application/pdf') {
      // For PDF files, you would use pdf-parse
      content = file.buffer.toString('utf-8'); // Simplified for demo
    } else {
      content = file.buffer.toString('utf-8');
    }

    // Create document upload record
    const documentUpload: DocumentUpload = {
      id: '',
      userId,
      filename: file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      content,
      processedAt: new Date(),
      status: 'processing',
      extractedTopics: [],
      generatedFlashcards: 0,
    };

    const uploadId: string = await firebaseService.createDocument(
      'documentUploads',
      documentUpload
    );

    // Process document with Gemini AI
    try {
      const topicParam: string | undefined = topic;
      const result = await geminiService.processDocument(content, topicParam);

      // Update document upload with results
      await firebaseService.updateDocument('documentUploads', uploadId, {
        status: 'completed',
        extractedTopics: result.topics,
        generatedFlashcards: result.flashcards.length,
      });

      // Create learning plan from processed document
      const learningPlan = {
        userId,
        title: `${
          topicParam != null && topicParam !== '' ? topicParam : 'Document'
        } - Generated from Upload`,
        description: `Learning plan generated from uploaded document: ${file.originalname}`,
        topic:
          topicParam != null && topicParam !== ''
            ? topicParam
            : result.topics.length > 0
            ? result.topics[0]
            : 'General',
        skillLevel: 'intermediate' as const,
        flashcards: result.flashcards,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        totalCards: result.flashcards.length,
        masteredCards: 0,
      };

      const planId: string = await firebaseService.createDocument('learningPlans', learningPlan);

      return res.status(201).json({
        success: true,
        data: {
          uploadId,
          learningPlanId: planId,
          extractedTopics: result.topics,
          generatedFlashcards: result.flashcards.length,
        },
        message: 'Document processed successfully',
      });
    } catch (error: unknown) {
      // Update document upload with error status
      await firebaseService.updateDocument('documentUploads', uploadId, {
        status: 'failed',
      });

      logger.error('Error processing document:', error);
      throw error;
    }
  }
);

// GET /api/documents/uploads
router.get('/uploads', async (req: Request, res: Response): Promise<Response | void> => {
  const userId: string | undefined = req.user?.uid;
  if (userId == null || userId === '') {
    return res.status(401).json({
      success: false,
      error: { message: 'User not authenticated' },
    });
  }

  const uploads = await firebaseService.queryDocuments('documentUploads', [
    { field: 'userId', operator: '==', value: userId },
  ]);

  return res.json({
    success: true,
    data: uploads,
    message: 'Document uploads retrieved successfully',
  });
});

interface CsvRowData {
  type: string;
  [key: string]: unknown;
}

// Helper functions for PDF generation
const getUserInfo = (
  user: Record<string, unknown> | null
): {
  name: string;
  email: string;
  skillLevel: string;
} => {
  const userName: string =
    user != null && typeof user === 'object' && 'name' in user && typeof user.name === 'string'
      ? user.name
      : 'N/A';
  const userEmail: string =
    user != null && typeof user === 'object' && 'email' in user && typeof user.email === 'string'
      ? user.email
      : 'N/A';
  const userSkillLevel: string =
    user != null &&
    typeof user === 'object' &&
    'skillLevel' in user &&
    typeof user.skillLevel === 'string'
      ? user.skillLevel
      : 'N/A';
  return { name: userName, email: userEmail, skillLevel: userSkillLevel };
};

const calculateStatistics = (
  filteredSessions: Array<Record<string, unknown>>
): { totalStudyTimeMinutes: number; averageScore: number } => {
  const totalStudyTimeMinutes: number = Math.round(
    filteredSessions.reduce((sum: number, s: Record<string, unknown>): number => {
      const duration: unknown = s['duration'];
      return sum + (typeof duration === 'number' ? duration : 0);
    }, 0) / 60
  );

  const averageScore: number =
    filteredSessions.length > 0
      ? Math.round(
          filteredSessions.reduce((sum: number, s: Record<string, unknown>): number => {
            const score: unknown = s['score'];
            return sum + (typeof score === 'number' ? score : 0);
          }, 0) / filteredSessions.length
        )
      : 0;

  return { totalStudyTimeMinutes, averageScore };
};

const generateSessionsTable = (filteredSessions: Array<Record<string, unknown>>): string => {
  return `
                <div class="section">
                    <h2>Study Sessions</h2>
                    <table>
                        <tr>
                            <th>Date</th>
                            <th>Mode</th>
                            <th>Duration</th>
                            <th>Score</th>
                            <th>Cards Reviewed</th>
                        </tr>
                        ${filteredSessions
                          .map((session: Record<string, unknown>): string => {
                            const startTime: unknown = session['startTime'];
                            const mode: unknown = session['mode'];
                            const duration: unknown = session['duration'];
                            const score: unknown = session['score'];
                            const flashcardsReviewed: unknown = session['flashcardsReviewed'];
                            return `
                            <tr>
                                <td>${
                                  startTime != null && typeof startTime === 'string'
                                    ? new Date(startTime).toLocaleDateString()
                                    : 'N/A'
                                }</td>
                                <td>${mode != null && typeof mode === 'string' ? mode : 'N/A'}</td>
                                <td>${
                                  duration != null && typeof duration === 'number'
                                    ? Math.round(duration / 60)
                                    : 0
                                } min</td>
                                <td>${
                                  score != null && typeof score === 'number' ? `${score}%` : 'N/A'
                                }</td>
                                <td>${
                                  flashcardsReviewed != null &&
                                  typeof flashcardsReviewed === 'number'
                                    ? flashcardsReviewed
                                    : 0
                                }</td>
                            </tr>
                        `;
                          })
                          .join('')}
                    </table>
                </div>
                `;
};

const generateFlashcardsTable = (learningPlans: Array<Record<string, unknown>>): string => {
  return `
                <div class="section">
                    <h2>Flashcards Summary</h2>
                    <table>
                        <tr>
                            <th>Learning Plan</th>
                            <th>Total Cards</th>
                            <th>Mastered Cards</th>
                            <th>Mastery %</th>
                        </tr>
                        ${learningPlans
                          .map((plan: Record<string, unknown>): string => {
                            const title: unknown = plan['title'];
                            const totalCards: unknown = plan['totalCards'];
                            const masteredCards: unknown = plan['masteredCards'];
                            const totalCardsNum: number =
                              typeof totalCards === 'number' ? totalCards : 0;
                            const masteredCardsNum: number =
                              typeof masteredCards === 'number' ? masteredCards : 0;
                            return `
                            <tr>
                                <td>${
                                  title != null && typeof title === 'string' ? title : 'N/A'
                                }</td>
                                <td>${totalCardsNum}</td>
                                <td>${masteredCardsNum}</td>
                                <td>${
                                  totalCardsNum > 0
                                    ? Math.round((masteredCardsNum / totalCardsNum) * 100)
                                    : 0
                                }%</td>
                            </tr>
                        `;
                          })
                          .join('')}
                    </table>
                </div>
                `;
};

// POST /api/export/csv
router.post('/csv', async (req: Request, res: Response): Promise<Response | void> => {
  const userId: string | undefined = req.user?.uid;
  if (userId == null || userId === '') {
    return res.status(401).json({
      success: false,
      error: { message: 'User not authenticated' },
    });
  }

  const body = req.body as ExportData;
  const exportData: ExportData = body;

  // Get user's learning plans
  const learningPlans = await firebaseService.queryDocuments('learningPlans', [
    { field: 'userId', operator: '==', value: userId },
  ]);

  // Get study sessions
  const studySessions = await firebaseService.queryDocuments('studySessions', [
    { field: 'userId', operator: '==', value: userId },
  ]);

  // Filter by date range if specified
  const filteredSessions: Array<Record<string, unknown>> = studySessions.filter(
    (session: Record<string, unknown>): boolean => {
      const dateRange: { start: Date; end: Date } = exportData.dateRange;
      const startTime: unknown = session['startTime'];
      if (startTime != null && typeof startTime === 'string') {
        const sessionDate = new Date(startTime);
        return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
      }
      return true;
    }
  );

  // Prepare CSV data
  const csvData: CsvRowData[] = [];

  if (exportData.includeSessions) {
    filteredSessions.forEach((session: Record<string, unknown>): void => {
      const row: CsvRowData = {
        type: 'session',
        sessionId: session['id'] as string,
        learningPlanId: session['learningPlanId'] as string,
        mode: session['mode'] as string,
        startTime: session['startTime'] as string,
        endTime: session['endTime'] as string,
        duration: typeof session['duration'] === 'number' ? session['duration'] : 0,
        score: typeof session['score'] === 'number' ? session['score'] : undefined,
        flashcardsReviewed:
          typeof session['flashcardsReviewed'] === 'number' ? session['flashcardsReviewed'] : 0,
        isCompleted: typeof session['isCompleted'] === 'boolean' ? session['isCompleted'] : false,
      };
      csvData.push(row);
    });
  }

  if (exportData.includeStatistics) {
    const totalSessions: number = filteredSessions.length;
    const averageScore: number =
      totalSessions > 0
        ? filteredSessions.reduce((sum: number, s: Record<string, unknown>): number => {
            const score: unknown = s['score'];
            return sum + (typeof score === 'number' ? score : 0);
          }, 0) / totalSessions
        : 0;
    const totalStudyTime: number = filteredSessions.reduce(
      (sum: number, s: Record<string, unknown>): number => {
        const duration: unknown = s['duration'];
        return sum + (typeof duration === 'number' ? duration : 0);
      },
      0
    );

    const stats = {
      totalLearningPlans: learningPlans.length,
      totalSessions,
      averageScore,
      totalStudyTime,
    };

    csvData.push({
      type: 'statistics',
      ...stats,
    });
  }

  if (exportData.includeFlashcards) {
    learningPlans.forEach((plan: Record<string, unknown>): void => {
      const flashcards: unknown = plan['flashcards'];
      if (Array.isArray(flashcards)) {
        (flashcards as Array<Record<string, unknown>>).forEach(
          (card: Record<string, unknown>): void => {
            csvData.push({
              type: 'flashcard',
              learningPlanId: plan['id'] as string,
              cardId: card['id'] as string,
              question: card['question'] as string,
              answer: card['answer'] as string,
              difficulty: card['difficulty'] as string,
              masteryLevel: typeof card['masteryLevel'] === 'number' ? card['masteryLevel'] : 0,
              reviewCount: typeof card['reviewCount'] === 'number' ? card['reviewCount'] : 0,
              lastReviewed: card['lastReviewed'] as string | undefined,
            });
          }
        );
      }
    });
  }

  // Generate CSV
  if (csvData.length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'No data to export' },
    });
  }

  const csvWriter = createObjectCsvWriter({
    path: 'temp_export.csv',
    header: Object.keys(csvData[0] ?? {}).map((key: string): { id: string; title: string } => ({
      id: key,
      title: key,
    })),
  });

  await csvWriter.writeRecords(csvData);

  // Send CSV file
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="flashlearn_export_${Date.now()}.csv"`
  );

  const csvContent: Buffer = fs.readFileSync('temp_export.csv');
  res.send(csvContent);

  // Clean up temp file
  fs.unlinkSync('temp_export.csv');
});

// POST /api/export/pdf
router.post('/pdf', async (req: Request, res: Response): Promise<Response | void> => {
  const userId: string | undefined = req.user?.uid;
  if (userId == null || userId === '') {
    return res.status(401).json({
      success: false,
      error: { message: 'User not authenticated' },
    });
  }

  const body = req.body as ExportData;
  const exportData: ExportData = body;

  // Get user data
  const user = await firebaseService.getDocument('users', userId);
  const learningPlans = await firebaseService.queryDocuments('learningPlans', [
    { field: 'userId', operator: '==', value: userId },
  ]);

  const studySessions = await firebaseService.queryDocuments('studySessions', [
    { field: 'userId', operator: '==', value: userId },
  ]);

  // Filter by date range if specified
  const filteredSessions: Array<Record<string, unknown>> = studySessions.filter(
    (session: Record<string, unknown>): boolean => {
      const dateRange: { start: Date; end: Date } = exportData.dateRange;
      const startTime: unknown = session['startTime'];
      if (startTime != null && typeof startTime === 'string') {
        const sessionDate = new Date(startTime);
        return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
      }
      return true;
    }
  );

  // Get user info and statistics using helper functions
  const {
    name: userName,
    email: userEmail,
    skillLevel: userSkillLevel,
  }: {
    name: string;
    email: string;
    skillLevel: string;
  } = getUserInfo(user);
  const {
    totalStudyTimeMinutes,
    averageScore,
  }: {
    totalStudyTimeMinutes: number;
    averageScore: number;
  } = calculateStatistics(filteredSessions);

  const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>FlashLearn AI - Learning Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .section { margin-bottom: 20px; }
                    .stats { display: flex; justify-content: space-around; }
                    .stat-item { text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>FlashLearn AI - Learning Report</h1>
                    <p>Generated on ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="section">
                    <h2>User Information</h2>
                    <p><strong>Name:</strong> ${userName}</p>
                    <p><strong>Email:</strong> ${userEmail}</p>
                    <p><strong>Skill Level:</strong> ${userSkillLevel}</p>
                </div>

                <div class="section">
                    <h2>Learning Statistics</h2>
                    <div class="stats">
                        <div class="stat-item">
                            <h3>${learningPlans.length}</h3>
                            <p>Learning Plans</p>
                        </div>
                        <div class="stat-item">
                            <h3>${filteredSessions.length}</h3>
                            <p>Study Sessions</p>
                        </div>
                        <div class="stat-item">
                            <h3>${totalStudyTimeMinutes}</h3>
                            <p>Minutes Studied</p>
                        </div>
                        <div class="stat-item">
                            <h3>${averageScore}%</h3>
                            <p>Average Score</p>
                        </div>
                    </div>
                </div>

                ${exportData.includeSessions ? generateSessionsTable(filteredSessions) : ''}
                ${exportData.includeFlashcards ? generateFlashcardsTable(learningPlans) : ''}
            </body>
            </html>
        `;

  // Generate PDF using Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdf: Buffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px',
    },
  });
  await browser.close();

  // Send PDF file
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="flashlearn_report_${Date.now()}.pdf"`
  );
  res.send(pdf);
});

export const documentRoutes = router;
