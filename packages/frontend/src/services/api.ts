import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  LearningPlan,
  Flashcard,
  QuizQuestion,
  StudySession,
  DocumentUpload,
  ExportData,
  ApiResponse,
  PaginatedResponse,
  QuizResult,
  LearningProgress,
} from '@/types';
import { AuthService } from './firebase';
import { toast } from 'react-hot-toast';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 300000, // allow up to 5 minutes for long-running AI generations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      async config => {
        // Only use backend JWT for protected routes
        const backendJwt = cookies.get('jwtToken') || localStorage.getItem('jwtToken');
        if (backendJwt) {
          config.headers.Authorization = `Bearer ${backendJwt}`;
        } else if (config.url && !config.url.includes('/auth/')) {
          // No token for a protected route → warn for easier debugging
          // (Creation endpoints like /objectives are protected)
          // Don't block the request; backend will 401 and the response interceptor will handle UX.
          console.warn('No JWT found when calling', config.url);
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      error => {
        if (error.response?.status === 401) {
          try {
            // localStorage.removeItem('jwtToken');
            // cookies.remove('jwtToken', { path: '/' });
          } catch {}
          toast.error('Session expirée. Veuillez vous reconnecter.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async backendLogin(email: string, password: string): Promise<{ jwtToken: string; user?: any }> {
    const response = await this.api.post('/auth/login', { email, password });
    const jwt = response.data?.jwtToken;
    if (jwt) {
      cookies.set('jwtToken', jwt, { path: '/', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 });
      try {
        localStorage.setItem('jwtToken', jwt);
      } catch {}
    }
    return { jwtToken: jwt, user: response.data?.user };
  }

  async backendRegister(
    name: string,
    email: string,
    password: string
  ): Promise<{ jwtToken: string; user?: any }> {
    const response = await this.api.post('/auth/register', { name, email, password });
    const jwt = response.data?.jwtToken || response.data?.token;
    if (jwt) {
      cookies.set('jwtToken', jwt, { path: '/', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 });
      try {
        localStorage.setItem('jwtToken', jwt);
      } catch {}
    }
    return { jwtToken: jwt, user: response.data?.user };
  }

  // Objectives
  async createObjective(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/objectives', data);
    return response.data;
  }

  async getObjectives(): Promise<ApiResponse<any[]>> {
    const response = await this.api.get('/objectives');
    return response.data;
  }

  async getObjective(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/objectives/${id}`);
    return response.data;
  }

  async deleteObjective(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/objectives/${id}`);
    return response.data;
  }

  async completeLearningPath(
    objectiveId: string,
    pathId: string
  ): Promise<ApiResponse<{ learningPaths: any[]; objectiveProgress: number }>> {
    const response = await this.api.patch(`/objectives/${objectiveId}/paths/${pathId}/complete`);
    return response.data;
  }

  async completeModule(
    objectiveId: string,
    pathId: string,
    moduleId: string
  ): Promise<ApiResponse<{ path: any; objectiveProgress: number }>> {
    const response = await this.api.patch(
      `/objectives/${objectiveId}/paths/${pathId}/modules/${moduleId}/complete`
    );
    return response.data;
  }

  async generateModuleContent(
    objectiveId: string,
    pathId: string,
    moduleId: string
  ): Promise<ApiResponse<{ module: any; flashcards?: any[]; suggestedResources?: any[] }>> {
    const response = await this.api.post(
      `/objectives/${objectiveId}/paths/${pathId}/modules/${moduleId}/generate-content`
    );
    return response.data;
  }

  async generateModuleValidationQuiz(
    objectiveId: string,
    pathId: string,
    moduleId: string
  ): Promise<ApiResponse<{ module: any; validationQuiz?: any[] }>> {
    const response = await this.api.post(
      `/objectives/${objectiveId}/paths/${pathId}/modules/${moduleId}/generate-validation-quiz`
    );
    return response.data;
  }

  async validateModule(
    objectiveId: string,
    pathId: string,
    moduleId: string,
    answers: Array<{ questionId: string; selectedAnswer: string | number }>,
    timeSpent: number
  ): Promise<
    ApiResponse<{
      score: number;
      passed: boolean;
      correctAnswers: number;
      totalQuestions: number;
      feedback: Array<{ questionId: string; correct: boolean; explanation?: string }>;
      module: any;
    }>
  > {
    const response = await this.api.post(
      `/objectives/${objectiveId}/paths/${pathId}/modules/${moduleId}/validate`,
      {
        answers,
        timeSpent,
      }
    );
    return response.data;
  }

  async trackFlashcardSession(
    objectiveId: string,
    pathId: string,
    moduleId: string,
    flashcardMastery: number,
    timeSpent?: number,
    masteredCardIds?: string[]
  ): Promise<ApiResponse<{ module: any; trend?: 'progression' | 'regression' | 'stable' }>> {
    const response = await this.api.post(
      `/objectives/${objectiveId}/paths/${pathId}/modules/${moduleId}/flashcard-session`,
      {
        flashcardMastery,
        timeSpent,
        masteredCardIds,
      }
    );
    return response.data;
  }

  // Assessments
  async startAssessment(payload: {
    objectiveId: string;
    topic?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    count?: number;
  }): Promise<ApiResponse<any>> {
    const response = await this.api.post('/assessments/start', payload);
    return response.data;
  }

  async submitAssessment(
    assessmentId: string,
    answers: { questionId: string; selectedAnswer: number }[],
    timeSpent: number
  ): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/assessments/${assessmentId}/submit`, {
      answers,
      timeSpent,
    });
    return response.data;
  }

  async getAssessmentResult(resultId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/assessments/results/${resultId}`);
    return response.data;
  }

  // Objectives → Generate learning paths
  async generateLearningPaths(objectiveId: string): Promise<ApiResponse<any>> {
    const response = await this.api.post(`/objectives/${objectiveId}/generate-paths`);
    return response.data;
  }

  async generatePathModules(objectiveId: string, pathId: string): Promise<ApiResponse<any>> {
    const response = await this.api.post(
      `/objectives/${objectiveId}/paths/${pathId}/generate-modules`
    );
    return response.data;
  }

  // Learning Plans
  async getLearningPlans(): Promise<ApiResponse<LearningPlan[]>> {
    const response = await this.api.get('/learning-plans');
    return response.data;
  }

  async getLearningPlan(id: string): Promise<ApiResponse<LearningPlan>> {
    const response = await this.api.get(`/learning-plans/${id}`);
    return response.data;
  }

  async createLearningPlan(data: {
    title: string;
    description: string;
    topic: string;
    skillLevel: string;
    mode: string;
  }): Promise<ApiResponse<LearningPlan>> {
    const response = await this.api.post('/learning-plans', data);
    return response.data;
  }

  async updateLearningPlan(
    id: string,
    data: Partial<LearningPlan>
  ): Promise<ApiResponse<LearningPlan>> {
    const response = await this.api.put(`/learning-plans/${id}`, data);
    return response.data;
  }

  async deleteLearningPlan(id: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/learning-plans/${id}`);
    return response.data;
  }

  // Study Sessions
  async startStudySession(
    planId: string,
    mode: 'flashcards' | 'quiz'
  ): Promise<ApiResponse<StudySession>> {
    const response = await this.api.post(`/learning-plans/${planId}/study-session`, { mode });
    return response.data;
  }

  async reviewFlashcard(
    planId: string,
    cardId: string,
    userResponse: 'correct' | 'incorrect',
    responseTime: number,
    sessionId: string
  ): Promise<ApiResponse<Flashcard>> {
    const response = await this.api.post(`/learning-plans/${planId}/flashcards/${cardId}/review`, {
      userResponse,
      responseTime,
      sessionId,
    });
    return response.data;
  }

  // Quiz
  async getQuizQuestions(
    planId: string,
    count: number = 5
  ): Promise<
    ApiResponse<{
      questions: QuizQuestion[];
      difficulty: string;
      adaptiveRecommendations: string[];
    }>
  > {
    const response = await this.api.get(`/learning-plans/${planId}/quiz-questions?count=${count}`);
    return response.data;
  }

  async submitQuiz(
    planId: string,
    answers: any[],
    sessionId: string
  ): Promise<ApiResponse<QuizResult>> {
    const response = await this.api.post(`/learning-plans/${planId}/quiz-submit`, {
      answers,
      sessionId,
    });
    return response.data;
  }

  // Document Upload
  async uploadDocument(
    file: File,
    topic?: string
  ): Promise<
    ApiResponse<{
      uploadId: string;
      learningPlanId: string;
      extractedTopics: string[];
      generatedFlashcards: number;
    }>
  > {
    const formData = new FormData();
    formData.append('document', file);
    if (topic) {
      formData.append('topic', topic);
    }

    const response = await this.api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getDocumentUploads(): Promise<ApiResponse<DocumentUpload[]>> {
    const response = await this.api.get('/documents/uploads');
    return response.data;
  }

  // Export
  async exportData(
    format: 'csv' | 'pdf',
    options: {
      dateRange?: { start: string; end: string };
      includeSessions?: boolean;
      includeStatistics?: boolean;
      includeFlashcards?: boolean;
    }
  ): Promise<Blob> {
    const response = await this.api.post(`/export/${format}`, options, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<
    ApiResponse<{
      status: string;
      timestamp: string;
      services: {
        firebase: boolean;
        gemini: boolean;
        firestore: boolean;
      };
      uptime: number;
      version: string;
    }>
  > {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
