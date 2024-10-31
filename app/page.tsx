"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalizadorUsuariosSocial from './components/AnalizadorUsuariosSocial';
import LoginRegister from './components/LoginRegister';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (token) {
      setIsAuthenticated(true);
    } else {
      router.push('/loginregister');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      {isAuthenticated ? (
        <AnalizadorUsuariosSocial />
      ) : (
        <LoginRegister />
      )}
    </div>
  );
}
