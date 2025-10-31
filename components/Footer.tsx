import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl py-4 px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} Guaraní Renda. Todos los derechos reservados.</p>
        <p className="mt-1">Hecho con ❤️ y IA por entusiastas del Guaraní.</p>
      </div>
    </footer>
  );
};