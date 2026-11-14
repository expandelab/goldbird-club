'use client';

import React from 'react';
import { LoyaltyTier } from '@expandemoney/shared-types';
import { formatPEN } from '../lib/utils';
import { Sparkles, Award, Crown, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';

interface DigitalWalletPassProps {
  merchantName: string;
  customerName: string;
  tier: LoyaltyTier;
  availableBalance: number;
  totalVisits: number;
  currentCycleVisits: number;
  brandColor?: string;
  branchName?: string;
}

export const DigitalWalletPass: React.FC<DigitalWalletPassProps> = ({
  merchantName,
  customerName,
  tier,
  availableBalance,
  totalVisits,
  currentCycleVisits,
  brandColor = '#059669',
  branchName = 'Barranco',
}) => {
  const getTierDetails = (t: LoyaltyTier) => {
    switch (t) {
      case 'oro':
        return {
          label: 'NIVEL ORO',
          subtitle: 'Top Tier / VIP (> 30 Consumos)',
          perk: 'Experiencias VIP y reservas exclusivas',
          bgGradient: 'from-amber-600 via-yellow-700 to-amber-950',
          badgeBg: 'bg-amber-300 text-amber-950',
          icon: Crown,
        };
      case 'plata':
        return {
          label: 'NIVEL PLATA',
          subtitle: 'Intermedio (10 a 30 Consumos)',
          perk: 'Canje de cupones de fidelidad del local',
          bgGradient: 'from-slate-700 via-slate-800 to-slate-950',
          badgeBg: 'bg-slate-200 text-slate-900',
          icon: Award,
        };
      case 'bronce':
      default:
        return {
          label: 'NIVEL BRONCE',
          subtitle: 'Nivel Inicial (1 a 9 Consumos)',
          perk: '1 Sello por cada consumo de S/ 30',
          bgGradient: 'from-orange-800 via-amber-900 to-stone-950',
          badgeBg: 'bg-orange-300 text-orange-950',
          icon: CheckCircle2,
        };
    }
  };

  const tierInfo = getTierDetails(tier);
  const TierIcon = tierInfo.icon;

  return (
    <div className={`w-full rounded-3xl p-6 bg-gradient-to-br ${tierInfo.bgGradient} text-white shadow-2xl relative overflow-hidden border border-white/20 select-none`}>
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Top row: Merchant & Tier Badge */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/70 block">
            Pase de Fidelización Web
          </span>
          <h2 className="text-xl font-black tracking-tight mt-0.5">{merchantName}</h2>
          <div className="flex items-center gap-1 text-[11px] text-white/80 mt-0.5">
            <MapPin className="w-3 h-3 text-emerald-300" />
            <span>Sede {branchName}</span>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm ${tierInfo.badgeBg}`}>
          <TierIcon className="w-3.5 h-3.5" />
          <span>{tierInfo.label}</span>
        </div>
      </div>

      {/* Center: Progreso de Sellos y Consumos */}
      <div className="mt-7 grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
          <span className="text-[11px] text-white/80 font-medium block">Sellos del Ciclo</span>
          <div className="text-2xl font-black mt-1 text-emerald-300 font-mono">
            {currentCycleVisits}/10
          </div>
          <span className="text-[10px] text-white/70 block mt-0.5">Consumos calificados</span>
        </div>

        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
          <span className="text-[11px] text-white/80 font-medium block">Total Histórico</span>
          <div className="text-2xl font-black mt-1 text-white font-mono">
            {totalVisits}
          </div>
          <span className="text-[10px] text-white/70 block mt-0.5">Consumos en local</span>
        </div>
      </div>

      {/* Beneficio del nivel actual */}
      <div className="mt-4 p-2.5 bg-black/25 rounded-xl border border-white/10 text-[11px] text-white/90 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span>{tierInfo.perk}</span>
      </div>

      {/* Bottom row: Titular */}
      <div className="mt-5 pt-3 border-t border-white/15 flex items-center justify-between text-xs relative z-10">
        <div>
          <span className="text-[10px] text-white/60 uppercase tracking-wider block">Titular del Pase</span>
          <span className="font-bold text-white text-sm tracking-tight">{customerName}</span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-white/60 uppercase tracking-wider block">Nivel Actual</span>
          <span className="font-bold text-amber-200 text-xs tracking-tight">
            {tierInfo.subtitle}
          </span>
        </div>
      </div>
    </div>
  );
};
