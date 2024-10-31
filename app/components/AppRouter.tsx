"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginRegister from './LoginRegister';
import AnalizadorUsuariosSocial from './AnalizadorUsuariosSocial';

const AppRouter: React.FC = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null); // Estado para almacenar el token
  const [loading, setLoading] = useState(true); // Estado de carga

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken'); // Obtener el token del localStorage
    setToken(storedToken); // Actualizar el estado con el token
    setLoading(false); // Cambiar el estado de carga
  }, []);

  // Si aún se está cargando, no renderizar nada
  if (loading) {
    return <div>Cargando...</div>; // Puedes mostrar un spinner o un mensaje de carga
  }

  // Si no hay token, renderizar LoginRegister
  if (!token) {
    return <LoginRegister />;
  }

  // Si hay token, renderizar AnalizadorUsuariosSocial
  return (
    <AnalizadorUsuariosSocial onLogout={() => {
      localStorage.removeItem('authToken'); // Eliminar el token al cerrar sesión
      setToken(null); // Actualizar el estado del token
      router.push('/loginregister'); // Redirigir a la página de login
    }} />
  );
};

export default AppRouter;
