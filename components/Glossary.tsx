// src/components/Glossary.tsx (REEMPLAZAR COMPLETO)

import React, { useState, useCallback, useMemo } from 'react';
import { translateToGuarani, translateBulkToGuarani } from '../services/geminiService';
import { apiBulkCreateFlashcards } from '../services/api';
import { useAppContext } from '../contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Flashcards } from './Flashcards';
import { FlashcardManager } from './FlashcardManager';
import { VocabularyItem, Flashcard } from '../types';

type ViewMode = 'translator' | 'my-flashcards' | 'practice-lessons' | 'practicing';

export const Glossary: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('translator');
  const [inputText, setInputText] = useState('');
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [practiceDeck, setPracticeDeck] = useState<Flashcard[] | VocabularyItem[] | null>(null);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  const { lessons } = useAppContext();

  const allVocabulary = useMemo(() => {
    return lessons.flatMap(lesson => lesson.vocabulary || []).filter(
      (item, index, self) => index === self.findIndex((t) => (t.word === item.word))
    );
  }, [lessons]);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) {
      setError('Por favor, ingresa texto para traducir.');
      return;
    }
    setIsLoading(true);
    setError('');
    setTranslation('');
    try {
      const result = await translateToGuarani(inputText);
      setTranslation(result);
    } catch (err) {
      setError('Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  }, [inputText]);

  const handleImportAndCreateFlashcards = useCallback(async () => {
    const words = importText.split('\n').map(w => w.trim()).filter(Boolean);
    if (words.length === 0) {
      setError('Por favor, ingresa al menos una palabra para importar.');
      return;
    }

    setIsImporting(true);
    setError('');
    try {
      const translations = await translateBulkToGuarani(words);
      
      // Crear flashcards en el backend
      const flashcardsData = translations.map(t => ({
        spanish_word: t.spanish,
        guarani_word: t.guarani,
        deck_name: 'Importadas con IA'
      }));

      const result = await apiBulkCreateFlashcards(flashcardsData);
      
      if (result.errors.length > 0) {
        alert(`Creadas ${result.created} flashcards. Errores: ${result.errors.join(', ')}`);
      } else {
        alert(`¡${result.created} flashcards creadas exitosamente!`);
      }
      
      setImportText('');
      setViewMode('my-flashcards');
    } catch (err) {
      setError('Ocurrió un error al crear las tarjetas.');
    } finally {
      setIsImporting(false);
    }
  }, [importText]);

  const handlePracticeFlashcards = (flashcards: Flashcard[]) => {
    setPracticeDeck(flashcards);
    setViewMode('practicing');
  };

  const handlePracticeLessons = () => {
    setPracticeDeck(allVocabulary);
    setViewMode('practicing');
  };

  const handleExitPractice = () => {
    setPracticeDeck(null);
    setViewMode('translator');
  };

  // Convertir VocabularyItem a Flashcard para práctica
  const practiceCards: Flashcard[] | null = practiceDeck ? practiceDeck.map((item, index) => {
    if ('id' in item) {
      return item as Flashcard;
    } else {
      const vocabItem = item as VocabularyItem;
      return {
        id: 0, // Temporal, no se guarda
        spanish_word: vocabItem.translation,
        guarani_word: vocabItem.word,
        example: vocabItem.example,
        notes: '',
        deck_name: 'Lecciones',
        is_favorite: false,
        times_reviewed: 0,
        times_correct: 0,
        accuracy: 0,
        last_reviewed: null,
        created_at: '',
        updated_at: '',
      };
    }
  }) : null;

  if (viewMode === 'practicing' && practiceCards) {
    return <Flashcards items={practiceCards} onExit={handleExitPractice} />;
  }

  if (viewMode === 'my-flashcards') {
    return (
      <>
        <div className="container mx-auto p-4 mb-4">
          <Button variant="outline" onClick={() => setViewMode('translator')}>
            ← Volver al Glosario
          </Button>
        </div>
        <FlashcardManager onPractice={handlePracticeFlashcards} />
      </>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Glosario y Práctica</CardTitle>
          <CardDescription>
            Traduce, crea flashcards con IA, o practica vocabulario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Navegación de pestañas */}
            <div className="flex gap-2 border-b border-border pb-2">
              <button
                onClick={() => setViewMode('translator')}
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  viewMode === 'translator'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary'
                }`}
              >
                Traductor
              </button>
              <button
                onClick={() => setViewMode('my-flashcards')}
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  viewMode === 'my-flashcards'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary'
                }`}
              >
                Mis Flashcards
              </button>
              <button
                onClick={() => setViewMode('practice-lessons')}
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  viewMode === 'practice-lessons'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary'
                }`}
              >
                Lecciones
              </button>
            </div>

            {viewMode === 'translator' && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Traductor Español - Guaraní</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
                      placeholder="Ej: Corazón, Amigo, Agua"
                      className="flex-grow"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleTranslate}
                      disabled={isLoading}
                      className="w-full sm:w-auto"
                    >
                      {isLoading ? 'Traduciendo...' : 'Traducir'}
                    </Button>
                  </div>

                  {error && <p className="text-destructive mt-4">{error}</p>}
                  
                  {(translation || isLoading) && (
                    <div className="mt-6 p-6 bg-secondary/50 border-l-4 border-primary rounded-r-lg">
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Traducción a Guaraní
                      </h2>
                      {isLoading ? (
                        <div className="h-8 bg-muted rounded-md animate-pulse mt-2"></div>
                      ) : (
                        <p className="text-3xl font-bold text-primary mt-1">{translation}</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold mb-2">Crear Flashcards con IA</h3>
                  <p className="text-muted-foreground mb-4">
                    Escribe palabras en Español (una por línea). La IA las traducirá y guardará como flashcards.
                  </p>
                  <Input
                    as="textarea"
                    rows={5}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={"Agua\nSol\nLuna\nEstrellas"}
                    className="w-full text-sm"
                    disabled={isImporting}
                  />
                  <Button
                    onClick={handleImportAndCreateFlashcards}
                    disabled={!importText.trim() || isImporting}
                    className="w-full sm:w-auto mt-2"
                  >
                    {isImporting ? 'Creando...' : 'Crear y Guardar Flashcards'}
                  </Button>
                </div>
              </>
            )}

            {viewMode === 'practice-lessons' && (
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Vocabulario de Lecciones</h3>
                <p className="text-muted-foreground mb-4">
                  Practica todas las palabras aprendidas en tus lecciones.
                </p>
                <Button 
                  onClick={handlePracticeLessons}
                  disabled={allVocabulary.length === 0}
                  size="lg"
                >
                  Practicar ({allVocabulary.length} palabras)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};