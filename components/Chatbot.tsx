import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getChatbotResponse, transcribeAudio, generateSpeech, checkGuaraniPronunciation } from '../services/geminiService';
import { useAppContext } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Button } from './ui/Button';
import { Send, Mic, StopCircle, Loader2, XCircle } from './ui/icons';

interface PronunciationFeedback {
  target: string;
  transcription: string;
  accuracyScore: number;
  feedback: string;
}

interface Message {
  text: string;
  isUser: boolean;
  pronunciationFeedback?: PronunciationFeedback;
}

// Audio decoding functions
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000); // Mono, 24kHz
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

const PronunciationFeedbackCard: React.FC<{ data: PronunciationFeedback }> = ({ data }) => {
  return (
    <div className="my-2 rounded-lg border bg-card text-card-foreground p-4">
      <h4 className="font-semibold text-primary">Resultados de la Práctica</h4>
      <div className="mt-2 space-y-2 text-sm">
        <p><span className="font-medium text-muted-foreground">Querías decir:</span> {data.target}</p>
        <p><span className="font-medium text-muted-foreground">Se escuchó:</span> {data.transcription}</p>
      </div>
      <div className="mt-4">
        <Label>Precisión: {data.accuracyScore}%</Label>
        <div className="w-full bg-secondary rounded-full h-2.5 mt-1">
          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${data.accuracyScore}%`, transition: 'width 0.5s ease-in-out' }}></div>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">Sugerencia:</p>
        <p className="text-sm">{data.feedback}</p>
      </div>
    </div>
  );
};


export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Mba'éichapa! Soy Arami, tu tutora de Guaraní. Prueba a decirme 'Mba'éichapa' o pregúntame algo.", isUser: false },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [practiceTarget, setPracticeTarget] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAppContext();
  
  const playAudio = useCallback(async (base64Audio: string) => {
    try {
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext);
        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContext.destination);
        source.start();
    } catch (error) {
        console.error("Failed to play audio:", error);
    }
  }, []);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [messages]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { text: messageText, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const botResponseText = await getChatbotResponse(messageText);
      const botMessage: Message = { text: botResponseText, isUser: false };
      setMessages(prev => [...prev, botMessage]);

      const audioData = await generateSpeech(botResponseText);
      if (audioData) {
        await playAudio(audioData);
      }
    } catch (error) {
      console.error("Error in chat flow:", error);
      const errorMessage: Message = { text: "Lo siento, tuve un problema para procesar tu mensaje.", isUser: false };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, playAudio]);

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const options = { mimeType: 'audio/webm;codecs=opus' };
        const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
        
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        
        recorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        
        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result?.toString().split(',')[1];
            if (base64Audio) {
              setIsLoading(true);
              if (practiceTarget) {
                 const result = await checkGuaraniPronunciation(base64Audio, recorder.mimeType, practiceTarget);
                 if (result) {
                    const feedbackMsg: Message = { text: '', isUser: false, pronunciationFeedback: { ...result, target: practiceTarget }};
                    setMessages(prev => [...prev, feedbackMsg]);
                 } else {
                    const errorMsg: Message = { text: "No pude analizar la pronunciación. Inténtalo de nuevo.", isUser: false };
                    setMessages(prev => [...prev, errorMsg]);
                 }
                 setPracticeTarget(null);
              } else {
                const transcript = await transcribeAudio(base64Audio, recorder.mimeType);
                if (transcript) {
                  await handleSendMessage(transcript);
                }
              }
              setIsLoading(false);
            }
          };
          stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("No se pudo acceder al micrófono. Por favor, revisa los permisos en tu navegador.");
      }
    }
  }, [isRecording, handleSendMessage, practiceTarget]);

  return (
    <div className="flex h-full flex-col container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="mx-auto w-full max-w-2xl flex-grow flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-xl text-primary">Chat con Arami</CardTitle>
          <CardDescription>Practica tu Guaraní conversando y mejora tu pronunciación.</CardDescription>
        </CardHeader>
        <CardContent ref={chatContainerRef} className="flex-grow space-y-2 overflow-y-auto p-4">
          {messages.map((msg, index) => {
            const guaraniPhrases = msg.text.match(/'([^']+)'/g);
            if (msg.pronunciationFeedback) {
              return <PronunciationFeedbackCard key={index} data={msg.pronunciationFeedback} />;
            }
            return (
              <div key={index} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-2 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  {!msg.isUser && (
                    <div className="h-8 w-8 flex-shrink-0 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-sm">A</div>
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
                    <img src={user?.avatarUrl} alt="User" className="h-8 w-8 flex-shrink-0 rounded-full" />
                  )}
                </div>
                 {!msg.isUser && guaraniPhrases && !isLoading && (
                  <div className="mt-2 ml-10 flex flex-wrap gap-2">
                    {guaraniPhrases.map((phrase, idx) => (
                      <Button 
                        key={idx} 
                        size="sm" 
                        variant="outline"
                        onClick={() => setPracticeTarget(phrase.replace(/'/g, ''))}
                      >
                         <Mic className="mr-2 h-4 w-4" /> Practicar "{phrase.replace(/'/g, '')}"
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
               <div className="h-8 w-8 flex-shrink-0 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-sm">A</div>
               <div className="max-w-xs rounded-2xl px-4 py-2 md:max-w-md rounded-bl-none bg-secondary text-secondary-foreground">
                <div className="flex items-center justify-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                </div>
               </div>
            </div>
          )}
        </CardContent>
        <div className="flex-shrink-0 border-t p-4">
            {practiceTarget ? (
              <div className="flex items-center gap-2 w-full p-2 bg-secondary rounded-md animate-fade-in">
                <p className="text-sm text-secondary-foreground flex-grow">
                  Practica: <span className="font-bold text-primary">{practiceTarget}</span>
                </p>
                <Button 
                    onClick={handleToggleRecording} 
                    disabled={isLoading}
                    variant={isRecording ? "destructive" : "default"} 
                    size="icon"
                >
                    {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button onClick={() => setPracticeTarget(null)} variant="ghost" size="icon">
                    <XCircle className="h-5 w-5"/>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                  placeholder="Escribe un mensaje..."
                  className="flex-grow"
                  disabled={isLoading || isRecording}
                />
                 <Button
                  onClick={handleToggleRecording}
                  disabled={isLoading}
                  variant={isRecording ? "destructive" : "default"}
                  size="icon"
                >
                  {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button
                  onClick={() => handleSendMessage(inputText)}
                  disabled={!inputText.trim() || isLoading || isRecording}
                  size="icon"
                >
                  <Send className="h-5 w-5"/>
                </Button>
              </div>
            )}
        </div>
      </Card>
    </div>
  );
};
