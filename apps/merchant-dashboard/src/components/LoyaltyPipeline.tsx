'use client';

import React from 'react';
import { DemoClient } from '../lib/demoData';
import { formatPEN } from '../lib/utils';
import { Award, Sparkles, Crown, Users } from 'lucide-react';

interface LoyaltyPipelineProps {
  clients: DemoClient[];
  onSelectClient?: (clientId: string) => void;
}

export const LoyaltyPipeline: React.FC<LoyaltyPipelineProps> = ({
  clients,
  onSelectClient,
}) => {
  const counts = {
    bronce: clients.filter((c) => c.tier === 'bronce').length,
    plata: clients.filter((c) => c.tier === 'plata').length,
    oro: clients.filter((c) => c.tier === 'oro').length,
  };

  const total = clients.length || 1;
  const maxCount = Math.max(counts.bronce, counts.plata, counts.oro, 1);

  // Clientes que les faltan 3 o menos consumos para completar tarjeta (10)
  const nearReward = clients
    .filter((c) => c.tier !== 'oro' && c.visits >= 7)
    .sort((a, b) => b.visits - a.visits);

  const tiers = [
    {
      key: 'bronce' as const,
      label: '🥉 Bronce',
      count: counts.bronce,
      gradient: 'linear-gradient(90deg, #8a6a3a, #c99a55)',
      desc: '0–9 consumos',
    },
    {
      key: 'plata' as const,
      label: '🥈 Plata',
      count: counts.plata,
      gradient: 'linear-gradient(90deg, #9aa3b0, #e4e9f0)',
      desc: '10–29 consumos',
    },
    {
      key: 'oro' as const,
      label: '🥇 Oro',
      count: counts.oro,
      gradient: 'linear-gradient(90deg, #00c764, #FFD95A)',
      desc: '+30 consumos',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#121824] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Pipeline de fidelización
          </h3>
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
            {total} clientes activos
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Distribución de clientes por nivel de tarjeta
        </p>
      </div>

      {/* Barras de distribución por nivel */}
      <div className="my-6 space-y-4">
        {tiers.map((t) => {
          const widthPct = Math.max(8, Math.round((t.count / maxCount) * 100));
          return (
            <div key={t.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {t.label} <span className="font-normal text-slate-400">({t.desc})</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {t.count}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{
                    width: `${widthPct}%`,
                    background: t.gradient,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: Cerca de completar tarjeta */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-400 font-medium">
          Cerca de completar tarjeta (≥ 7 sellos):
        </span>
        <span className="px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00e676] border border-emerald-500/20">
          {nearReward.length} clientes
        </span>
      </div>
    </div>
  );
};
