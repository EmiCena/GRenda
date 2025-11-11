import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  apiGetConversationModes,
  apiSendChatMessage,
  apiEndChatSession,
  apiUpdateChallengeProgress,
} from '../../services/api';
import { useAppContext } from '../../contexts/AppContext';
import { ConversationMode, ChatMessage, SessionAnalysis } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Send, Mic, StopCircle, Loader2, XCircle, Settings } from '../ui/icons';
import { ConversationModeSelector } from './ConversationModeSelector';
import { SessionAnalysisComponent } from './SessionAnalysis';

interface Message {
  text: string;
  isUser: boolean;
  corrections?: any[];
}

export const ChatbotImproved: React.FC = () => {
  const [modes, setModes] = useState<ConversationMode[]>([]);
  const [selectedMode, setSelectedMode] = useState<number | null>(null);
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [sessionAnalysis, setSessionAnalysis] = useState<SessionAnalysis | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAppContext();

  // Cargar modos disponibles
  useEffect(() => {
    loadModes();
  }, []);

  // Scroll automático
  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  const loadModes = async () => {
    const data = await apiGetConversationModes();
    setModes(data);
  };

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return;

      const userMessage: Message = { text: messageText, isUser: true };
      setMessages((prev) => [...prev, userMessage]);
      setInputText('');
      setIsLoading(true);

      try {
        const response = await apiSendChatMessage({
          message: messageText,
          mode_id: selectedMode || undefined,
          session_id: currentSessionId || undefined,
          difficulty_level: difficultyLevel,
        });

        // Guardar session ID
        if (!currentSessionId) {
          setCurrentSessionId(response.session_id);
        }

        const botMessage: Message = {
          text: response.response,
          isUser: false,
          corrections: response.has_corrections ? response.corrections : undefined,
        };
        setMessages((prev) => [...prev, botMessage]);

        // Actualizar desafío de chatbot
        try {
          await apiUpdateChallengeProgress('CHATBOT', 1);
        } catch (error) {
          console.log('Error actualizando desafío:', error);
        }
      } catch (error: any) {
        const errorMessage: Message = {
          text: 'Lo siento, tuve un problema para procesar tu mensaje.',
          isUser: false,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, selectedMode, currentSessionId, difficultyLevel]
  );

  const handleEndSession = async () => {
    if (!currentSessionId) {
      setMessages([]);
      setCurrentSessionId(null);
      setShowModeSelector(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiEndChatSession(currentSessionId);
      setSessionAnalysis(result.analysis);
    } catch (error) {
      console.error('Error al finalizar sesión:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAnalysis = () => {
    setSessionAnalysis(null);
    setMessages([]);
    setCurrentSessionId(null);
    setShowModeSelector(true);
  };

  const handleStartSession = () => {
    setShowModeSelector(false);
    setMessages([
      {
        text: `¡Mba'éichapa! Soy Arami${
          selectedMode
            ? '. Vamos a practicar en el modo seleccionado'
            : ', tu tutora de Guaraní'
        }. ¿En qué puedo ayudarte hoy? 😊`,
        isUser: false,
      },
    ]);
  };

  return (
    <div className="flex h-full flex-col container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="mx-auto w-full max-w-4xl flex-grow flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl text-primary">Chat con Arami ✨</CardTitle>
              <CardDescription>
                {showModeSelector
                  ? 'Elige un modo y nivel para comenzar'
                  : `Nivel: ${difficultyLevel === 'beginner' ? 'Principiante' : difficultyLevel === 'intermediate' ? 'Intermedio' : 'Avanzado'}`}
              </CardDescription>
            </div>
            {!showModeSelector && (
              <Button variant="outline" size="sm" onClick={handleEndSession}>
                Finalizar Sesión
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-grow flex flex-col overflow-hidden">
          {/* Selector de Modo y Nivel */}
          {showModeSelector && (
            <div className="space-y-4">
              <ConversationModeSelector
                modes={modes}
                selectedMode={selectedMode}
                onSelectMode={setSelectedMode}
              />

              {/* Selector de Nivel */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Selecciona tu nivel:
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDifficultyLevel('beginner')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      difficultyLevel === 'beginner'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-border hover:border-green-500/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">🌱</div>
                    <div className="text-xs font-medium">Principiante</div>
                  </button>

                  <button
                    onClick={() => setDifficultyLevel('intermediate')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      difficultyLevel === 'intermediate'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-border hover:border-blue-500/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">🌿</div>
                    <div className="text-xs font-medium">Intermedio</div>
                  </button>

                  <button
                    onClick={() => setDifficultyLevel('advanced')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      difficultyLevel === 'advanced'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-border hover:border-purple-500/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">🌳</div>
                    <div className="text-xs font-medium">Avanzado</div>
                  </button>
                </div>
              </div>

              <Button onClick={handleStartSession} className="w-full" size="lg">
                Comenzar Conversación
              </Button>
            </div>
          )}

          {/* Chat Messages */}
          {!showModeSelector && (
            <>
              <div
                ref={chatContainerRef}
                className="flex-grow space-y-4 overflow-y-auto p-4 mb-4"
              >
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`flex items-end gap-2 ${
                        msg.isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {!msg.isUser && (
                        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          A
                        </div>
                      )}
                      <div
                        className={`max-w-xs rounded-2xl px-4 py-2 md:max-w-md ${
                          msg.isUser
                            ? 'rounded-br-none bg-primary text-primary-foreground'
                            : 'rounded-bl-none bg-secondary text-secondary-foreground'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      {msg.isUser && (
                        <img
                          src={user?.avatarUrl}
                          alt="User"
                          className="h-8 w-8 flex-shrink-0 rounded-full"
                        />
                      )}
                    </div>

                    {/* Correcciones */}
                    {msg.corrections && msg.corrections.length > 0 && (
                      <div className="mt-2 ml-10 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-md">
                        <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                          💡 Sugerencias:
                        </p>
                        {msg.corrections.map((corr: any, idx: number) => (
                          <div key={idx} className="text-xs text-yellow-900 dark:text-yellow-100 mb-1">
                            <span className="line-through">{corr.original_text}</span> →{' '}
                            <span className="font-semibold">{corr.corrected_text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="h-8 w-8 flex-shrink-0 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-sm">
                      A
                    </div>
                    <div className="max-w-xs rounded-2xl px-4 py-2 md:max-w-md rounded-bl-none bg-secondary text-secondary-foreground">
                      <div className="flex items-center justify-center gap-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              {!sessionAnalysis && (
                <div className="flex-shrink-0 border-t p-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                      placeholder="Escribe un mensaje..."
                      className="flex-grow"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => handleSendMessage(inputText)}
                      disabled={!inputText.trim() || isLoading}
                      size="icon"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Análisis */}
      {sessionAnalysis && (
        <SessionAnalysisComponent
          analysis={sessionAnalysis}
          onClose={handleCloseAnalysis}
        />
      )}
    </div>
  );
};

// Exportar para uso en otras partes de la app
export default ChatbotImproved;