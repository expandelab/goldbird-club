'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { MetricCard } from '../components/MetricCard';
import { TransactionsTable } from '../components/TransactionsTable';
import { CustomersTable } from '../components/CustomersTable';
import { PosRegisterModal } from '../components/PosRegisterModal';
import { LoyaltyCardVisualizer } from '../components/LoyaltyCardVisualizer';
import { SalesLineChart } from '../components/SalesLineChart';
import { AverageTicketCard } from '../components/AverageTicketCard';
import { LoyaltyPipeline } from '../components/LoyaltyPipeline';
import { RewardsConfigSection } from '../components/RewardsConfigSection';
import { supabase } from '../lib/supabase';
import { formatPEN } from '../lib/utils';
import {
  DemoClient,
  DemoTransaction,
  INITIAL_DEMO_CLIENTS,
  INITIAL_DEMO_TRANSACTIONS,
  DEMO_SALES_BY_DAY,
} from '../lib/demoData';
import { UserRole } from '@expandemoney/shared-types';
import {
  TrendingUp,
  Coins,
  Percent,
  Users,
  QrCode,
  Gift,
  ArrowRight,
  Info,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'resumen' | 'clientes' | 'recompensas' | 'transacciones'>('resumen');
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [selectedClientForPos, setSelectedClientForPos] = useState<DemoClient | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('merchant_admin');

  // State initialized with the exact data from https://www.expandemoney.com/panel.html
  const [clients, setClients] = useState<DemoClient[]>(INITIAL_DEMO_CLIENTS);
  const [transactions, setTransactions] = useState<any[]>(INITIAL_DEMO_TRANSACTIONS);
  const [salesData, setSalesData] = useState(DEMO_SALES_BY_DAY);

  // Financial KPIs matching panel.html
  const [metrics, setMetrics] = useState({
    totalSales: 855.0,
    totalCreditAwarded: 13.6,
    activeCustomers: 7,
    loyaltyCostPct: 1.6,
    salesDelta: -25.3,
    creditDelta: -14.5,
    customerDelta: 0.0,
    costDelta: 14.4,
  });

  const merchantConfig = {
    id: 'a1111111-1111-1111-1111-111111111111',
    commercial_name: 'Café Alma — Barranco',
    slug: 'cafe-barranqueno',
    branch_name: 'Sede Barranco',
    min_spend_for_stamp: 30.0,
    reward_type: 'free_product',
    reward_title: 'Desayuno Completo o Postre Artesanal Gratis',
    reward_value: 25.0,
  };

  // Sparkline data matching metrics
  const sparklines = {
    sales: [45, 60, 52, 70, 65, 80, 92, 85, 95, 88, 102, 110, 85],
    credit: [1.5, 2.0, 2.5, 1.8, 3.0, 2.2, 3.5, 4.0, 3.2, 3.8, 4.2],
    customers: [5, 5, 6, 6, 6, 7, 7, 7, 7, 7],
    cost: [1.8, 1.7, 1.9, 1.5, 1.6, 1.4, 1.6, 1.5, 1.6],
  };

  // Check Supabase on mount and listen to realtime if available
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: txs, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('merchant_id', merchantConfig.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!txError && txs && txs.length > 0) {
          setTransactions(txs);
          const totalGross = txs.reduce((sum: number, t: any) => sum + Number(t.gross_amount || 0), 0);
          setMetrics((prev) => ({ ...prev, totalSales: totalGross || prev.totalSales }));
        }

        const { data: custs, error: cError } = await supabase
          .from('customers')
          .select('*')
          .eq('merchant_id', merchantConfig.id);

        if (!cError && custs && custs.length > 0) {
          const mapped: DemoClient[] = custs.map((c: any) => ({
            id: c.id,
            name: c.full_name,
            code: c.phone || c.id.slice(0, 6),
            tier: c.current_tier,
            visits: c.current_cycle_visits,
            totalVisits: c.total_visits,
            lockedBalance: Number(c.locked_balance || 0),
            availableBalance: Number(c.available_balance || 0),
            avatar: c.full_name.slice(0, 2).toUpperCase(),
          }));
          setClients(mapped);
          setMetrics((prev) => ({ ...prev, activeCustomers: custs.length }));
        }
      } catch (e) {
        // Fallback to exact demo data
      }
    };

    fetchData();

    // Setup realtime subscription
    const channel = supabase
      .channel('realtime_merchant_panel_demo')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions', filter: `merchant_id=eq.${merchantConfig.id}` },
        (payload) => {
          const newTx = payload.new;
          setTransactions((prev) => [newTx, ...prev.slice(0, 19)]);
          setMetrics((prev) => {
            const added = Number(newTx.gross_amount || 0);
            return {
              ...prev,
              totalSales: prev.totalSales + added,
            };
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle simulation of +1 visit (≥ S/ 30) for interactive demonstration
  const handleSimulateVisit = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    const isGold = client.tier === 'oro';
    const isSilver = client.tier === 'plata';
    const rate = isGold ? 1.0 : isSilver ? 0.7 : 0.5;
    const spendAmount = 35.0;

    // Check if completes 10th visit
    const nextVisits = client.visits + 1;
    const completedCycle = !isGold && nextVisits >= 10;
    const rewardUnlock = isSilver ? 7.0 : 5.0;

    // Calculate new tier if lifetime visits trigger upgrade
    const nextLifetime = client.totalVisits + 1;
    const newTier = nextLifetime >= 30 ? 'oro' : nextLifetime >= 10 ? 'plata' : 'bronce';

    // Update clients reactively
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        if (isGold) {
          return {
            ...c,
            totalVisits: nextLifetime,
            availableBalance: c.availableBalance + rate,
          };
        }
        if (completedCycle) {
          return {
            ...c,
            tier: newTier as any,
            visits: 0,
            totalVisits: nextLifetime,
            lockedBalance: 0,
            availableBalance: c.availableBalance + rewardUnlock,
          };
        }
        return {
          ...c,
          tier: newTier as any,
          visits: nextVisits,
          totalVisits: nextLifetime,
          lockedBalance: c.lockedBalance + rate,
        };
      })
    );

    // Create a new transaction in real time
    const newTx: DemoTransaction = {
      id: `tx-${Date.now()}`,
      customerName: client.name,
      customerCode: client.code,
      tier: client.tier,
      type: 'consumo',
      amount: spendAmount,
      creditEarned: rate,
      lockedAmount: isGold ? 0 : rate,
      timestamp: 'Ahora mismo',
      status: 'completado',
      completedMilestone: completedCycle,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update KPIs
    setMetrics((prev) => {
      const newTotal = prev.totalSales + spendAmount;
      const newCredit = prev.totalCreditAwarded + rate + (completedCycle ? rewardUnlock : 0);
      const newCost = (newCredit / newTotal) * 100;
      return {
        ...prev,
        totalSales: newTotal,
        totalCreditAwarded: newCredit,
        loyaltyCostPct: parseFloat(newCost.toFixed(1)),
      };
    });
  };

  const handleOpenPosForClient = (client: any) => {
    setSelectedClientForPos(client);
    setIsPosOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar
        onOpenPosModal={() => {
          setSelectedClientForPos(null);
          setIsPosOpen(true);
        }}
        isConnected={isConnected}
        merchantName={merchantConfig.commercial_name}
        merchantSlug={merchantConfig.slug}
        branchName={merchantConfig.branch_name}
        userRole={userRole}
      />

      <div className="flex flex-1">
        <Sidebar
          userRole={userRole}
          activeTab={activeTab}
          onTabChange={(tab: any) => setActiveTab(tab)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header con Saludo y Nota de Demo idéntica a panel.html */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading font-black text-2xl text-slate-900 dark:text-white tracking-tight">
                Hola, María — así va Café Alma hoy
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Cada consumo registrado, convertido en un número. Resultados de tu fidelización.
              </p>
            </div>

            {/* Toggle de Rol Operativo */}
            <div className="flex items-center gap-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 text-xs self-start sm:self-auto">
              <button
                onClick={() => setUserRole('merchant_admin')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  userRole === 'merchant_admin'
                    ? 'bg-slate-900 text-white dark:bg-[#00e676] dark:text-[#0b0f17] shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Admin (Total)
              </button>
              <button
                onClick={() => setUserRole('merchant_staff')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  userRole === 'merchant_staff'
                    ? 'bg-emerald-600 text-white dark:bg-[#00e676] dark:text-[#0b0f17] shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Cajero / Staff
              </button>
            </div>
          </div>

          {/* Banner Note informativo de datos de ejemplo */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-700 dark:text-slate-300">
            <Info className="w-4 h-4 text-emerald-600 dark:text-[#00e676] flex-none" />
            <span>
              <strong>Demo interactiva:</strong> Datos de demostración sincronizados. Lo que registres en caja impacta reactivamente tus ventas, el saldo de los clientes y el costo de fidelización.
            </span>
          </div>

          {/* Navigation Tabs (Resumen, Clientes, Recompensas, Transacciones) */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
            {[
              { id: 'resumen', label: 'Resumen' },
              { id: 'clientes', label: `Clientes (${clients.length})` },
              { id: 'recompensas', label: 'Recompensas & Reglas' },
              { id: 'transacciones', label: `Transacciones (${transactions.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 relative transition-all ${
                  activeTab === tab.id
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 dark:bg-[#00e676] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* ============================================================== */}
          {/* TAB 1: RESUMEN GENERAL                                         */}
          {/* ============================================================== */}
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              {/* KPIs Principales con Sparklines y Deltas exactos de panel.html */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Ventas registradas"
                  value={formatPEN(metrics.totalSales)}
                  deltaPct={metrics.salesDelta}
                  subtitle="Periodo 14 días"
                  sparklineData={sparklines.sales}
                  icon={TrendingUp}
                  iconColor="text-emerald-600 dark:text-[#00e676]"
                  iconBg="bg-emerald-50 dark:bg-emerald-950/40"
                />
                <MetricCard
                  title="Saldo abonado a clientes"
                  value={formatPEN(metrics.totalCreditAwarded)}
                  deltaPct={metrics.creditDelta}
                  subtitle="Abonos y premios EM.R"
                  sparklineData={sparklines.credit}
                  icon={Coins}
                  iconColor="text-teal-600 dark:text-teal-400"
                  iconBg="bg-teal-50 dark:bg-teal-950/40"
                />
                <MetricCard
                  title="Clientes activos"
                  value={metrics.activeCustomers.toString()}
                  deltaPct={metrics.customerDelta}
                  subtitle="Pases activos en wallet"
                  sparklineData={sparklines.customers}
                  icon={Users}
                  iconColor="text-purple-600 dark:text-purple-400"
                  iconBg="bg-purple-50 dark:bg-purple-950/40"
                />
                <MetricCard
                  title="Costo de fidelización"
                  value={`${metrics.loyaltyCostPct}%`}
                  deltaPct={metrics.costDelta}
                  subtitle="Sobre ventas registradas"
                  sparklineData={sparklines.cost}
                  icon={Percent}
                  iconColor="text-blue-600 dark:text-blue-400"
                  iconBg="bg-blue-50 dark:bg-blue-950/40"
                />
              </div>

              {/* Fila 2: Gráfica de Ventas + Pipeline de Fidelización */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SalesLineChart data={salesData} />
                </div>
                <div>
                  <LoyaltyPipeline clients={clients} />
                </div>
              </div>

              {/* Fila 3: Visualizador Dinámico de Tarjetas Digitales + Ticket Promedio */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <LoyaltyCardVisualizer
                    clients={clients}
                    onSimulateVisit={handleSimulateVisit}
                  />
                </div>
                <div>
                  <AverageTicketCard />
                </div>
              </div>

              {/* Fila 4: Últimas Transacciones en Tiempo Real */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                      Últimas transacciones
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Consumos, cupones y cobros en tiempo real
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('transacciones')}
                    className="text-xs font-bold text-emerald-600 dark:text-[#00e676] hover:underline flex items-center gap-1"
                  >
                    <span>Ver todas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <TransactionsTable transactions={transactions.slice(0, 6)} isLoading={isLoading} />
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CLIENTES                                                */}
          {/* ============================================================== */}
          {activeTab === 'clientes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-white">
                    Directorio de Clientes
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tarjeta, progreso de 10 sellos, saldo bloqueado y saldo disponible. Registra su consumo con un clic.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedClientForPos(null);
                    setIsPosOpen(true);
                  }}
                  className="inline-flex items-center gap-2 bg-slate-900 dark:bg-[#00e676] text-white dark:text-[#0b0f17] text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  <Gift className="w-4 h-4" />
                  <span>Nuevo Consumo en POS</span>
                </button>
              </div>

              <CustomersTable
                customers={clients}
                isLoading={isLoading}
                onRegisterSpend={handleOpenPosForClient}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: RECOMPENSAS & REGLAS                                    */}
          {/* ============================================================== */}
          {activeTab === 'recompensas' && (
            <RewardsConfigSection
              clients={clients}
              onRulesUpdate={(newRules) => {
                // Rules updated
              }}
            />
          )}

          {/* ============================================================== */}
          {/* TAB 4: TRANSACCIONES EN VIVO                                   */}
          {/* ============================================================== */}
          {activeTab === 'transacciones' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-white">
                    Historial Completo de Transacciones
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Auditoría de consumos calificados (≥ S/ 30), sellos otorgados, cupones canjeados y cobros digitales
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`http://localhost:4004/api/reports/export/transactions/${merchantConfig.id}`}
                    target="_blank"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                  >
                    Exportar CSV
                  </a>
                </div>
              </div>

              <TransactionsTable transactions={transactions} isLoading={isLoading} />
            </div>
          )}
        </main>
      </div>

      {/* Modal POS */}
      <PosRegisterModal
        isOpen={isPosOpen}
        onClose={() => setIsPosOpen(false)}
        merchantId={merchantConfig.id}
        minSpendForStamp={merchantConfig.min_spend_for_stamp}
        clients={clients}
        selectedClient={selectedClientForPos}
        onSuccess={(saleData) => {
          if (saleData) {
            handleSimulateVisit(saleData.customer_id || clients[0]?.id);
          }
        }}
      />
    </div>
  );
}
