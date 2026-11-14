'use client';

import React, { useEffect, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { RefreshCw, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { generarTokenQR } from '../lib/goldbird-service';

interface DynamicQrCodeProps {
  tarjetaId: string;
  onTokenChange?: (token: string) => void;
}

export const DynamicQrCode: React.FC<DynamicQrCodeProps> = ({
  tarjetaId,
  onTokenChange,
}) => {
  const [token, setToken] = useState<string>('');
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(180);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshedFlash, setRefreshedFlash] = useState<boolean>(false);

  const refreshQR = useCallback(async () => {
    if (!tarjetaId) return;
    setLoading(true);
    try {
      const res = await generarTokenQR(tarjetaId);
      setToken(res.token);
      setSecondsLeft(res.expiresInSeconds || 180);
      onTokenChange?.(res.token);

      const url = await QRCode.toDataURL(res.token, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#09090b',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
      setQrImageUrl(url);

      setRefreshedFlash(true);
      setTimeout(() => setRefreshedFlash(false), 800);
    } catch (err) {
      console.error('Error generando QR dinámico:', err);
    } finally {
      setLoading(false);
    }
  }, [tarjetaId, onTokenChange]);

  // Carga inicial
  useEffect(() => {
    refreshQR();
  }, [refreshQR]);

  // Contador regresivo
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          refreshQR();
          return 180;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshQR]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progressPct = ((180 - secondsLeft) / 180) * 100;
  const isExpiringSoon = secondsLeft <= 30;

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 shadow-xl text-center flex flex-col items-center relative overflow-hidden">
      {/* Fondo con brillo sutil */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Cabecera del QR */}
      <div className="w-full flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>QR Dinámico Antifraude</span>
        </div>
        <div
          className={`flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded-full text-[11px] transition-colors ${
            isExpiringSoon
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
              : 'bg-neutral-800 text-amber-400 border border-neutral-700'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Contenedor del Código QR */}
      <div
        className={`relative p-3 bg-white rounded-2xl shadow-inner transition-all duration-300 ${
          refreshedFlash ? 'ring-4 ring-amber-400/80 scale-[1.02]' : 'ring-1 ring-neutral-700'
        }`}
      >
        {loading && !qrImageUrl ? (
          <div className="w-56 h-56 flex flex-col items-center justify-center text-neutral-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs">Cifrando token...</span>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={qrImageUrl}
            alt="Código QR de fidelización Gold Bird"
            className="w-56 h-56 rounded-lg block select-none"
          />
        )}
      </div>

      {/* Barra de progreso de expiración */}
      <div className="w-full mt-4 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isExpiringSoon
              ? 'bg-rose-500'
              : 'bg-gradient-to-r from-amber-500 to-yellow-400'
          }`}
          style={{ width: `${100 - progressPct}%` }}
        />
      </div>

      {/* Mensaje de instrucciones y botón manual de refresco */}
      <div className="w-full flex items-center justify-between mt-3 text-[11px] text-neutral-400">
        <span className="text-left text-neutral-400">
          Muestra este código al barista para sumar tu sello.
        </span>
        <button
          onClick={refreshQR}
          disabled={loading}
          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium px-2 py-1 rounded-md hover:bg-neutral-800 transition-colors shrink-0 disabled:opacity-50"
          title="Generar nuevo QR"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refrescar</span>
        </button>
      </div>
    </div>
  );
};
