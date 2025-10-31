import React, { useState, useEffect, useMemo } from 'react';
import { VocabularyItem } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { ChevronLeft, CheckCircle, XCircle } from './ui/icons';

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

interface FlashcardsProps {
  items: VocabularyItem[];
  onExit: () => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({ items, onExit }) => {
  const [deck, setDeck] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    setDeck(shuffleArray(items));
  }, [items]);

  const handleAnswer = (wasCorrect: boolean) => {
    if (wasCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }
    
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setDeck(shuffleArray(items));
    setCurrentIndex(0);
    setIsFlipped(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIsFinished(false);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto text-center p-8">
          <CardTitle>Sin vocabulario</CardTitle>
          <p className="text-muted-foreground mt-4">No hay palabras en las lecciones para practicar todavía.</p>
          <Button onClick={onExit} className="mt-6">Volver al Glosario</Button>
        </Card>
      </div>
    );
  }

  if (isFinished) {
    const total = correctCount + incorrectCount;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto text-center p-8">
          <CardTitle className="text-2xl text-primary">¡Práctica Completada!</CardTitle>
          <div className="my-6 text-5xl font-bold">{percentage}%</div>
          <div className="flex justify-around">
            <div className="text-green-500">
              <p className="text-2xl font-semibold">{correctCount}</p>
              <p>Correctas</p>
            </div>
            <div className="text-destructive">
              <p className="text-2xl font-semibold">{incorrectCount}</p>
              <p>Incorrectas</p>
            </div>
          </div>
          <div className="flex gap-4 mt-8 justify-center">
            <Button onClick={handleRestart}>Practicar de Nuevo</Button>
            <Button onClick={onExit} variant="outline">Volver al Glosario</Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentItem = deck[currentIndex];

  if (!currentItem) {
    return null; // or a loading state
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
            <Button onClick={onExit} variant="ghost"><ChevronLeft className="mr-2 h-4 w-4"/> Salir</Button>
            <span className="text-sm text-muted-foreground">{currentIndex + 1} / {deck.length}</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2.5 mb-6">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${((currentIndex) / deck.length) * 100}%`, transition: 'width 0.3s' }}></div>
        </div>

        <div className="[perspective:1000px] h-64">
            <div 
                className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
            >
                {/* Front */}
                <div className="absolute w-full h-full [backface-visibility:hidden] rounded-lg border bg-card text-card-foreground shadow-sm flex items-center justify-center p-6">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Español</p>
                        <h2 className="text-4xl font-bold">{currentItem.word}</h2>
                    </div>
                </div>
                {/* Back */}
                <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-lg border bg-card text-card-foreground shadow-sm flex items-center justify-center p-6">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Guaraní</p>
                        <h2 className="text-4xl font-bold text-primary">{currentItem.translation}</h2>
                        <p className="text-muted-foreground mt-4 italic">"{currentItem.example}"</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-8 flex justify-center">
            {isFlipped ? (
                <div className="flex gap-4">
                    <Button onClick={() => handleAnswer(false)} variant="destructive" size="lg" className="w-36">
                        <XCircle className="mr-2 h-5 w-5" /> Incorrecto
                    </Button>
                    <Button onClick={() => handleAnswer(true)} size="lg" className="w-36 bg-green-600 hover:bg-green-700">
                        <CheckCircle className="mr-2 h-5 w-5" /> Correcto
                    </Button>
                </div>
            ) : (
                <Button onClick={() => setIsFlipped(true)} size="lg" className="w-48">
                    Mostrar Traducción
                </Button>
            )}
        </div>
      </div>
    </div>
  );
};