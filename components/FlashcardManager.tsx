// src/components/FlashcardManager.tsx (CREAR)

import React, { useState, useEffect } from 'react';
import { 
  apiGetAllFlashcards, 
  apiCreateFlashcard, 
  apiUpdateFlashcard, 
  apiDeleteFlashcard,
  apiGetFlashcardDecks 
} from '../services/api';
import { Flashcard, FlashcardCreateData } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface FlashcardManagerProps {
  onPractice: (flashcards: Flashcard[]) => void;
}

export const FlashcardManager: React.FC<FlashcardManagerProps> = ({ onPractice }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<{ deck_name: string; count: number }[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [formData, setFormData] = useState<FlashcardCreateData>({
    spanish_word: '',
    guarani_word: '',
    example: '',
    notes: '',
    deck_name: 'General',
  });

  useEffect(() => {
    loadFlashcards();
    loadDecks();
  }, [selectedDeck, showOnlyFavorites]);

  const loadFlashcards = async () => {
    setIsLoading(true);
    const data = await apiGetAllFlashcards({
      deck: selectedDeck || undefined,
      favorites: showOnlyFavorites || undefined,
    });
    setFlashcards(data);
    setIsLoading(false);
  };

  const loadDecks = async () => {
    const data = await apiGetFlashcardDecks();
    setDecks(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiUpdateFlashcard(editingId, formData);
      } else {
        await apiCreateFlashcard(formData);
      }
      resetForm();
      loadFlashcards();
      loadDecks();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta flashcard?')) return;
    try {
      await apiDeleteFlashcard(id);
      loadFlashcards();
      loadDecks();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEdit = (flashcard: Flashcard) => {
    setFormData({
      spanish_word: flashcard.spanish_word,
      guarani_word: flashcard.guarani_word,
      example: flashcard.example,
      notes: flashcard.notes,
      deck_name: flashcard.deck_name,
    });
    setEditingId(flashcard.id);
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      spanish_word: '',
      guarani_word: '',
      example: '',
      notes: '',
      deck_name: 'General',
    });
    setEditingId(null);
    setShowCreateForm(false);
  };

  const toggleFavorite = async (flashcard: Flashcard) => {
    try {
      await apiUpdateFlashcard(flashcard.id, { is_favorite: !flashcard.is_favorite } as any);
      loadFlashcards();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl text-primary">Mis Flashcards</CardTitle>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? 'Cancelar' : '+ Nueva Flashcard'}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Formulario de creación/edición */}
          {showCreateForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 border border-border rounded-lg bg-secondary/20">
              <h3 className="text-lg font-semibold mb-4">
                {editingId ? 'Editar Flashcard' : 'Nueva Flashcard'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Palabra en Español"
                  value={formData.spanish_word}
                  onChange={(e) => setFormData({ ...formData, spanish_word: e.target.value })}
                  required
                />
                <Input
                  placeholder="Palabra en Guaraní"
                  value={formData.guarani_word}
                  onChange={(e) => setFormData({ ...formData, guarani_word: e.target.value })}
                  required
                />
                <Input
                  placeholder="Ejemplo (opcional)"
                  value={formData.example}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                />
                <Input
                  placeholder="Mazo (ej: Animales, Colores)"
                  value={formData.deck_name}
                  onChange={(e) => setFormData({ ...formData, deck_name: e.target.value })}
                />
              </div>
              <Input
                as="textarea"
                placeholder="Notas adicionales (opcional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-4"
              />
              <div className="flex gap-2 mt-4">
                <Button type="submit">{editingId ? 'Actualizar' : 'Crear'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          )}

          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={selectedDeck}
              onChange={(e) => setSelectedDeck(e.target.value)}
              className="border border-input bg-background px-3 py-2 rounded-md text-sm text-foreground"
            >
              <option value="">Todos los mazos</option>
              {decks.map(deck => (
                <option key={deck.deck_name} value={deck.deck_name}>
                  {deck.deck_name} ({deck.count})
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showOnlyFavorites}
                onChange={(e) => setShowOnlyFavorites(e.target.checked)}
              />
              Solo favoritos
            </label>

            {flashcards.length > 0 && (
              <Button onClick={() => onPractice(flashcards)} className="ml-auto">
                Practicar ({flashcards.length})
              </Button>
            )}
          </div>

          {/* Lista de flashcards */}
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : flashcards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay flashcards. ¡Crea tu primera tarjeta!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashcards.map(card => (
                <div key={card.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-grow">
                      <p className="font-bold text-foreground">{card.spanish_word}</p>
                      <p className="text-primary">{card.guarani_word}</p>
                    </div>
                    <button onClick={() => toggleFavorite(card)} className="text-xl">
                      {card.is_favorite ? '⭐' : '☆'}
                    </button>
                  </div>

                  {card.example && (
                    <p className="text-sm text-muted-foreground italic mt-2">"{card.example}"</p>
                  )}

                  <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                    <span>{card.deck_name}</span>
                    {card.times_reviewed > 0 && (
                      <span>{card.accuracy}% ({card.times_reviewed} veces)</span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(card)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(card.id)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};