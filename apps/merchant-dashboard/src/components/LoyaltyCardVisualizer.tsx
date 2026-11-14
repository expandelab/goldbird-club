'use client';

import React, { useState } from 'react';
import { DemoClient } from '../lib/demoData';
import { formatPEN } from '../lib/utils';
import { Crown, Sparkles, Award, Gift, Check, ArrowRight, Zap, RefreshCw } from 'lucide-react';

interface LoyaltyCardVisualizerProps {
  clients: DemoClient[];
  selectedClientId?: string;
  onSelectClient?: (clientId: string) => void;
  onSimulateVisit?: (clientId: string) => void;
}

export const LoyaltyCardVisualizer: React.FC<LoyaltyCardVisualizerProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  onSimulateVisit,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    selectedClientId || clients.find((c) => c.tier === 'bronce' && c.visits >= 8)?.id || clients[0]?.id || 'c5'
  );

  const activeId = selectedClientId || internalSelectedId;
  const currentClient = clients.find((c) => c.id === activeId) || clients[0];

  const handleSelect = (id: string) => {
    setInternalSelectedId(id);
    if (onSelectClient) onSelectClient(id);
  };

  const isGold = currentClient?.tier === 'oro';
  const isSilver = currentClient?.tier === 'plata';
  const isBronze = currentClient?.tier === 'bronce';

  const visits = currentClient?.visits || 0;
  const maxVisits = 10;
  const visitsLeft = maxVisits - visits;
  const progressPct = isGold ? 100 : Math.min(100, Math.round((visits / maxVisits) * 100));

  // Visual themes according to Tier
  const tierStyles = {
    bronce: {
      cardBg:
        'bg-gradient-to-br from-amber-500/10 via-orange-600/5 to-amber-900/15 dark:from-[#26170d] dark:via-[#1d120a] dark:to-[#150c07]',
      border: 'border-amber-700/30 dark:border-amber-600/40',
      badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-[#E9A867] dark:border-amber-700/60',
      accent: 'text-amber-700 dark:text-[#E9A867]',
      accentBg: 'bg-amber-500',
      glow: 'shadow-[0_12px_36px_-12px_rgba(217,119,6,0.25)]',
      icon: Award,
      label: '🥉 Nivel Bronce',
      statusMsg: visitsLeft === 1 ? '¡A solo 1 consumo de liberar premio!' : `Le faltan ${visitsLeft} consumos para su premio`,
      rewardDesc: 'Acumula S/ 0.50 bloqueado por consumo · Libera S/ 5.00',
    },
    plata: {
      cardBg:
        'bg-gradient-to-br from-slate-400/15 via-slate-600/5 to-slate-800/15 dark:from-[#17202e] dark:via-[#121924] dark:to-[#0c121b]',
      border: 'border-slate-300 dark:border-slate-600/60',
      badge: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-[#C9D1DC] dark:border-slate-600',
      accent: 'text-slate-700 dark:text-[#C9D1DC]',
      accentBg: 'bg-slate-400',
      glow: 'shadow-[0_12px_36px_-12px_rgba(148,163,184,0.3)]',
      icon: Sparkles,
      label: '🥈 Nivel Plata',
      statusMsg: visitsLeft === 1 ? '¡A 1 consumo de su premio intermedio!' : `Le faltan ${visitsLeft} consumos para su premio`,
      rewardDesc: 'Acumula S/ 0.70 bloqueado por consumo · Libera S/ 7.00',
    },
    oro: {
      cardBg:
        'bg-gradient-to-br from-amber-400/20 via-yellow-500/10 to-amber-600/20 dark:from-[#2e230b] dark:via-[#201807] dark:to-[#161105]',
      border: 'border-amber-400/70 dark:border-[#FFD95A]/60',
      badge: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-[#FFD95A] dark:border-amber-500/60',
      accent: 'text-amber-600 dark:text-[#F5C542]',
      accentBg: 'bg-gradient-to-r from-[#F5C542] to-[#FFD95A]',
      glow: 'shadow-[0_12px_40px_-10px_rgba(245,197,66,0.35)]',
      icon: Crown,
      label: '👑 Nivel Oro VIP',
      statusMsg: '¡Cliente Top Tier! Saldo disponible al instante en cada compra',
      rewardDesc: '+S/ 1.00 directo y disponible en cada consumo sin tarjeta',
    },
  }[currentClient?.tier || 'bronce'];

  const TierIcon = tierStyles.icon;

  return (
    <div className="space-y-4">
      {/* Selector de Cliente para interactuar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Visualizador de Tarjeta Digital de Cliente</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00e676] border border-emerald-500/20">
              Interactivo
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selecciona un cliente para inspeccionar el diseño de su tarjeta según su nivel
          </p>
        </div>

        {/* Chips de selección rápida */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-[#121824] rounded-xl border border-slate-200 dark:border-slate-800">
          {clients.map((c) => {
            const isAct = c.id === currentClient?.id;
            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                type="button"
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  isAct
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    c.tier === 'oro'
                      ? 'bg-amber-400'
                      : c.tier === 'plata'
                      ? 'bg-slate-400'
                      : 'bg-amber-600'
                  }`}
                />
                <span>{c.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-70">
                  {c.tier === 'oro' ? 'VIP' : `${c.visits}/10`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tarjeta Digital Interactiva */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 border transition-all duration-300 ${tierStyles.cardBg} ${tierStyles.border} ${tierStyles.glow}`}
      >
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-white/5 dark:bg-white/[0.03] blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-36 h-36 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header de la Tarjeta */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-slate-700/60 flex items-center justify-center font-mono font-bold text-base text-white shadow-md">
                {currentClient.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-black text-lg text-slate-900 dark:text-white tracking-tight">
                    {currentClient.name}
                  </h4>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                    {currentClient.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Café Alma — Barranco · {currentClient.totalVisits} consumos acumulados
                </p>
              </div>
            </div>

            {/* Badge de Nivel */}
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-sm ${tierStyles.badge}`}>
              <TierIcon className="w-3.5 h-3.5" />
              <span>{tierStyles.label}</span>
            </div>
          </div>

          {/* Punch Card Tracker (10 Sellos) - Para Bronce y Plata */}
          {!isGold ? (
            <div className="space-y-3 bg-white/60 dark:bg-black/20 p-4 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold tracking-wider uppercase text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e676]" />
                  <span>Tarjeta de 10 Consumos</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  <span className="text-emerald-600 dark:text-[#00e676]">{visits}</span> / {maxVisits} consumos
                </span>
              </div>

              {/* Grid de 10 Sellos Circulares */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {Array.from({ length: maxVisits }).map((_, idx) => {
                  const isFilled = idx < visits;
                  const isTenth = idx === 9;
                  return (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300 border ${
                        isFilled
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_12px_rgba(0,230,118,0.35)] dark:bg-[#00e676] dark:text-[#0b0f17] dark:border-[#00e676]'
                          : isTenth
                          ? 'bg-amber-500/10 border-dashed border-amber-400/60 text-amber-600 dark:text-[#FFD95A]'
                          : 'bg-slate-200/50 dark:bg-slate-800/60 border-slate-300/50 dark:border-slate-700/50 text-slate-400'
                      }`}
                    >
                      {isFilled ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : isTenth ? (
                        <Gift className="w-4 h-4 animate-pulse" />
                      ) : (
                        <span className="text-xs font-mono font-medium">{idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Barra de progreso continua */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-[#00e676] dark:to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">{tierStyles.statusMsg}</span>
                <span>{progressPct}% completado</span>
              </div>
            </div>
          ) : (
            /* Vista Especial Nivel Oro VIP */
            <div className="bg-amber-400/10 dark:bg-amber-500/10 border border-amber-400/30 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500 dark:text-[#FFD95A]" />
                  <span className="font-bold text-sm text-slate-900 dark:text-[#FFD95A]">
                    Pase Ilimitado Oro VIP
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {tierStyles.rewardDesc}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  Beneficio VIP
                </span>
                <div className="font-mono font-black text-sm text-amber-600 dark:text-[#FFD95A]">
                  S/ 1.00 / consumo
                </div>
              </div>
            </div>
          )}

          {/* Saldos Bloqueado vs. Disponible */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/80 dark:bg-[#121824]/90 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Saldo Bloqueado
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono">
                  EM.R
                </span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {formatPEN(currentClient.lockedBalance)}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                {isGold ? 'No aplica (Oro directo)' : 'Se libera al completar 10 sellos'}
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#121824]/90 p-3.5 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-[#00e676]">
                  Saldo Disponible
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-[#00e676] font-mono">
                  Canjeable
                </span>
              </div>
              <div className="text-xl font-black font-mono text-emerald-600 dark:text-[#00e676] mt-1">
                {formatPEN(currentClient.availableBalance)}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Listo para descontar en cuenta
              </p>
            </div>
          </div>

          {/* Botón de acción para simular consumo en vivo */}
          <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Prueba la reacción del motor de fidelización:
            </span>
            <button
              onClick={() => onSimulateVisit && onSimulateVisit(currentClient.id)}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-[#00e676] dark:hover:bg-[#00c764] dark:text-[#0b0f17] transition-all shadow-sm active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Simular +1 Consumo (S/ 35.00)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
