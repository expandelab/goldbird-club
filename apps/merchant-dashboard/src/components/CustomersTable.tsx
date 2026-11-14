'use client';

import React, { useState } from 'react';
import { formatPEN } from '../lib/utils';
import { Award, Sparkles, Crown, Search, PlusCircle } from 'lucide-react';

interface CustomersTableProps {
  customers: any[];
  isLoading?: boolean;
  onRegisterSpend?: (client: any) => void;
}

export const CustomersTable: React.FC<CustomersTableProps> = ({
  customers,
  isLoading,
  onRegisterSpend,
}) => {
  const [tierFilter, setTierFilter] = useState<'all' | 'bronce' | 'plata' | 'oro'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = customers.filter((c) => {
    const tier = (c.tier || c.current_tier || 'bronce').toLowerCase();
    const name = (c.name || c.full_name || '').toLowerCase();
    const code = (c.code || c.phone || '').toLowerCase();
    const matchesTier = tierFilter === 'all' || tier === tierFilter;
    const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase()) || code.includes(searchTerm.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const getInitials = (name?: string) => {
    if (!name) return 'CL';
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0] || '')
      .join('')
      .toUpperCase();
  };

  const getTierBadge = (tier: string) => {
    const t = (tier || 'bronce').toLowerCase();
    if (t === 'oro') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-[#FFD95A] border border-amber-300 dark:border-amber-700/60">
          <Crown className="w-3 h-3 text-amber-600 dark:text-[#FFD95A]" />
          Oro VIP
        </span>
      );
    }
    if (t === 'plata') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-[#C9D1DC] border border-slate-300 dark:border-slate-600">
          <Sparkles className="w-3 h-3 text-slate-500" />
          Plata
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-orange-100 text-orange-900 dark:bg-amber-950/60 dark:text-[#E9A867] border border-orange-200 dark:border-amber-800/50">
        <Award className="w-3 h-3 text-amber-600" />
        Bronce
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-200">
      {/* Filtros superiores */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'bronce', label: '🥉 Bronce' },
            { id: 'plata', label: '🥈 Plata' },
            { id: 'oro', label: '🥇 Oro' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTierFilter(item.id as any)}
              type="button"
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                tierFilter === item.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
            {filtered.length} clientes
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
            <tr>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Nivel</th>
              <th className="py-3 px-4 text-center">Tarjeta (10 Sellos)</th>
              <th className="py-3 px-4 text-right">Saldo Bloqueado</th>
              <th className="py-3 px-4 text-right">Saldo Disponible</th>
              <th className="py-3 px-4 text-center">Visitas Totales</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  Cargando clientes...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  Sin clientes coincidentes con el filtro.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const name = c.name || c.full_name;
                const code = c.code || c.phone;
                const tier = (c.tier || c.current_tier || 'bronce').toLowerCase();
                const visits = c.visits ?? c.current_cycle_visits ?? 0;
                const totalVisits = c.totalVisits ?? c.total_visits ?? visits;
                const locked = c.lockedBalance ?? c.locked_balance ?? 0;
                const available = c.availableBalance ?? c.available_balance ?? 0;
                const isGold = tier === 'oro';

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                          {c.avatar || getInitials(name)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {name}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            {code}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getTierBadge(tier)}</td>

                    <td className="py-3.5 px-4 text-center">
                      {isGold ? (
                        <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                          Sin tarjeta (VIP)
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 dark:bg-[#00e676] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (visits / 10) * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {visits}/10
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-500 dark:text-slate-400">
                      {formatPEN(isGold ? 0 : locked)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-[#00e676]">
                      {formatPEN(available)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {totalVisits}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onRegisterSpend && onRegisterSpend(c)}
                        type="button"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-all shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e676]" />
                        <span>Registrar</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
