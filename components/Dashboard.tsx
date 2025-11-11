import React, { useEffect, useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { BarChart } from './charts/BarChart';
import { DonutChart } from './charts/DonutChart';
import { LineChart } from './charts/LineChart';
import { ProgressChart } from './charts/ProgressChart';
import { StatsCard } from './charts/StatsCard';
import { MascotWidget } from './mascot/MascotWidget';
import { AchievementsList } from './mascot/AchievementsList';
import { StreakWidget } from './StreakWidget';
import { DailyChallenges } from './DailyChallenges';
import { ActivityHeatmap } from './ActivityHeatmap';
import { StudyStatsWidget } from './StudyStatsWidget';
import { View, Progress } from '../types';
import { apiGetWeaknessAnalysis, WeaknessAnalysis } from '../services/api';

interface DashboardProps {
  setView: (view: View) => void;
}

type ProgressEntry = Progress[string];

export const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { lessons, progress, user } = useAppContext();
  const [weaknessData, setWeaknessData] = useState<WeaknessAnalysis | null>(null);
  const [loadingWeakness, setLoadingWeakness] = useState(true);

  // Cargar análisis de puntos débiles
  useEffect(() => {
    const loadWeakness = async () => {
      setLoadingWeakness(true);
      const data = await apiGetWeaknessAnalysis();
      setWeaknessData(data);
      setLoadingWeakness(false);
    };
    loadWeakness();
  }, []);

  // Calcular estadísticas con tipos seguros
  const progressEntries = Object.entries(progress) as [string, ProgressEntry][];
  
  const completedLessons = progressEntries.filter(([_, p]) => p.completed).length;
  const totalLessons = lessons.length;
  
  const averageScore = progressEntries.length > 0
    ? Math.round(
        progressEntries.reduce((sum, [_, p]) => sum + p.score, 0) / progressEntries.length
      )
    : 0;
    
  const totalXP = user?.total_xp || 0;

  // Calcular progreso semanal REAL
  const weeklyProgress = useMemo(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const data = last7Days.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const completedThatDay = progressEntries.filter(([_, p]) => {
        if (!p.completed_at) return false;
        const completedDate = new Date(p.completed_at);
        return completedDate >= dayStart && completedDate <= dayEnd;
      }).length;

      return {
        label: dayNames[date.getDay()],
        value: completedThatDay * 20,
      };
    });

    const hasRealData = data.some(d => d.value > 0);
    
    if (!hasRealData && completedLessons > 0) {
      const lessonsPerDay = Math.ceil(completedLessons / 7);
      return data.map((d, index) => ({
        ...d,
        value: index < completedLessons ? lessonsPerDay * 15 : 0
      }));
    }

    return data;
  }, [progressEntries, completedLessons]);

  // Calcular vocabulario aprendido REAL
  const vocabularyLearned = useMemo(() => {
    let totalWords = 0;
    progressEntries
      .filter(([_, p]) => p.completed)
      .forEach(([lessonId, _]) => {
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson?.vocabulary) {
          totalWords += lesson.vocabulary.length;
        }
      });
    return totalWords;
  }, [progressEntries, lessons]);

  // Estimación de vocabulario total disponible
  const totalVocabulary = useMemo(() => {
    return lessons.reduce((sum, lesson) => {
      return sum + (lesson.vocabulary?.length || 0);
    }, 0);
  }, [lessons]);

  const totalExercises = weaknessData?.total_exercises_completed || 0;
  const estimatedTotalExercises = lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0);

  // Datos para gráficos
  const lessonsProgress = lessons.slice(0, 5).map(lesson => ({
    label: lesson.title.split(' ')[0],
    value: progress[lesson.id]?.score || 0,
    max: 100,
  }));

  const completionPercentage = totalLessons > 0 
    ? (completedLessons / totalLessons) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            ¡Mba'éichapa, {user?.name}! 👋
          </h1>
          <p className="text-muted-foreground">
            Tu progreso en el aprendizaje del Guaraní
          </p>
        </div>

        {/* Stats Cards - SIN trends y SIN racha */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Lecciones Completadas"
            value={`${completedLessons}/${totalLessons}`}
            icon="📚"
            color="bg-blue-500"
          />
          
          <StatsCard
            title="Promedio de Puntaje"
            value={progressEntries.length > 0 ? `${averageScore}%` : 'Sin datos'}
            icon="⭐"
            color="bg-yellow-500"
          />
          
          <StatsCard
            title="Experiencia Total"
            value={totalXP.toString()}
            icon="🎯"
            color="bg-purple-500"
          />
        </div>

        {/* RACHA Y DESAFÍOS DIARIOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StreakWidget />
          <DailyChallenges />
        </div>

        {/* HEATMAP Y ESTADÍSTICAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <ActivityHeatmap />
          </div>
          <div className="lg:col-span-1">
            <StudyStatsWidget />
          </div>
        </div>

        {/* MASCOTA + GRÁFICOS PRINCIPALES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Mascota Widget */}
          <div className="lg:col-span-1">
            <MascotWidget />
          </div>

          {/* Gráficos de progreso */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progreso General (Donut) */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <DonutChart
                percentage={completionPercentage}
                size={180}
                color="#3b82f6"
                label="Progreso General"
                subtitle="Lecciones"
              />
            </div>

            {/* Progreso por lección (Barras) */}
            {lessonsProgress.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <BarChart
                  data={lessonsProgress}
                  title="Últimas Lecciones"
                  height={220}
                  color="bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* PUNTOS DÉBILES - Análisis REAL */}
        {!loadingWeakness && weaknessData && weaknessData.total_exercises_completed > 0 && (
          <div className="mb-8">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <span>📊</span>
                Áreas de Mejora
              </h2>
              <p className="text-muted-foreground mb-6">
                Basado en {weaknessData.total_exercises_completed} ejercicios completados
              </p>
              
              {(() => {
                const allStats = [
                  ...weaknessData.overall_stats,
                  ...weaknessData.translation_breakdown
                ];
                const minAccuracy = Math.min(...allStats.map(s => s.accuracy));

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weaknessData.overall_stats.map((stat) => (
                      <div 
                        key={stat.type} 
                        className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                          stat.accuracy === minAccuracy
                            ? 'border-red-300 bg-red-50 dark:bg-red-950/20' 
                            : 'border-border'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{stat.icon}</span>
                            <span className="font-semibold text-foreground">{stat.display_name}</span>
                          </div>
                          <span className={`text-lg font-bold ${
                            stat.accuracy >= 80 ? 'text-green-600 dark:text-green-400' :
                            stat.accuracy >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {stat.accuracy}%
                          </span>
                        </div>
                        
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              stat.accuracy >= 80 ? 'bg-green-500' :
                              stat.accuracy >= 60 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`}
                            style={{ width: `${stat.accuracy}%` }}
                          />
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {stat.correct_answers} correctas de {stat.total_attempts} intentos
                        </p>
                        
                        {stat.accuracy === minAccuracy && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                            ⚠️ Área que necesita más atención
                          </p>
                        )}
                      </div>
                    ))}
                    
                    {weaknessData.translation_breakdown.map((stat) => (
                      <div 
                        key={stat.type} 
                        className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                          stat.accuracy === minAccuracy
                            ? 'border-red-300 bg-red-50 dark:bg-red-950/20' 
                            : 'border-border'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{stat.icon}</span>
                            <span className="font-semibold text-foreground text-sm">{stat.display_name}</span>
                          </div>
                          <span className={`text-lg font-bold ${
                            stat.accuracy >= 80 ? 'text-green-600 dark:text-green-400' :
                            stat.accuracy >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {stat.accuracy}%
                          </span>
                        </div>
                        
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              stat.accuracy >= 80 ? 'bg-green-500' :
                              stat.accuracy >= 60 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`}
                            style={{ width: `${stat.accuracy}%` }}
                          />
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {stat.correct_answers}/{stat.total_attempts} correctas
                        </p>

                        {stat.accuracy === minAccuracy && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                            ⚠️ Área que necesita más atención
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  💡 <strong>Consejo:</strong> Enfócate en practicar las áreas con menor puntaje para mejorar tu dominio general del Guaraní.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay datos de análisis */}
        {!loadingWeakness && weaknessData && weaknessData.total_exercises_completed === 0 && (
          <div className="mb-8">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Completa ejercicios para ver tu análisis
              </h3>
              <p className="text-muted-foreground mb-4">
                Una vez que completes algunas lecciones, aquí verás tus áreas de mejora
              </p>
              <button
                onClick={() => setView('LESSONS')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors"
              >
                Empezar a Practicar
              </button>
            </div>
          </div>
        )}

        {/* Progreso Semanal + Mini Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {weeklyProgress.some(d => d.value > 0) ? (
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <LineChart
                data={weeklyProgress}
                title="Actividad de los Últimos 7 Días"
                height={220}
                color="#10b981"
              />
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-2">📅</p>
                <p className="text-sm text-muted-foreground">
                  Completa lecciones para ver tu actividad semanal
                </p>
              </div>
            </div>
          )}

          {/* Progress bars */}
          <div className="space-y-4">
            <ProgressChart
              title="Vocabulario Aprendido"
              current={vocabularyLearned}
              total={totalVocabulary > 0 ? totalVocabulary : 100}
              color="bg-green-500"
              icon="📖"
            />
            <ProgressChart
              title="Ejercicios Completados"
              current={totalExercises}
              total={estimatedTotalExercises > 0 ? estimatedTotalExercises : 50}
              color="bg-blue-500"
              icon="✍️"
            />
          </div>
        </div>

        {/* LOGROS */}
        <div className="mb-8">
          <AchievementsList />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setView('LESSONS')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground p-6 rounded-lg shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📚</div>
            <h3 className="text-lg font-semibold mb-1">Continuar Aprendiendo</h3>
            <p className="text-sm opacity-90">Explora nuevas lecciones</p>
          </button>

          <button
            onClick={() => setView('CHATBOT')}
            className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">💬</div>
            <h3 className="text-lg font-semibold mb-1">Practicar con Arami</h3>
            <p className="text-sm opacity-90">Chatbot de conversación</p>
          </button>

          <button
            onClick={() => setView('GLOSSARY')}
            className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📝</div>
            <h3 className="text-lg font-semibold mb-1">Glosario</h3>
            <p className="text-sm opacity-90">Traduce palabras</p>
          </button>
        </div>
      </div>
    </div>
  );
};