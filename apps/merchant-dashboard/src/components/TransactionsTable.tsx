'use client';

import React from 'react';
import { formatPEN, formatDate } from '../lib/utils';
import { CreditCard, Banknote, CheckCircle, XCircle, Award, Sparkles, Crown } from 'lucide-react';

export interface DisplayTransaction {
  id: string;
  reference_code?: string;
  created_at?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_code?: string;
  payment_method?: string;
  gross_amount?: number;
  amount?: number;
  qualified_for_stamp?: boolean;
  platform_fee_amount?: number;
  net_merchant_amount?: number;
  type?: string;
  tier?: 'bronce' | 'plata' | 'oro' | string;
  credit?: number;
  creditEarned?: number;
  status?: string;
  timestamp?: string;
}

interface TransactionsTableProps {
  transactions: any[];
  isLoading?: boolean;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  isLoading,
}) => {
  const getInitials = (name?: string) => {
    if (!name) return 'CF';
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0] || '')
      .join('')
      .toUpperCase();
  };

  const getTierBadge = (tier?: string) => {
    if (!tier) return <span className="text-slate-400 font-mono text-[11px]">—</span>;
    const t = tier.toLowerCase();
    if (t === 'oro') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-[#FFD95A] border border-amber-300 dark:border-amber-700/60">
          <Crown className="w-3 h-3 text-amber-600 dark:text-[#FFD95A]" />
          Oro
        </span>
      );
    }
    if (t === 'plata') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-[#C9D1DC] border border-slate-300 dark:border-slate-600">
          <Sparkles className="w-3 h-3 text-slate-500" />
          Plata
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-orange-100 text-orange-900 dark:bg-amber-950/60 dark:text-[#E9A867] border border-orange-200 dark:border-amber-800/50">
        <Award className="w-3 h-3 text-amber-600" />
        Bronce
      </span>
    );
  };

  const getTypeBadge = (type?: string) => {
    const tp = (type || 'consumo').toLowerCase();
    if (tp === 'cupon') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00e676] border border-emerald-500/20">
          Cupón
        </span>
      );
    }
    if (tp === 'cobro' || tp === 'payment_link') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
          Cobro Link
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        Consumo POS
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
            <tr>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Nivel</th>
              <th className="py-3 px-4">Fecha / Hora</th>
              <th className="py-3 px-4 text-right">Monto Consumo</th>
              <th className="py-3 px-4 text-right">Saldo Abonado</th>
              <th className="py-3 px-4 text-center">Sello EM.R</th>
              <th className="py-3 px-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Cargando transacciones en tiempo real...</span>
                  </div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  No hay transacciones registradas.
                </td>
              </tr>
            ) : (
              transactions.map((tx: any, idx: number) => {
                const name = tx.customer_name || tx.customerName || 'Consumidor Final';
                const code = tx.customer_code || tx.customerCode || tx.customer_phone || tx.reference_code;
                const amt = Number(tx.gross_amount ?? tx.amount ?? 0);
                const credit = Number(tx.creditEarned ?? tx.credit ?? (amt >= 30 ? (tx.tier === 'oro' ? 1.0 : tx.tier === 'plata' ? 0.7 : 0.5) : 0));
                const qualifies = tx.qualified_for_stamp ?? (amt >= 30.0);
                const dateText = tx.timestamp || (tx.created_at ? formatDate(tx.created_at) : 'Hoy');

                return (
                  <tr
                    key={tx.id || idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">
                          {getInitials(name)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {name}
                          </div>
                          {code && (
                            <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                              {code}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getTypeBadge(tx.type)}</td>

                    <td className="py-3.5 px-4">{getTierBadge(tx.tier)}</td>

                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {dateText}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {formatPEN(amt)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-[#00e676]">
                      {credit > 0 ? `+${formatPEN(credit)}` : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {qualifies ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00e676] border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3 text-emerald-500 dark:text-[#00e676]" />
                          1 Sello Otorgado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                          <XCircle className="w-3 h-3" />
                          &lt; S/ 30
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-[#00e676] border border-emerald-500/20">
                        {tx.status === 'pagado' ? 'Pagado' : 'Completado'}
                      </span>
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
