import React, { useState, useRef, DragEvent } from 'react';
import { AnyExercise, ExerciseType } from '../../types';
import { ExerciseEditor } from './ExerciseEditor';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { GripVertical, Plus } from '../ui/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';

interface ExerciseManagerProps {
    exercises: AnyExercise[];
    setExercises: React.Dispatch<React.SetStateAction<AnyExercise[]>>;
}

const ExercisePill: React.FC<{ type: ExerciseType }> = ({ type }) => {
    const styles = {
        [ExerciseType.MULTIPLE_CHOICE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        [ExerciseType.TRANSLATION]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        [ExerciseType.FILL_IN_THE_BLANK]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    };
    const text = {
        [ExerciseType.MULTIPLE_CHOICE]: 'Opción Múltiple',
        [ExerciseType.TRANSLATION]: 'Traducción',
        [ExerciseType.FILL_IN_THE_BLANK]: 'Completar Espacio',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type]}`}>{text[type]}</span>;
};

const getExerciseSummary = (exercise: AnyExercise): string => {
    switch (exercise.type) {
        case ExerciseType.MULTIPLE_CHOICE: return exercise.question;
        case ExerciseType.TRANSLATION: return exercise.phraseToTranslate;
        case ExerciseType.FILL_IN_THE_BLANK: return exercise.sentence;
        default: return 'Ejercicio sin título';
    }
};

export const ExerciseManager: React.FC<ExerciseManagerProps> = ({ exercises, setExercises }) => {
    const [editingExercise, setEditingExercise] = useState<AnyExercise | 'new' | null>(null);
    const [newExerciseType, setNewExerciseType] = useState<ExerciseType>(ExerciseType.MULTIPLE_CHOICE);
    const [isChoosingType, setIsChoosingType] = useState(false);
    
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('opacity-50');
        const listCopy = [...exercises];
        if (dragItem.current === null || dragOverItem.current === null) return;
        const dragItemContent = listCopy[dragItem.current];
        listCopy.splice(dragItem.current, 1);
        listCopy.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setExercises(listCopy);
    };

    const handleSelectType = (type: ExerciseType) => {
        setNewExerciseType(type);
        setEditingExercise('new');
        setIsChoosingType(false);
    }

    const handleDelete = (exerciseId: string) => {
        if (window.confirm('¿Eliminar este ejercicio?')) {
            setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
        }
    };
    
    const handleSaveExercise = (exercise: AnyExercise) => {
        if (editingExercise === 'new') {
            setExercises(prev => [...prev, exercise]);
        } else {
            setExercises(prev => prev.map(ex => ex.id === exercise.id ? exercise : ex));
        }
        setEditingExercise(null);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Ejercicios</CardTitle>
                <Button onClick={() => setIsChoosingType(true)} variant="outline" size="sm">
                   <Plus className="mr-2 h-4 w-4"/> Añadir Ejercicio
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {exercises.map((ex, index) => (
                        <div
                            key={ex.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className="p-3 bg-secondary/50 rounded-lg flex items-center justify-between cursor-grab active:cursor-grabbing"
                        >
                            <div className="flex items-center gap-4">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-foreground truncate max-w-sm">{getExerciseSummary(ex)}</p>
                                    <ExercisePill type={ex.type} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={() => setEditingExercise(ex)} variant="ghost" size="sm">Editar</Button>
                                <Button onClick={() => handleDelete(ex.id)} variant="ghost" size="sm" className="text-destructive hover:text-destructive">Eliminar</Button>
                            </div>
                        </div>
                    ))}
                    {exercises.length === 0 && <p className="text-center text-muted-foreground py-8">Esta lección no tiene ejercicios. ¡Añade el primero!</p>}
                </div>
            </CardContent>

            <Dialog open={isChoosingType} onOpenChange={setIsChoosingType}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Selecciona un tipo de ejercicio</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {(Object.keys(ExerciseType) as Array<keyof typeof ExerciseType>).map(key => (
                            <button key={key} onClick={() => handleSelectType(ExerciseType[key])} className="p-4 border rounded-lg hover:bg-secondary text-left">
                                <ExercisePill type={ExerciseType[key]} />
                                <p className="font-semibold mt-1">{ExerciseType[key].replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</p>
                            </button>
                        ))}
                    </div>
                     <DialogFooter>
                        <Button onClick={() => setIsChoosingType(false)} variant="outline">Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {editingExercise && (
                <ExerciseEditor 
                    exerciseToEdit={editingExercise === 'new' ? null : editingExercise}
                    exerciseType={editingExercise === 'new' ? newExerciseType : editingExercise.type}
                    onSave={handleSaveExercise} 
                    onClose={() => setEditingExercise(null)} 
                />
            )}
        </Card>
    );
};