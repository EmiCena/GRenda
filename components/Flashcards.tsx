// src/components/Flashcards.tsx (REEMPLAZAR COMPLETO)

import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';
import { apiReviewFlashcard } from '../services/api';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';

interface FlashcardsProps {
  items: Flashcard[];
  onExit: () => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({ items, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  if (items.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-muted-foreground mb-4">No hay tarjetas para practicar</p>
        <Button onClick={onExit}>Volver</Button>
      </div>
    );
  }

  const currentCard = items[currentIndex];
  const progress = ((reviewedCards.size / items.length) * 100).toFixed(0);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = async (isCorrect: boolean) => {
    // Registrar revisión en el backend si tiene ID (flashcards guardadas)
    if (currentCard.id) {
      try {
        await apiReviewFlashcard(currentCard.id, isCorrect);
      } catch (error) {
        console.error('Error registrando revisión:', error);
      }
    }

    // Actualizar estadísticas locales
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));

    setReviewedCards(prev => new Set(prev).add(currentIndex));

    // Siguiente tarjeta
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewedCards(new Set());
    setStats({ correct: 0, incorrect: 0 });
  };

  const isFinished = reviewedCards.size === items.length;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">
            Práctica de Flashcards
          </h2>
          <Button variant="outline" onClick={onExit}>
            Salir
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-3 mb-2">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {currentIndex + 1} / {items.length}
          </span>
          <span>
            ✅ {stats.correct} | ❌ {stats.incorrect}
          </span>
        </div>
      </div>

      {/* Flashcard */}
      {isFinished ? (
        <Card className="max-w-2xl mx-auto w-full">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              ¡Práctica Completada!
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.correct}
                </div>
                <div className="text-sm text-muted-foreground">Correctas</div>
              </div>
              <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.incorrect}
                </div>
                <div className="text-sm text-muted-foreground">Incorrectas</div>
              </div>
            </div>
            <div className="text-lg mb-6">
              Precisión: <span className="font-bold text-primary">
                {((stats.correct / items.length) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleRestart}>Reintentar</Button>
              <Button variant="outline" onClick={onExit}>Volver</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Card Display */}
          <div
            className="max-w-2xl mx-auto w-full flex-grow flex items-center justify-center mb-6 cursor-pointer perspective-1000"
            onClick={handleFlip}
          >
            <div
              className={`relative w-full h-96 transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front */}
              <Card
                className={`absolute inset-0 flex items-center justify-center backface-hidden ${
                  isFlipped ? 'invisible' : 'visible'
                }`}
              >
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">Español</p>
                  <h3 className="text-4xl font-bold text-foreground mb-4">
                    {currentCard.spanish_word}
                  </h3>
                  {currentCard.example && (
                    <p className="text-sm text-muted-foreground italic mt-4">
                      "{currentCard.example}"
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-8">
                    Toca para ver la respuesta
                  </p>
                </CardContent>
              </Card>

              {/* Back */}
              <Card
                className={`absolute inset-0 flex items-center justify-center backface-hidden rotate-y-180 ${
                  isFlipped ? 'visible' : 'invisible'
                }`}
              >
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">Guaraní</p>
                  <h3 className="text-4xl font-bold text-primary mb-4">
                    {currentCard.guarani_word}
                  </h3>
                  {currentCard.notes && (
                    <p className="text-sm text-muted-foreground mt-4">
                      {currentCard.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Controls */}
          <div className="max-w-2xl mx-auto w-full space-y-4">
            {/* Answer Buttons (only show when flipped) */}
            {isFlipped && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleAnswer(false)}
                  className="h-16 text-lg border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  ❌ No lo sabía
                </Button>
                <Button
                  onClick={() => handleAnswer(true)}
                  className="h-16 text-lg bg-green-500 hover:bg-green-600"
                >
                  ✅ Lo sabía
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                ← Anterior
              </Button>
              <Button
                variant="outline"
                onClick={handleFlip}
              >
                {isFlipped ? '🔄 Ocultar' : '🔄 Voltear'}
              </Button>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentIndex === items.length - 1}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        </>
      )}

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};