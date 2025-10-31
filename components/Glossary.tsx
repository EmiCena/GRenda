import React, { useState, useCallback, useMemo } from 'react';
import { translateToGuarani, translateBulkToGuarani } from '../services/geminiService';
import { useAppContext } from '../contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Flashcards } from './Flashcards';
import { VocabularyItem } from '../types';

export const Glossary: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [practiceDeck, setPracticeDeck] = useState<VocabularyItem[] | null>(null);
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

  const handleImportAndTranslate = useCallback(async () => {
    const words = importText.split('\n').map(w => w.trim()).filter(Boolean);
    if (words.length === 0) {
      setError('Por favor, ingresa al menos una palabra para importar.');
      return;
    }

    setIsImporting(true);
    setError('');
    try {
      const translations = await translateBulkToGuarani(words);
      const newItems: VocabularyItem[] = translations.map(t => ({
        word: t.spanish,
        translation: t.guarani,
        example: ''
      }));
      setPracticeDeck(newItems);
    } catch (err) {
      setError('Ocurrió un error al crear las tarjetas.');
    } finally {
      setIsImporting(false);
      setImportText('');
    }
  }, [importText]);

  if (practiceDeck) {
    return <Flashcards items={practiceDeck} onExit={() => setPracticeDeck(null)} />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Glosario y Práctica</CardTitle>
          <CardDescription>
            Usa el traductor, crea tarjetas de memoria con IA, o practica el vocabulario de las lecciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
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
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Traduciendo...
                    </>
                  ) : (
                    'Traducir'
                  )}
                </Button>
              </div>

              {error && <p className="text-destructive mt-4">{error}</p>}
              
              {(translation || isLoading) && (
                  <div className="mt-6 p-6 bg-secondary/50 border-l-4 border-primary rounded-r-lg">
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Traducción a Guaraní</h2>
                      {isLoading ? (
                          <div className="h-8 bg-muted rounded-md animate-pulse mt-2"></div>
                      ) : (
                          <p className="text-3xl font-bold text-primary mt-1">{translation}</p>
                      )}
                  </div>
              )}
            </div>
            
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-2">Crear Tarjetas con IA</h3>
              <p className="text-muted-foreground mb-4">
                Escribe una lista de palabras en Español (una por línea). La IA las traducirá a Guaraní y creará tarjetas de memoria para que practiques.
              </p>
              <Input
                as="textarea"
                rows={5}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={"Agua\nSol\nLuna"}
                className="w-full text-sm"
                disabled={isImporting}
              />
              <Button
                onClick={handleImportAndTranslate}
                disabled={!importText.trim() || isImporting}
                className="w-full sm:w-auto mt-2"
              >
                {isImporting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando Tarjetas...
                  </>
                ) : (
                  'Crear y Practicar'
                )}
              </Button>
            </div>

            <div className="border-t border-border pt-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Práctica de Vocabulario</h3>
                <p className="text-muted-foreground mb-4">
                    Memoriza las palabras de todas las lecciones.
                </p>
                <Button 
                    onClick={() => setPracticeDeck(allVocabulary)}
                    disabled={allVocabulary.length === 0}
                    size="lg"
                >
                    Practicar con Tarjetas ({allVocabulary.length} palabras)
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};