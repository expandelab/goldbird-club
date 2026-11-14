'use client';

import React from 'react';
import { Award, ChevronRight, Sparkles, Star } from 'lucide-react';
import { NivelFidelidad, Comercio } from '../lib/types';

interface TierProgressProps {
  nivelActual: NivelFidelidad;
  visitasTotales: number;
  comercio: Comercio;
}

export const TierProgress: React.FC<TierProgressProps> = ({
  nivelActual,
  visitasTotales,
  comercio,
}) => {
  const nivelesConfig = comercio.config_reglas?.niveles || {
    bronce: {
      nombre: 'Bronce',
      min_visitas: 0,
      max_visitas: 6,
      beneficio: 'Bienvenida al club de sellos + 1 café gratis al completar tu 1ra tarjeta',
    },
    plata: {
      nombre: 'Plata',
      min_visitas: 7,
      max_visitas: 30,
      beneficio: 'Saldo a favor para consumo + 3% dcto. permanente en el local',
    },
    oro: {
      nombre: 'Oro',
      min_visitas: 31,
      max_visitas: 999999,
      beneficio: 'Saldo a favor para consumo + 5% dcto. permanente + catas y eventos exclusivos',
    },
  };

  let nextNivelNombre = '';
  let visitasParaSiguiente = 0;
  let progressPct = 100;

  if (nivelActual === 'bronce') {
    nextNivelNombre = 'Plata';
    visitasParaSiguiente = Math.max(0, 7 - visitasTotales);
    progressPct = Math.min(100, Math.round((visitasTotales / 7) * 100));
  } else if (nivelActual === 'plata') {
    nextNivelNombre = 'Oro';
    visitasParaSiguiente = Math.max(0, 31 - visitasTotales);
    progressPct = Math.min(100, Math.round(((visitasTotales - 7) / (31 - 7)) * 100));
  } else {
    nextNivelNombre = 'Nivel Máximo (Oro)';
    visitasParaSiguiente = 0;
    progressPct = 100;
  }

  const getTierBadge = () => {
    switch (nivelActual) {
      case 'oro':
        return {
          title: 'Nivel Oro',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          gradient: 'from-amber-400 via-yellow-300 to-amber-500',
        };
      case 'plata':
        return {
          title: 'Nivel Plata',
          bg: 'bg-slate-400/20 text-slate-200 border-slate-300/40',
          gradient: 'from-slate-200 via-neutral-100 to-slate-400',
        };
      case 'bronce':
      default:
        return {
          title: 'Nivel Bronce',
          bg: 'bg-orange-600/20 text-amber-500 border-orange-500/30',
          gradient: 'from-amber-600 to-orange-500',
        };
    }
  };

  const badge = getTierBadge();
  const currentBenefit = nivelesConfig[nivelActual]?.beneficio;

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 shadow-lg space-y-3.5">
      {/* Header del Nivel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl border ${badge.bg}`}>
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
              Membresía por Visitas
            </span>
            <h3 className="text-sm font-black text-white capitalize">{badge.title}</h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-white">{visitasTotales}</span>
          <span className="text-[11px] text-neutral-400 ml-1">visitas</span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-1.5">
        <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${badge.gradient} transition-all duration-700`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span>{nivelActual.toUpperCase()}</span>
          {visitasParaSiguiente > 0 ? (
            <span className="text-amber-400/90 font-medium">
              Faltan {visitasParaSiguiente} visitas para {nextNivelNombre}
            </span>
          ) : (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Máximo Nivel Alcanzado
            </span>
          )}
        </div>
      </div>

      {/* Beneficio actual */}
      <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-left text-xs space-y-1">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wide">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>Beneficio de tu nivel actual:</span>
        </div>
        <p className="text-neutral-300 text-[11px] leading-relaxed pl-5">
          {currentBenefit}
        </p>
      </div>
    </div>
  );
};
