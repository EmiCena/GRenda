import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import {
  Lesson,
  AnyExercise,
  ExerciseType,
  MultipleChoiceExercise,
  TranslationExercise,
  FillInTheBlankExercise,
  Progress,
} from '../types';
import { generateSpeech } from '../services/geminiService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ChevronLeft, CheckCircle, XCircle, Volume2, Loader2 } from './ui/icons';

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
  const frameCount = dataInt16.length / 1; // Assuming mono
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

// --- Reusable Text-to-Speech Button ---
const TextToSpeechButton: React.FC<{ textToRead: string }> = ({ textToRead }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const playText = async () => {
    if (!textToRead || isSpeaking) return;
    try {
      setIsSpeaking(true);
      const audioData = await generateSpeech(textToRead);
      if (audioData) {
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContext);
        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContext.destination);
        source.start();
        source.onended = () => setIsSpeaking(false);
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
      setIsSpeaking(false);
    }
  };

  return (
    <Button onClick={playText} variant="ghost" size="icon" title="Leer en voz alta" disabled={isSpeaking}>
      {isSpeaking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
    </Button>
  );
};


// --- Exercise Components ---

const MultipleChoiceComponent: React.FC<{ exercise: MultipleChoiceExercise; onAnswer: (isCorrect: boolean) => void }> = ({ exercise, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const handleSubmit = () => {
    if (selectedOption === null) return;
    const isCorrect = selectedOption === exercise.correctAnswerIndex;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setTimeout(() => {
      onAnswer(isCorrect);
      setSelectedOption(null);
      setFeedback(null);
    }, 1500);
  };
  
  const getButtonClass = (index: number) => {
    const isSelected = selectedOption === index;
    const isCorrect = index === exercise.correctAnswerIndex;
    let baseClass = 'w-full justify-start p-4 h-auto text-base border-2 rounded-lg';

    if (feedback) { // After submission
        if (isCorrect) {
            return `${baseClass} bg-green-500/20 border-green-500 text-foreground`;
        }
        if (isSelected && !isCorrect) {
            return `${baseClass} bg-red-500/20 border-red-500 text-foreground`;
        }
        return `${baseClass} border-transparent bg-secondary/80 text-muted-foreground`; // other options
    } else { // Before submission
        if (isSelected) {
            return `${baseClass} bg-primary/20 border-primary`;
        }
        return `${baseClass} border-border bg-transparent hover:bg-secondary`;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center gap-4 mb-6">
        <h3 className="text-xl font-semibold text-center">{exercise.question}</h3>
        <TextToSpeechButton textToRead={exercise.question} />
      </div>
      <div className="space-y-3 flex-grow">
        {exercise.options.map((option, index) => (
            <Button key={index} onClick={() => setSelectedOption(index)} disabled={!!feedback} className={getButtonClass(index)} variant="outline">
              {option}
            </Button>
        ))}
      </div>
      <Button onClick={handleSubmit} disabled={selectedOption === null || !!feedback} className="w-full mt-6">
        Comprobar
      </Button>
    </div>
  );
};

const TranslationComponent: React.FC<{ exercise: TranslationExercise; onAnswer: (isCorrect: boolean) => void }> = ({ exercise, onAnswer }) => {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    const isCorrect = answer.trim().toLowerCase() === exercise.correctAnswer.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setTimeout(() => {
      onAnswer(isCorrect);
      setAnswer('');
      setFeedback(null);
    }, 2500);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-semibold">{exercise.prompt}</h3>
        <TextToSpeechButton textToRead={exercise.prompt} />
      </div>
      <p className="text-2xl font-bold mb-6 p-4 bg-secondary rounded-lg text-center">{exercise.phraseToTranslate}</p>
      <Input type="text" value={answer} onChange={e => setAnswer(e.target.value)} disabled={!!feedback} placeholder="Escribe la traducción..."
        className="text-center text-lg h-12" />
      
      {feedback === 'correct' && (
        <div className="mt-4 p-3 rounded-lg text-center flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            <CheckCircle className="h-5 w-5"/>
            <span>¡Correcto!</span>
        </div>
      )}
      {feedback === 'incorrect' && (
        <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
            <div className="flex items-center gap-2 font-bold">
                <XCircle className="h-5 w-5"/>
                <span>Respuesta Incorrecta</span>
            </div>
            <div className="mt-2 text-sm text-left pl-2 border-l-2 border-red-400 dark:border-red-600">
                <p><span className="font-semibold">Tu respuesta:</span> {answer}</p>
                <p><span className="font-semibold">Respuesta correcta:</span> {exercise.correctAnswer}</p>
            </div>
        </div>
      )}

      <Button onClick={handleSubmit} disabled={!answer.trim() || !!feedback} className="w-full mt-auto">
        Comprobar
      </Button>
    </div>
  );
};

const FillInTheBlankComponent: React.FC<{ exercise: FillInTheBlankExercise; onAnswer: (isCorrect: boolean) => void }> = ({ exercise, onAnswer }) => {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    const isCorrect = answer.trim().toLowerCase() === exercise.correctAnswer.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setTimeout(() => {
      onAnswer(isCorrect);
      setAnswer('');
      setFeedback(null);
    }, 2500);
  };
  
  const sentenceToRead = exercise.sentence.replace('___', 'espacio en blanco');
  const sentenceParts = exercise.sentence.split('___');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center gap-4 mb-6">
        <h3 className="text-lg font-semibold text-center">Completa la oración:</h3>
        <TextToSpeechButton textToRead={sentenceToRead} />
      </div>
      <div className="text-2xl font-bold mb-6 p-4 bg-secondary rounded-lg text-center flex items-center justify-center flex-wrap gap-2">
        <span>{sentenceParts[0]}</span>
        <Input type="text" value={answer} onChange={e => setAnswer(e.target.value)} disabled={!!feedback} placeholder="..."
          className="h-auto p-1 border-b-2 bg-transparent text-center focus:ring-0" style={{ width: `${Math.max(10, exercise.correctAnswer.length)}ch` }} />
        <span>{sentenceParts[1]}</span>
      </div>

      {feedback === 'correct' && (
        <div className="mt-4 p-3 rounded-lg text-center flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            <CheckCircle className="h-5 w-5"/>
            <span>¡Correcto!</span>
        </div>
      )}
      {feedback === 'incorrect' && (
        <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
            <div className="flex items-center gap-2 font-bold">
                <XCircle className="h-5 w-5"/>
                <span>Respuesta Incorrecta</span>
            </div>
            <div className="mt-2 text-sm text-left pl-2 border-l-2 border-red-400 dark:border-red-600">
                <p><span className="font-semibold">Tu respuesta:</span> {answer}</p>
                <p><span className="font-semibold">Respuesta correcta:</span> {exercise.correctAnswer}</p>
            </div>
        </div>
      )}
      <Button onClick={handleSubmit} disabled={!answer.trim() || !!feedback} className="w-full mt-auto">
        Comprobar
      </Button>
    </div>
  );
};

const ExerciseRenderer: React.FC<{ exercise: AnyExercise; onAnswer: (isCorrect: boolean) => void }> = ({ exercise, onAnswer }) => {
  switch (exercise.type) {
    case ExerciseType.MULTIPLE_CHOICE:
      return <MultipleChoiceComponent exercise={exercise} onAnswer={onAnswer} />;
    case ExerciseType.TRANSLATION:
      return <TranslationComponent exercise={exercise} onAnswer={onAnswer} />;
    case ExerciseType.FILL_IN_THE_BLANK:
      return <FillInTheBlankComponent exercise={exercise} onAnswer={onAnswer} />;
    default:
      return <p>Tipo de ejercicio no soportado.</p>;
  }
};

const LessonPractice: React.FC<{ lesson: Lesson; onComplete: (score: number) => void; onBack: () => void; }> = ({ lesson, onComplete, onBack }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (lesson.exercises.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>Esta lección no tiene ejercicios todavía.</p>
        <Button onClick={onBack} className="mt-4">Volver</Button>
      </div>
    );
  }

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
    const nextIndex = currentExerciseIndex + 1;
    if (nextIndex < lesson.exercises.length) {
      setCurrentExerciseIndex(nextIndex);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    const totalQuestions = lesson.exercises.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center h-full">
        <Card className="max-w-md mx-auto text-center">
            <CardHeader>
                <CardTitle className="text-2xl text-primary">¡Lección Completada!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Has respondido correctamente a <span className="font-bold text-foreground">{correctAnswers}</span> de <span className="font-bold text-foreground">{totalQuestions}</span> preguntas.
                </p>
                <div className="my-6 text-5xl font-bold text-primary">{score}%</div>
            </CardContent>
            <CardFooter>
                 <Button onClick={() => onComplete(score)} className="w-full">
                    Continuar
                </Button>
            </CardFooter>
        </Card>
      </div>
    );
  }

  const currentExercise = lesson.exercises[currentExerciseIndex];
  const progressPercentage = ((currentExerciseIndex) / lesson.exercises.length) * 100;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col h-full">
      <div className="max-w-2xl mx-auto w-full flex-grow flex flex-col">
        <div className="w-full bg-secondary rounded-full h-2.5 mb-4">
          <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progressPercentage}%`, transition: 'width 0.5s' }}></div>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground mb-6">
          <span>Progreso</span>
          <span>{currentExerciseIndex + 1} / {lesson.exercises.length}</span>
        </div>
        <Card className="flex-grow">
            <CardContent className="p-6 h-full">
                <ExerciseRenderer exercise={currentExercise} onAnswer={handleAnswer} />
            </CardContent>
        </Card>
        <div className="mt-4 text-center">
          <Button onClick={onBack} variant="link">
            Salir de la práctica
          </Button>
        </div>
      </div>
    </div>
  );
};

const LessonDetail: React.FC<{ lesson: Lesson; onStartPractice: () => void; onBack: () => void; }> = ({ lesson, onStartPractice, onBack }) => (
  <div className="container mx-auto p-4 sm:p-6 lg:p-8">
    <div className="max-w-4xl mx-auto">
      <Button onClick={onBack} variant="ghost" className="mb-4">
        <ChevronLeft className="h-4 w-4 mr-2" />
        Volver a Lecciones
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl text-primary">{lesson.title}</CardTitle>
          <CardDescription>{lesson.description}</CardDescription>
        </CardHeader>
        <CardContent>
            {lesson.vocabulary && lesson.vocabulary.length > 0 && (
            <div className="mt-4">
                <h3 className="text-xl font-semibold mb-4 text-primary/90">Vocabulario</h3>
                <div className="space-y-3">
                {lesson.vocabulary.map((item, index) => (
                    <div key={index} className="p-3 bg-secondary/50 rounded-lg">
                    <p className="font-bold text-foreground">{item.word} - <span className="font-normal">{item.translation}</span></p>
                    <p className="text-sm text-muted-foreground italic">Ej: {item.example}</p>
                    </div>
                ))}
                </div>
            </div>
            )}

            {lesson.grammar && lesson.grammar.length > 0 && (
            <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 text-primary/90">Gramática</h3>
                <div className="space-y-3">
                {lesson.grammar.map((item, index) => (
                    <div key={index} className="p-3 bg-secondary/50 rounded-lg">
                    <p className="font-bold text-foreground">{item.rule}</p>
                    <p className="text-sm text-foreground/80 mt-1">{item.explanation}</p>
                    <p className="text-sm text-muted-foreground italic mt-1">Ej: {item.example}</p>
                    </div>
                ))}
                </div>
            </div>
            )}
        </CardContent>
        <CardFooter className="justify-center">
           <Button onClick={onStartPractice} size="lg">
                ¡Practicar ({lesson.exercises.length} ejercicios)!
            </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
);

const LessonList: React.FC<{ lessons: Lesson[]; progress: Progress; onSelectLesson: (lesson: Lesson) => void; }> = ({ lessons, progress, onSelectLesson }) => (
  <div className="container mx-auto p-4 sm:p-6 lg:p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-primary mb-6">Lecciones</h1>
      <div className="space-y-4">
        {lessons.map(lesson => {
          const lessonProgress = progress[lesson.id];
          const isCompleted = lessonProgress?.completed;
          return (
            <Card key={lesson.id}>
              <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-grow">
                  <h2 className="text-xl font-bold text-primary/90">{lesson.title}</h2>
                  <p className="text-muted-foreground mt-1">{lesson.description}</p>
                  {isCompleted && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-500">
                      <CheckCircle className="h-5 w-5" />
                      <span>Completado - {lessonProgress.score}%</span>
                    </div>
                  )}
                </div>
                <Button onClick={() => onSelectLesson(lesson)} className="w-full sm:w-auto flex-shrink-0">
                  {isCompleted ? 'Repasar' : 'Empezar'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  </div>
);

export const LessonView: React.FC = () => {
  const { lessons, progress, updateProgress } = useAppContext();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);

  if (isPracticing && selectedLesson) {
    return <LessonPractice
      lesson={selectedLesson}
      onComplete={(score) => {
        updateProgress(selectedLesson.id, score);
        setIsPracticing(false);
        setSelectedLesson(null);
      }}
      onBack={() => setIsPracticing(false)}
    />;
  }

  if (selectedLesson) {
    return <LessonDetail
      lesson={selectedLesson}
      onStartPractice={() => setIsPracticing(true)}
      onBack={() => setSelectedLesson(null)}
    />;
  }

  return <LessonList lessons={lessons} progress={progress} onSelectLesson={setSelectedLesson} />;
};