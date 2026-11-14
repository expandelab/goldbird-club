'use client';

import React from 'react';
import { Coffee, Gift, Check, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { Tarjeta, Comercio } from '../lib/types';

interface LoyaltyStampCardProps {
  tarjeta: Tarjeta;
  comercio: Comercio;
}

export const LoyaltyStampCard: React.FC<LoyaltyStampCardProps> = ({
  tarjeta,
  comercio,
}) => {
  const metaSellos = comercio.config_reglas?.meta_sellos || 6;
  const sellosActuales = Math.min(tarjeta.sellos_actuales, metaSellos);
  const premioDisponible = tarjeta.premio_disponible || sellosActuales >= metaSellos;
  const premioDescripcion =
    comercio.config_reglas?.premio_descripcion ||
    '1 Café Americano o Capuccino gratis (o bebida de especialidad)';

  return (
    <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden space-y-4">
      {/* Detalle visual dorado superior */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600" />

      {/* Encabezado de la Tarjeta */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500/90">
            Tarjeta de Fidelidad
          </span>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
            <span>{comercio.nombre}</span>
          </h2>
        </div>
        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold text-amber-400">
          <span>{sellosActuales}</span>
          <span className="text-amber-500/60">/</span>
          <span>{metaSellos} sellos</span>
        </div>
      </div>

      {/* Grid de 6 Sellos (2 filas de 3) */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        {Array.from({ length: metaSellos }).map((_, idx) => {
          const numSello = idx + 1;
          const isStamped = numSello <= sellosActuales;
          const isLast = numSello === metaSellos;

          return (
            <div
              key={numSello}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 relative transition-all duration-300 ${
                isStamped
                  ? isLast
                    ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-neutral-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 animate-stamp'
                    : 'bg-neutral-800/90 border border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/5'
                  : isLast
                  ? 'bg-neutral-900/80 border-2 border-dashed border-amber-500/40 text-amber-500/60'
                  : 'bg-neutral-900/50 border border-neutral-800 border-dashed text-neutral-600'
              }`}
            >
              {isStamped ? (
                isLast ? (
                  <Sparkles className="w-7 h-7 text-neutral-950 animate-pulse" />
                ) : (
                  <div className="relative">
                    <Coffee className="w-6 h-6 text-amber-400" />
                    <span className="absolute -bottom-1 -right-1 bg-amber-500 text-neutral-950 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] font-black">
                      ✓
                    </span>
                  </div>
                )
              ) : isLast ? (
                <Gift className="w-6 h-6 text-amber-500/60" />
              ) : (
                <span className="text-sm font-bold text-neutral-500">#{numSello}</span>
              )}

              <span
                className={`text-[10px] font-bold mt-1 uppercase tracking-tight ${
                  isStamped && isLast ? 'text-neutral-950' : 'text-neutral-400'
                }`}
              >
                {isLast ? 'Premio' : `Sello ${numSello}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Banner de Premio Disponible o Próximo Premio */}
      {premioDisponible ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-yellow-500/20 border border-amber-400/50 flex items-start gap-3 animate-pulse-slow">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-md">
            <Gift className="w-4 h-4 font-bold" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1">
              <span>¡Felicidades! Premio Disponible</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </h4>
            <p className="text-[12px] text-neutral-200 mt-0.5 font-medium leading-snug">
              {premioDescripcion}
            </p>
            <p className="text-[10px] text-amber-400/80 mt-1">
              Muestra tu QR en mostrador para que el barista confirme el canje de tu café.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-left flex items-start gap-2.5">
          <Gift className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-[11px] text-neutral-400">
              Completa los <strong className="text-white">{metaSellos} sellos</strong> para ganar:
            </div>
            <div className="text-xs font-semibold text-amber-300 mt-0.5">
              {premioDescripcion}
            </div>
          </div>
        </div>
      )}

      {/* Reglas e info de vigencia */}
      <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-500 border-t border-neutral-800/60">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-neutral-400" />
          <span>Vigencia: 90 días entre visitas</span>
        </span>
        <span>Máx. 1 sello cada 3 horas</span>
      </div>
    </div>
  );
};
