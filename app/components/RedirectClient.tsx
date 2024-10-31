"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const RedirectClient = () => {
  const router = useRouter();

  useEffect(() => {

    if (window.location.pathname === '/') {
      router.push('/analizador');
    }
  }, [router]);

  return null;
};

export default RedirectClient;
