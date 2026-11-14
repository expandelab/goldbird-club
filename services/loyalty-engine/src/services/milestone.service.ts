import { Coupon, RewardType } from '@expandemoney/shared-types';

export interface MilestoneRewardConfig {
  rewardType: RewardType;
  rewardTitle: string;
  rewardValue: number;
}

export interface MilestoneEvaluation {
  currentCycleVisits: number;
  newCycleVisits: number;
  isMilestoneReached: boolean;
  couponToIssue?: {
    title: string;
    rewardType: RewardType;
    discountAmount: number;
    code: string;
    validDays: number;
  };
}

export class MilestoneService {
  public static readonly MILESTONE_CYCLE = 10; // 10 consumos por tarjeta EM.R

  /**
   * Evalúa si el consumo completa la tarjeta de 10 consumos y emite el cupón de premio configurable
   */
  public static evaluateMilestone(
    currentCycle: number,
    config: MilestoneRewardConfig
  ): MilestoneEvaluation {
    const newCycleVisits = (currentCycle % this.MILESTONE_CYCLE) + 1;
    const isMilestoneReached = newCycleVisits === this.MILESTONE_CYCLE;

    let couponToIssue = undefined;

    if (isMilestoneReached) {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      couponToIssue = {
        title: `¡Premio 10 Consumos! ${config.rewardTitle}`,
        rewardType: config.rewardType,
        discountAmount: config.rewardValue,
        code: `PREMIO10-${randomSuffix}`,
        validDays: 30,
      };
    }

    return {
      currentCycleVisits: currentCycle,
      newCycleVisits,
      isMilestoneReached,
      couponToIssue,
    };
  }

  /**
   * Valida si un cupón de recompensa puede ser canjeado para un monto específico
   */
  public static validateCouponRedemption(
    coupon: Coupon,
    grossAmount?: number
  ): { valid: boolean; error?: string; discountAmount: number } {
    if (coupon.status !== 'active') {
      return { valid: false, error: 'El cupón ya fue canjeado o está inactivo', discountAmount: 0 };
    }

    const now = new Date();
    const expiry = new Date(coupon.expires_at);
    if (now > expiry) {
      return { valid: false, error: 'El cupón ha expirado', discountAmount: 0 };
    }

    const minSpend = Number(coupon.min_spend || 0);
    if (grossAmount !== undefined && grossAmount < minSpend) {
      return {
        valid: false,
        error: `El consumo mínimo para este cupón es de S/ ${minSpend.toFixed(2)}`,
        discountAmount: 0,
      };
    }

    return {
      valid: true,
      discountAmount: Number(coupon.discount_amount),
    };
  }
}
