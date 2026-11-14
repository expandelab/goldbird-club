import { getSupabaseAdminClient } from '@expandemoney/supabase-client';
import {
  LoyaltyTier,
  RewardRule,
  CreateOrUpdateRewardRuleDTO,
  MerchantRewardProgram,
} from '@expandemoney/shared-types';
import {
  getDefaultRewardRulesForMerchant,
  getDefaultRuleForTier,
} from './default-rules';

// Almacén en memoria de respaldo para ambientes de desarrollo o pruebas sin migración DB aplicada
const memoryStore: Map<string, Map<LoyaltyTier, RewardRule>> = new Map();

export class RewardsService {
  /**
   * Crea o actualiza una regla de recompensa por nivel para un comercio
   */
  public static async upsertRule(
    dto: CreateOrUpdateRewardRuleDTO
  ): Promise<RewardRule> {
    const merchantId = (dto.merchantId || dto.merchant_id)?.trim();
    if (!merchantId) {
      throw new Error('merchant_id es requerido');
    }

    const tier = dto.tier;
    const consumptionGoal = Number(
      dto.consumptionGoal ?? dto.consumption_goal ?? dto.meta_consumos ?? 10
    );
    const cashbackRatePct = Number(
      dto.cashbackRatePct ??
        dto.cashback_rate_pct ??
        dto.cashback_balance_per_visit ??
        dto.saldo_cashback_visita ??
        3.0
    );
    const balanceToRelease = Number(
      dto.balanceToRelease ??
        dto.balance_to_release ??
        dto.saldo_a_liberar ??
        0.0
    );
    const minSpend = Number(
      dto.minSpend ?? dto.min_spend ?? dto.monto_minimo ?? 30.0
    );
    const rewardType = dto.rewardType ?? dto.reward_type ?? 'free_product';
    const rewardTitle =
      dto.rewardTitle ??
      dto.reward_title ??
      `Premio Nivel ${tier.toUpperCase()}`;
    const rewardDescription =
      dto.rewardDescription ??
      dto.reward_description ??
      `Regla para nivel ${tier}: Meta ${consumptionGoal} consumos, ${cashbackRatePct}% cashback, S/ ${balanceToRelease.toFixed(2)} liberado`;
    const isActive = dto.isActive ?? dto.is_active ?? true;

    const supabase = getSupabaseAdminClient();

    // 1. Verificar si el comercio existe en la BD
    let merchantInfo: any = null;
    try {
      const { data: merchant, error: mError } = await supabase
        .from('merchants')
        .select('id, commercial_name, min_spend_for_stamp, reward_type, reward_title, reward_value')
        .eq('id', merchantId)
        .maybeSingle();

      if (!mError && merchant) {
        merchantInfo = merchant;
      }
    } catch {
      // Continuar si Supabase no está conectado localmente
    }

    const payload = {
      merchant_id: merchantId,
      tier,
      consumption_goal: consumptionGoal,
      cashback_rate_pct: cashbackRatePct,
      balance_to_release: balanceToRelease,
      min_spend: minSpend,
      reward_type: rewardType,
      reward_title: rewardTitle,
      reward_description: rewardDescription,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    // 2. Intentar guardar en Supabase si la tabla existe
    try {
      const { data, error } = await supabase
        .from('merchant_reward_rules')
        .upsert(payload, { onConflict: 'merchant_id,tier' })
        .select('*')
        .single();

      if (!error && data) {
        const savedRule: RewardRule = {
          id: data.id,
          merchant_id: data.merchant_id,
          tier: data.tier as LoyaltyTier,
          consumption_goal: Number(data.consumption_goal),
          cashback_rate_pct: Number(data.cashback_rate_pct),
          balance_to_release: Number(data.balance_to_release),
          min_spend: Number(data.min_spend),
          reward_type: data.reward_type,
          reward_title: data.reward_title,
          reward_description: data.reward_description,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };

        // Sincronizar en memoria
        this.setInMemory(merchantId, savedRule);
        return savedRule;
      }
    } catch {
      // Fallback a memoria si la tabla aún no fue creada físicamente
    }

    // 3. Fallback en memoria si la BD no tiene la tabla
    const fallbackRule: RewardRule = {
      id: `rule-${merchantId}-${tier}`,
      ...payload,
      created_at: new Date().toISOString(),
    };
    this.setInMemory(merchantId, fallbackRule);
    return fallbackRule;
  }

  /**
   * Consulta las reglas de recompensa configuradas para un comercio.
   * Si el comercio no tiene reglas personalizadas para algún nivel,
   * se retornan las reglas base por defecto del sistema EM.R.
   */
  public static async getRulesByMerchant(
    merchantId: string
  ): Promise<MerchantRewardProgram> {
    const cleanId = merchantId.trim();
    const supabase = getSupabaseAdminClient();

    let merchantName: string | undefined = undefined;
    let merchantDefaults: any = undefined;

    // 1. Obtener datos del comercio
    try {
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id, commercial_name, min_spend_for_stamp, reward_type, reward_title, reward_value')
        .eq('id', cleanId)
        .maybeSingle();

      if (merchant) {
        merchantName = merchant.commercial_name;
        merchantDefaults = merchant;
      }
    } catch {
      // Ignorar error de conexión a Supabase
    }

    const defaultRules = getDefaultRewardRulesForMerchant(cleanId, merchantDefaults);
    const existingRulesMap: Map<LoyaltyTier, RewardRule> = new Map();

    // 2. Intentar leer de Supabase
    try {
      const { data: dbRules, error } = await supabase
        .from('merchant_reward_rules')
        .select('*')
        .eq('merchant_id', cleanId);

      if (!error && dbRules && dbRules.length > 0) {
        for (const row of dbRules) {
          const rule: RewardRule = {
            id: row.id,
            merchant_id: row.merchant_id,
            tier: row.tier as LoyaltyTier,
            consumption_goal: Number(row.consumption_goal),
            cashback_rate_pct: Number(row.cashback_rate_pct),
            balance_to_release: Number(row.balance_to_release),
            min_spend: Number(row.min_spend),
            reward_type: row.reward_type,
            reward_title: row.reward_title,
            reward_description: row.reward_description,
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
          };
          existingRulesMap.set(rule.tier, rule);
        }
      }
    } catch {
      // Fallback a memoria
    }

    // Si no vino de la BD, consultar almacén en memoria
    if (existingRulesMap.size === 0 && memoryStore.has(cleanId)) {
      const memMap = memoryStore.get(cleanId)!;
      memMap.forEach((val, key) => existingRulesMap.set(key, val));
    }

    // 3. Unir reglas existentes con defaults para garantizar siempre los 3 niveles
    const tiers: LoyaltyTier[] = ['bronce', 'plata', 'oro'];
    let defaultUsed = false;

    const mergedRules: RewardRule[] = tiers.map((t) => {
      if (existingRulesMap.has(t)) {
        return existingRulesMap.get(t)!;
      }
      defaultUsed = true;
      const def = defaultRules.find((d) => d.tier === t);
      return def || getDefaultRuleForTier(cleanId, t, merchantDefaults);
    });

    return {
      merchant_id: cleanId,
      merchant_name: merchantName || 'Comercio eXpandeMoney',
      rules: mergedRules,
      default_used: defaultUsed,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Consulta la regla de recompensa de un nivel específico para un comercio
   */
  public static async getRuleByTier(
    merchantId: string,
    tier: LoyaltyTier
  ): Promise<RewardRule> {
    const program = await this.getRulesByMerchant(merchantId);
    const rule = program.rules.find((r) => r.tier === tier);
    if (!rule) {
      return getDefaultRuleForTier(merchantId, tier);
    }
    return rule;
  }

  /**
   * Guarda regla en almacén en memoria
   */
  private static setInMemory(merchantId: string, rule: RewardRule): void {
    if (!memoryStore.has(merchantId)) {
      memoryStore.set(merchantId, new Map());
    }
    memoryStore.get(merchantId)!.set(rule.tier, rule);
  }
}
