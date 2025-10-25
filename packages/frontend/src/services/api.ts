import axios, {AxiosInstance, AxiosResponse} from "axios";
import {LearningPath, User, ApiResponse, PaginatedResponse} from "@/types";

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
            (config) => {
                const token = localStorage.getItem("authToken");
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
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
                    localStorage.removeItem("authToken");
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            }
        );
    }

    // Learning Paths
    async getLearningPaths(params?: {
        page?: number;
        limit?: number;
        difficulty?: string;
        search?: string;
    }): Promise<PaginatedResponse<LearningPath>> {
        const response = await this.api.get("/learning-paths", {params});
        return response.data;
    }

    async getLearningPath(id: string): Promise<ApiResponse<LearningPath>> {
        const response = await this.api.get(`/learning-paths/${id}`);
        return response.data;
    }

    async createLearningPath(
        data: Partial<LearningPath>
    ): Promise<ApiResponse<LearningPath>> {
        const response = await this.api.post("/learning-paths", data);
        return response.data;
    }

    async updateLearningPath(
        id: string,
        data: Partial<LearningPath>
    ): Promise<ApiResponse<LearningPath>> {
        const response = await this.api.put(`/learning-paths/${id}`, data);
        return response.data;
    }

    async deleteLearningPath(id: string): Promise<ApiResponse<void>> {
        const response = await this.api.delete(`/learning-paths/${id}`);
        return response.data;
    }

    // Users
    async getUsers(params?: {
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponse<User>> {
        const response = await this.api.get("/users", {params});
        return response.data;
    }

    async getUser(id: string): Promise<ApiResponse<User>> {
        const response = await this.api.get(`/users/${id}`);
        return response.data;
    }

    async getCurrentUser(): Promise<ApiResponse<User>> {
        const response = await this.api.get("/users/me");
        return response.data;
    }

    async updateUser(
        id: string,
        data: Partial<User>
    ): Promise<ApiResponse<User>> {
        const response = await this.api.put(`/users/${id}`, data);
        return response.data;
    }

    // Auth
    async login(
        email: string,
        password: string
    ): Promise<ApiResponse<{token: string; user: User}>> {
        const response = await this.api.post("/auth/login", {email, password});
        return response.data;
    }

    async register(data: {
        name: string;
        email: string;
        password: string;
    }): Promise<ApiResponse<{token: string; user: User}>> {
        const response = await this.api.post("/auth/register", data);
        return response.data;
    }

    async logout(): Promise<void> {
        localStorage.removeItem("authToken");
    }

    // Health check
    async healthCheck(): Promise<
        ApiResponse<{status: string; timestamp: string}>
    > {
        const response = await this.api.get("/health");
        return response.data;
    }
}

export const apiService = new ApiService();
export default apiService;
