"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalizadorUsuariosSocial from '../components/AnalizadorUsuariosSocial';

export default function AnalizadorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      router.push('/loginregister');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    router.push('/loginregister');
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Sistema de identificación de usuarios Reales y Bots en la era de la IA</h1>
      <AnalizadorUsuariosSocial onLogout={handleLogout} />
    </div>
  );
}
