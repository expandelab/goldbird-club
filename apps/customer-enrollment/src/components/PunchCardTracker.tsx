'use client';

import React from 'react';
import { Sparkles, Check, Gift } from 'lucide-react';
import { RewardType } from '@expandemoney/shared-types';

interface PunchCardTrackerProps {
  currentCycleVisits: number; // 0 a 10 sellos
  merchantName: string;
  rewardTitle?: string;
  minSpendForStamp?: number;
}

export const PunchCardTracker: React.FC<PunchCardTrackerProps> = ({
  currentCycleVisits,
  merchantName,
  rewardTitle = 'Desayuno Completo o Postre Artesanal Gratis',
  minSpendForStamp = 30.0,
}) => {
  const totalSlots = 10;
  const visits = Math.min(Math.max(currentCycleVisits, 0), totalSlots);
  const remaining = totalSlots - visits;

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Tarjeta de 10 Consumos</h3>
            <p className="text-[11px] text-slate-500">
              1 sello con cada consumo de <strong>S/ {minSpendForStamp.toFixed(2)}</strong> en local
            </p>
          </div>
        </div>

        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          {visits}/10 Sellos
        </span>
      </div>

      {/* Grid de 10 Sellos */}
      <div className="grid grid-cols-5 gap-2.5 pt-1">
        {Array.from({ length: totalSlots }).map((_, index) => {
          const slotNumber = index + 1;
          const isCompleted = slotNumber <= visits;
          const isMilestone = slotNumber === 10;

          return (
            <div
              key={slotNumber}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all ${
                isCompleted
                  ? isMilestone
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 border-dashed'
              }`}
            >
              {isCompleted ? (
                isMilestone ? (
                  <Sparkles className="w-5 h-5 animate-pulse" />
                ) : (
                  <Check className="w-5 h-5 stroke-[3]" />
                )
              ) : isMilestone ? (
                <Gift className="w-4 h-4 text-amber-500" />
              ) : (
                <span className="text-xs font-bold">{slotNumber}</span>
              )}

              <span className="text-[9px] font-semibold mt-0.5 opacity-90">
                {isMilestone ? 'PREMIO' : `#${slotNumber}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Banner del premio configurable EM.R */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 text-xs text-slate-700 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-emerald-900">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Premio al completar tu 10º sello:</span>
        </div>
        <p className="text-[11px] text-emerald-950 font-medium pl-5">
          {rewardTitle}
        </p>
        <p className="text-[10px] text-slate-500 pl-5">
          {remaining === 0
            ? '¡Felicidades! Tu premio ya está listo para canjear en caja.'
            : `Te faltan solo ${remaining} consumo${remaining > 1 ? 's' : ''} calificados para desbloquearlo.`}
        </p>
      </div>
    </div>
  );
};
