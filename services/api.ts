import axios from 'axios';
import { Lesson, Progress, User, LoginCredentials } from '../types';

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

// --- User API ---

export const apiLogin = async (nameOrCredentials: string | LoginCredentials): Promise<User> => {
  try {
    let endpoint = '/auth/login/';
    let data: any;
    
    // Si es solo un string (nombre), usar quick-login
    if (typeof nameOrCredentials === 'string') {
      endpoint = '/auth/quick-login/';
      data = { name: nameOrCredentials };
    } else {
      // Si son credenciales completas, usar login normal
      endpoint = '/auth/login/';
      data = nameOrCredentials;
    }

    const response = await api.post(endpoint, data);
    const { access, refresh } = response.data;

    // Guardar tokens
    sessionStorage.setItem('access_token', access);
    sessionStorage.setItem('refresh_token', refresh);

    // Obtener datos del usuario
    const userResponse = await api.get('/auth/profile/');
    const userData = userResponse.data;
    
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
    const errorMsg = error.response?.data?.error || 
                     error.response?.data?.detail || 
                     'Error al iniciar sesión';
    throw new Error(errorMsg);
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

// --- Lessons API ---

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

// --- Progress API ---

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
): Promise<{ score: number; completed: boolean }> => {
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