import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { generateMascotImage } from '../services/geminiService';
import { DonutChart } from './charts/DonutChart';
import { BarChart } from './charts/BarChart';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Progress } from '../types';

const Mascot = () => {
    const [imageUrl, setImageUrl] = useState<string | null>(localStorage.getItem('guaraniRendaMascot'));
    const [isLoading, setIsLoading] = useState<boolean>(!imageUrl);

    useEffect(() => {
        const fetchMascot = async () => {
            if (!imageUrl) {
                setIsLoading(true);
                const generatedUrl = await generateMascotImage();
                if (generatedUrl) {
                    setImageUrl(generatedUrl);
                    localStorage.setItem('guaraniRendaMascot', generatedUrl);
                }
                setIsLoading(false);
            }
        };
        fetchMascot();
    }, [imageUrl]);

    if (isLoading) {
        return (
            <div className="bg-secondary rounded-full p-4 w-40 h-40 mx-auto flex items-center justify-center animate-pulse">
            </div>
        );
    }

    if (imageUrl) {
        return <img src={imageUrl} alt="Mascot" className="w-40 h-40 mx-auto object-contain" />;
    }
    
    // Fallback SVG
    return (
        <div className="bg-secondary rounded-full p-4 w-40 h-40 mx-auto flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
                <path d="M12 10.414c-1.33 0-2.58.5-3.536 1.464a5 5 0 0 0 7.072 0C14.58 10.914 13.33 10.414 12 10.414z"></path><circle cx="8.5" cy="8.5" r="1.5"></circle><circle cx="15.5" cy="8.5" r="1.5"></circle>
            </svg>
        </div>
    );
};


export const Dashboard: React.FC = () => {
    const { user, progress, lessons } = useAppContext();
    
    // Fix: Explicitly type `p` because TypeScript might incorrectly infer it as `unknown`
    // when using `Object.values` on a type with an index signature.
    const completedLessons = Object.values(progress).filter((p: Progress[string]) => p.completed);
    const completedLessonsCount = completedLessons.length;
    const totalLessons = lessons.length;
    const overallProgress = totalLessons > 0 ? (completedLessonsCount / totalLessons) * 100 : 0;
    
    const lessonScores = lessons
        .filter(lesson => progress[lesson.id] && progress[lesson.id].completed)
        .map(lesson => ({
            label: lesson.title,
            value: progress[lesson.id].score,
        }));
        
    const encouragementMessages = [
        "¡Rohayhu! (¡Te quiero!) ¡Sigue así!",
        "¡Iporãiterei! (¡Muy bien!) Estás progresando mucho.",
        "¡Ani nekane'õ! (¡No te canses!) El conocimiento es poder.",
        "Cada palabra que aprendes es un paso más cerca de la fluidez."
    ];

    const message = encouragementMessages[completedLessonsCount % encouragementMessages.length];

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <h1 className="text-3xl font-bold text-primary">Mba'éichapa, {user?.name}!</h1>
                <p className="text-muted-foreground mt-2">¡Bienvenido de nuevo a tu aventura en Guaraní!</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                           <CardTitle className="text-xl text-primary/90">Progreso General</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <DonutChart progress={overallProgress} />
                             <p className="mt-4 text-muted-foreground text-center">
                               <span className="font-bold text-foreground">{completedLessonsCount}</span> de <span className="font-bold text-foreground">{totalLessons}</span> lecciones completadas.
                            </p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                            <Mascot />
                            <p className="mt-4 text-muted-foreground italic">{message}</p>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="lg:col-span-2">
                   <BarChart data={lessonScores} title="Puntajes por Lección" />
                </div>
            </div>
        </div>
    );
};
