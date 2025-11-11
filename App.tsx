import React, { useState } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { View } from './types';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LessonView } from './components/LessonView';
import { Glossary } from './components/Glossary';
import { ChatbotImproved } from './components/chatbot/ChatbotImproved';
import { Footer } from './components/Footer';
import { AdminView } from './components/admin/AdminView';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAppContext();
  const [view, setView] = useState<View>('DASHBOARD');

  if (isLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    switch (view) {
      case 'DASHBOARD':
        return <Dashboard setView={setView} />;  // ✅ AGREGADO
      case 'LESSONS':
        return <LessonView setView={setView} />;  // ✅ Si LessonView también lo necesita
      case 'GLOSSARY':
        return <Glossary setView={setView} />;  // ✅ Si Glossary también lo necesita
      case 'CHATBOT':
        return <ChatbotImproved />;  // ✅ Si Chatbot también lo necesita
      case 'ADMIN':
        return user.role === 'admin' ? <AdminView setView={setView} /> : <Dashboard setView={setView} />;
      case 'PROFILE':
      default:
        return <Dashboard setView={setView} />;  // ✅ AGREGADO
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header currentView={view} setView={setView} />
      <main className="flex-grow">
        {renderView()}
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;