import axios from 'axios';
import { 
  Lesson, 
  Progress, 
  User, 
  LoginCredentials, 
  RegisterData, 
  Flashcard, 
  FlashcardCreateData,
  UserStreak, 
  UserChallengeProgress, 
  ActivityLog, 
  StudyStats, 
  StudySession,
  ConversationMode, 
  ChatSession, 
  ChatMessage, 
  SessionAnalysis, 
  UserConversationLevel
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Configurar axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para refrescar token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = sessionStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        sessionStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('currentUser');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================

export const apiRegister = async (data: RegisterData): Promise<{
  user: User;
  access: string;
  refresh: string;
  message: string;
}> => {
  try {
    const response = await axios.post(`${API_URL}/auth/register/`, data);
    
    const { access, refresh, user: userData } = response.data;
    
    sessionStorage.setItem('access_token', access);
    sessionStorage.setItem('refresh_token', refresh);
    
    const user: User = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      name: userData.first_name || userData.username,
      avatarUrl: userData.profile_picture || 
                 `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(userData.username)}`,
      role: (userData.is_staff || userData.is_superuser) ? 'admin' : 'user',
      level: userData.level || 1,
      total_xp: userData.total_xp || 0,
      streak_days: userData.streak_days || 0,
      is_staff: userData.is_staff || false,
      is_superuser: userData.is_superuser || false,
    };
    
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    return { ...response.data, user };
  } catch (error: any) {
    console.error('Register error:', error);
    
    if (error.response?.data) {
      const errors = error.response.data;
      const errorMessages = [];
      
      if (errors.username) errorMessages.push(`Usuario: ${errors.username[0]}`);
      if (errors.email) errorMessages.push(`Email: ${errors.email[0]}`);
      if (errors.password) errorMessages.push(`Contraseña: ${errors.password[0]}`);
      if (errors.password2) errorMessages.push(errors.password2[0]);
      if (errors.non_field_errors) errorMessages.push(errors.non_field_errors[0]);
      
      throw new Error(errorMessages.join('\n') || 'Error al registrar usuario');
    }
    
    throw new Error('Error de conexión con el servidor');
  }
};

export const apiLogin = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await axios.post(`${API_URL}/auth/login/`, credentials);
    
    const { access, refresh, user: userData } = response.data;

    sessionStorage.setItem('access_token', access);
    sessionStorage.setItem('refresh_token', refresh);

    const user: User = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      name: userData.first_name || userData.username,
      avatarUrl: userData.profile_picture || 
                 `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(userData.username)}`,
      role: (userData.is_staff || userData.is_superuser) ? 'admin' : 'user',
      level: userData.level || 1,
      total_xp: userData.total_xp || 0,
      streak_days: userData.streak_days || 0,
      is_staff: userData.is_staff || false,
      is_superuser: userData.is_superuser || false,
    };

    sessionStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.response?.data) {
      const errorMsg = error.response.data.non_field_errors?.[0] || 
                       error.response.data.detail || 
                       'Usuario o contraseña incorrectos';
      throw new Error(errorMsg);
    }
    
    throw new Error('Error de conexión con el servidor');
  }
};

export const apiLogout = async (): Promise<void> => {
  try {
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (refreshToken) {
      await api.post('/auth/logout/', { refresh: refreshToken });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('currentUser');
  }
};

export const apiGetCurrentUser = async (): Promise<User | null> => {
  try {
    const token = sessionStorage.getItem('access_token');
    if (!token) return null;

    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      try {
        await api.get('/auth/profile/');
        return JSON.parse(storedUser);
      } catch {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('currentUser');
        return null;
      }
    }

    const response = await api.get('/auth/profile/');
    const userData = response.data;
    
    const user: User = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      name: userData.first_name || userData.username,
      avatarUrl: userData.profile_picture || 
                 `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(userData.username)}`,
      role: (userData.is_staff || userData.is_superuser) ? 'admin' : 'user',
      level: userData.level || 1,
      total_xp: userData.total_xp || 0,
      streak_days: userData.streak_days || 0,
      is_staff: userData.is_staff || false,
      is_superuser: userData.is_superuser || false,
    };

    sessionStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  } catch (error) {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('currentUser');
    return null;
  }
};

export const apiUpdateUserRole = async (user: User, role: 'user' | 'admin'): Promise<User> => {
  const updatedUser = { ...user, role };
  sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
  return updatedUser;
};

// ==================== LESSONS API ====================

export const apiGetAllLessons = async (): Promise<Lesson[]> => {
  try {
    const response = await api.get('/lessons/');
    return response.data;
  } catch (error: any) {
    console.error('Error getting lessons:', error);
    throw new Error(error.response?.data?.detail || 'Error al obtener lecciones');
  }
};

export const apiAddLesson = async (lessonData: Omit<Lesson, 'id'>): Promise<Lesson> => {
  try {
    const response = await api.post('/lessons/', lessonData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al crear lección');
  }
};

export const apiUpdateLesson = async (updatedLesson: Lesson): Promise<Lesson> => {
  try {
    const response = await api.put(`/lessons/${updatedLesson.id}/`, updatedLesson);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al actualizar lección');
  }
};

export const apiDeleteLesson = async (lessonId: string): Promise<void> => {
  try {
    await api.delete(`/lessons/${lessonId}/`);
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al eliminar lección');
  }
};

// ==================== PROGRESS API ====================

export const apiGetAllProgress = async (): Promise<Progress> => {
  try {
    const response = await api.get('/progress/');
    
    const progress: Progress = {};
    response.data.forEach((item: any) => {
      progress[item.lesson_id] = {
        score: item.score,
        completed: item.completed,
        completed_at: item.completed_at,
      };
    });
    
    return progress;
  } catch (error: any) {
    console.error('Error getting progress:', error);
    return {};
  }
};

export const apiUpdateProgress = async (
  lessonId: string, 
  data: { score: number; completed: boolean }
): Promise<{ score: number; completed: boolean; completed_at?: string }> => {
  try {
    const response = await api.post('/progress/', {
      lesson_id: lessonId,
      score: data.score,
      completed: data.completed,
    });
    
    return {
      score: response.data.score,
      completed: response.data.completed,
      completed_at: response.data.completed_at,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al actualizar progreso');
  }
};

// ==================== EXERCISE RESULTS API ====================

export interface ExerciseResultData {
  exercise_id: string;
  exercise_type: 'MULTIPLE_CHOICE' | 'TRANSLATION' | 'FILL_IN_THE_BLANK';
  is_correct: boolean;
  user_answer: string;
  correct_answer: string;
}

export interface WeaknessStats {
  type: string;
  display_name: string;
  icon: string;
  total_attempts: number;
  correct_answers: number;
  accuracy: number;
}

export interface WeaknessAnalysis {
  overall_stats: WeaknessStats[];
  translation_breakdown: WeaknessStats[];
  total_exercises_completed: number;
}

export const apiUpdateProgressWithResults = async (
  lessonId: string,
  data: {
    score: number;
    completed: boolean;
    exercise_results?: ExerciseResultData[];
  }
): Promise<{ score: number; completed: boolean; completed_at?: string }> => {
  try {
    const response = await api.post('/progress/', {
      lesson_id: lessonId,
      score: data.score,
      completed: data.completed,
      exercise_results: data.exercise_results || [],
    });

    return {
      score: response.data.score,
      completed: response.data.completed,
      completed_at: response.data.completed_at,
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al actualizar progreso');
  }
};

export const apiGetWeaknessAnalysis = async (): Promise<WeaknessAnalysis> => {
  try {
    const response = await api.get('/analytics/weaknesses/');
    return response.data;
  } catch (error: any) {
    console.error('Error getting weakness analysis:', error);
    return {
      overall_stats: [],
      translation_breakdown: [],
      total_exercises_completed: 0,
    };
  }
};

// ==================== FLASHCARDS API ====================

export const apiGetAllFlashcards = async (filters?: {
  deck?: string;
  favorites?: boolean;
}): Promise<Flashcard[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.deck) params.append('deck', filters.deck);
    if (filters?.favorites) params.append('favorites', 'true');
    
    const response = await api.get(`/flashcards/?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error('Error getting flashcards:', error);
    throw new Error(error.response?.data?.detail || 'Error al obtener flashcards');
  }
};

export const apiCreateFlashcard = async (data: FlashcardCreateData): Promise<Flashcard> => {
  try {
    const response = await api.post('/flashcards/', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al crear flashcard');
  }
};

export const apiUpdateFlashcard = async (id: number, data: Partial<FlashcardCreateData>): Promise<Flashcard> => {
  try {
    const response = await api.patch(`/flashcards/${id}/`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al actualizar flashcard');
  }
};

export const apiDeleteFlashcard = async (id: number): Promise<void> => {
  try {
    await api.delete(`/flashcards/${id}/`);
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al eliminar flashcard');
  }
};

export const apiReviewFlashcard = async (flashcardId: number, isCorrect: boolean): Promise<Flashcard> => {
  try {
    const response = await api.post('/flashcards/review/', {
      flashcard_id: flashcardId,
      is_correct: isCorrect,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al registrar revisión');
  }
};

export const apiBulkCreateFlashcards = async (flashcards: FlashcardCreateData[]): Promise<{
  created: number;
  errors: string[];
  flashcards: Flashcard[];
}> => {
  try {
    const response = await api.post('/flashcards/bulk-create/', { flashcards });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al crear flashcards');
  }
};

export const apiGetFlashcardDecks = async (): Promise<{ deck_name: string; count: number }[]> => {
  try {
    const response = await api.get('/flashcards/decks/');
    return response.data;
  } catch (error: any) {
    console.error('Error getting decks:', error);
    return [];
  }
};

// ==================== STREAK & CHALLENGES API ====================

export const apiGetStreak = async (): Promise<UserStreak> => {
  try {
    const response = await api.get('/streak/');
    return response.data;
  } catch (error: any) {
    console.error('Error getting streak:', error);
    return {
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      freeze_count: 0,
      total_days_studied: 0,
    };
  }
};

export const apiGetDailyChallenges = async (): Promise<UserChallengeProgress[]> => {
  try {
    const response = await api.get('/challenges/daily/');
    return response.data;
  } catch (error: any) {
    console.error('Error getting challenges:', error);
    return [];
  }
};

export const apiUpdateChallengeProgress = async (
  challengeType: string,
  increment: number = 1
): Promise<{ progress: UserChallengeProgress; completed: boolean }> => {
  try {
    const response = await api.post('/challenges/update/', {
      challenge_type: challengeType,
      increment,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error updating challenge:', error);
    throw error;
  }
};

// ==================== STATS API ====================

export const apiGetActivityHeatmap = async (): Promise<ActivityLog[]> => {
  try {
    const response = await api.get('/stats/heatmap/');
    return response.data;
  } catch (error: any) {
    console.error('Error getting heatmap:', error);
    return [];
  }
};

export const apiGetStudyStats = async (): Promise<StudyStats> => {
  try {
    const response = await api.get('/stats/study/');
    return response.data;
  } catch (error: any) {
    console.error('Error getting study stats:', error);
    return {
      total_time_minutes: 0,
      total_time_hours: 0,
      week: { lessons: 0, flashcards: 0, messages: 0, time: 0, xp: 0 },
      month: { lessons: 0, flashcards: 0, messages: 0, time: 0, xp: 0 },
      best_study_hour: null,
      total_sessions: 0,
    };
  }
};

// ==================== STUDY SESSION API ====================

export const apiStartStudySession = async (
  activityType: string,
  lessonId?: string
): Promise<StudySession> => {
  try {
    const response = await api.post('/study/start/', {
      activity_type: activityType,
      lesson_id: lessonId,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error starting session:', error);
    throw error;
  }
};

export const apiEndStudySession = async (sessionId: number): Promise<StudySession> => {
  try {
    const response = await api.post('/study/end/', {
      session_id: sessionId,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error ending session:', error);
    throw error;
  }
};

// ==================== CHATBOT MEJORADO API ====================

export const apiGetConversationModes = async (): Promise<ConversationMode[]> => {
  try {
    const response = await api.get('/chatbot/modes/');
    return response.data;
  } catch (error: any) {
    console.error('Error getting conversation modes:', error);
    return [];
  }
};

export const apiSendChatMessage = async (data: {
  message: string;
  mode_id?: number;
  session_id?: number;
  difficulty_level?: string;
}): Promise<ChatMessage & { session_id: number; has_corrections: boolean }> => {
  try {
    const response = await api.post('/chatbot/', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Error al enviar mensaje');
  }
};

export const apiGetChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await api.get('/chatbot/sessions/');
    return response.data;
  } catch (error: any) {
    console.error('Error getting chat sessions:', error);
    return [];
  }
};

export const apiGetChatSession = async (sessionId: number): Promise<ChatSession> => {
  try {
    const response = await api.get(`/chatbot/sessions/${sessionId}/`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Error al obtener sesión');
  }
};

export const apiEndChatSession = async (sessionId: number): Promise<{
  session: ChatSession;
  analysis: SessionAnalysis;
}> => {
  try {
    const response = await api.post('/chatbot/sessions/end/', {
      session_id: sessionId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Error al finalizar sesión');
  }
};

export const apiGetConversationStats = async (): Promise<UserConversationLevel> => {
  try {
    const response = await api.get('/chatbot/stats/');
    return response.data;
  } catch (error: any) {
    console.error('Error getting conversation stats:', error);
    return {
      current_level: 'A1',
      level_name: 'Principiante',
      total_sessions: 0,
      total_messages: 0,
      total_time_minutes: 0,
      vocabulary_size: 0,
      grammar_score: 0,
      vocabulary_score: 0,
      fluency_score: 0,
      comprehension_score: 0,
      overall_score: 0,
    };
  }
};