import { Request, Response } from 'express';
import { z } from 'zod';
import { RewardsService } from '../services/rewards.service';
import { LoyaltyTier, RewardType } from '@expandemoney/shared-types';

const tierEnum = z.enum(['bronce', 'plata', 'oro'], {
  errorMap: () => ({ message: 'El nivel debe ser bronce, plata u oro' }),
});

const rewardTypeEnum = z.enum(['free_product', 'balance_credit'], {
  errorMap: () => ({ message: 'reward_type debe ser free_product o balance_credit' }),
});

// Esquema para crear o actualizar una regla de recompensa
const upsertRuleSchema = z
  .object({
    merchant_id: z.string().min(1, 'merchant_id es requerido').optional(),
    merchantId: z.string().min(1, 'merchantId es requerido').optional(),
    tier: tierEnum,
    consumption_goal: z.number().int().positive('La meta de consumos debe ser un entero positivo').optional(),
    consumptionGoal: z.number().int().positive('consumptionGoal debe ser un entero positivo').optional(),
    meta_consumos: z.number().int().positive('meta_consumos debe ser un entero positivo').optional(),
    cashback_rate_pct: z.number().min(0, 'El cashback debe ser mayor o igual a 0').optional(),
    cashbackRatePct: z.number().min(0, 'cashbackRatePct debe ser mayor o igual a 0').optional(),
    cashback_balance_per_visit: z.number().min(0).optional(),
    saldo_cashback_visita: z.number().min(0).optional(),
    balance_to_release: z.number().min(0, 'El saldo a liberar debe ser mayor o igual a 0').optional(),
    balanceToRelease: z.number().min(0, 'balanceToRelease debe ser mayor o igual a 0').optional(),
    saldo_a_liberar: z.number().min(0).optional(),
    min_spend: z.number().min(0).optional(),
    minSpend: z.number().min(0).optional(),
    monto_minimo: z.number().min(0).optional(),
    reward_type: rewardTypeEnum.optional(),
    rewardType: rewardTypeEnum.optional(),
    reward_title: z.string().min(1).optional(),
    rewardTitle: z.string().min(1).optional(),
    reward_description: z.string().optional(),
    rewardDescription: z.string().optional(),
    is_active: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => data.merchant_id !== undefined || data.merchantId !== undefined,
    { message: 'El identificador del comercio (merchant_id o merchantId) es requerido', path: ['merchant_id'] }
  );

export class RewardsController {
  /**
   * POST /api/rewards/rules
   * PUT  /api/rewards/rules
   * PUT  /api/rewards/merchants/:merchantId/rules/:tier
   * Crear o editar una regla de recompensa (nivel Bronce/Plata/Oro, meta de consumos, saldo cashback por visita, saldo a liberar)
   */
  public static async upsertRule(req: Request, res: Response) {
    try {
      // Combinar parámetros de URL si existen
      const body = {
        ...req.body,
        merchant_id: req.params.merchantId || req.body.merchant_id || req.body.merchantId,
        merchantId: req.params.merchantId || req.body.merchantId || req.body.merchant_id,
        tier: req.params.tier || req.body.tier,
      };

      const parsed = upsertRuleSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'Error de validación en los datos de la regla de recompensa',
          details: parsed.error.format(),
        });
      }

      const rule = await RewardsService.upsertRule(parsed.data);

      return res.status(200).json({
        success: true,
        message: `Regla de recompensa para el nivel ${rule.tier.toUpperCase()} guardada exitosamente`,
        rule,
      });
    } catch (error: any) {
      console.error('[rewards-service] Error al guardar regla de recompensa:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor al procesar regla de recompensa',
      });
    }
  }

  /**
   * GET /api/rewards/merchants/:merchantId/rules
   * GET /api/rewards/rules/:merchantId
   * Consultar todas las reglas de recompensa y niveles del comercio
   */
  public static async getRulesByMerchant(req: Request, res: Response) {
    try {
      const merchantId = req.params.merchantId?.trim();
      if (!merchantId) {
        return res.status(400).json({
          success: false,
          error: 'El parámetro merchantId es requerido',
        });
      }

      const program = await RewardsService.getRulesByMerchant(merchantId);

      return res.json({
        success: true,
        program,
      });
    } catch (error: any) {
      console.error('[rewards-service] Error al consultar reglas de recompensa:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener reglas del comercio',
      });
    }
  }

  /**
   * GET /api/rewards/merchants/:merchantId/rules/:tier
   * GET /api/rewards/rules/:merchantId/:tier
   * Consultar la regla de un nivel específico (Bronce/Plata/Oro) de un comercio
   */
  public static async getRuleByTier(req: Request, res: Response) {
    try {
      const merchantId = req.params.merchantId?.trim();
      const tierParam = req.params.tier?.toLowerCase() as LoyaltyTier;

      if (!merchantId) {
        return res.status(400).json({
          success: false,
          error: 'El parámetro merchantId es requerido',
        });
      }

      const tierParsed = tierEnum.safeParse(tierParam);
      if (!tierParsed.success) {
        return res.status(400).json({
          success: false,
          error: 'El nivel especificado no es válido. Debe ser bronce, plata u oro',
        });
      }

      const rule = await RewardsService.getRuleByTier(merchantId, tierParsed.data);

      return res.json({
        success: true,
        rule,
      });
    } catch (error: any) {
      console.error('[rewards-service] Error al consultar regla de nivel:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener regla de nivel',
      });
    }
  }

  /**
   * POST /api/rewards/merchants/:merchantId/program
   * Guardar o actualizar el programa completo (los 3 niveles) de una sola vez
   */
  public static async saveFullProgram(req: Request, res: Response) {
    try {
      const merchantId = req.params.merchantId?.trim() || req.body.merchantId || req.body.merchant_id;
      const rules = req.body.rules;

      if (!merchantId || !Array.isArray(rules) || rules.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere merchantId y un arreglo no vacío de rules',
        });
      }

      const savedRules = [];
      for (const item of rules) {
        const parsed = upsertRuleSchema.safeParse({
          ...item,
          merchantId,
        });
        if (parsed.success) {
          const saved = await RewardsService.upsertRule(parsed.data);
          savedRules.push(saved);
        }
      }

      const program = await RewardsService.getRulesByMerchant(merchantId);

      return res.json({
        success: true,
        message: 'Programa de recompensas actualizado con éxito',
        program,
      });
    } catch (error: any) {
      console.error('[rewards-service] Error al guardar programa de recompensas:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al guardar programa',
      });
    }
  }
}
