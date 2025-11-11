// src/components/chatbot/SessionAnalysis.tsx (CREAR)

import React from 'react';
import { SessionAnalysis } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';

interface SessionAnalysisProps {
  analysis: SessionAnalysis;
  onClose: () => void;
}

export const SessionAnalysisComponent: React.FC<SessionAnalysisProps> = ({
  analysis,
  onClose,
}) => {
  const performanceMessages = {
    excellent: {
      title: '¡Excelente! 🌟',
      message: 'Tu desempeño fue sobresaliente. ¡Sigue así!',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-500',
    },
    good: {
      title: '¡Muy Bien! 👏',
      message: 'Buen trabajo. Vas por buen camino.',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-500',
    },
    fair: {
      title: 'Bien 👍',
      message: 'Sigue practicando para mejorar.',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderColor: 'border-yellow-500',
    },
    needs_improvement: {
      title: 'Sigue Practicando 💪',
      message: 'La práctica hace al maestro. ¡No te rindas!',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      borderColor: 'border-orange-500',
    },
  };

  const performanceInfo = performanceMessages[analysis.performance];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-primary flex items-center gap-2">
            📊 Resumen de Conversación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Performance Badge */}
          <div
            className={`p-4 rounded-lg border-2 ${performanceInfo.bgColor} ${performanceInfo.borderColor}`}
          >
            <h3 className={`text-xl font-bold ${performanceInfo.color} mb-1`}>
              {performanceInfo.title}
            </h3>
            <p className={`text-sm ${performanceInfo.color}`}>
              {performanceInfo.message}
            </p>
          </div>

          {/* Estadísticas Generales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-3xl font-bold text-primary">
                {analysis.duration_minutes}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Minutos</div>
            </div>

            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-3xl font-bold text-primary">
                {analysis.messages_sent}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Mensajes</div>
            </div>

            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-3xl font-bold text-primary">
                {analysis.words_used}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Palabras</div>
            </div>

            <div className="text-center p-4 bg-secondary rounded-lg">
              <div className="text-3xl font-bold text-primary">
                {analysis.accuracy_rate}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Precisión</div>
            </div>
          </div>

          {/* Precisión Visual */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold">Precisión Gramatical</span>
              <span className="text-primary font-bold">{analysis.accuracy_rate}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  analysis.accuracy_rate >= 90
                    ? 'bg-green-500'
                    : analysis.accuracy_rate >= 70
                    ? 'bg-blue-500'
                    : analysis.accuracy_rate >= 50
                    ? 'bg-yellow-500'
                    : 'bg-orange-500'
                }`}
                style={{ width: `${analysis.accuracy_rate}%` }}
              />
            </div>
          </div>

          {/* Errores por tipo */}
          {Object.keys(analysis.error_breakdown).length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-foreground">
                Tipos de Errores Encontrados:
              </h4>
              <div className="space-y-2">
                {Object.entries(analysis.error_breakdown).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex justify-between items-center p-3 bg-secondary rounded-lg"
                  >
                    <span className="text-sm capitalize">
                      {type === 'verb' && '🔤 Verbos'}
                      {type === 'article' && '📰 Artículos'}
                      {type === 'preposition' && '🔗 Preposiciones'}
                      {type === 'spelling' && '✏️ Ortografía'}
                      {type === 'other' && '❓ Otros'}
                      {!['verb', 'article', 'preposition', 'spelling', 'other'].includes(type) && type}
                    </span>
                    <span className="font-bold text-primary">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Palabras más usadas */}
          {analysis.most_common_words.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-foreground">
                Palabras Más Usadas:
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.most_common_words.map((word, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Consejo */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Consejo:</strong>{' '}
              {analysis.accuracy_rate >= 90
                ? 'Estás dominando el Guaraní. Intenta modos más avanzados.'
                : analysis.accuracy_rate >= 70
                ? 'Muy buen progreso. Sigue practicando las áreas débiles.'
                : analysis.accuracy_rate >= 50
                ? 'Sigue practicando. Enfócate en los errores comunes.'
                : 'Practica con más frecuencia. Los modos básicos te ayudarán.'}
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <Button onClick={onClose} className="flex-1">
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};