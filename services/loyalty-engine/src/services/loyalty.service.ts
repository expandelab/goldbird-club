import { getSupabaseAdminClient } from '@expandemoney/supabase-client';
import {
  Customer,
  Merchant,
  Coupon,
  PaymentMethod,
  RecordConsumptionPayload,
  CustomerLoyaltyStatus,
} from '@expandemoney/shared-types';
import { EngineService } from './engine.service';
import { MilestoneService } from './milestone.service';

export interface RecordConsumptionServiceInput {
  merchantId: string;
  customerId: string;
  amount: number;
  branchId?: string;
  paymentMethod?: PaymentMethod;
  redeemCashback?: boolean;
  couponCode?: string;
}

export interface RecordConsumptionResult {
  transaction: {
    id: string;
    referenceCode: string;
    grossAmount: number;
    couponDiscount: number;
    cashbackRedeemed: number;
    netToPay: number;
    paymentMethod: PaymentMethod;
    status: string;
    createdAt: string;
  };
  stamps: {
    qualifiesForStamp: boolean;
    stampsAwarded: number;
    minSpendRequired: number;
    currentCycleVisits: number;
    cycleTarget: number;
    totalAccumulatedVisits: number;
  };
  tier: {
    previousTier: string;
    currentTier: string;
    tierUpgraded: boolean;
    perks: {
      title: string;
      range: string;
      cashbackPct: number;
      balanceMode: string;
      perks: string;
    };
  };
  cashback: {
    ratePct: number;
    amountEarned: number;
    balanceCreditedType: 'locked' | 'available';
    explanation: string;
  };
  balances: {
    previousAvailableBalance: number;
    previousLockedBalance: number;
    unlockedAmount: number;
    cashbackRedeemed: number;
    newAvailableBalance: number;
    newLockedBalance: number;
    totalActiveBalance: number;
  };
  reward: {
    milestoneReached: boolean;
    couponIssued?: {
      code: string;
      title: string;
      rewardType: string;
      discountAmount: number;
      expiresAt: string;
    };
    balanceRewardCredited?: number;
  };
}

export class LoyaltyService {
  /**
   * Registra un consumo en el comercio, procesando:
   * - Regla de sello EM.R (≥ S/ 30.00 en local)
   * - Cálculo de cashback escalonado según nivel Bronce/Plata/Oro
   * - Saldo abonado: Bloqueado en Bronce vs. Disponible en Plata/Oro
   * - Desbloqueo de saldo bloqueado acumulado en visitas anteriores
   * - Transición y cambio de niveles
   * - Tarjeta de 10 consumos y emisión de premio configurable
   */
  public static async recordConsumption(input: RecordConsumptionServiceInput): Promise<RecordConsumptionResult> {
    const supabase = getSupabaseAdminClient();

    // 1. Obtener comercio
    const { data: merchant, error: mError } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', input.merchantId)
      .single();

    if (mError || !merchant) {
      throw new Error(`Comercio no encontrado con ID: ${input.merchantId}`);
    }

    // 2. Obtener cliente
    const { data: customer, error: cError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', input.customerId)
      .eq('merchant_id', input.merchantId)
      .single();

    if (cError || !customer) {
      throw new Error(`Cliente no encontrado con ID: ${input.customerId} para este comercio`);
    }

    // 3. Evaluar consumo y reglas de sellos, niveles y cashback
    const evaluation = EngineService.evaluateConsumption({
      merchant,
      customer,
      grossAmount: input.amount,
    });

    // 4. Validar cupón de premio si se envió código
    let couponDiscount = 0;
    let redeemedCoupon: Coupon | null = null;
    if (input.couponCode && input.couponCode.trim() !== '') {
      const codeUpper = input.couponCode.trim().toUpperCase();
      const { data: coupon, error: coupError } = await supabase
        .from('coupons')
        .select('*')
        .eq('merchant_id', input.merchantId)
        .eq('customer_id', input.customerId)
        .eq('code', codeUpper)
        .eq('status', 'active')
        .single();

      if (!coupError && coupon) {
        const validation = MilestoneService.validateCouponRedemption(coupon, input.amount);
        if (validation.valid) {
          couponDiscount = validation.discountAmount;
          redeemedCoupon = coupon;
        }
      }
    }

    // 5. Desbloqueo de saldo bloqueado acumulado (si consumo califica para sello)
    const unlockedAmount = evaluation.unlockedBalance;
    const initialAvailable = Number(customer.available_balance || 0) + unlockedAmount;

    // 6. Aplicar redención de saldo disponible de cashback si se solicitó
    let cashbackRedeemed = 0;
    const amountAfterCoupon = Math.max(0, input.amount - couponDiscount);
    if (input.redeemCashback && initialAvailable > 0) {
      cashbackRedeemed = Math.min(initialAvailable, amountAfterCoupon);
    }

    // 7. Saldo abonado por este consumo (bloqueado en Bronce vs disponible en Plata/Oro)
    const cashbackEarned = evaluation.cashbackEarned;
    const balanceCreditedType = evaluation.balanceCreditedType;

    // 8. Evaluar premio de meta de 10 consumos (Tarjeta EM.R)
    let issuedCouponData: any = null;
    let balanceRewardCredited = 0;

    if (evaluation.isRewardEarned) {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const couponCode = `PREMIO10-${randomSuffix}`;
      const couponTitle = `¡Premio 10 Consumos! ${merchant.reward_title}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

      const { data: newCoupon, error: newCoupErr } = await supabase
        .from('coupons')
        .insert({
          merchant_id: input.merchantId,
          customer_id: input.customerId,
          code: couponCode,
          title: couponTitle,
          reward_type: merchant.reward_type,
          discount_amount: merchant.reward_value,
          min_spend: 0.00,
          status: 'active',
          expires_at: expiresAt,
        })
        .select('*')
        .single();

      if (!newCoupErr && newCoupon) {
        issuedCouponData = {
          code: newCoupon.code,
          title: newCoupon.title,
          rewardType: newCoupon.reward_type,
          discountAmount: Number(newCoupon.discount_amount),
          expiresAt: newCoupon.expires_at,
        };
      }

      // Si el premio es saldo directo en billetera
      if (merchant.reward_type === 'balance_credit') {
        balanceRewardCredited = Number(merchant.reward_value);
      }
    }

    // 9. Calcular saldos finales del cliente
    let finalAvailableBalance = initialAvailable - cashbackRedeemed + balanceRewardCredited;
    let finalLockedBalance = 0;

    if (balanceCreditedType === 'available') {
      finalAvailableBalance += cashbackEarned;
      finalLockedBalance = 0;
    } else {
      // Bronce: cashback entra como locked_balance
      finalLockedBalance = cashbackEarned;
    }

    finalAvailableBalance = Math.round(finalAvailableBalance * 100) / 100;
    finalLockedBalance = Math.round(finalLockedBalance * 100) / 100;

    // 10. Calcular montos de liquidación y tarifa de expandeMoney (5% flat)
    const netToPay = Math.max(0, input.amount - couponDiscount - cashbackRedeemed);
    const feePct = Number(merchant.flat_fee_percentage || 5.0);
    const platformFee = Math.round((netToPay * (feePct / 100)) * 100) / 100;
    const netMerchant = Math.round((netToPay - platformFee) * 100) / 100;

    // 11. Generar código de referencia único para la transacción
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referenceCode = `EXP-LOY-${datePrefix}-${randCode}`;

    // 12. Registrar transacción en base de datos
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        merchant_id: input.merchantId,
        branch_id: input.branchId || null,
        customer_id: input.customerId,
        customer_name: customer.full_name,
        customer_phone: customer.phone,
        type: 'in_store_sale',
        gross_amount: input.amount,
        qualified_for_stamp: evaluation.qualifiesForStamp,
        platform_fee_pct: feePct,
        platform_fee_amount: platformFee,
        net_merchant_amount: netMerchant,
        cashback_pct_applied: evaluation.cashbackPct,
        cashback_earned: cashbackEarned,
        cashback_redeemed: cashbackRedeemed,
        status: 'completed',
        payment_method: input.paymentMethod || 'efectivo',
        reference_code: referenceCode,
        metadata: {
          previous_tier: evaluation.previousTier,
          new_tier: evaluation.newTier,
          tier_upgraded: evaluation.tierUpgraded,
          balance_credited_type: balanceCreditedType,
          unlocked_amount: unlockedAmount,
          coupon_applied: redeemedCoupon?.code || null,
          coupon_discount: couponDiscount,
          cycle_visits: evaluation.newCycleVisits,
          milestone_reached: evaluation.isRewardEarned,
          reward_coupon_code: issuedCouponData?.code || null,
        },
      })
      .select('*')
      .single();

    if (txError || !tx) {
      throw new Error(`Error registrando transacción de fidelización: ${txError?.message}`);
    }

    // 13. Marcar cupón como canjeado si se utilizó
    if (redeemedCoupon) {
      await supabase
        .from('coupons')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
        })
        .eq('id', redeemedCoupon.id);
    }

    // 14. Actualizar cliente en base de datos
    const { error: custUpdateError } = await supabase
      .from('customers')
      .update({
        total_visits: evaluation.newTotalVisits,
        current_cycle_visits: evaluation.newCycleVisits,
        current_tier: evaluation.newTier,
        available_balance: finalAvailableBalance,
        locked_balance: finalLockedBalance,
        total_spent: Math.round((Number(customer.total_spent || 0) + input.amount) * 100) / 100,
        last_visit_at: new Date().toISOString(),
      })
      .eq('id', customer.id);

    if (custUpdateError) {
      throw new Error(`Error actualizando cliente en base de datos: ${custUpdateError.message}`);
    }

    const explanation = balanceCreditedType === 'locked'
      ? `Abono de S/ ${cashbackEarned.toFixed(2)} (${evaluation.cashbackPct}%) en Saldo Bloqueado (se desbloqueará en tu próximo consumo calificado ≥ S/ ${evaluation.minSpendRequired.toFixed(2)}).`
      : `Abono de S/ ${cashbackEarned.toFixed(2)} (${evaluation.cashbackPct}%) en Saldo Disponible de libre uso inmediato por ser cliente ${evaluation.newTier.toUpperCase()}.`;

    return {
      transaction: {
        id: tx.id,
        referenceCode: tx.reference_code,
        grossAmount: input.amount,
        couponDiscount,
        cashbackRedeemed,
        netToPay,
        paymentMethod: input.paymentMethod || 'efectivo',
        status: tx.status,
        createdAt: tx.created_at,
      },
      stamps: {
        qualifiesForStamp: evaluation.qualifiesForStamp,
        stampsAwarded: evaluation.stampsAwarded,
        minSpendRequired: evaluation.minSpendRequired,
        currentCycleVisits: evaluation.newCycleVisits,
        cycleTarget: EngineService.CYCLE_TARGET,
        totalAccumulatedVisits: evaluation.newTotalVisits,
      },
      tier: {
        previousTier: evaluation.previousTier,
        currentTier: evaluation.newTier,
        tierUpgraded: evaluation.tierUpgraded,
        perks: evaluation.tierPerks,
      },
      cashback: {
        ratePct: evaluation.cashbackPct,
        amountEarned: cashbackEarned,
        balanceCreditedType,
        explanation,
      },
      balances: {
        previousAvailableBalance: Number(customer.available_balance || 0),
        previousLockedBalance: Number(customer.locked_balance || 0),
        unlockedAmount,
        cashbackRedeemed,
        newAvailableBalance: finalAvailableBalance,
        newLockedBalance: finalLockedBalance,
        totalActiveBalance: Math.round((finalAvailableBalance + finalLockedBalance) * 100) / 100,
      },
      reward: {
        milestoneReached: evaluation.isRewardEarned,
        couponIssued: issuedCouponData || undefined,
        balanceRewardCredited: balanceRewardCredited > 0 ? balanceRewardCredited : undefined,
      },
    };
  }

  /**
   * Consulta el estado de fidelización actual del cliente:
   * - Visitas acumuladas y consumos calificados
   * - Saldo abonado (disponible vs bloqueado)
   * - Progreso de la tarjeta de 10 consumos (Punch Card Digital)
   * - Nivel actual (Bronce, Plata, Oro) y progreso al siguiente nivel
   * - Cupones activos vigentes
   */
  public static async getCustomerStatus(customerId: string, merchantId?: string): Promise<CustomerLoyaltyStatus> {
    const supabase = getSupabaseAdminClient();

    let query = supabase.from('customers').select('*').eq('id', customerId);
    if (merchantId) {
      query = query.eq('merchant_id', merchantId);
    }

    const { data: customer, error: cError } = await query.single();
    if (cError || !customer) {
      throw new Error(`Cliente no encontrado con ID: ${customerId}`);
    }

    const { data: merchant, error: mError } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', customer.merchant_id)
      .single();

    if (mError || !merchant) {
      throw new Error(`Comercio asociado al cliente no encontrado (ID: ${customer.merchant_id})`);
    }

    // Cupones activos del cliente
    const { data: coupons } = await supabase
      .from('coupons')
      .select('*')
      .eq('merchant_id', customer.merchant_id)
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    // Progreso de tarjeta
    const cardProgress = EngineService.calculateCardProgress(customer.current_cycle_visits);
    const tierProgress = EngineService.calculateTierProgress(customer.total_visits);
    const tierPerks = EngineService.getTierPerks(customer.current_tier, merchant);

    const available = Number(customer.available_balance || 0);
    const locked = Number(customer.locked_balance || 0);
    const balanceMode = EngineService.getBalanceCreditType(customer.current_tier);

    const explanation = balanceMode === 'locked'
      ? `Actualmente en nivel ${customer.current_tier.toUpperCase()}: Tu cashback se abona como Saldo Bloqueado y se desbloquea al volver a consumir en el local.`
      : `Actualmente en nivel ${customer.current_tier.toUpperCase()}: Tu cashback se abona como Saldo Disponible para descuento inmediato en caja.`;

    return {
      customer: {
        id: customer.id,
        full_name: customer.full_name,
        phone: customer.phone,
        wallet_token: customer.wallet_token,
      },
      merchant: {
        id: merchant.id,
        commercial_name: merchant.commercial_name,
        slug: merchant.slug,
      },
      tier: {
        current_tier: customer.current_tier,
        name: tierPerks.title,
        perks: tierPerks.perks,
        next_tier: tierProgress.nextTier,
        visits_to_next_tier: tierProgress.visitsToNextTier,
        progress_pct_to_next_tier: tierProgress.progressPct,
      },
      visits: {
        total_accumulated_visits: customer.total_visits,
        total_spent: Number(customer.total_spent || 0),
        last_visit_at: customer.last_visit_at,
      },
      balance: {
        available_balance: available,
        locked_balance: locked,
        total_balance: Math.round((available + locked) * 100) / 100,
        cashback_rate_pct: tierPerks.cashbackPct,
        balance_mode: balanceMode,
        explanation,
      },
      card_progress: {
        current_stamps: cardProgress.currentStamps,
        target_stamps: cardProgress.targetStamps,
        stamps_remaining: cardProgress.stampsRemaining,
        progress_pct: cardProgress.progressPct,
        min_spend_per_stamp: Number(merchant.min_spend_for_stamp || 30.0),
        reward: {
          title: merchant.reward_title,
          type: merchant.reward_type,
          value: Number(merchant.reward_value || 20.0),
        },
      },
      active_coupons: coupons || [],
    };
  }

  /**
   * Simulación de consumo en memoria
   */
  public static async simulateConsumption(merchantId: string, customerId: string, grossAmount: number, redeemCashback = false, couponCode?: string) {
    const supabase = getSupabaseAdminClient();

    const { data: merchant, error: mError } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', merchantId)
      .single();

    if (mError || !merchant) {
      throw new Error('Comercio no encontrado');
    }

    const { data: customer, error: cError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('merchant_id', merchantId)
      .single();

    if (cError || !customer) {
      throw new Error('Cliente no encontrado');
    }

    let couponDiscount = 0;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('customer_id', customerId)
        .eq('code', couponCode.toUpperCase().trim())
        .eq('status', 'active')
        .single();

      if (coupon) {
        const validation = MilestoneService.validateCouponRedemption(coupon, grossAmount);
        if (validation.valid) {
          couponDiscount = validation.discountAmount;
        }
      }
    }

    return EngineService.calculateTransaction({
      merchant,
      customer,
      grossAmount,
      redeemCashback,
      couponDiscount,
    });
  }

  /**
   * Validación de cupón
   */
  public static async validateCoupon(merchantId: string, couponCode: string, grossAmount?: number) {
    const supabase = getSupabaseAdminClient();

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('code', couponCode.trim().toUpperCase())
      .single();

    if (error || !coupon) {
      return { valid: false, error: 'Cupón no encontrado para este comercio', discountAmount: 0 };
    }

    const validation = MilestoneService.validateCouponRedemption(coupon, grossAmount);
    return {
      ...validation,
      couponDetails: {
        code: coupon.code,
        title: coupon.title,
        rewardType: coupon.reward_type,
        expiresAt: coupon.expires_at,
        status: coupon.status,
      },
    };
  }
}
