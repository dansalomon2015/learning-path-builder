import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';
import type {
  LearningPlan,
  Flashcard,
  QuizQuestion,
  StudySession,
  DocumentUpload,
  ApiResponse,
  QuizResult,
} from '@/types';
import { toast } from 'react-hot-toast';

// Helper functions for cookie management
const getCookie = (name: string): string | undefined => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue;
  }
  return undefined;
};

const setCookie = (
  name: string,
  value: string,
  options?: { path?: string; sameSite?: string; maxAge?: number }
): void => {
  let cookieString = `${name}=${value}`;
  if (options?.path != null) {
    cookieString += `; path=${options.path}`;
  }
  if (options?.sameSite != null) {
    cookieString += `; SameSite=${options.sameSite}`;
  }
  if (options?.maxAge != null) {
    cookieString += `; max-age=${options.maxAge}`;
  }
  document.cookie = cookieString;
};

class ApiService {
  private readonly api: AxiosInstance;

  constructor() {
    const baseURL: string =
      typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL !== ''
        ? import.meta.env.VITE_API_URL
        : '/api';
    this.api = axios.create({
      baseURL,
      timeout: 300000, // allow up to 5 minutes for long-running AI generations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        // Only use backend JWT for protected routes
        const cookieJwt: string | undefined = getCookie('jwtToken');
        const storageJwt: string | null = localStorage.getItem('jwtToken');
        const backendJwt: string | undefined = cookieJwt ?? storageJwt ?? undefined;
        if (backendJwt != null && backendJwt !== '') {
          config.headers.Authorization = `Bearer ${backendJwt}`;
        } else if (config.url != null && !config.url.includes('/auth/')) {
          // No token for a protected route → warn for easier debugging
          // (Creation endpoints like /objectives are protected)
          // Don't block the request; backend will 401 and the response interceptor will handle UX.
          console.warn('No JWT found when calling', config.url);
        }
        return config;
      },
      (error: AxiosError): Promise<AxiosError> => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse): AxiosResponse => {
        return response;
      },
      (error: AxiosError): Promise<AxiosError> => {
        if (error.response?.status === 401) {
          try {
            // localStorage.removeItem('jwtToken');
            // cookies.remove('jwtToken', { path: '/' });
          } catch {
            // Ignore errors
          }
          toast.error('Session expired. Please log in again.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async backendLogin(
    email: string,
    password: string
  ): Promise<{ jwtToken: string; user?: Record<string, unknown> }> {
    const response = await this.api.post<{ jwtToken?: string; user?: Record<string, unknown> }>(
      '/auth/login',
      { email, password }
    );
    const jwt: string | undefined = response.data.jwtToken;
    if (jwt != null && jwt !== '') {
      setCookie('jwtToken', jwt, { path: '/', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 });
      try {
        localStorage.setItem('jwtToken', jwt);
      } catch {
        // Ignore errors
      }
    }
    return { jwtToken: jwt ?? '', user: response.data.user };
  }

  async backendRegister(
    name: string,
    email: string,
    password: string
  ): Promise<{ jwtToken: string; user?: Record<string, unknown> }> {
    const response = await this.api.post<{
      jwtToken?: string;
      token?: string;
      user?: Record<string, unknown>;
    }>('/auth/register', { name, email, password });
    const jwt: string | undefined = response.data.jwtToken ?? response.data.token;
    if (jwt != null && jwt !== '') {
      setCookie('jwtToken', jwt, { path: '/', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 });
      try {
        localStorage.setItem('jwtToken', jwt);
      } catch {
        // Ignore errors
      }
    }
    return { jwtToken: jwt ?? '', user: response.data.user };
  }

  // Objectives
  async createObjective(
    data: Record<string, unknown>
  ): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await this.api.post<ApiResponse<Record<string, unknown>>>('/objectives', data);
    return response.data;
  }

  async getObjectives(): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    const response = await this.api.get<ApiResponse<Array<Record<string, unknown>>>>('/objectives');
    return response.data;
  }

  async getObjective(id: string): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await this.api.get<ApiResponse<Record<string, unknown>>>(`/objectives/${id}`);
    return response.data;
  }

  async deleteObjective(id: string): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await this.api.delete<ApiResponse<Record<string, unknown>>>(
      `/objectives/${id}`
    );
    return response.data;
  }

  async completeLearningPath(
    objectiveId: string,
    pathId: string
  ): Promise<
    ApiResponse<{ learningPaths: Array<Record<string, unknown>>; objectiveProgress: number }>
  > {
    const response = await this.api.patch<
      ApiResponse<{
        learningPaths: Array<Record<string, unknown>>;
        objectiveProgress: number;
      }>
    >(`/objectives/${objectiveId}/paths/${pathId}/complete`);
    return response.data;
  }

  async completeModule(
    objectiveId: string,
    pathId: string,
    moduleId: string
  ): Promise<ApiResponse<{ path: Record<string, unknown>; objectiveProgress: number }>> {
    const response = await this.api.patch<
      ApiResponse<{
        path: Record<string, unknown>;
        objectiveProgress: number;
      }>
    >(`/objectives/${objectiveId}/paths/${pathId}/modules/${moduleId}/complete`);
    return response.data;
  }

  async generateModuleContent(
    objectiveId: string,
    pathId: string,
    moduleId: string
  ): Promise<
    ApiResponse<{
      module: Record<string, unknown>;
      flashcards?: Flashcard[];
      suggestedResources?: Array<Record<string, unknown>>;
    }>
  > {
    const response = await this.api.post<
      ApiResponse<{
        module: Record<string, unknown>;
        flashcards?: Flashcard[];
        suggestedResources?: Array<Record<string, unknown>>;
      }>
    >(`/objectives/${objectiveId}/paths/${pathId}/modules/${moduleId}/generate-content`);
    return response.data;
  }

  async generateModuleValidationQuiz(
    objectiveId: string,
    pathId: string,
    moduleId: string
  ): Promise<ApiResponse<{ module: Record<string, unknown>; validationQuiz?: QuizQuestion[] }>> {
    const response = await this.api.post<
      ApiResponse<{
        module: Record<string, unknown>;
        validationQuiz?: QuizQuestion[];
      }>
    >(`/objectives/${objectiveId}/paths/${pathId}/modules/${moduleId}/generate-validation-quiz`);
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
      module: Record<string, unknown>;
    }>
  > {
    const response = await this.api.post<
      ApiResponse<{
        score: number;
        passed: boolean;
        correctAnswers: number;
        totalQuestions: number;
        feedback: Array<{ questionId: string; correct: boolean; explanation?: string }>;
        module: Record<string, unknown>;
      }>
    >(`/objectives/${objectiveId}/paths/${pathId}/modules/${moduleId}/validate`, {
      answers,
      timeSpent,
    });
    return response.data;
  }

  async trackFlashcardSession(params: {
    objectiveId: string;
    pathId: string;
    moduleId: string;
    flashcardMastery: number;
    timeSpent?: number;
    masteredCardIds?: string[];
  }): Promise<
    ApiResponse<{
      module: Record<string, unknown>;
      trend?: 'progression' | 'regression' | 'stable';
    }>
  > {
    const {
      objectiveId,
      pathId,
      moduleId,
      flashcardMastery,
      timeSpent,
      masteredCardIds,
    }: {
      objectiveId: string;
      pathId: string;
      moduleId: string;
      flashcardMastery: number;
      timeSpent?: number;
      masteredCardIds?: string[];
    } = params;
    const response = await this.api.post<
      ApiResponse<{
        module: Record<string, unknown>;
        trend?: 'progression' | 'regression' | 'stable';
      }>
    >(`/objectives/${objectiveId}/paths/${pathId}/modules/${moduleId}/flashcard-session`, {
      flashcardMastery,
      timeSpent,
      masteredCardIds,
    });
    return response.data;
  }

  // Assessments
  async startAssessment(payload: {
    objectiveId: string;
    topic?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    count?: number;
  }): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await this.api.post<ApiResponse<Record<string, unknown>>>(
      '/assessments/start',
      payload
    );
    return response.data;
  }

  async submitAssessment(
    assessmentId: string,
    answers: { questionId: string; selectedAnswer: number }[],
    timeSpent: number
  ): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await this.api.post<ApiResponse<Record<string, unknown>>>(
      `/assessments/${assessmentId}/submit`,
      {
        answers,
        timeSpent,
      }
    );
    return response.data;
  }

  async getAssessmentResult(resultId: string): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await this.api.get<ApiResponse<Record<string, unknown>>>(
      `/assessments/results/${resultId}`
    );
    return response.data;
  }

  // Objectives → Generate learning paths
  async generateLearningPaths(objectiveId: string): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await this.api.post<ApiResponse<Record<string, unknown>>>(
      `/objectives/${objectiveId}/generate-paths`
    );
    return response.data;
  }

  async generatePathModules(
    objectiveId: string,
    pathId: string
  ): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await this.api.post<ApiResponse<Record<string, unknown>>>(
      `/objectives/${objectiveId}/paths/${pathId}/generate-modules`
    );
    return response.data;
  }

  // Learning Plans
  async getLearningPlans(): Promise<ApiResponse<LearningPlan[]>> {
    const response = await this.api.get<ApiResponse<LearningPlan[]>>('/learning-plans');
    return response.data;
  }

  async getLearningPlan(id: string): Promise<ApiResponse<LearningPlan>> {
    const response = await this.api.get<ApiResponse<LearningPlan>>(`/learning-plans/${id}`);
    return response.data;
  }

  async createLearningPlan(data: {
    title: string;
    description: string;
    topic: string;
    skillLevel: string;
    mode: string;
  }): Promise<ApiResponse<LearningPlan>> {
    const response = await this.api.post<ApiResponse<LearningPlan>>('/learning-plans', data);
    return response.data;
  }

  async updateLearningPlan(
    id: string,
    data: Partial<LearningPlan>
  ): Promise<ApiResponse<LearningPlan>> {
    const response = await this.api.put<ApiResponse<LearningPlan>>(`/learning-plans/${id}`, data);
    return response.data;
  }

  async deleteLearningPlan(id: string): Promise<ApiResponse<void>> {
    const response = await this.api.delete<ApiResponse<void>>(`/learning-plans/${id}`);
    return response.data;
  }

  // Study Sessions
  async startStudySession(
    planId: string,
    mode: 'flashcards' | 'quiz'
  ): Promise<ApiResponse<StudySession>> {
    const response = await this.api.post<ApiResponse<StudySession>>(
      `/learning-plans/${planId}/study-session`,
      { mode }
    );
    return response.data;
  }

  async reviewFlashcard(
    planId: string,
    cardId: string,
    userResponse: 'correct' | 'incorrect',
    responseTime: number,
    sessionId: string
  ): Promise<ApiResponse<Flashcard>> {
    const response = await this.api.post<ApiResponse<Flashcard>>(
      `/learning-plans/${planId}/flashcards/${cardId}/review`,
      {
        userResponse,
        responseTime,
        sessionId,
      }
    );
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
    const response = await this.api.get<
      ApiResponse<{
        questions: QuizQuestion[];
        difficulty: string;
        adaptiveRecommendations: string[];
      }>
    >(`/learning-plans/${planId}/quiz-questions?count=${count}`);
    return response.data;
  }

  async submitQuiz(
    planId: string,
    answers: Array<{ questionId: string; selectedAnswer: number }>,
    sessionId: string
  ): Promise<ApiResponse<QuizResult>> {
    const response = await this.api.post<ApiResponse<QuizResult>>(
      `/learning-plans/${planId}/quiz-submit`,
      {
        answers,
        sessionId,
      }
    );
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
    if (topic != null && topic !== '') {
      formData.append('topic', topic);
    }

    const response = await this.api.post<
      ApiResponse<{
        uploadId: string;
        learningPlanId: string;
        extractedTopics: string[];
        generatedFlashcards: number;
      }>
    >('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getDocumentUploads(): Promise<ApiResponse<DocumentUpload[]>> {
    const response = await this.api.get<ApiResponse<DocumentUpload[]>>('/documents/uploads');
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
    const response = await this.api.post<Blob>(`/export/${format}`, options, {
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
    const response = await this.api.get<
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
    >('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
