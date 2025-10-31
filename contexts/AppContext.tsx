import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Progress, Role, Theme, Lesson, LoginCredentials } from '../types';
import { 
    apiGetCurrentUser, 
    apiLogin, 
    apiLogout, 
    apiGetAllLessons, 
    apiAddLesson, 
    apiUpdateLesson, 
    apiDeleteLesson, 
    apiGetAllProgress, 
    apiUpdateProgress,
    apiUpdateUserRole
} from '../services/api';

interface AppContextType {
  user: User | null;
  login: (credentials: string | LoginCredentials) => Promise<void>;
  logout: () => void;
  progress: Progress;
  updateProgress: (lessonId: string, score: number) => void;
  theme: Theme;
  toggleTheme: (isDark: boolean) => void;
  toggleRole: (isAdmin: boolean) => void;
  lessons: Lesson[];
  addLesson: (lesson: Lesson) => void;
  updateLesson: (lesson: Lesson) => void;
  deleteLesson: (lessonId: string) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedPrefs = window.localStorage.getItem('color-theme');
        if (typeof storedPrefs === 'string') {
            return storedPrefs as Theme;
        }

        const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
        if (userMedia.matches) {
            return 'dark';
        }
    }
    return 'light';
  });

  useEffect(() => {
    const loadData = async () => {
        try {
            const sessionUser = await apiGetCurrentUser();
            if (sessionUser) {
                setUser(sessionUser);
                const [dbLessons, dbProgress] = await Promise.all([
                    apiGetAllLessons(),
                    apiGetAllProgress(),
                ]);
                setLessons(dbLessons);
                setProgress(dbProgress);
            }
        } catch (error) {
            console.error("Failed to load initial data", error);
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            sessionStorage.removeItem('currentUser');
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    localStorage.setItem('color-theme', theme);
  }, [theme]);

  const login = useCallback(async (credentials: string | LoginCredentials) => {
    setIsLoading(true);
    try {
        const newUser = await apiLogin(credentials);
        setUser(newUser);
        const [dbLessons, dbProgress] = await Promise.all([
            apiGetAllLessons(),
            apiGetAllProgress(),
        ]);
        setLessons(dbLessons);
        setProgress(dbProgress);
    } catch (error: any) {
        console.error("Login failed:", error);
        throw error;
    } finally {
        setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setLessons([]);
    setProgress({});
  }, []);

  const updateProgress = useCallback(async (lessonId: string, score: number) => {
    const progressData = {
        score,
        completed: score >= 80,
    };
    setProgress(prev => ({ ...prev, [lessonId]: progressData }));
    try {
        await apiUpdateProgress(lessonId, progressData);
    } catch (error) {
        console.error("Failed to update progress on server", error);
    }
  }, []);

  const toggleTheme = useCallback((isDark: boolean) => {
    setTheme(isDark ? 'dark' : 'light');
  }, []);
  
  const toggleRole = useCallback(async (isAdmin: boolean) => {
    if (!user) return;
    const newRole: Role = isAdmin ? 'admin' : 'user';
    try {
        const updatedUser = await apiUpdateUserRole(user, newRole);
        setUser(updatedUser);
    } catch (error) {
        console.error("Failed to update role", error);
    }
  }, [user]);

  const addLesson = useCallback(async (lesson: Lesson) => {
    try {
        await apiAddLesson(lesson);
        const updatedLessons = await apiGetAllLessons();
        setLessons(updatedLessons);
    } catch (error) {
        console.error("Failed to add lesson", error);
    }
  }, []);

  const updateLesson = useCallback(async (updatedLesson: Lesson) => {
    try {
        await apiUpdateLesson(updatedLesson);
        const updatedLessons = await apiGetAllLessons();
        setLessons(updatedLessons);
    } catch (error) {
        console.error("Failed to update lesson", error);
    }
  }, []);

  const deleteLesson = useCallback(async (lessonId: string) => {
    try {
        await apiDeleteLesson(lessonId);
        const updatedLessons = await apiGetAllLessons();
        setLessons(updatedLessons);
    } catch (error) {
        console.error("Failed to delete lesson", error);
    }
  }, []);

  return (
    <AppContext.Provider value={{ 
      user, 
      login, 
      logout, 
      progress, 
      updateProgress, 
      theme, 
      toggleTheme, 
      toggleRole,
      lessons,
      addLesson,
      updateLesson,
      deleteLesson,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};