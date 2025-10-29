export interface User {
  name: string;
  email: string;
  avatarUrl: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  example?: string;
  // Properties for spaced repetition (optional for mock, but good practice)
  repetitionLevel?: number;
  lastReviewed?: Date | null;
}

export interface LearningPlan {
  id:string;
  title: string;
  level: string;
  flashcards: Flashcard[];
}

export type StudyMode = 'spaced-repetition' | 'quiz';