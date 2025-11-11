// src/components/StudyStatsWidget.tsx (CREAR)

import React, { useEffect, useState } from 'react';
import { apiGetStudyStats } from '../services/api';
import { StudyStats } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

export const StudyStatsWidget: React.FC = () => {
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await apiGetStudyStats();
    setStats(data);
    setLoading(false);
  };

  if (loading || !stats) {
    return (
      <Card>
        <CardContent className="p-6 animate-pulse">
          <div className="h-40 bg-secondary rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-3xl">📈</span>
          Estadísticas de Estudio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tiempo total */}
          <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg">
            <div className="text-4xl font-bold">
              {stats.total_time_hours}h
            </div>
            <div className="text-sm opacity-90">Tiempo total estudiado</div>
          </div>

          {/* Esta semana */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Esta Semana
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-secondary rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {stats.week.lessons || 0}
                </div>
                <div className="text-xs text-muted-foreground">Lecciones</div>
              </div>
              <div className="text-center p-3 bg-secondary rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {stats.week.flashcards || 0}
                </div>
                <div className="text-xs text-muted-foreground">Flashcards</div>
              </div>
              <div className="text-center p-3 bg-secondary rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {stats.week.time || 0}min
                </div>
                <div className="text-xs text-muted-foreground">Tiempo</div>
              </div>
              <div className="text-center p-3 bg-secondary rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {stats.week.xp || 0}
                </div>
                <div className="text-xs text-muted-foreground">XP</div>
              </div>
            </div>
          </div>

          {/* Mejor hora */}
          {stats.best_study_hour !== null && (
            <div className="text-center text-sm text-muted-foreground">
              ⏰ Mejor hora de estudio:{' '}
              <span className="font-bold text-foreground">
                {stats.best_study_hour}:00
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};