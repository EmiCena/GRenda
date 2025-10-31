import React, { useState } from 'react';
import { Lesson, AnyExercise } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { ExerciseManager } from './ExerciseManager';
import { AIInput } from './AIInput';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChevronLeft } from '../ui/icons';

interface LessonEditorProps {
    lessonToEdit: Lesson | null;
    onBack: () => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({ lessonToEdit, onBack }) => {
    const { addLesson, updateLesson } = useAppContext();
    const [title, setTitle] = useState(lessonToEdit?.title || '');
    const [description, setDescription] = useState(lessonToEdit?.description || '');
    const [exercises, setExercises] = useState<AnyExercise[]>(lessonToEdit?.exercises || []);

    const handleSave = () => {
        if (!title.trim() || !description.trim()) {
            alert('El título y la descripción son obligatorios.');
            return;
        }

        const lessonData = {
            title,
            description,
            exercises,
             // Note: vocabulary and grammar are not editable in this form for simplicity
            vocabulary: lessonToEdit?.vocabulary || [],
            grammar: lessonToEdit?.grammar || [],
        }

        if (lessonToEdit) {
            updateLesson({ ...lessonData, id: lessonToEdit.id });
        } else {
            addLesson({ ...lessonData, id: `l${Date.now()}` });
        }
        onBack();
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                     <h1 className="text-3xl font-bold text-primary">
                        {lessonToEdit ? 'Editar Lección' : 'Crear Nueva Lección'}
                    </h1>
                    <Button onClick={onBack} variant="ghost"><ChevronLeft className="mr-2 h-4 w-4"/> Volver</Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Información de la Lección</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <AIInput
                            id="title"
                            label="Título"
                            value={title}
                            onChange={setTitle}
                            contentType="título de lección"
                            placeholder="Escribe el título de la lección"
                        />
                         <AIInput
                            id="description"
                            label="Descripción"
                            as="textarea"
                            rows={3}
                            value={description}
                            onChange={setDescription}
                            contentType="descripción de lección"
                            placeholder="Describe de qué trata la lección"
                            context={{ title: title }}
                        />
                    </CardContent>
                </Card>

                <ExerciseManager exercises={exercises} setExercises={setExercises} />

                <div className="flex justify-end gap-4">
                    <Button onClick={onBack} variant="outline">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                        Guardar Lección
                    </Button>
                </div>
            </div>
        </div>
    );
};