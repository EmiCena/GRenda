import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface BarChartData {
    label: string;
    value: number;
}

interface BarChartProps {
    data: BarChartData[];
    title: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
    const maxValue = 100;
    const chartHeight = 200;
    const barWidth = 40;
    const barMargin = 20;
    const chartWidth = data.length * (barWidth + barMargin);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-xl text-primary/90">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[200px]">
                        <p className="text-muted-foreground text-center py-10">Completa algunas lecciones para ver tus puntajes aquí.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto pb-4">
                        <svg width={chartWidth} height={chartHeight + 60}>
                            {data.map((item, index) => {
                                const barHeight = item.value > 0 ? (item.value / maxValue) * chartHeight : 0;
                                const x = index * (barWidth + barMargin);
                                const y = chartHeight - barHeight;
                                return (
                                    <g key={index} className="group">
                                        <title>{`${item.label}: ${item.value}%`}</title>
                                        <rect
                                            x={x}
                                            y={y}
                                            width={barWidth}
                                            height={barHeight}
                                            className="fill-primary/50 group-hover:fill-primary/70 transition-colors"
                                            rx="4"
                                        />
                                        <text
                                            x={x + barWidth / 2}
                                            y={y - 8}
                                            textAnchor="middle"
                                            className="text-xs font-bold fill-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {item.value}%
                                        </text>
                                        <foreignObject x={x - barMargin/2} y={chartHeight + 10} width={barWidth + barMargin} height={50}>
                                            <p className="text-xs text-center text-muted-foreground leading-tight break-words">
                                                {item.label}
                                            </p>
                                        </foreignObject>
                                    </g>
                                );
                            })}
                            {/* Y-axis line */}
                            <line x1="0" y1="0" x2="0" y2={chartHeight} stroke="currentColor" className="text-border" strokeWidth="1" />
                        </svg>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};