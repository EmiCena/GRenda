import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { View } from '../types';
import { Switch } from './Switch';

interface HeaderProps {
    currentView: View;
    setView: (view: View) => void;
}

const NavItem: React.FC<{
    view: View;
    currentView: View;
    setView: (view: View) => void;
    children: React.ReactNode;
}> = ({ view, currentView, setView, children }) => {
    const isActive = currentView === view;
    return (
        <button
            onClick={() => setView(view)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-primary/10 text-primary dark:text-primary'
                    : 'text-muted-foreground hover:bg-secondary/80 dark:hover:bg-secondary/20'
            }`}
        >
            {children}
        </button>
    );
};


export const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
    const { user, logout, theme, toggleTheme, toggleRole } = useAppContext();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 flex items-center gap-2">
                             <h1 className="text-xl font-bold text-primary">Guaraní Renda</h1>
                             {user?.role === 'admin' && (
                                <span className="px-2 py-0.5 text-xs font-bold text-destructive-foreground bg-destructive rounded-md">ADMIN</span>
                             )}
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                               <NavItem view="DASHBOARD" currentView={currentView} setView={setView}>Dashboard</NavItem>
                               <NavItem view="LESSONS" currentView={currentView} setView={setView}>Lecciones</NavItem>
                               <NavItem view="GLOSSARY" currentView={currentView} setView={setView}>Glosario</NavItem>
                               <NavItem view="CHATBOT" currentView={currentView} setView={setView}>Chatbot</NavItem>
                               {user?.role === 'admin' && (
                                   <NavItem view="ADMIN" currentView={currentView} setView={setView}>Admin</NavItem>
                               )}
                            </div>
                        </div>
                    </div>
                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setIsDropdownOpen(prev => !prev)}
                            className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-background"
                            aria-haspopup="true"
                            aria-expanded={isDropdownOpen}
                        >
                             <img className="h-9 w-9 rounded-full" src={user?.avatarUrl} alt="User avatar" />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-card py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-border">
                                <div className="px-4 py-3">
                                    <p className="text-sm text-muted-foreground">Sesión iniciada como</p>
                                    <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
                                </div>
                                <div className="border-t border-border"></div>
                                <div className="py-1">
                                    <div className="flex items-center justify-between px-4 py-2 text-sm text-foreground">
                                        <span>{theme === 'dark' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}</span>
                                        <Switch id="theme-switch" checked={theme === 'dark'} onChange={toggleTheme} />
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2 text-sm text-foreground">
                                        <span>Modo Admin</span>
                                        <Switch id="role-switch" checked={user?.role === 'admin'} onChange={toggleRole} />
                                    </div>
                                </div>
                                <div className="border-t border-border"></div>
                                <div className="py-1">
                                    <button 
                                        onClick={() => { logout(); setIsDropdownOpen(false); }} 
                                        className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary/80 dark:hover:bg-secondary/20"
                                    >
                                       Salir
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};