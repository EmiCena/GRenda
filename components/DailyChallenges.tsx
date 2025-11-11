// src/components/DailyChallenges.tsx (CREAR)

import React, { useEffect, useState } from 'react';
import { apiGetDailyChallenges } from '../services/api';
import { UserChallengeProgress } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

export const DailyChallenges: React.FC = () => {
  const [challenges, setChallenges] = useState<UserChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
    
    // Recargar cada 30 segundos para actualizar progreso
    const interval = setInterval(loadChallenges, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadChallenges = async () => {
    const data = await apiGetDailyChallenges();
    setChallenges(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 animate-pulse">
          <div className="space-y-3">
            <div className="h-12 bg-secondary rounded"></div>
            <div className="h-12 bg-secondary rounded"></div>
            <div className="h-12 bg-secondary rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = challenges.filter(c => c.completed).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-3xl">🎯</span>
            Desafíos Diarios
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{challenges.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {challenges.map((progress) => (
            <div
              key={progress.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                progress.completed
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-500'
                  : 'bg-secondary border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {progress.completed ? (
                    <span className="text-2xl">✅</span>
                  ) : (
                    <span className="text-2xl">⏳</span>
                  )}
                  <span className="font-medium text-foreground">
                    {progress.challenge.description}
                  </span>
                </div>
                {progress.completed && (
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    +{progress.challenge.xp_reward} XP
                  </span>
                )}
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    progress.completed ? 'bg-green-500' : 'bg-primary'
                  }`}
                  style={{ width: `${progress.progress_percentage}%` }}
                />
              </div>

              <div className="mt-1 text-xs text-muted-foreground">
                {progress.current_value} / {progress.challenge.target_value}
              </div>
            </div>
          ))}
        </div>

        {completedCount === challenges.length && challenges.length > 0 && (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-950/20 border border-green-300 dark:border-green-800 rounded-lg text-center">
            <p className="text-sm text-green-900 dark:text-green-100 font-bold">
              🎉 ¡Completaste todos los desafíos de hoy!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};