import {Router} from "express";
import {Request, Response} from "express";
import multer from "multer";
import {firebaseService} from "@/services/firebase";
import {geminiService} from "@/services/gemini";
import {DocumentUpload, ExportData} from "@/types";
import {createObjectCsvWriter} from "csv-writer";
import puppeteer from "puppeteer";
import {logger} from "@/utils/logger";

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ["application/pdf", "text/plain", "text/markdown"];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Invalid file type. Only PDF, TXT, and MD files are allowed."
                )
            );
        }
    },
});

// POST /api/documents/upload
router.post(
    "/upload",
    upload.single("document"),
    async (req: Request, res: Response) => {
        try {
            const userId = req.user?.uid;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: {message: "User not authenticated"},
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: {message: "No file uploaded"},
                });
            }

            const {topic} = req.body;
            const file = req.file;

            // Extract text content based on file type
            let content = "";
            if (file.mimetype === "application/pdf") {
                // For PDF files, you would use pdf-parse
                content = file.buffer.toString("utf-8"); // Simplified for demo
            } else {
                content = file.buffer.toString("utf-8");
            }

            // Create document upload record
            const documentUpload: DocumentUpload = {
                id: "",
                userId,
                filename: file.originalname,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                content,
                processedAt: new Date(),
                status: "processing",
                extractedTopics: [],
                generatedFlashcards: 0,
            };

            const uploadId = await firebaseService.createDocument(
                "documentUploads",
                documentUpload
            );

            // Process document with Gemini AI
            try {
                const result = await geminiService.processDocument(
                    content,
                    topic
                );

                // Update document upload with results
                await firebaseService.updateDocument(
                    "documentUploads",
                    uploadId,
                    {
                        status: "completed",
                        extractedTopics: result.topics,
                        generatedFlashcards: result.flashcards.length,
                    }
                );

                // Create learning plan from processed document
                const learningPlan = {
                    userId,
                    title: `${topic || "Document"} - Generated from Upload`,
                    description: `Learning plan generated from uploaded document: ${file.originalname}`,
                    topic: topic || result.topics[0] || "General",
                    skillLevel: "intermediate",
                    flashcards: result.flashcards,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: true,
                    totalCards: result.flashcards.length,
                    masteredCards: 0,
                };

                const planId = await firebaseService.createDocument(
                    "learningPlans",
                    learningPlan
                );

                res.status(201).json({
                    success: true,
                    data: {
                        uploadId,
                        learningPlanId: planId,
                        extractedTopics: result.topics,
                        generatedFlashcards: result.flashcards.length,
                    },
                    message: "Document processed successfully",
                });
            } catch (error) {
                // Update document upload with error status
                await firebaseService.updateDocument(
                    "documentUploads",
                    uploadId,
                    {
                        status: "failed",
                    }
                );

                logger.error("Error processing document:", error);
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }
);

// GET /api/documents/uploads
router.get("/uploads", async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {message: "User not authenticated"},
            });
        }

        const uploads = await firebaseService.queryDocuments(
            "documentUploads",
            [{field: "userId", operator: "==", value: userId}]
        );

        res.json({
            success: true,
            data: uploads,
            message: "Document uploads retrieved successfully",
        });
    } catch (error) {
        throw error;
    }
});

// POST /api/export/csv
router.post("/csv", async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {message: "User not authenticated"},
            });
        }

        const exportData: ExportData = req.body;

        // Get user's learning plans
        const learningPlans = await firebaseService.queryDocuments(
            "learningPlans",
            [{field: "userId", operator: "==", value: userId}]
        );

        // Get study sessions
        const studySessions = await firebaseService.queryDocuments(
            "studySessions",
            [{field: "userId", operator: "==", value: userId}]
        );

        // Filter by date range if specified
        const filteredSessions = studySessions.filter((session) => {
            if (exportData.dateRange) {
                const sessionDate = new Date(session.startTime);
                return (
                    sessionDate >= exportData.dateRange.start &&
                    sessionDate <= exportData.dateRange.end
                );
            }
            return true;
        });

        // Prepare CSV data
        const csvData: any[] = [];

        if (exportData.includeSessions) {
            filteredSessions.forEach((session) => {
                csvData.push({
                    type: "session",
                    sessionId: session.id,
                    learningPlanId: session.learningPlanId,
                    mode: session.mode,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    duration: session.duration,
                    score: session.score,
                    flashcardsReviewed: session.flashcardsReviewed,
                    isCompleted: session.isCompleted,
                });
            });
        }

        if (exportData.includeStatistics) {
            const stats = {
                totalLearningPlans: learningPlans.length,
                totalSessions: filteredSessions.length,
                averageScore:
                    filteredSessions.reduce(
                        (sum, s) => sum + (s.score || 0),
                        0
                    ) / filteredSessions.length,
                totalStudyTime: filteredSessions.reduce(
                    (sum, s) => sum + (s.duration || 0),
                    0
                ),
            };

            csvData.push({
                type: "statistics",
                ...stats,
            });
        }

        if (exportData.includeFlashcards) {
            learningPlans.forEach((plan) => {
                plan.flashcards.forEach((card) => {
                    csvData.push({
                        type: "flashcard",
                        learningPlanId: plan.id,
                        cardId: card.id,
                        question: card.question,
                        answer: card.answer,
                        difficulty: card.difficulty,
                        masteryLevel: card.masteryLevel,
                        reviewCount: card.reviewCount,
                        lastReviewed: card.lastReviewed,
                    });
                });
            });
        }

        // Generate CSV
        const csvWriter = createObjectCsvWriter({
            path: "temp_export.csv",
            header: Object.keys(csvData[0] || {}).map((key) => ({
                id: key,
                title: key,
            })),
        });

        await csvWriter.writeRecords(csvData);

        // Send CSV file
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="flashlearn_export_${Date.now()}.csv"`
        );

        const fs = require("fs");
        const csvContent = fs.readFileSync("temp_export.csv");
        res.send(csvContent);

        // Clean up temp file
        fs.unlinkSync("temp_export.csv");
    } catch (error) {
        logger.error("Error generating CSV export:", error);
        throw error;
    }
});

// POST /api/export/pdf
router.post("/pdf", async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: {message: "User not authenticated"},
            });
        }

        const exportData: ExportData = req.body;

        // Get user data
        const user = await firebaseService.getDocument("users", userId);
        const learningPlans = await firebaseService.queryDocuments(
            "learningPlans",
            [{field: "userId", operator: "==", value: userId}]
        );

        const studySessions = await firebaseService.queryDocuments(
            "studySessions",
            [{field: "userId", operator: "==", value: userId}]
        );

        // Filter by date range if specified
        const filteredSessions = studySessions.filter((session) => {
            if (exportData.dateRange) {
                const sessionDate = new Date(session.startTime);
                return (
                    sessionDate >= exportData.dateRange.start &&
                    sessionDate <= exportData.dateRange.end
                );
            }
            return true;
        });

        // Generate HTML content for PDF
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
                    <p><strong>Name:</strong> ${user?.name || "N/A"}</p>
                    <p><strong>Email:</strong> ${user?.email || "N/A"}</p>
                    <p><strong>Skill Level:</strong> ${
                        user?.skillLevel || "N/A"
                    }</p>
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
                            <h3>${Math.round(
                                filteredSessions.reduce(
                                    (sum, s) => sum + (s.duration || 0),
                                    0
                                ) / 60
                            )}</h3>
                            <p>Minutes Studied</p>
                        </div>
                        <div class="stat-item">
                            <h3>${Math.round(
                                filteredSessions.reduce(
                                    (sum, s) => sum + (s.score || 0),
                                    0
                                ) / filteredSessions.length
                            )}%</h3>
                            <p>Average Score</p>
                        </div>
                    </div>
                </div>

                ${
                    exportData.includeSessions
                        ? `
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
                            .map(
                                (session) => `
                            <tr>
                                <td>${new Date(
                                    session.startTime
                                ).toLocaleDateString()}</td>
                                <td>${session.mode}</td>
                                <td>${Math.round(
                                    (session.duration || 0) / 60
                                )} min</td>
                                <td>${session.score || "N/A"}%</td>
                                <td>${session.flashcardsReviewed}</td>
                            </tr>
                        `
                            )
                            .join("")}
                    </table>
                </div>
                `
                        : ""
                }

                ${
                    exportData.includeFlashcards
                        ? `
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
                            .map(
                                (plan) => `
                            <tr>
                                <td>${plan.title}</td>
                                <td>${plan.totalCards}</td>
                                <td>${plan.masteredCards}</td>
                                <td>${Math.round(
                                    (plan.masteredCards / plan.totalCards) * 100
                                )}%</td>
                            </tr>
                        `
                            )
                            .join("")}
                    </table>
                </div>
                `
                        : ""
                }
            </body>
            </html>
        `;

        // Generate PDF using Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20px",
                right: "20px",
                bottom: "20px",
                left: "20px",
            },
        });
        await browser.close();

        // Send PDF file
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="flashlearn_report_${Date.now()}.pdf"`
        );
        res.send(pdf);
    } catch (error) {
        logger.error("Error generating PDF export:", error);
        throw error;
    }
});

export const documentRoutes = router;
