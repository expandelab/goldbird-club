'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { CustomersTable } from '../../components/CustomersTable';
import { supabase } from '../../lib/supabase';
import { Customer } from '@expandemoney/shared-types';
import { INITIAL_DEMO_CLIENTS } from '../../lib/demoData';
import { Download, RefreshCw } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>(INITIAL_DEMO_CLIENTS);
  const [isLoading, setIsLoading] = useState(false);
  const merchantId = 'a1111111-1111-1111-1111-111111111111';

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('total_spent', { ascending: false });

      if (data && data.length > 0) {
        setCustomers(data);
      }
    } catch (e) {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleExportCSV = () => {
    window.open(`http://localhost:4004/api/reports/export/customers/${merchantId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar merchantName="Café Alma — Barranco" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-black text-2xl text-slate-900 dark:text-white tracking-tight">
                Directorio de Clientes CRM
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Clientes enrolados mediante Web Wallet sin aplicaciones, niveles de fidelidad y saldos acumulados.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadCustomers}
                className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm"
                title="Recargar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-[#00e676] dark:hover:bg-[#00c764] text-white dark:text-[#0b0f17] rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Clientes CSV</span>
              </button>
            </div>
          </div>

          <CustomersTable customers={customers} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
}
