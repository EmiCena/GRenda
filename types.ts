// ==================== BASIC TYPES ====================

export type Role = 'user' | 'admin';
export type Theme = 'light' | 'dark';

export type View = 'DASHBOARD' | 'LESSONS' | 'GLOSSARY' | 'CHATBOT' | 'PROFILE' | 'ADMIN';

// ==================== EXERCISE TYPES ====================

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

// ==================== LESSON TYPES ====================

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

// ==================== USER TYPES ====================

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

// ==================== PROGRESS TYPES ====================

export interface Progress {
  [lessonId: string]: {
    score: number;
    completed: boolean;
    completed_at?: string;
  };
}

// ==================== AUTH TYPES ====================

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

// ==================== FLASHCARD TYPES ====================

export interface Flashcard {
  id: number;
  spanish_word: string;
  guarani_word: string;
  example: string;
  notes: string;
  deck_name: string;
  is_favorite: boolean;
  times_reviewed: number;
  times_correct: number;
  accuracy: number;
  last_reviewed: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlashcardCreateData {
  spanish_word: string;
  guarani_word: string;
  example?: string;
  notes?: string;
  deck_name?: string;
}

// ==================== STREAK & CHALLENGES TYPES ====================

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  freeze_count: number;
  total_days_studied: number;
}

export interface DailyChallenge {
  id: number;
  challenge_type: string;
  description: string;
  target_value: number;
  xp_reward: number;
  date: string;
  is_active: boolean;
}

export interface UserChallengeProgress {
  id: number;
  challenge: DailyChallenge;
  current_value: number;
  completed: boolean;
  completed_at: string | null;
  progress_percentage: number;
}

// ==================== ACTIVITY & STATS TYPES ====================

export interface ActivityLog {
  id: number;
  user: number;
  date: string;
  lessons_completed: number;
  flashcards_reviewed: number;
  chatbot_messages: number;
  time_studied_minutes: number;
  xp_earned: number;
}

export interface StudyStats {
  total_time_minutes: number;
  total_time_hours: number;
  week: {
    lessons: number;
    flashcards: number;
    messages: number;
    time: number;
    xp: number;
  };
  month: {
    lessons: number;
    flashcards: number;
    messages: number;
    time: number;
    xp: number;
  };
  best_study_hour: number | null;
  total_sessions: number;
}

export interface StudySession {
  id: number;
  user: number;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  activity_type: string;
  lesson_id: string | null;
}

// src/types.ts (AGREGAR al final)

// ==================== CHATBOT MEJORADO ====================

export interface ConversationMode {
  id: number;
  name: string;
  icon: string;
  description: string;
  system_prompt: string;
  example_phrases: string[];
  difficulty_level: string;
}

export interface GrammarCorrection {
  id: number;
  original_text: string;
  corrected_text: string;
  error_type: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ChatMessage {
  id: number;
  message: string;
  response: string;
  is_user_message: boolean;
  detected_language: string;
  grammar_corrections: any[];
  word_count: number;
  sentiment: string;
  created_at: string;
  corrections: GrammarCorrection[];
}

export interface ChatSession {
  id: number;
  mode: number | null;
  mode_name: string;
  mode_icon: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  message_count: number;
  difficulty_level: string;
  words_used: number;
  new_words_learned: string[];
  grammar_errors: number;
  pronunciation_score: number;
  messages: ChatMessage[];
}

export interface SessionAnalysis {
  duration_minutes: number;
  messages_sent: number;
  words_used: number;
  grammar_errors: number;
  accuracy_rate: number;
  most_common_words: string[];
  error_breakdown: Record<string, number>;
  performance: 'excellent' | 'good' | 'fair' | 'needs_improvement';
}

export interface UserConversationLevel {
  current_level: string;
  level_name: string;
  total_sessions: number;
  total_messages: number;
  total_time_minutes: number;
  vocabulary_size: number;
  grammar_score: number;
  vocabulary_score: number;
  fluency_score: number;
  comprehension_score: number;
  overall_score: number;
}