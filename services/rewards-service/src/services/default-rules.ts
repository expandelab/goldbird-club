import { LoyaltyTier, RewardRule } from '@expandemoney/shared-types';

/**
 * Reglas de negocio EM.R por defecto para comercios que aún no han personalizado sus niveles.
 */
export function getDefaultRewardRulesForMerchant(
  merchantId: string,
  merchantData?: {
    min_spend_for_stamp?: number;
    reward_type?: 'free_product' | 'balance_credit';
    reward_title?: string;
    reward_value?: number;
  }
): RewardRule[] {
  const minSpend = Number(merchantData?.min_spend_for_stamp || 30.0);
  const rewardType = merchantData?.reward_type || 'free_product';
  const rewardTitle = merchantData?.reward_title || 'Premio EM.R 10 Consumos';
  const rewardValue = Number(merchantData?.reward_value || 20.0);

  return [
    {
      merchant_id: merchantId,
      tier: 'bronce',
      consumption_goal: 10,
      cashback_rate_pct: 3.0,
      balance_to_release: 0.0,
      min_spend: minSpend,
      reward_type: rewardType,
      reward_title: rewardTitle,
      reward_description:
        'Nivel inicial (1 a 9 consumos). Cashback del 3% en saldo bloqueado para incentivar retorno en próxima visita.',
      is_active: true,
    },
    {
      merchant_id: merchantId,
      tier: 'plata',
      consumption_goal: 30,
      cashback_rate_pct: 5.0,
      balance_to_release: rewardValue,
      min_spend: minSpend,
      reward_type: rewardType,
      reward_title: `Beneficio Plata: ${rewardTitle}`,
      reward_description:
        'Nivel intermedio/recurrente (10 a 30 consumos). Cashback del 5% de disponibilidad inmediata y cupones de premio.',
      is_active: true,
    },
    {
      merchant_id: merchantId,
      tier: 'oro',
      consumption_goal: 50,
      cashback_rate_pct: 8.0,
      balance_to_release: rewardValue * 1.5,
      min_spend: minSpend,
      reward_type: 'balance_credit',
      reward_title: `Premio VIP Oro: S/ ${(rewardValue * 1.5).toFixed(2)} de Saldo Libre`,
      reward_description:
        'Nivel Top Tier / VIP (> 30 consumos). Máxima tasa de cashback del 8% disponible al instante y trato preferencial.',
      is_active: true,
    },
  ];
}

export function getDefaultRuleForTier(
  merchantId: string,
  tier: LoyaltyTier,
  merchantData?: {
    min_spend_for_stamp?: number;
    reward_type?: 'free_product' | 'balance_credit';
    reward_title?: string;
    reward_value?: number;
  }
): RewardRule {
  const allDefaults = getDefaultRewardRulesForMerchant(merchantId, merchantData);
  const found = allDefaults.find((r) => r.tier === tier);
  return found || allDefaults[0];
}
