// src/components/Login.tsx (REEMPLAZAR COMPLETO)

import React, { useState } from 'react';
import { apiLogin, apiRegister } from '../services/api';
import { useAppContext } from '../contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Label } from './ui/Label';

type FormMode = 'login' | 'register';

export const Login: React.FC = () => {
  const { login } = useAppContext();
  const [mode, setMode] = useState<FormMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });
  
  // Register form
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(loginData);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones frontend
    if (registerData.password !== registerData.password2) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (registerData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiRegister(registerData);
      
      // Auto-login después del registro
      await login({
        username: registerData.username,
        password: registerData.password,
      });
    } catch (err: any) {
      setError(err.message || 'Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🦫</div>
          <CardTitle className="text-3xl font-bold text-primary">
            Guaraní Renda
          </CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? 'Inicia sesión para continuar aprendiendo' 
              : 'Crea una cuenta para comenzar tu viaje'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                mode === 'register'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-username">Usuario</Label>
                <Input
                  id="login-username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="tu_usuario"
                  required
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="login-password">Contraseña</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !loginData.username || !loginData.password}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reg-firstname">Nombre *</Label>
                  <Input
                    id="reg-firstname"
                    type="text"
                    value={registerData.first_name}
                    onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                    placeholder="Juan"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="reg-lastname">Apellido</Label>
                  <Input
                    id="reg-lastname"
                    type="text"
                    value={registerData.last_name}
                    onChange={(e) => setRegisterData({ ...registerData, last_name: e.target.value })}
                    placeholder="Pérez"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reg-username">Usuario *</Label>
                <Input
                  id="reg-username"
                  type="text"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  placeholder="juanperez"
                  required
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="reg-email">Correo Electrónico *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  placeholder="juan@ejemplo.com"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="reg-password">Contraseña *</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="reg-password2">Confirmar Contraseña *</Label>
                <Input
                  id="reg-password2"
                  type="password"
                  value={registerData.password2}
                  onChange={(e) => setRegisterData({ ...registerData, password2: e.target.value })}
                  placeholder="Repite la contraseña"
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={
                  isLoading || 
                  !registerData.username || 
                  !registerData.email || 
                  !registerData.password || 
                  !registerData.password2 ||
                  !registerData.first_name
                }
              >
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Al continuar, aceptas nuestros términos de servicio</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};