'use client';

import React from 'react';
import { formatPEN } from '../lib/utils';
import { Users, UserCheck, ArrowUpRight } from 'lucide-react';

interface AverageTicketCardProps {
  recurrentAmount?: number;
  newCustomerAmount?: number;
}

export const AverageTicketCard: React.FC<AverageTicketCardProps> = ({
  recurrentAmount = 44.58,
  newCustomerAmount = 45.71,
}) => {
  const max = Math.max(recurrentAmount, newCustomerAmount, 1);
  const recPct = (recurrentAmount / max) * 100;
  const newPct = (newCustomerAmount / max) * 100;

  return (
    <div className="bg-white dark:bg-[#121824] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Ticket promedio
          </h3>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
            Comparativa
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Cliente recurrente vs. cliente nuevo
        </p>
      </div>

      <div className="my-6 space-y-4">
        {/* Cliente Recurrente */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e676]" />
              <span>Cliente recurrente</span>
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-[#00e676] text-sm">
              {formatPEN(recurrentAmount)}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-[#00e676] dark:to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${recPct}%` }}
            />
          </div>
        </div>

        {/* Cliente Nuevo */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Cliente nuevo</span>
            </span>
            <span className="font-mono font-bold text-slate-600 dark:text-slate-400 text-sm">
              {formatPEN(newCustomerAmount)}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-400 dark:bg-slate-600 rounded-full transition-all duration-500"
              style={{ width: `${newPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Frecuencia media: <strong>2.8 visitas/mes</strong></span>
        <span className="text-emerald-600 dark:text-[#00e676] font-medium">+18% retención</span>
      </div>
    </div>
  );
};
