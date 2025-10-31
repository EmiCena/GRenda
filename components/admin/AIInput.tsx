import React, { useState, TextareaHTMLAttributes, InputHTMLAttributes } from 'react';
import { getAISuggestion } from '../../services/geminiService';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { Sparkles, Loader2 } from '../ui/icons';

type ContentType = 'título de lección' | 'descripción de lección' | 'pregunta de opción múltiple' | 'frase para traducir' | 'oración para completar' | 'respuesta de traducción';

interface CommonProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    contentType: ContentType;
    context?: Record<string, string>;
}

type AIInputProps = CommonProps & { as?: 'input' } & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>;
type AITextAreaProps = CommonProps & { as: 'textarea' } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'>;

type Props = AIInputProps | AITextAreaProps;

export const AIInput: React.FC<Props> = (props) => {
    const { id, label, value, onChange, contentType, context, as = 'input', ...rest } = props;

    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSuggest = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestion(null);
        try {
            const result = await getAISuggestion(contentType, value, context);
            if (result.startsWith('Error:')) {
                setError(result);
            } else {
                setSuggestion(result);
            }
        } catch (e) {
            setError('Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = () => {
        if (suggestion) {
            onChange(suggestion);
        }
        setSuggestion(null);
    };

    const handleDiscard = () => {
        setSuggestion(null);
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label htmlFor={id}>
                    {label}
                </Label>
                <Button
                    type="button"
                    onClick={handleSuggest}
                    disabled={isLoading}
                    variant="ghost"
                    size="sm"
                    title="Obtener sugerencia de la IA"
                >
                    {isLoading ? (
                         <Loader2 className="animate-spin h-4 w-4 mr-2"/>
                    ) : (
                       <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Sugerir
                </Button>
            </div>
            
            <Input
                as={as}
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                {...(rest as any)}
            />

            {suggestion && (
                <div className="mt-2 p-3 bg-emerald-50 dark:bg-slate-700/50 border-l-4 border-primary rounded-r-lg">
                    <p className="text-sm font-medium">Sugerencia:</p>
                    <p className="text-sm text-muted-foreground italic my-1">"{suggestion}"</p>
                    <div className="flex gap-2 mt-2">
                        <Button onClick={handleAccept} size="sm">Aceptar</Button>
                        <Button onClick={handleDiscard} size="sm" variant="secondary">Descartar</Button>
                    </div>
                </div>
            )}
            
            {error && (
                 <div className="mt-2 p-3 bg-destructive/10 border-l-4 border-destructive rounded-r-lg">
                    <p className="text-sm text-destructive">{error}</p>
                 </div>
            )}
        </div>
    );
};