'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, User, ArrowLeft } from 'lucide-react';
import { GoldBirdLogo } from './GoldBirdLogo';

interface HeaderProps {
  showBack?: boolean;
  backHref?: string;
  userRole?: 'cliente' | 'comercio' | null;
  userName?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  backHref = '/',
  userRole,
  userName,
  onLogout,
}) => {
  return (
    <header className="px-4 py-3 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showBack && (
          <Link
            href={backHref}
            className="p-1.5 -ml-1 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        )}

        <Link href="/" className="flex items-center gap-2 group">
          <GoldBirdLogo size={36} showText={true} />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {userRole === 'comercio' ? (
          <Link
            href="/comercio"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-all shadow-sm"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Modo Mostrador</span>
          </Link>
        ) : userRole === 'cliente' ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-300 font-semibold hidden sm:inline">
              {userName || 'Mi Cuenta'}
            </span>
            <Link
              href="/mi-tarjeta"
              className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700/80 flex items-center justify-center text-amber-400 hover:border-amber-400/60 hover:shadow-md hover:shadow-amber-500/20 transition-all"
              title="Mi Tarjeta"
            >
              <User className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 hover:from-neutral-800 hover:to-neutral-700 text-amber-300 border border-amber-500/30 shadow-sm transition-all"
          >
            Ingresar
          </Link>
        )}
      </div>
    </header>
  );
};
