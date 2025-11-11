// src/components/ActivityHeatmap.tsx (CREAR)

import React, { useEffect, useState } from 'react';
import { apiGetActivityHeatmap } from '../services/api';
import { ActivityLog } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

export const ActivityHeatmap: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeatmap();
  }, []);

  const loadHeatmap = async () => {
    const data = await apiGetActivityHeatmap();
    setLogs(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 animate-pulse">
          <div className="h-40 bg-secondary rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar por semanas (últimas 20 semanas)
  const weeks: ActivityLog[][] = [];
  let currentWeek: ActivityLog[] = [];

  // Últimos 140 días (20 semanas)
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 140);

  for (let i = 0; i < 140; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const log = logs.find(l => l.date === dateStr);

    currentWeek.push(
      log || {
        id: 0,
        user: 0,
        date: dateStr,
        lessons_completed: 0,
        flashcards_reviewed: 0,
        chatbot_messages: 0,
        time_studied_minutes: 0,
        xp_earned: 0,
      }
    );

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  const getColor = (xp: number) => {
    if (xp === 0) return 'bg-muted';
    if (xp < 50) return 'bg-green-200 dark:bg-green-900';
    if (xp < 100) return 'bg-green-400 dark:bg-green-700';
    if (xp < 200) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-800 dark:bg-green-300';
  };

  const maxXP = Math.max(...logs.map(l => l.xp_earned), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-3xl">📅</span>
          Actividad (Últimas 20 semanas)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`w-3 h-3 rounded-sm ${getColor(day.xp_earned)}`}
                    title={`${day.date}: ${day.xp_earned} XP`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Menos</span>
          <div className="w-3 h-3 bg-muted rounded-sm"></div>
          <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-400 dark:bg-green-700 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-600 dark:bg-green-500 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-800 dark:bg-green-300 rounded-sm"></div>
          <span>Más</span>
        </div>
      </CardContent>
    </Card>
  );
};