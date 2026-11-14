import { QuickSalePayload, PaymentMethod } from '@expandemoney/shared-types';
import { getSupabaseAdminClient } from '@expandemoney/supabase-client';

export interface DigitalPaymentInput {
  merchantId: string;
  paymentLinkId?: string;
  customerPhone?: string;
  customerName?: string;
  grossAmount: number;
  paymentMethod: PaymentMethod;
  branchId?: string;
}

export class PaymentProcessor {
  /**
   * Procesa consumo en local vía RPC validando la regla de 1 sello por cada consumo de S/ 30.00
   */
  public static async processInStoreSale(payload: QuickSalePayload) {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase.rpc('process_quick_sale', {
      p_merchant_id: payload.merchant_id,
      p_phone: payload.phone,
      p_full_name: payload.full_name || 'Cliente expandeMoney',
      p_gross_amount: payload.gross_amount,
      p_redeem_cashback: payload.redeem_cashback || false,
      p_coupon_code: payload.coupon_code || null,
      p_payment_method: payload.payment_method || 'yape',
      p_branch_id: payload.branch_id || null,
    });

    if (error) {
      throw new Error(`Fallo en el procesamiento de consumo: ${error.message}`);
    }

    return data;
  }

  /**
   * Procesa un cobro digital originado por link o QR con tarifa plana del 5%
   */
  public static async processDigitalPayment(input: DigitalPaymentInput) {
    const supabase = getSupabaseAdminClient();
    const feePct = 5.0; // 5% tarifa plana expandeMoney
    const platformFee = Math.round(input.grossAmount * (feePct / 100) * 100) / 100;
    const netMerchant = Math.round((input.grossAmount - platformFee) * 100) / 100;

    const refCode = `EXP-DIG-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const qualifiesForStamp = input.grossAmount >= 30.0;

    const { data: tx, error } = await supabase
      .from('transactions')
      .insert({
        merchant_id: input.merchantId,
        branch_id: input.branchId || null,
        customer_name: input.customerName || 'Cliente Digital',
        customer_phone: input.customerPhone || null,
        type: 'payment_link',
        gross_amount: input.grossAmount,
        qualified_for_stamp: qualifiesForStamp,
        platform_fee_pct: feePct,
        platform_fee_amount: platformFee,
        net_merchant_amount: netMerchant,
        cashback_pct_applied: 0.0,
        cashback_earned: 0.0,
        cashback_redeemed: 0.0,
        status: 'completed',
        payment_method: input.paymentMethod,
        reference_code: refCode,
        metadata: { payment_link_id: input.paymentLinkId },
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Error registrando cobro digital: ${error.message}`);
    }

    return tx;
  }
}
