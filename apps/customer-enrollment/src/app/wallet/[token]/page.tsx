'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { GoldBirdLogo } from '../../../components/GoldBirdLogo';

export default function WalletTokenRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token;

  useEffect(() => {
    // Redirigir suavemente a /mi-tarjeta
    const timeout = setTimeout(() => {
      router.replace('/mi-tarjeta');
    }, 600);

    return () => clearTimeout(timeout);
  }, [router, token]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-6 text-center space-y-4 min-h-screen bg-neutral-950 text-white">
      <GoldBirdLogo size={80} showText={false} />
      <div className="flex items-center gap-2 text-amber-400">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span className="text-xs font-semibold">Cargando tu tarjeta Gold Bird...</span>
      </div>
      <p className="text-[11px] text-neutral-400 max-w-xs">
        Abriendo la tarjeta digital y sincronizando tus sellos acumulados en Cafetería Barranca.
      </p>
    </div>
  );
}
