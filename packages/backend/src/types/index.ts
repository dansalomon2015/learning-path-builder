export interface LearningPath {
    id: string;
    title: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    estimatedDuration: number; // in hours
    topics: string[];
    prerequisites: string[];
    resources: Resource[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    isPublished: boolean;
}

export interface Resource {
    id: string;
    title: string;
    type: "article" | "video" | "course" | "book" | "tutorial";
    url?: string;
    description: string;
    duration?: number; // in minutes
    difficulty: "beginner" | "intermediate" | "advanced";
}

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: "student" | "instructor" | "admin";
    learningPaths: string[]; // Array of learning path IDs
    progress: Progress[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Progress {
    learningPathId: string;
    completedResources: string[];
    completedAt?: Date;
    startedAt: Date;
    percentage: number;
}

export interface ApiResponse<T = any> {
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
