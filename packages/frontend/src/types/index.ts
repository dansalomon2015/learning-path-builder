export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives: string[];
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
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
  difficulty: 'easy' | 'medium' | 'hard';
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
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  usageExample?: string;
}

export interface StudySession {
  id: string;
  userId: string;
  learningPlanId: string;
  mode: 'flashcards' | 'quiz';
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
  status: 'processing' | 'completed' | 'failed';
  extractedTopics: string[];
  generatedFlashcards: number;
}

export interface ExportData {
  userId: string;
  format: 'csv' | 'pdf';
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
  difficultyAdjustment: 'increase' | 'decrease' | 'maintain';
}

// Learning Objectives System
export interface LearningObjective {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string; // e.g., "Programming", "Design", "Management"
  targetRole: string; // e.g., "Senior Java Developer", "UX Designer"
  targetTimeline: number; // months
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
  milestones: ObjectiveMilestone[];
  learningPaths: LearningPath[];
  assessmentResults?: AssessmentResult[];
}

export interface ObjectiveMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completedDate?: string;
  isCompleted: boolean;
  skills: string[];
  learningPaths: string[]; // IDs of learning paths
}

export interface LearningPath {
  id: string;
  objectiveId: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // weeks
  prerequisites: string[];
  skills: string[];
  modules: LearningModule[];
  isCompleted: boolean;
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: 'theory' | 'practice' | 'project' | 'assessment';
  duration: number; // hours
  content: ModuleContent[];
  isCompleted: boolean;
  order: number;
}

export interface ModuleContent {
  id: string;
  type: 'video' | 'article' | 'exercise' | 'quiz' | 'project';
  title: string;
  url?: string;
  content?: string;
  duration?: number; // minutes
  isCompleted: boolean;
}

// Assessment System
export interface Assessment {
  id: string;
  title: string;
  description: string;
  category: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  questions: AssessmentQuestion[];
  duration: number; // minutes
  passingScore: number; // percentage
  createdAt: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'code_review' | 'practical';
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  skills: string[];
}

export interface AssessmentResult {
  id: string;
  userId: string;
  assessmentId: string;
  objectiveId?: string;
  score: number; // percentage
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // minutes
  answers: AssessmentAnswer[];
  completedAt: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  recommendations: string[];
}

export interface AssessmentAnswer {
  questionId: string;
  selectedAnswer: string | number;
  isCorrect: boolean;
  timeSpent: number; // seconds
}

// Enhanced Learning Plan with Objective Integration
export interface EnhancedLearningPlan extends LearningPlan {
  objectiveId?: string;
  learningPathId?: string;
  moduleId?: string;
  isPartOfPath: boolean;
  prerequisites: string[];
  skills: string[];
  estimatedDuration: number; // hours
  difficulty: 'easy' | 'medium' | 'hard';
  learningOutcomes: string[];
}
