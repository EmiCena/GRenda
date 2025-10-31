import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Lesson } from '../../types';
import { LessonEditor } from './LessonEditor';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const AdminLessonCard: React.FC<{ lesson: Lesson; onEdit: () => void; onDelete: () => void; }> = ({ lesson, onEdit, onDelete }) => (
    <Card>
        <div className="p-5 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold text-primary/90">{lesson.title}</h3>
                <p className="text-muted-foreground text-sm">{lesson.exercises.length} ejercicios</p>
            </div>
            <div className="flex items-center gap-3">
                <Button onClick={onEdit} variant="outline" size="sm">Editar</Button>
                <Button onClick={onDelete} variant="destructive" size="sm">Eliminar</Button>
            </div>
        </div>
    </Card>
);

export const AdminView: React.FC = () => {
    const { lessons, deleteLesson: contextDeleteLesson } = useAppContext();
    const [editingLesson, setEditingLesson] = useState<Lesson | 'new' | null>(null);

    const handleCreateNew = () => {
        setEditingLesson('new');
    };

    const handleEdit = (lesson: Lesson) => {
        setEditingLesson(lesson);
    };

    const handleDelete = (lessonId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta lección? Esta acción no se puede deshacer.')) {
            contextDeleteLesson(lessonId);
        }
    };
    
    if (editingLesson) {
        return <LessonEditor lessonToEdit={editingLesson === 'new' ? null : editingLesson} onBack={() => setEditingLesson(null)} />;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-primary">Panel de Administración</h1>
                    <Button onClick={handleCreateNew}>
                        Crear Lección
                    </Button>
                </div>
                <div className="space-y-4">
                    {lessons.length > 0 ? (
                        lessons.map(lesson => (
                            <AdminLessonCard 
                                key={lesson.id} 
                                lesson={lesson} 
                                onEdit={() => handleEdit(lesson)}
                                onDelete={() => handleDelete(lesson.id)}
                            />
                        ))
                    ) : (
                        <Card className="text-center text-muted-foreground py-12">
                            No hay lecciones creadas. ¡Crea la primera!
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};