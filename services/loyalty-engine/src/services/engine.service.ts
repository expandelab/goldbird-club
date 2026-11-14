import { LoyaltyTier, Merchant, Customer, RewardType, BalanceCreditType } from '@expandemoney/shared-types';

export interface TierRules {
  tier: LoyaltyTier;
  title: string;
  badgeName: string;
  minVisits: number;
  maxVisits?: number;
  defaultCashbackPct: number;
  balanceType: BalanceCreditType;
  benefitsDescription: string;
}

export interface StampEvaluationInput {
  merchant: Pick<Merchant, 'min_spend_for_stamp' | 'reward_type' | 'reward_title' | 'reward_value'> & {
    cashback_bronze_pct?: number;
    cashback_silver_pct?: number;
    cashback_gold_pct?: number;
  };
  customer: Pick<Customer, 'current_tier' | 'total_visits' | 'current_cycle_visits' | 'available_balance' | 'locked_balance'>;
  grossAmount: number;
}

export interface StampEvaluationResult {
  qualifiesForStamp: boolean;
  stampsAwarded: number;
  minSpendRequired: number;
  grossAmount: number;
  previousTier: LoyaltyTier;
  newTier: LoyaltyTier;
  tierUpgraded: boolean;
  newTotalVisits: number;
  newCycleVisits: number;
  isRewardEarned: boolean;
  cashbackPct: number;
  cashbackEarned: number;
  balanceCreditedType: BalanceCreditType;
  unlockedBalance: number;
  tierPerks: {
    tier: LoyaltyTier;
    title: string;
    range: string;
    cashbackPct: number;
    balanceMode: BalanceCreditType;
    perks: string;
  };
  rewardDetails?: {
    rewardType: RewardType;
    rewardTitle: string;
    rewardValue: number;
  };
}

export interface SimulationInput {
  merchant: Partial<Merchant> & {
    cashback_bronze_pct?: number;
    cashback_silver_pct?: number;
    cashback_gold_pct?: number;
    min_spend_for_stamp?: number;
  };
  customer: Pick<Customer, 'current_tier' | 'total_visits' | 'current_cycle_visits' | 'available_balance' | 'locked_balance'>;
  grossAmount: number;
  redeemCashback?: boolean;
  couponDiscount?: number;
}

export class EngineService {
  public static readonly MIN_SPEND_STAMP_DEFAULT = 30.00; // S/ 30.00 en local
  public static readonly CYCLE_TARGET = 10;                // 10 consumos (Tarjeta EM.R)

  // Porcentajes por defecto de cashback
  public static readonly DEFAULT_CASHBACK_BRONZE = 3.0; // 3%
  public static readonly DEFAULT_CASHBACK_SILVER = 5.0; // 5%
  public static readonly DEFAULT_CASHBACK_GOLD = 8.0;   // 8%

  /**
   * Determina el nivel del cliente según sus consumos calificados (≥ S/ 30 en local):
   * - Bronce (1 a 9 consumos en local): Nivel Inicial / Onboarding
   * - Plata (10 a 30 consumos en local): Nivel Intermedio / Recurrente
   * - Oro (> 30 consumos en local): Nivel Top Tier / VIP
   */
  public static calculateTier(totalQualifiedVisits: number): LoyaltyTier {
    if (totalQualifiedVisits > 30) return 'oro';
    if (totalQualifiedVisits >= 10) return 'plata';
    return 'bronce';
  }

  /**
   * Retorna la tasa de cashback (%) asignada al nivel, respetando overrides del comercio si existen
   */
  public static getCashbackRate(tier: LoyaltyTier, merchant?: Partial<Merchant> & {
    cashback_bronze_pct?: number;
    cashback_silver_pct?: number;
    cashback_gold_pct?: number;
  }): number {
    switch (tier) {
      case 'oro':
        return Number(merchant?.cashback_gold_pct ?? this.DEFAULT_CASHBACK_GOLD);
      case 'plata':
        return Number(merchant?.cashback_silver_pct ?? this.DEFAULT_CASHBACK_SILVER);
      case 'bronce':
      default:
        return Number(merchant?.cashback_bronze_pct ?? this.DEFAULT_CASHBACK_BRONZE);
    }
  }

  /**
   * Determina el tipo de abono según el nivel de fidelización:
   * - Bronce: Saldo Bloqueado ('locked') para garantizar el retorno en la próxima visita.
   * - Plata: Saldo Disponible ('available') de disponibilidad inmediata.
   * - Oro: Saldo Disponible ('available') de disponibilidad inmediata para cliente VIP.
   */
  public static getBalanceCreditType(tier: LoyaltyTier): BalanceCreditType {
    switch (tier) {
      case 'oro':
      case 'plata':
        return 'available';
      case 'bronce':
      default:
        return 'locked';
    }
  }

  /**
   * Retorna la información oficial y beneficios del nivel
   */
  public static getTierPerks(tier: LoyaltyTier, merchant?: any) {
    const rate = this.getCashbackRate(tier, merchant);
    const balanceMode = this.getBalanceCreditType(tier);

    switch (tier) {
      case 'oro':
        return {
          tier: 'oro' as LoyaltyTier,
          title: 'Nivel Oro (Top Tier / VIP)',
          range: 'Más de 30 consumos en local (>30)',
          cashbackPct: rate,
          balanceMode,
          perks: `${rate}% de saldo disponible inmediato. Acceso prioritario a experiencias exclusivas VIP, menús secretos y reservas preferenciales.`,
        };
      case 'plata':
        return {
          tier: 'plata' as LoyaltyTier,
          title: 'Nivel Plata (Intermedio / Recurrente)',
          range: '10 a 30 consumos en local',
          cashbackPct: rate,
          balanceMode,
          perks: `${rate}% de saldo disponible. Acceso inmediato al canje del premio del local tras completar 10 sellos y cupones de fidelidad recurrentes.`,
        };
      case 'bronce':
      default:
        return {
          tier: 'bronce' as LoyaltyTier,
          title: 'Nivel Bronce (Inicial / Onboarding)',
          range: '1 a 9 consumos en local',
          cashbackPct: rate,
          balanceMode,
          perks: `${rate}% en saldo bloqueado (se desbloquea en tu siguiente consumo). Acumula 1 sello por cada consumo desde S/ 30.`,
        };
    }
  }

  /**
   * Calcula el progreso del cliente hacia el siguiente nivel de fidelización
   */
  public static calculateTierProgress(totalVisits: number): {
    nextTier: LoyaltyTier | null;
    visitsToNextTier: number;
    progressPct: number;
  } {
    if (totalVisits > 30) {
      return {
        nextTier: null,
        visitsToNextTier: 0,
        progressPct: 100,
      };
    }

    if (totalVisits >= 10) {
      const visitsInSilver = totalVisits - 10;
      const targetForGold = 21; // 31 - 10
      const visitsNeeded = 31 - totalVisits;
      const progress = Math.min(100, Math.round((visitsInSilver / targetForGold) * 100));
      return {
        nextTier: 'oro',
        visitsToNextTier: visitsNeeded,
        progressPct: progress,
      };
    }

    // Bronce (0 a 9)
    const visitsNeeded = 10 - totalVisits;
    const progress = Math.min(100, Math.round((totalVisits / 10) * 100));
    return {
      nextTier: 'plata',
      visitsToNextTier: visitsNeeded,
      progressPct: progress,
    };
  }

  /**
   * Calcula el progreso de la tarjeta de 10 sellos (Punch Card Digital EM.R)
   */
  public static calculateCardProgress(currentCycleVisits: number): {
    currentStamps: number;
    targetStamps: number;
    stampsRemaining: number;
    progressPct: number;
  } {
    const current = Math.min(this.CYCLE_TARGET, Math.max(0, currentCycleVisits));
    const remaining = Math.max(0, this.CYCLE_TARGET - current);
    const progressPct = Math.round((current / this.CYCLE_TARGET) * 100);

    return {
      currentStamps: current,
      targetStamps: this.CYCLE_TARGET,
      stampsRemaining: remaining,
      progressPct,
    };
  }

  /**
   * Evalúa las reglas de fidelización EM.R para un consumo en local:
   * 1. Verifica si califica para sello (monto >= min_spend_for_stamp)
   * 2. Calcula incremento de visitas y avance en la tarjeta de 10 sellos
   * 3. Evalúa si se alcanza la meta de 10 sellos (emisión de premio)
   * 4. Calcula cambio de nivel (Bronce -> Plata -> Oro)
   * 5. Calcula cashback (%) y determina si se abona como bloqueado (Bronce) o disponible (Plata/Oro)
   * 6. Desbloquea saldo bloqueado acumulado previo al registrar un consumo calificado
   */
  public static evaluateConsumption(input: StampEvaluationInput): StampEvaluationResult {
    const minSpend = Number(input.merchant.min_spend_for_stamp) || this.MIN_SPEND_STAMP_DEFAULT;
    const qualifies = input.grossAmount >= minSpend;

    let newTotalVisits = input.customer.total_visits;
    let newCycleVisits = input.customer.current_cycle_visits;
    let isRewardEarned = false;

    if (qualifies) {
      newTotalVisits += 1;
      newCycleVisits = (newCycleVisits % this.CYCLE_TARGET) + 1;
      if (newCycleVisits === this.CYCLE_TARGET) {
        isRewardEarned = true;
      }
    }

    const previousTier = input.customer.current_tier;
    const newTier = this.calculateTier(newTotalVisits);
    const tierUpgraded = previousTier !== newTier;

    // Tasa de cashback y tipo de abono según nivel resultante
    const cashbackPct = this.getCashbackRate(newTier, input.merchant);
    const cashbackEarned = Math.round((input.grossAmount * (cashbackPct / 100)) * 100) / 100;
    const balanceCreditedType = this.getBalanceCreditType(newTier);

    // Regla de desbloqueo: En la siguiente visita calificada (>= S/ 30), el saldo bloqueado previo se libera a disponible
    const unlockedBalance = qualifies ? Number(input.customer.locked_balance || 0) : 0;

    return {
      qualifiesForStamp: qualifies,
      stampsAwarded: qualifies ? 1 : 0,
      minSpendRequired: minSpend,
      grossAmount: input.grossAmount,
      previousTier,
      newTier,
      tierUpgraded,
      newTotalVisits,
      newCycleVisits,
      isRewardEarned,
      cashbackPct,
      cashbackEarned,
      balanceCreditedType,
      unlockedBalance,
      tierPerks: this.getTierPerks(newTier, input.merchant),
      rewardDetails: isRewardEarned
        ? {
            rewardType: input.merchant.reward_type || 'free_product',
            rewardTitle: input.merchant.reward_title || 'Premio 10 Consumos',
            rewardValue: Number(input.merchant.reward_value) || 20.0,
          }
        : undefined,
    };
  }

  /**
   * Simulación en memoria de cálculo de consumo y cashback (sin efectos secundarios en BD)
   */
  public static calculateTransaction(input: SimulationInput) {
    const minSpend = Number(input.merchant.min_spend_for_stamp) || this.MIN_SPEND_STAMP_DEFAULT;
    const qualifies = input.grossAmount >= minSpend;

    const projectedTotalVisits = qualifies ? input.customer.total_visits + 1 : input.customer.total_visits;
    const projectedCycleVisits = qualifies ? (input.customer.current_cycle_visits % this.CYCLE_TARGET) + 1 : input.customer.current_cycle_visits;
    const projectedTier = this.calculateTier(projectedTotalVisits);
    const tierUpgraded = projectedTier !== input.customer.current_tier;

    const cashbackPct = this.getCashbackRate(projectedTier, input.merchant);
    const cashbackEarned = Math.round((input.grossAmount * (cashbackPct / 100)) * 100) / 100;
    const balanceCreditedType = this.getBalanceCreditType(projectedTier);

    const couponDiscount = Number(input.couponDiscount || 0);
    const unlockedBalance = qualifies ? Number(input.customer.locked_balance || 0) : 0;
    const spendableBalance = Number(input.customer.available_balance || 0) + unlockedBalance;

    let cashbackRedeemed = 0;
    const amountAfterCoupon = Math.max(0, input.grossAmount - couponDiscount);
    if (input.redeemCashback && spendableBalance > 0) {
      cashbackRedeemed = Math.min(spendableBalance, amountAfterCoupon);
    }

    const netToPay = Math.max(0, amountAfterCoupon - cashbackRedeemed);
    const isTenthVisit = qualifies && projectedCycleVisits === this.CYCLE_TARGET;

    return {
      grossAmount: input.grossAmount,
      qualifiesForStamp: qualifies,
      minSpendRequired: minSpend,
      stampsAwarded: qualifies ? 1 : 0,
      currentTier: input.customer.current_tier,
      projectedTier,
      tierUpgraded,
      projectedTotalVisits,
      projectedCycleVisits,
      isTenthVisit,
      cashbackPct,
      cashbackEarned,
      balanceCreditedType,
      unlockedBalance,
      couponDiscount,
      cashbackRedeemed,
      netToPay,
      tierPerks: this.getTierPerks(projectedTier, input.merchant),
    };
  }
}
