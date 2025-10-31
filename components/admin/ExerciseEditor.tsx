import React, { useState } from 'react';
import { AnyExercise, ExerciseType } from '../../types';
import { AIInput } from './AIInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Trash2 } from '../ui/icons';

interface ExerciseEditorProps {
    exerciseToEdit: AnyExercise | null;
    exerciseType: ExerciseType;
    onSave: (exercise: AnyExercise) => void;
    onClose: () => void;
}

export const ExerciseEditor: React.FC<ExerciseEditorProps> = ({ exerciseToEdit, exerciseType, onSave, onClose }) => {
    
    // --- Multiple Choice State ---
    const mcExercise = exerciseToEdit?.type === ExerciseType.MULTIPLE_CHOICE ? exerciseToEdit : null;
    const [question, setQuestion] = useState(mcExercise?.question || '');
    const [options, setOptions] = useState(mcExercise?.options || ['', '', '']);
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState(mcExercise?.correctAnswerIndex || 0);

    // --- Translation State ---
    const trExercise = exerciseToEdit?.type === ExerciseType.TRANSLATION ? exerciseToEdit : null;
    const [prompt, setPrompt] = useState(trExercise?.prompt || 'Traduce la siguiente frase:');
    const [phraseToTranslate, setPhraseToTranslate] = useState(trExercise?.phraseToTranslate || '');
    const [correctTranslation, setCorrectTranslation] = useState(trExercise?.correctAnswer || '');

    // --- Fill in the Blank State ---
    const fbExercise = exerciseToEdit?.type === ExerciseType.FILL_IN_THE_BLANK ? exerciseToEdit : null;
    const [sentence, setSentence] = useState(fbExercise?.sentence || '');
    const [correctBlank, setCorrectBlank] = useState(fbExercise?.correctAnswer || '');
    

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };
    
    const addOption = () => setOptions([...options, '']);
    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
            if (correctAnswerIndex === index) setCorrectAnswerIndex(0);
            else if (correctAnswerIndex > index) setCorrectAnswerIndex(correctAnswerIndex - 1);
        }
    }

    const handleSubmit = () => {
        let exerciseData: AnyExercise | null = null;
        const id = exerciseToEdit?.id || `ex${Date.now()}`;

        switch (exerciseType) {
            case ExerciseType.MULTIPLE_CHOICE:
                if (!question.trim() || options.some(o => !o.trim())) {
                    alert('La pregunta y todas las opciones son obligatorias.'); return;
                }
                exerciseData = { id, type: ExerciseType.MULTIPLE_CHOICE, question, options, correctAnswerIndex };
                break;
            case ExerciseType.TRANSLATION:
                 if (!phraseToTranslate.trim() || !correctTranslation.trim()) {
                    alert('La frase a traducir y la traducción correcta son obligatorias.'); return;
                }
                exerciseData = { id, type: ExerciseType.TRANSLATION, prompt, phraseToTranslate, correctAnswer: correctTranslation };
                break;
            case ExerciseType.FILL_IN_THE_BLANK:
                if (!sentence.trim() || !correctBlank.trim() || !sentence.includes('___')) {
                    alert('La oración debe contener "___" y la respuesta correcta no puede estar vacía.'); return;
                }
                exerciseData = { id, type: ExerciseType.FILL_IN_THE_BLANK, sentence, correctAnswer: correctBlank };
                break;
        }

        if (exerciseData) {
            onSave(exerciseData);
        }
    };

    const renderForm = () => {
        switch (exerciseType) {
            case ExerciseType.MULTIPLE_CHOICE:
                return (
                    <div className="space-y-4">
                        <AIInput
                            id="mc-question"
                            label="Pregunta"
                            value={question}
                            onChange={setQuestion}
                            contentType="pregunta de opción múltiple"
                            placeholder="Ej: ¿Cómo se dice 'Hola'?"
                        />
                        <div>
                            <Label>Opciones</Label>
                            <div className="space-y-2 mt-1">
                                {options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input type="radio" name="correct-option" checked={index === correctAnswerIndex} onChange={() => setCorrectAnswerIndex(index)} className="form-radio h-5 w-5 text-primary focus:ring-primary flex-shrink-0" />
                                        <Input value={option} onChange={e => handleOptionChange(index, e.target.value)} placeholder={`Opción ${index + 1}`} />
                                        <Button onClick={() => removeOption(index)} disabled={options.length <= 2} variant="ghost" size="icon" className="text-destructive hover:text-destructive flex-shrink-0"><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={addOption} type="button" variant="link" size="sm" className="px-0">Añadir opción</Button>
                        </div>
                    </div>
                );
            case ExerciseType.TRANSLATION:
                return (
                    <div className="space-y-4">
                        <AIInput
                            id="tr-phrase"
                            label="Frase a traducir (en Español)"
                            value={phraseToTranslate}
                            onChange={setPhraseToTranslate}
                            contentType="frase para traducir"
                            placeholder="Ej: Estoy bien"
                        />
                        <AIInput
                            id="tr-answer"
                            label="Traducción Correcta (en Guaraní)"
                            value={correctTranslation}
                            onChange={setCorrectTranslation}
                            contentType="respuesta de traducción"
                            context={{ sourcePhrase: phraseToTranslate }}
                            placeholder="Ej: Iporãnte"
                        />
                    </div>
                );
            case ExerciseType.FILL_IN_THE_BLANK:
                 return (
                    <div className="space-y-4">
                        <AIInput
                            id="fb-sentence"
                            label='Oración con un espacio en blanco (usa "___")'
                            value={sentence}
                            onChange={setSentence}
                            contentType="oración para completar"
                            placeholder="Ej: Che aĩ ___."
                        />
                        <AIInput
                            id="fb-answer"
                            label="Palabra correcta para el espacio"
                            value={correctBlank}
                            onChange={setCorrectBlank}
                            contentType="respuesta de traducción"
                            context={{ sourcePhrase: sentence.replace('___', `[PALABRA FALTANTE]`) }}
                            placeholder="Ej: iporãnte"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    const titleText = `${exerciseToEdit ? 'Editar' : 'Crear'} Ejercicio: ${exerciseType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}`;

    return (
       <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{titleText}</DialogTitle>
                </DialogHeader>
                <div className="py-4">{renderForm()}</div>
                <DialogFooter>
                    <Button onClick={onClose} variant="outline">Cancelar</Button>
                    <Button onClick={handleSubmit}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};