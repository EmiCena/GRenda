import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { BarChart } from './charts/BarChart';
import { DonutChart } from './charts/DonutChart';
import { LineChart } from './charts/LineChart';
import { ProgressChart } from './charts/ProgressChart';
import { StatsCard } from './charts/StatsCard';
import { MascotWidget } from './mascot/MascotWidget';
import { AchievementsList } from './mascot/AchievementsList';
import { View, Progress } from '../types';

interface DashboardProps {
  setView: (view: View) => void;
}

// Tipo auxiliar para las entradas de progreso
type ProgressEntry = Progress[string];

export const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { lessons, progress, user } = useAppContext();

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
  const streak = user?.streak_days || 0;

  // Datos para gráficos
  const lessonsProgress = lessons.slice(0, 5).map(lesson => ({
    label: lesson.title.split(' ')[0],
    value: progress[lesson.id]?.score || 0,
    max: 100,
  }));

  const weeklyProgress = [
    { label: 'Lun', value: 75 },
    { label: 'Mar', value: 85 },
    { label: 'Mié', value: 70 },
    { label: 'Jue', value: 90 },
    { label: 'Vie', value: 80 },
    { label: 'Sáb', value: 95 },
    { label: 'Dom', value: 88 },
  ];

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Lecciones Completadas"
            value={`${completedLessons}/${totalLessons}`}
            icon="📚"
            color="bg-blue-500"
            trend={{ value: 12, isPositive: true }}
          />
          
          <StatsCard
            title="Promedio de Puntaje"
            value={`${averageScore}%`}
            icon="⭐"
            color="bg-yellow-500"
            trend={{ value: 5, isPositive: true }}
          />
          
          <StatsCard
            title="Experiencia Total"
            value={totalXP}
            icon="🎯"
            color="bg-purple-500"
            trend={{ value: 8, isPositive: true }}
          />
          
          <StatsCard
            title="Racha de Días"
            value={`${streak} días`}
            icon="🔥"
            color="bg-orange-500"
          />
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
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <BarChart
                data={lessonsProgress}
                title="Últimas Lecciones"
                height={220}
                color="bg-gradient-to-r from-blue-500 to-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Progreso Semanal + Mini Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de línea semanal */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <LineChart
              data={weeklyProgress}
              title="Progreso Semanal"
              height={220}
              color="#10b981"
            />
          </div>

          {/* Progress bars */}
          <div className="space-y-4">
            <ProgressChart
              title="Vocabulario Aprendido"
              current={45}
              total={100}
              color="bg-green-500"
              icon="📖"
            />
            <ProgressChart
              title="Ejercicios Completados"
              current={28}
              total={50}
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