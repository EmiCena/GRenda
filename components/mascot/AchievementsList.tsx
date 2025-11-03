import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Achievement {
  id: number;
  achievement_type: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export const AchievementsList: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/achievements/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAchievements(response.data);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-20 bg-secondary rounded"></div>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">🏆</div>
        <p className="text-muted-foreground">
          Aún no tienes logros. ¡Completa lecciones para desbloquear!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">🏆 Logros Desbloqueados</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="bg-card border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="text-4xl">{achievement.icon}</div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground">{achievement.title}</h4>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Desbloqueado: {new Date(achievement.unlocked_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};