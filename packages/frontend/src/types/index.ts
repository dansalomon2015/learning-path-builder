export interface LearningPath {
    id: string;
    title: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    estimatedDuration: number; // in hours
    topics: string[];
    rating: number;
    studentsCount: number;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export interface Resource {
    id: string;
    title: string;
    type: "article" | "video" | "course" | "book" | "tutorial";
    url?: string;
    description: string;
    duration?: number; // in minutes
    difficulty: "beginner" | "intermediate" | "advanced";
    completed?: boolean;
}

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: "student" | "instructor" | "admin";
    createdAt: string;
    updatedAt: string;
}

export interface UserProgress {
    learningPathId: string;
    title: string;
    progress: number;
    completedResources: number;
    totalResources: number;
}

export interface UserStats {
    totalLearningPaths: number;
    completedPaths: number;
    totalHours: number;
    averageRating: number;
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
