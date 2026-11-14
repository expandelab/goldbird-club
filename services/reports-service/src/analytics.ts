import { MerchantMetrics } from '@expandemoney/shared-types';
import { getSupabaseAdminClient } from '@expandemoney/supabase-client';

export class ReportsAnalytics {
  public static async getMerchantMetrics(merchantId: string): Promise<MerchantMetrics> {
    const supabase = getSupabaseAdminClient();

    // 1. Obtener todas las transacciones completadas del comercio
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('status', 'completed');

    const txList = transactions || [];

    // 2. Obtener clientes
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('merchant_id', merchantId);

    const custList = customers || [];

    // 3. Obtener cupones activos
    const { count: activeCouponsCount } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('status', 'active');

    // Cálculos de ventas y cashback
    const totalSales = txList.reduce((acc, tx) => acc + Number(tx.gross_amount || 0), 0);
    const totalCreditedBalance = txList.reduce((acc, tx) => acc + Number(tx.cashback_earned || 0), 0);
    const loyaltyCostPct = totalSales > 0 ? (totalCreditedBalance / totalSales) * 100 : 0;

    // Desglose de clientes por nivel
    const customersByTier = {
      bronce: custList.filter((c) => c.current_tier === 'bronce').length,
      plata: custList.filter((c) => c.current_tier === 'plata').length,
      oro: custList.filter((c) => c.current_tier === 'oro').length,
    };

    // Hoy
    const today = new Date().toISOString().split('T')[0];
    const todayTxs = txList.filter((tx) => tx.created_at.startsWith(today));
    const todaySales = todayTxs.reduce((acc, tx) => acc + Number(tx.gross_amount || 0), 0);

    // Ticket promedio general
    const avgTicket = txList.length > 0 ? totalSales / txList.length : 0;

    // Ticket promedio: Recurrente vs Nuevo
    const recurringCustomerIds = new Set(
      custList.filter((c) => c.total_visits > 1).map((c) => c.id)
    );

    const recurringTxs = txList.filter((tx) => tx.customer_id && recurringCustomerIds.has(tx.customer_id));
    const newTxs = txList.filter((tx) => !tx.customer_id || !recurringCustomerIds.has(tx.customer_id));

    const avgTicketRecurring =
      recurringTxs.length > 0
        ? recurringTxs.reduce((acc, tx) => acc + Number(tx.gross_amount || 0), 0) / recurringTxs.length
        : 0;

    const avgTicketNew =
      newTxs.length > 0
        ? newTxs.reduce((acc, tx) => acc + Number(tx.gross_amount || 0), 0) / newTxs.length
        : 0;

    return {
      total_sales: Math.round(totalSales * 100) / 100,
      total_credited_balance: Math.round(totalCreditedBalance * 100) / 100,
      loyalty_cost_pct: Math.round(loyaltyCostPct * 100) / 100,
      total_customers: custList.length,
      active_coupons_count: activeCouponsCount || 0,
      customers_by_tier: customersByTier,
      today_sales: Math.round(todaySales * 100) / 100,
      today_transactions_count: todayTxs.length,
      avg_ticket: Math.round(avgTicket * 100) / 100,
      avg_ticket_recurring: Math.round(avgTicketRecurring * 100) / 100,
      avg_ticket_new: Math.round(avgTicketNew * 100) / 100,
    };
  }
}
