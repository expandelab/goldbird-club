'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { Coupon } from '@expandemoney/shared-types';
import { formatPEN, formatDate } from '../../lib/utils';
import { TicketPercent, Gift, Coins, CheckCircle2, Clock } from 'lucide-react';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const merchantId = 'a1111111-1111-1111-1111-111111111111';

  useEffect(() => {
    const fetchCoupons = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from('coupons')
          .select('*')
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false });

        if (data) {
          setCoupons(data as Coupon[]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar merchantName="Café Alma — Barranco" />

      <div className="flex flex-1">
        <Sidebar userRole="merchant_admin" />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Premios y Cupones de Fidelidad (10 Consumos)</h1>
            <p className="text-xs text-slate-500 mt-1">
              Beneficios desbloqueados automáticamente tras completar la tarjeta de 10 consumos calificados (≥ S/ 30) en local.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Premio Configurado del Local</span>
              <div className="text-base font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-emerald-600" />
                <span>Producto Gratis o Saldo</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Definido en configuración EM.R</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Condición de Obtención</span>
              <div className="text-base font-bold text-slate-900 mt-1">10 Consumos ≥ S/ 30.00</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Sello otorgado en caja por consumo</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Nivel Alcanzado al Canjear</span>
              <div className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1">
                <span>Nivel Plata (10 a 30)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Acceso a canjes de cupones del local</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Premio Configurable</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4 text-right">Valor Estimado</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4">Vigencia</th>
                    <th className="py-3 px-4">Emitido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Cargando cupones...
                      </td>
                    </tr>
                  ) : coupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Aún no se han emitido cupones de recompensa.
                      </td>
                    </tr>
                  ) : (
                    coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.code}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{c.title}</td>
                        <td className="py-3 px-4">
                          {c.reward_type === 'free_product' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                              Producto Gratis
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              Saldo Consumo
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">
                          {formatPEN(c.discount_amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {c.status === 'active' ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Activo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                              Canjeado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500">{formatDate(c.expires_at)}</td>
                        <td className="py-3 px-4 text-[11px] text-slate-400">{formatDate(c.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
