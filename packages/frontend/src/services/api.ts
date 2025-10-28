import axios, {AxiosInstance, AxiosResponse} from "axios";
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
} from "@/types";
import {AuthService} from "./firebase";

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: import.meta.env.VITE_API_URL || "/api",
            timeout: 10000,
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Request interceptor
        this.api.interceptors.request.use(
            async (config) => {
                const idToken = await AuthService.getIdToken();
                if (idToken) {
                    config.headers.Authorization = `Bearer ${idToken}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.api.interceptors.response.use(
            (response: AxiosResponse) => {
                return response;
            },
            (error) => {
                if (error.response?.status === 401) {
                    AuthService.signOut();
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            }
        );
    }

    // Learning Plans
    async getLearningPlans(): Promise<ApiResponse<LearningPlan[]>> {
        const response = await this.api.get("/learning-plans");
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
        const response = await this.api.post("/learning-plans", data);
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
        mode: "flashcards" | "quiz"
    ): Promise<ApiResponse<StudySession>> {
        const response = await this.api.post(
            `/learning-plans/${planId}/study-session`,
            {mode}
        );
        return response.data;
    }

    async reviewFlashcard(
        planId: string,
        cardId: string,
        userResponse: "correct" | "incorrect",
        responseTime: number,
        sessionId: string
    ): Promise<ApiResponse<Flashcard>> {
        const response = await this.api.post(
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
        const response = await this.api.get(
            `/learning-plans/${planId}/quiz-questions?count=${count}`
        );
        return response.data;
    }

    async submitQuiz(
        planId: string,
        answers: any[],
        sessionId: string
    ): Promise<ApiResponse<QuizResult>> {
        const response = await this.api.post(
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
        formData.append("document", file);
        if (topic) {
            formData.append("topic", topic);
        }

        const response = await this.api.post("/documents/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    }

    async getDocumentUploads(): Promise<ApiResponse<DocumentUpload[]>> {
        const response = await this.api.get("/documents/uploads");
        return response.data;
    }

    // Export
    async exportData(
        format: "csv" | "pdf",
        options: {
            dateRange?: {start: string; end: string};
            includeSessions?: boolean;
            includeStatistics?: boolean;
            includeFlashcards?: boolean;
        }
    ): Promise<Blob> {
        const response = await this.api.post(`/export/${format}`, options, {
            responseType: "blob",
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
        const response = await this.api.get("/health");
        return response.data;
    }
}

export const apiService = new ApiService();
export default apiService;
