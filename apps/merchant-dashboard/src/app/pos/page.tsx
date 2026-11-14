'use client';

import React, { useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { PosRegisterModal } from '../../components/PosRegisterModal';
import { INITIAL_DEMO_CLIENTS } from '../../lib/demoData';
import { Calculator, Sparkles, ArrowRight } from 'lucide-react';

export default function PosPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar merchantName="Café Alma — Barranco" />

      <div className="flex flex-1">
        <Sidebar userRole="merchant_staff" />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-600 dark:text-[#00e676] mb-2 shadow-sm border border-emerald-500/30">
            <Calculator className="w-10 h-10" />
          </div>

          <h1 className="font-heading font-black text-3xl text-slate-900 dark:text-white tracking-tight">
            Terminal POS de Caja expandeMoney
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
            Registra consumos en segundos validando la regla de 1 sello por cada consumo ≥ S/ 30.00 en local.
          </p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-[#00e676] dark:hover:bg-[#00c764] text-white dark:text-[#0b0f17] font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all text-sm active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Abrir Registro Rápido en Caja</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <PosRegisterModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            merchantId="a1111111-1111-1111-1111-111111111111"
            clients={INITIAL_DEMO_CLIENTS}
          />
        </main>
      </div>
    </div>
  );
}
