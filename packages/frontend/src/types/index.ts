// Enums for type safety
export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum StudyMode {
  FLASHCARDS = 'flashcards',
  QUIZ = 'quiz',
  MIXED = 'mixed',
}

export enum DifficultyAdjustment {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

export enum DifficultyAdjustmentAction {
  INCREASE = 'increase',
  DECREASE = 'decrease',
  MAINTAIN = 'maintain',
}

export enum AssessmentQuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  CODE_REVIEW = 'code_review',
  PRACTICAL = 'practical',
}

export enum ModuleType {
  THEORY = 'theory',
  PRACTICE = 'practice',
  PROJECT = 'project',
  ASSESSMENT = 'assessment',
}

export enum ResourceType {
  DOCUMENTATION = 'documentation',
  BOOK = 'book',
  ARTICLE = 'article',
  VIDEO = 'video',
  TUTORIAL = 'tutorial',
  OFFICIAL_GUIDE = 'official_guide',
}

export enum ObjectiveStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAUSED = 'paused',
}

export enum DocumentStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
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
  createdAt: string;
  completedAt?: string;
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
  averageTimePerQuestion?: number;
  suspiciousPattern?: boolean;
}

export interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  missedDays: number;
  recoveryHistory: Array<{
    date: string;
    recoveredDays: number;
    assessmentId: string;
    objectiveId: string;
  }>;
  updatedAt: string;
}

export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
}

export enum PerformanceTrend {
  PROGRESSION = 'progression',
  REGRESSION = 'regression',
  STABLE = 'stable',
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  // badges?: Badge[]; // Future: badges system to track achievements
  learningObjectives: string[];
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  studyMode: StudyMode;
  difficultyAdjustment: DifficultyAdjustment;
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
  skillLevel: SkillLevel;
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
  difficulty: Difficulty;
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
  difficulty: Difficulty;
  category: string;
  usageExample?: string;
}

export interface StudySession {
  id: string;
  userId: string;
  learningPlanId: string;
  mode: StudyMode;
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
  status: DocumentStatus;
  extractedTopics: string[];
  generatedFlashcards: number;
}

export interface ExportData {
  userId: string;
  format: ExportFormat;
  dateRange: {
    start: string;
    end: string;
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
  difficultyAdjustment: DifficultyAdjustmentAction;
}

export interface LearningAnalytics {
  totalStudyTime: number;
  averageScore: number;
  masteryLevel: number;
  weakAreas: string[];
  strongAreas: string[];
  learningVelocity: number;
  retentionRate: number;
  recommendations: string[];
}

export interface ObjectiveAnalytics extends LearningAnalytics {
  objectiveId: string;
  objectiveTitle: string;
  learningPathsCount: number;
  modulesCount: number;
  sessionsCount: number;
  completionRate: number; // percentage of completed modules
  progressTimeline: Array<{
    date: string;
    studyTime: number;
    masteryLevel: number;
    score: number;
  }>;
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
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
  status: ObjectiveStatus;
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
  difficulty: SkillLevel;
  estimatedDuration: number; // weeks
  prerequisites: string[];
  skills: string[];
  modules: LearningModule[];
  isCompleted: boolean;
  isEnabled: boolean; // Enabled by default only for the first path
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface ModulePerformanceHistory {
  attemptNumber: number;
  timestamp: string;
  quizScore?: number; // 0-100, only if validation quiz was taken
  flashcardMastery?: number; // 0-100, average mastery of flashcards studied
  timeSpent?: number; // minutes
  passed?: boolean; // whether validation quiz was passed
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: ModuleType;
  duration: number; // hours
  flashcards: Flashcard[]; // Replaces content[] - AI-generated flashcards
  validationQuiz?: QuizQuestion[]; // Quiz generated after mastering flashcards
  suggestedResources?: SuggestedResource[]; // Suggested official resources
  isCompleted: boolean;
  isEnabled: boolean; // Enabled by default only for the first module
  hasFlashcards: boolean; // Replaces hasContent - Indicates if flashcards have been generated
  hasValidationQuiz: boolean; // Indicates if validation quiz has been generated
  hasSuggestedResources: boolean; // Indicates if suggested resources have been generated
  progress: number; // 0-100 to display progress percentage
  order: number;
  dueDate?: string;
  masteredCardIds?: string[]; // IDs of mastered cards
  performanceHistory?: ModulePerformanceHistory[]; // Attempt history
  trend?: PerformanceTrend; // Trend based on performance
  lastAttemptScore?: number; // Last score obtained
  previousAttemptScore?: number; // Previous attempt score
  // Deprecated: content: ModuleContent[] - Use flashcards instead
}

export interface SuggestedResource {
  id: string;
  type: ResourceType;
  title: string;
  description: string;
  url?: string;
  author?: string;
  difficulty: SkillLevel;
  estimatedTime: number; // minutes
  priority: number; // 1-5 (1 = high priority)
  isOptional: boolean;
}

// Deprecated: ModuleContent - Use flashcards and suggestedResources instead
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
  skillLevel: SkillLevel;
  questions: AssessmentQuestion[];
  duration: number; // minutes
  passingScore: number; // percentage
  createdAt: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: AssessmentQuestionType;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: Difficulty;
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
  skillLevel: SkillLevel;
  recommendations: string[];
}

export interface AssessmentAnswer {
  questionId: string;
  selectedAnswer: string | number;
  isCorrect: boolean;
  timeSpent: number; // seconds
}

// Resource Assessment System
export interface ResourceAssessment {
  id: string;
  userId: string;
  resourceId: string;
  moduleId: string;
  pathId: string;
  objectiveId: string;
  resourceTitle: string;
  resourceType: ResourceType;
  resourceUrl?: string;
  questions: QuizQuestion[];
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
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
  completedAt: string;
}

// Module Final Exam System
export interface ModuleFinalExam {
  id: string;
  userId: string;
  moduleId: string;
  pathId: string;
  objectiveId: string;
  moduleTitle: string;
  questions: QuizQuestion[];
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
  score?: number;
  passed?: boolean;
  correctAnswers?: number;
  totalQuestions?: number;
  timeSpent?: number;
}

export interface ModuleFinalExamResult {
  id: string;
  userId: string;
  moduleId: string;
  pathId: string;
  objectiveId: string;
  examId: string;
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
  completedAt: string;
}

export interface ModuleFinalExamEligibility {
  canTake: boolean;
  missingResources?: string[];
  reason?: string;
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
  difficulty: Difficulty;
  learningOutcomes: string[];
}
