import React from 'react';

interface BarChartProps {
  data: { label: string; value: number; max?: number }[];
  title?: string;
  height?: number;
  color?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  title, 
  height = 200,
  color = 'bg-primary' 
}) => {
  const maxValue = Math.max(...data.map(d => d.max || d.value));

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      )}
      <div className="space-y-3" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const maxPercentage = item.max ? (item.max / maxValue) * 100 : 100;
          
          return (
            <div key={index} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-muted-foreground truncate">
                {item.label}
              </div>
              <div className="flex-1 relative">
                {/* Barra de fondo (máximo) */}
                {item.max && (
                  <div 
                    className="absolute h-8 bg-secondary rounded-md transition-all duration-300"
                    style={{ width: `${maxPercentage}%` }}
                  />
                )}
                {/* Barra de valor */}
                <div 
                  className={`relative h-8 ${color} rounded-md transition-all duration-500 ease-out flex items-center justify-end px-3 shadow-sm`}
                  style={{ width: `${percentage}%` }}
                >
                  <span className="text-xs font-bold text-white">
                    {item.value}{item.max ? `/${item.max}` : ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};