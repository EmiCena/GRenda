export type Role = 'user' | 'admin';
export type Theme = 'light' | 'dark';

export enum ExerciseType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRANSLATION = 'TRANSLATION',
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
}

export interface Exercise {
  type: ExerciseType;
  id: string;
}

export interface MultipleChoiceExercise extends Exercise {
  type: ExerciseType.MULTIPLE_CHOICE;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface TranslationExercise extends Exercise {
  type: ExerciseType.TRANSLATION;
  prompt: string;
  phraseToTranslate: string;
  correctAnswer: string;
}

export interface FillInTheBlankExercise extends Exercise {
  type: ExerciseType.FILL_IN_THE_BLANK;
  sentence: string;
  correctAnswer: string;
}

export type AnyExercise = MultipleChoiceExercise | TranslationExercise | FillInTheBlankExercise;

export interface VocabularyItem {
  word: string;
  translation: string;
  example: string;
}

export interface GrammarRule {
  rule: string;
  explanation: string;
  example: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  vocabulary?: VocabularyItem[];
  grammar?: GrammarRule[];
  exercises: AnyExercise[];
  order?: number;
  created_at?: string;
  updated_at?: string;
}

export type View = 'DASHBOARD' | 'LESSONS' | 'GLOSSARY' | 'CHATBOT' | 'PROFILE' | 'ADMIN';

// Usuario actualizado para Django
export interface User {
  id?: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  name: string;
  avatarUrl: string;
  role: Role;
  level?: number;
  total_xp?: number;
  streak_days?: number;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface Progress {
  [lessonId: string]: {
    score: number;
    completed: boolean;
    completed_at?: string;
  };
}

// Tipos para autenticación
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}