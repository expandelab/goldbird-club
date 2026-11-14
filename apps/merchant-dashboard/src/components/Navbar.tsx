'use client';

import React from 'react';
import Link from 'next/link';
import { Store, PlusCircle, ArrowUpRight, MapPin } from 'lucide-react';
import { RealtimeStatusBadge } from './RealtimeStatusBadge';
import { ThemeToggle } from './ThemeToggle';
import { UserRole } from '@expandemoney/shared-types';

interface NavbarProps {
  onOpenPosModal?: () => void;
  merchantName?: string;
  merchantSlug?: string;
  branchName?: string;
  userRole?: UserRole;
  isConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPosModal,
  merchantName = 'Café Alma — Barranco',
  merchantSlug = 'cafe-barranqueno',
  branchName = 'Barranco',
  userRole = 'merchant_admin',
  isConnected = true,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0b0f17]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between transition-colors duration-200">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 dark:bg-[#00e676] flex items-center justify-center text-slate-950 font-black text-base shadow-[0_0_18px_-4px_rgba(0,230,118,0.35)] transition-transform group-hover:scale-105">
            $
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-slate-900 dark:text-white tracking-tight text-base">
                expande<span className="text-emerald-600 dark:text-[#00e676]">Money</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Panel Comercio
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                {merchantName}
              </span>
              <span className="hidden md:flex items-center gap-1 text-slate-400 dark:text-slate-500">
                • <MapPin className="w-3 h-3 text-emerald-600 dark:text-[#00e676]" />
                {branchName}
              </span>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <RealtimeStatusBadge isConnected={isConnected} />

        {/* Theme Toggle Button */}
        <ThemeToggle />

        <Link
          href={`http://localhost:3001/enroll/${merchantSlug}`}
          target="_blank"
          className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-[#00e676] transition-colors bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60"
        >
          <span>Billetera Cliente</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>

        {onOpenPosModal && (
          <button
            onClick={onOpenPosModal}
            className="flex items-center gap-1.5 bg-slate-900 dark:bg-[#00e676] hover:bg-slate-800 dark:hover:bg-[#00c764] text-white dark:text-[#0b0f17] text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Registrar Consumo</span>
            <span className="sm:hidden">Cobro</span>
          </button>
        )}

        {/* Avatar Usuario */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
          <div
            className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-[#00e676] flex items-center justify-center text-xs font-mono font-bold"
            title="MR · María Rojas (Administradora)"
          >
            MR
          </div>
        </div>
      </div>
    </header>
  );
};
