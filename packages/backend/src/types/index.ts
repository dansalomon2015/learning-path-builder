export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  // badges?: Badge[]; // Future: badges system to track achievements
  learningObjectives: string[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  studyMode: 'flashcards' | 'quiz' | 'mixed';
  difficultyAdjustment: 'automatic' | 'manual';
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
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  flashcards: Flashcard[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  totalCards: number;
  masteredCards: number;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  createdAt: Date;
  lastReviewed?: Date;
  reviewCount: number;
  masteryLevel: number; // 0-100
  nextReviewDate?: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  usageExample?: string;
  skills?: string[];
}

export interface StudySession {
  id: string;
  userId: string;
  learningPlanId: string;
  mode: 'flashcards' | 'quiz';
  startTime: Date;
  endTime?: Date;
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

export interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date;
  missedDays: number;
  recoveryHistory: Array<{
    date: Date;
    recoveredDays: number;
    assessmentId: string;
    objectiveId: string;
  }>;
  updatedAt: Date;
}

export interface RecoveryAssessment {
  id: string;
  userId: string;
  objectiveId: string;
  objectiveTitle: string;
  missedDays: number;
  questionCount: number;
  questions: QuizQuestion[];
  status: 'pending' | 'completed';
  score?: number;
  passed?: boolean;
  recoveredDays?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface RecoveryResult {
  assessmentId: string;
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  recoveredDays: number;
  newStreak: number;
  feedback?: Array<{
    questionId: string;
    question: string;
    correct: boolean;
    userAnswer: string | number;
    correctAnswer: string | number;
    explanation: string;
  }>;
  averageTimePerQuestion?: number; // in seconds
  suspiciousPattern?: boolean;
}

export interface ResourceAssessment {
  id: string;
  userId: string;
  resourceId: string;
  moduleId: string;
  pathId: string;
  objectiveId: string;
  resourceTitle: string;
  resourceType: 'documentation' | 'book' | 'article' | 'video' | 'tutorial' | 'official_guide';
  resourceUrl?: string;
  questions: QuizQuestion[];
  status: 'pending' | 'completed';
  createdAt: Date;
  completedAt?: Date;
  score?: number;
  passed?: boolean; // >= 70%
  correctAnswers?: number;
  totalQuestions?: number;
  timeSpent?: number; // en secondes
}

export interface ResourceAssessmentResult {
  id: string;
  userId: string;
  resourceId: string;
  assessmentId: string;
  moduleId: string;
  objectiveId: string;
  resourceTitle: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  passed: boolean;
  answers: Array<{
    questionId: string;
    selectedAnswer: string | number;
    correct: boolean;
    explanation?: string;
  }>;
  feedback: Array<{
    questionId: string;
    question: string;
    correct: boolean;
    userAnswer: string | number;
    correctAnswer: string | number;
    explanation: string;
  }>;
  completedAt: Date;
}

export interface AdaptiveAlgorithm {
  userId: string;
  learningPlanId: string;
  currentDifficulty: 'easy' | 'medium' | 'hard';
  performanceHistory: PerformanceMetric[];
  adjustmentFactor: number;
  lastAdjustment: Date;
}

export interface PerformanceMetric {
  date: Date;
  score: number;
  responseTime: number;
  difficulty: string;
  category: string;
}

export interface DocumentUpload {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  content: string;
  processedAt: Date;
  status: 'processing' | 'completed' | 'failed';
  extractedTopics: string[];
  generatedFlashcards: number;
}

export interface ExportData {
  userId: string;
  format: 'csv' | 'pdf';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeSessions: boolean;
  includeStatistics: boolean;
  includeFlashcards: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  message?: string;
  timestamp: string;
  path?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GeminiRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  context?: string;
}

export interface GeminiResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    firebase: boolean;
    gemini: boolean;
    firestore: boolean;
  };
  uptime: number;
  version: string;
}
