"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

const LoginRegister: React.FC = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Estado de carga

  const validateEmail = (email: string) => {
    // Expresión regular para validar el formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true); // Iniciar carga

    // Validaciones
    if (isLogin) {
      if (!username || !password) {
        setError('Por favor, completa todos los campos.');
        setLoading(false); // Detener carga
        return;
      }
    } else {
      if (!username || !email || !password) {
        setError('Por favor, completa todos los campos.');
        setLoading(false); // Detener carga
        return;
      }
      // Validar el formato del correo electrónico
      if (!validateEmail(email)) {
        setError('Por favor, ingresa un correo electrónico válido.');
        setLoading(false); // Detener carga
        return;
      }
    }

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const data = isLogin ? { username, password } : { username, email, password };
      const response = await axios.post(endpoint, data);
      
      // Almacenar el token y el nombre de usuario en localStorage
      if (isLogin) {
        localStorage.setItem('authToken', response.data.token); // Asegúrate de que tu API devuelva un token
        localStorage.setItem('username', username); // Almacenar el nombre de usuario
      }

      router.push('/analizador'); // Redirigir al analizador
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Error al procesar la solicitud');
      } else {
        setError('Error al procesar la solicitud');
      }
    } finally {
      setLoading(false); // Detener carga
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-4"
            required // Añadir requerimiento
          />
          {!isLogin && (
            <Input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4"
              required // Añadir requerimiento
            />
          )}
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
            required // Añadir requerimiento
          />
          <Button type="submit" className="w-full mb-4" disabled={loading}>
            {loading ? 'Cargando...' : (isLogin ? 'Entrar' : 'Registrarse')}
          </Button>
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-blue-500 hover:underline">
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </form>
        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default LoginRegister;
