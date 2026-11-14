import { Request, Response } from 'express';
import { z } from 'zod';
import { LoyaltyService } from '../services/loyalty.service';
import { PaymentMethod } from '@expandemoney/shared-types';

const recordConsumptionSchema = z.object({
  monto: z.number().positive('El monto debe ser un número positivo mayor a 0').optional(),
  amount: z.number().positive('El amount debe ser un número positivo mayor a 0').optional(),
  merchant_id: z.string().uuid('merchant_id debe ser un UUID válido').optional(),
  merchantId: z.string().uuid('merchantId debe ser un UUID válido').optional(),
  customer_id: z.string().uuid('customer_id debe ser un UUID válido').optional(),
  customerId: z.string().uuid('customerId debe ser un UUID válido').optional(),
  branch_id: z.string().uuid('branch_id debe ser un UUID válido').optional().nullable(),
  branchId: z.string().uuid('branchId debe ser un UUID válido').optional().nullable(),
  payment_method: z.enum(['yape', 'plin', 'tarjeta', 'efectivo', 'payment_link']).optional(),
  paymentMethod: z.enum(['yape', 'plin', 'tarjeta', 'efectivo', 'payment_link']).optional(),
  redeem_cashback: z.boolean().optional(),
  redeemCashback: z.boolean().optional(),
  coupon_code: z.string().optional().nullable(),
  couponCode: z.string().optional().nullable(),
}).refine(
  (data) => data.monto !== undefined || data.amount !== undefined,
  { message: 'El monto del consumo (monto o amount) es requerido y debe ser mayor a 0', path: ['monto'] }
).refine(
  (data) => data.merchant_id !== undefined || data.merchantId !== undefined,
  { message: 'El identificador del comercio (merchant_id o merchantId) es requerido', path: ['merchant_id'] }
).refine(
  (data) => data.customer_id !== undefined || data.customerId !== undefined,
  { message: 'El identificador del cliente (customer_id o customerId) es requerido', path: ['customer_id'] }
);

const simulateSchema = z.object({
  merchantId: z.string().uuid().optional(),
  merchant_id: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  grossAmount: z.number().positive().optional(),
  monto: z.number().positive().optional(),
  redeemCashback: z.boolean().optional(),
  redeem_cashback: z.boolean().optional(),
  couponCode: z.string().optional().nullable(),
  coupon_code: z.string().optional().nullable(),
}).refine(
  (data) => (data.merchantId || data.merchant_id) && (data.customerId || data.customer_id) && (data.grossAmount || data.monto),
  { message: 'merchant_id, customer_id y monto son requeridos para la simulación' }
);

const validateCouponSchema = z.object({
  merchantId: z.string().uuid().optional(),
  merchant_id: z.string().uuid().optional(),
  couponCode: z.string().min(3).optional(),
  coupon_code: z.string().min(3).optional(),
  grossAmount: z.number().positive().optional(),
  monto: z.number().positive().optional(),
}).refine(
  (data) => (data.merchantId || data.merchant_id) && (data.couponCode || data.coupon_code),
  { message: 'merchant_id y coupon_code son requeridos' }
);

export class LoyaltyController {
  /**
   * POST /api/loyalty/record-consumption
   * Registra un consumo en local calculando:
   * - Regla de 1 sello por cada consumo ≥ S/ 30.00
   * - Cálculo de cashback escalonado según nivel:
   *   * Bronce (1 a 9 consumos): 3% en Saldo Bloqueado
   *   * Plata (10 a 30 consumos): 5% en Saldo Disponible
   *   * Oro (> 30 consumos): 8% en Saldo Disponible
   * - Desbloqueo de saldo bloqueado acumulado de visitas anteriores
   * - Transición y cambio de nivel (Bronce -> Plata -> Oro)
   * - Meta de 10 sellos y emisión automática del premio configurable
   */
  public static async recordConsumption(req: Request, res: Response) {
    try {
      const parsed = recordConsumptionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          errors: parsed.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const data = parsed.data;
      const amount = Number(data.monto ?? data.amount);
      const merchantId = (data.merchant_id ?? data.merchantId)!;
      const customerId = (data.customer_id ?? data.customerId)!;
      const branchId = (data.branch_id ?? data.branchId) || undefined;
      const paymentMethod = (data.payment_method ?? data.paymentMethod ?? 'efectivo') as PaymentMethod;
      const redeemCashback = Boolean(data.redeem_cashback ?? data.redeemCashback);
      const couponCode = (data.coupon_code ?? data.couponCode) || undefined;

      const result = await LoyaltyService.recordConsumption({
        merchantId,
        customerId,
        amount,
        branchId,
        paymentMethod,
        redeemCashback,
        couponCode,
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const status = error.message.includes('no encontrado') ? 404 : 500;
      return res.status(status).json({
        success: false,
        error: error.message || 'Error interno al registrar consumo',
      });
    }
  }

  /**
   * GET /api/loyalty/customers/:customerId/status
   * Consulta el estado actual del cliente:
   * - Visitas acumuladas y monto total consumido
   * - Saldo abonado (saldo disponible vs. saldo bloqueado)
   * - Progreso de tarjeta de 10 consumos (Punch Card Digital)
   * - Beneficios activos según nivel Bronce/Plata/Oro y avance al siguiente tier
   * - Cupones vigentes listos para canjear
   */
  public static async getCustomerStatus(req: Request, res: Response) {
    try {
      const customerId = req.params.customerId || (req.query.customerId as string) || (req.query.customer_id as string);
      const merchantId = (req.query.merchantId as string) || (req.query.merchant_id as string) || undefined;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: 'El customerId es obligatorio en la ruta o como query parameter',
        });
      }

      const status = await LoyaltyService.getCustomerStatus(customerId, merchantId);

      return res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'Error al obtener estado de fidelización del cliente',
      });
    }
  }

  /**
   * POST /api/loyalty/simulate
   * Simula el cálculo de cashback, desbloqueo y tarjeta sin persistir cambios en la BD
   */
  public static async simulate(req: Request, res: Response) {
    try {
      const parsed = simulateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          errors: parsed.error.errors,
        });
      }

      const data = parsed.data;
      const merchantId = (data.merchantId ?? data.merchant_id)!;
      const customerId = (data.customerId ?? data.customer_id)!;
      const grossAmount = Number(data.grossAmount ?? data.monto);
      const redeemCashback = Boolean(data.redeemCashback ?? data.redeem_cashback);
      const couponCode = (data.couponCode ?? data.coupon_code) || undefined;

      const simulation = await LoyaltyService.simulateConsumption(
        merchantId,
        customerId,
        grossAmount,
        redeemCashback,
        couponCode
      );

      return res.json({
        success: true,
        simulation,
      });
    } catch (error: any) {
      const status = error.message.includes('no encontrado') ? 404 : 500;
      return res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/loyalty/validate-coupon
   * Valida un cupón EM.R contra las reglas del comercio
   */
  public static async validateCoupon(req: Request, res: Response) {
    try {
      const parsed = validateCouponSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          errors: parsed.error.errors,
        });
      }

      const data = parsed.data;
      const merchantId = (data.merchantId ?? data.merchant_id)!;
      const couponCode = (data.couponCode ?? data.coupon_code)!;
      const grossAmount = data.grossAmount ?? data.monto;

      const result = await LoyaltyService.validateCoupon(merchantId, couponCode, grossAmount);

      return res.json({
        success: result.valid,
        ...result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
