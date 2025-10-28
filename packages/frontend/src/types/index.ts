export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    skillLevel: "beginner" | "intermediate" | "advanced";
    learningObjectives: string[];
    preferences: UserPreferences;
    createdAt: string;
    updatedAt: string;
}

export interface UserPreferences {
    studyMode: "flashcards" | "quiz" | "mixed";
    difficultyAdjustment: "automatic" | "manual";
    sessionLength: number; // in minutes
    notifications: boolean;
    language: string;
}

export interface LearningPlan {
    id: string;
    userId: string;
    title: string;
    description: string;
    topic: string;
    skillLevel: "beginner" | "intermediate" | "advanced";
    flashcards: Flashcard[];
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    totalCards: number;
    masteredCards: number;
}

export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    explanation?: string;
    difficulty: "easy" | "medium" | "hard";
    category: string;
    tags: string[];
    createdAt: string;
    lastReviewed?: string;
    reviewCount: number;
    masteryLevel: number; // 0-100
    nextReviewDate?: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
    category: string;
    usageExample?: string;
}

export interface StudySession {
    id: string;
    userId: string;
    learningPlanId: string;
    mode: "flashcards" | "quiz";
    startTime: string;
    endTime?: string;
    duration?: number; // in seconds
    score?: number; // for quiz mode
    totalQuestions?: number;
    correctAnswers?: number;
    flashcardsReviewed: number;
    isCompleted: boolean;
    performance: SessionPerformance;
}

export interface SessionPerformance {
    averageResponseTime: number;
    difficultyProgression: string[];
    weakAreas: string[];
    strongAreas: string[];
    recommendations: string[];
}

export interface DocumentUpload {
    id: string;
    userId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    content: string;
    processedAt: string;
    status: "processing" | "completed" | "failed";
    extractedTopics: string[];
    generatedFlashcards: number;
}

export interface ExportData {
    userId: string;
    format: "csv" | "pdf";
    dateRange: {
        start: string;
        end: string;
    };
    includeSessions: boolean;
    includeStatistics: boolean;
    includeFlashcards: boolean;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
    };
    message?: string;
    timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface LearningProgress {
    totalCards: number;
    masteredCards: number;
    inProgressCards: number;
    newCards: number;
    masteryPercentage: number;
    estimatedTimeToMastery: number; // in days
}

export interface QuizResult {
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    explanations: string[];
    recommendations: string[];
}

export interface AdaptiveRecommendations {
    weakAreas: string[];
    strongAreas: string[];
    suggestions: string[];
    difficultyAdjustment: "increase" | "decrease" | "maintain";
}
