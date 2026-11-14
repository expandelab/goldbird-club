'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coffee, RefreshCw, Sparkles, User, LogOut, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { Header } from '../../components/Header';
import { LoyaltyStampCard } from '../../components/LoyaltyStampCard';
import { TierProgress } from '../../components/TierProgress';
import { DynamicQrCode } from '../../components/DynamicQrCode';
import { PwaInstallBanner } from '../../components/PwaInstallBanner';
import { GoldBirdLogo } from '../../components/GoldBirdLogo';
import { obtenerTarjetaActual, COMERCIO_PILOTO_DEFAULT, registrarOAutenticarCliente } from '../../lib/goldbird-service';
import { Cliente, Tarjeta, Comercio } from '../../lib/types';

export default function MiTarjetaPage() {
  const router = useRouter();

  // Estado inicializado por defecto para garantizar 0 pantalla blanca
  const [cliente, setCliente] = useState<Cliente>({
    id: 'cli_barranca_default',
    nombre: 'Cliente Barranca',
    email: 'cliente@barranca.pe',
    acepto_ley_29733: true,
  });

  const [tarjeta, setTarjeta] = useState<Tarjeta>({
    id: 'tarj_barranca_default',
    cliente_id: 'cli_barranca_default',
    comercio_id: COMERCIO_PILOTO_DEFAULT.id,
    sellos_actuales: 1,
    visitas_totales: 1,
    nivel_actual: 'bronce',
    premio_disponible: false,
    ultimo_sello_at: null,
  });

  const [comercio, setComercio] = useState<Comercio>(COMERCIO_PILOTO_DEFAULT);
  const [loading, setLoading] = useState<boolean>(false);

  const launchConfetti = () => {
    if (typeof window !== 'undefined') {
      import('canvas-confetti').then((module) => {
        const confettiFn = module.default;
        confettiFn({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#9333EA', '#FBBF24', '#FFFFFF'],
        });
      }).catch(() => {});
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await obtenerTarjetaActual();
      if (res.cliente && res.tarjeta) {
        setCliente(res.cliente);
        setTarjeta(res.tarjeta);
        setComercio(res.comercio);

        if (res.tarjeta.premio_disponible || res.tarjeta.sellos_actuales >= 6) {
          launchConfetti();
        }
      } else {
        // Inicializar cliente y tarjeta de demostración si entra en incógnito
        const demoRes = await registrarOAutenticarCliente({
          nombre: 'Camila Morales',
          email: 'camila@barranca.pe',
          aceptoLey: true,
        });
        setCliente(demoRes.cliente);
        setTarjeta(demoRes.tarjeta);
        setComercio(demoRes.comercio);
      }
    } catch (err) {
      console.warn('Carga local con fallback seguro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('goldbird_pilot_active_client');
    }
    router.push('/');
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-neutral-950 text-white">
      <Header
        userRole="cliente"
        userName={cliente.nombre}
        onLogout={handleLogout}
      />

      <main className="p-4 sm:p-5 space-y-5">
        {/* Banner PWA para instalar en celular */}
        <PwaInstallBanner />

        {/* Saludo al cliente con branding Gold Bird */}
        <div className="flex items-center justify-between text-left px-1">
          <div className="flex items-center gap-3">
            <GoldBirdLogo size={42} showText={false} />
            <div>
              <span className="text-[11px] text-neutral-400">Club de Fidelidad</span>
              <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                <span>{cliente.nombre}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h1>
            </div>
          </div>

          <button
            onClick={cargarDatos}
            disabled={loading}
            className="p-2.5 text-neutral-400 hover:text-amber-400 rounded-xl bg-neutral-900 border border-neutral-800 transition-colors shadow-sm"
            title="Actualizar estado de sellos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Tarjeta de Sellos (6 Sellos) */}
        <LoyaltyStampCard
          tarjeta={tarjeta}
          comercio={comercio}
        />

        {/* Código QR Dinámico Antifraude (Expira cada 3 min) */}
        <DynamicQrCode
          tarjetaId={tarjeta.id}
        />

        {/* Progreso de Niveles: Bronce -> Plata -> Oro */}
        <TierProgress
          nivelActual={tarjeta.nivel_actual}
          visitasTotales={tarjeta.visitas_totales}
          comercio={comercio}
        />

        {/* Botón de salida / cerrar sesión */}
        <div className="text-center pt-2">
          <button
            onClick={handleLogout}
            className="text-xs text-neutral-500 hover:text-neutral-300 inline-flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión en este dispositivo</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-neutral-800/80 text-center space-y-1.5 text-[11px] text-neutral-500">
        <div className="flex items-center justify-center gap-3 text-neutral-400 text-[10px]">
          <Link href="/terminos" className="hover:text-amber-400 transition-colors">Términos</Link>
          <span>•</span>
          <Link href="/privacidad" className="hover:text-amber-400 transition-colors">Privacidad Ley 29733</Link>
        </div>
        <p>¿Preguntas? Escríbenos a <a href="mailto:hola@goldbird.club" className="text-amber-400 underline">hola@goldbird.club</a></p>
      </footer>
    </div>
  );
}
