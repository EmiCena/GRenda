// src/components/chatbot/ConversationModeSelector.tsx (CREAR)

import React from 'react';
import { ConversationMode } from '../../types';
import { Card } from '../ui/Card';

interface ConversationModeSelectorProps {
  modes: ConversationMode[];
  selectedMode: number | null;
  onSelectMode: (modeId: number | null) => void;
}

export const ConversationModeSelector: React.FC<ConversationModeSelectorProps> = ({
  modes,
  selectedMode,
  onSelectMode,
}) => {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        Elige un modo de conversación:
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Modo libre */}
        <button
          onClick={() => onSelectMode(null)}
          className={`p-3 rounded-lg border-2 transition-all ${
            selectedMode === null
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="text-2xl mb-1">💬</div>
          <div className="text-xs font-medium">Libre</div>
        </button>

        {/* Modos específicos */}
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedMode === mode.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
            title={mode.description}
          >
            <div className="text-2xl mb-1">{mode.icon}</div>
            <div className="text-xs font-medium line-clamp-1">
              {mode.name.charAt(0) + mode.name.slice(1).toLowerCase().replace('_', ' ')}
            </div>
          </button>
        ))}
      </div>

      {/* Descripción del modo seleccionado */}
      {selectedMode && modes.find((m) => m.id === selectedMode) && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            {modes.find((m) => m.id === selectedMode)?.description}
          </p>
        </div>
      )}
    </div>
  );
};