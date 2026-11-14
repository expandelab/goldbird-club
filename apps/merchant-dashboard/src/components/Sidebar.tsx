'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  QrCode,
  ArrowLeftRight,
  Users,
  TicketPercent,
  Calculator,
  Settings,
  Gift,
  Link2,
} from 'lucide-react';
import { UserRole } from '@expandemoney/shared-types';

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

interface SidebarProps {
  userRole?: UserRole;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userRole = 'merchant_admin',
  activeTab,
  onTabChange,
}) => {
  const pathname = usePathname();
  const isStaff = userRole === 'merchant_staff';

  const adminNavItems: NavItem[] = [
    { id: 'resumen', name: 'Resumen', href: '/', icon: LayoutDashboard },
    { id: 'clientes', name: 'Clientes', href: '/customers', icon: Users, badge: '7' },
    { id: 'recompensas', name: 'Recompensas', href: '/#recompensas', icon: Gift },
    { id: 'transacciones', name: 'Transacciones', href: '/transactions', icon: ArrowLeftRight },
    { id: 'cupones', name: 'Cupones', href: '/coupons', icon: TicketPercent },
    { id: 'pos', name: 'Terminal POS (Caja)', href: '/pos', icon: Calculator },
    { id: 'cobros', name: 'Links de cobro & QR', href: '/qr-enrollment', icon: Link2 },
    { id: 'settings', name: 'Reglas EM.R & Sedes', href: '/settings', icon: Settings },
  ];

  const staffNavItems: NavItem[] = [
    { id: 'pos', name: 'Terminal POS (Caja)', href: '/pos', icon: Calculator },
    { id: 'transacciones', name: 'Transacciones del Turno', href: '/transactions', icon: ArrowLeftRight },
  ];

  const navItems = isStaff ? staffNavItems : adminNavItems;

  const handleClick = (e: React.MouseEvent, item: typeof adminNavItems[0]) => {
    if (pathname === '/' && onTabChange && (item.id === 'resumen' || item.id === 'recompensas')) {
      e.preventDefault();
      onTabChange(item.id);
    }
  };

  return (
    <aside className="w-64 bg-slate-50 dark:bg-[#0d1220] text-slate-700 dark:text-slate-300 min-h-screen flex flex-col justify-between p-4 border-r border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      <div className="space-y-6">
        <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>{isStaff ? 'Modo Cajero / Staff' : 'Secciones del panel'}</span>
          {isStaff && (
            <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-mono font-bold">
              Operativo
            </span>
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isCurrent =
              pathname === item.href ||
              (pathname === '/' && activeTab === item.id) ||
              (item.id === 'resumen' && pathname === '/' && !activeTab);

            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={(e) => handleClick(e, item)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-[#00e676] font-bold border border-emerald-500/20 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isCurrent
                        ? 'text-emerald-600 dark:text-[#00e676]'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3.5 bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs space-y-1.5">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Reglas EM.R Activas</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-[#00e676]">≥ S/ 30</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          1 sello por consumo calificado. Al llegar a 10 sellos libera premio configurable.
        </p>
      </div>
    </aside>
  );
};
