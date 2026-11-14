import { getSupabaseAdminClient } from '@expandemoney/supabase-client';

export class ReportExporter {
  public static async exportTransactionsCSV(merchantId: string): Promise<string> {
    const supabase = getSupabaseAdminClient();

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error || !transactions) {
      throw new Error(`Error al exportar transacciones: ${error?.message}`);
    }

    const headers = [
      'ID_Transaccion',
      'Fecha_Hora',
      'Codigo_Referencia',
      'Cliente_Nombre',
      'Cliente_Telefono',
      'Tipo_Operacion',
      'Medio_Pago',
      'Monto_Bruto_PEN',
      'Comision_Expande_5Pct',
      'Neto_Abonado_PEN',
      'Cashback_Pct',
      'Cashback_Otorgado_PEN',
      'Cashback_Canjeado_PEN',
      'Estado',
    ];

    const rows = transactions.map((t) => [
      `"${t.id}"`,
      `"${new Date(t.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })}"`,
      `"${t.reference_code}"`,
      `"${t.customer_name || 'Consumidor Final'}"`,
      `"${t.customer_phone || '-'}"`,
      `"${t.type}"`,
      `"${t.payment_method}"`,
      Number(t.gross_amount).toFixed(2),
      Number(t.platform_fee_amount).toFixed(2),
      Number(t.net_merchant_amount).toFixed(2),
      `${t.cashback_pct_applied}%`,
      Number(t.cashback_earned).toFixed(2),
      Number(t.cashback_redeemed).toFixed(2),
      `"${t.status}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public static async exportCustomersCSV(merchantId: string): Promise<string> {
    const supabase = getSupabaseAdminClient();

    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('total_visits', { ascending: false });

    if (error || !customers) {
      throw new Error(`Error al exportar clientes: ${error?.message}`);
    }

    const headers = [
      'ID_Cliente',
      'Nombre_Completo',
      'WhatsApp_Telefono',
      'Nivel_Fidelizacion',
      'Total_Visitas',
      'Progreso_Ciclo_10',
      'Saldo_Disponible_PEN',
      'Saldo_Bloqueado_PEN',
      'Consumo_Total_PEN',
      'Ultima_Visita',
      'Fecha_Registro',
    ];

    const rows = customers.map((c) => [
      `"${c.id}"`,
      `"${c.full_name}"`,
      `"${c.phone}"`,
      `"${c.current_tier.toUpperCase()}"`,
      c.total_visits,
      `${c.current_cycle_visits}/10`,
      Number(c.available_balance).toFixed(2),
      Number(c.locked_balance).toFixed(2),
      Number(c.total_spent).toFixed(2),
      `"${new Date(c.last_visit_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })}"`,
      `"${new Date(c.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
