import React from 'react';

interface ProgressChartProps {
  title: string;
  current: number;
  total: number;
  color?: string;
  icon?: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  title,
  current,
  total,
  color = 'bg-primary',
  icon = '📚',
}) => {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-bold text-foreground">
            {current} <span className="text-lg text-muted-foreground">/ {total}</span>
          </p>
        </div>
      </div>
      
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{Math.round(percentage)}% completado</span>
        <span>{total - current} restantes</span>
      </div>
    </div>
  );
};