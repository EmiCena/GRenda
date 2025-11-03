import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Mascot {
  id: number;
  name: string;
  level: number;
  current_xp: number;
  total_xp: number;
  state: 'happy' | 'celebrating' | 'sleeping' | 'evolving' | 'normal';
  xp_for_next_level: number;
  evolution_stage: string;
  xp_percentage: number;
}

const MASCOT_IMAGES = {
  baby: '🦫',
  young: '🦦',
  adult: '🐾',
  elder: '🦌',
  master: '👑',
};

const STATES = {
  happy: '😊',
  celebrating: '🎉',
  sleeping: '😴',
  evolving: '✨',
  normal: '🙂',
};

const GUARANI_PHRASES = {
  happy: ["¡Iporãnte!", "¡Aguyje!", "¡Mba'éichapa!"],
  celebrating: ["¡Vy'apavẽ!", "¡Che vy'a!", "¡Iporãiterei!"],
  sleeping: ["Ke aju...", "Nañañandu...", "Aikotevẽ ñañemoĩ..."],
  evolving: ["¡Añemoakãrapu'ã!", "¡Che akãrapu'ã!", "¡Che iporãve!"],
  normal: ["Jajogua'u ñane", "Jaikuaase", "Jajoheja"],
};

export const MascotWidget: React.FC = () => {
  const [mascot, setMascot] = useState<Mascot | null>(null);
  const [phrase, setPhrase] = useState('');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMascot();
  }, []);

  const loadMascot = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/mascot/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMascot(response.data);
      updatePhrase(response.data.state);
    } catch (error) {
      console.error('Error loading mascot:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePhrase = (state: string) => {
    const phrases = GUARANI_PHRASES[state as keyof typeof GUARANI_PHRASES] || GUARANI_PHRASES.normal;
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setPhrase(randomPhrase);
  };

  if (loading || !mascot) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-40 bg-secondary rounded"></div>
      </div>
    );
  }

  const mascotIcon = MASCOT_IMAGES[mascot.evolution_stage as keyof typeof MASCOT_IMAGES] || '🦫';
  const stateEmoji = STATES[mascot.state as keyof typeof STATES] || '🙂';

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-2 border-blue-200 dark:border-blue-900 rounded-xl p-6 shadow-lg relative overflow-hidden">
      {/* Animación de level up */}
      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-yellow-400/90 z-10 animate-bounce">
          <div className="text-center">
            <div className="text-6xl mb-2">🎉</div>
            <div className="text-2xl font-bold text-white">¡NIVEL {mascot.level}!</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            {mascotIcon} {mascot.name}
            <span className="text-sm font-normal text-muted-foreground">Nivel {mascot.level}</span>
          </h3>
          <p className="text-sm text-muted-foreground capitalize">
            {mascot.evolution_stage === 'baby' && 'Bebé Carpincho'}
            {mascot.evolution_stage === 'young' && 'Carpincho Joven'}
            {mascot.evolution_stage === 'adult' && 'Carpincho Adulto'}
            {mascot.evolution_stage === 'elder' && 'Carpincho Sabio'}
            {mascot.evolution_stage === 'master' && 'Maestro Carpincho'}
          </p>
        </div>
        <div className="text-4xl">{stateEmoji}</div>
      </div>

      {/* Mascot Display */}
      <div className="text-center my-6">
        <div className={`text-8xl transition-transform duration-300 ${
          mascot.state === 'celebrating' ? 'animate-bounce' : ''
        } ${
          mascot.state === 'evolving' ? 'animate-spin' : ''
        }`}>
          {mascotIcon}
        </div>
        <div className="mt-4 text-sm italic text-muted-foreground bg-white dark:bg-gray-800 rounded-full px-4 py-2 inline-block">
          "{phrase}"
        </div>
      </div>

      {/* XP Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">XP</span>
          <span className="font-semibold text-foreground">
            {mascot.current_xp} / {mascot.xp_for_next_level}
          </span>
        </div>
        <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${mascot.xp_percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          {mascot.xp_percentage}% al siguiente nivel
        </p>
      </div>

      {/* Total XP */}
      <div className="mt-4 text-center">
        <div className="text-xs text-muted-foreground">XP Total</div>
        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
          {mascot.total_xp.toLocaleString()}
        </div>
      </div>
    </div>
  );
};