// src/components/StreakWidget.tsx (CREAR)

import React, { useEffect, useState } from 'react';
import { apiGetStreak } from '../services/api';
import { UserStreak } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

export const StreakWidget: React.FC = () => {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    const data = await apiGetStreak();
    setStreak(data);
    setLoading(false);
  };

  if (loading || !streak) {
    return (
      <Card>
        <CardContent className="p-6 animate-pulse">
          <div className="h-20 bg-secondary rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const isAtRisk = streak.last_activity_date && 
    new Date().toDateString() !== new Date(streak.last_activity_date).toDateString();

  return (
    <Card className={`${isAtRisk ? 'border-2 border-orange-500' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-3xl">🔥</span>
          Racha de Estudio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Racha actual */}
          <div className="text-center">
            <div className="text-5xl font-bold text-orange-500">
              {streak.current_streak}
            </div>
            <div className="text-sm text-muted-foreground">
              {streak.current_streak === 1 ? 'día' : 'días'} seguidos
            </div>
          </div>

          {/* Advertencia de riesgo */}
          {isAtRisk && (
            <div className="p-3 bg-orange-100 dark:bg-orange-950/20 border border-orange-300 dark:border-orange-800 rounded-lg">
              <p className="text-sm text-orange-900 dark:text-orange-100 text-center">
                ⚠️ ¡Estudia hoy para mantener tu racha!
              </p>
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {streak.longest_streak}
              </div>
              <div className="text-xs text-muted-foreground">Mejor racha</div>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {streak.total_days_studied}
              </div>
              <div className="text-xs text-muted-foreground">Total días</div>
            </div>
          </div>

          {/* Freeze disponibles */}
          {streak.freeze_count > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              ❄️ {streak.freeze_count} protección{streak.freeze_count !== 1 ? 'es' : ''} disponible{streak.freeze_count !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};