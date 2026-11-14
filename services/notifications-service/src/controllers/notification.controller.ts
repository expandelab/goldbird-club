import { Request, Response } from 'express';
import { z } from 'zod';
import { NotificationService } from '../services/notification.service';
import { NotificationEventType, NotificationChannel } from '@expandemoney/shared-types';

const eventTypeEnum = z.enum(
  [
    'nuevo_consumo',
    'liberacion_premio',
    'nuevo_cliente_qr',
    'cambio_nivel',
    'recordatorio_saldo',
    'alerta_comercio',
    'consumption_recorded',
    'reward_unlocked',
    'qr_registration',
    'tier_upgrade',
  ],
  {
    errorMap: () => ({
      message:
        'tipo_evento debe ser: nuevo_consumo, liberacion_premio, nuevo_cliente_qr, cambio_nivel o recordatorio_saldo',
    }),
  }
);

const channelEnum = z.enum(['whatsapp', 'email', 'both']);

const eventNotificationSchema = z
  .object({
    monto: z.number().min(0, 'El monto debe ser un número mayor o igual a 0').optional(),
    amount: z.number().min(0, 'El amount debe ser un número mayor o igual a 0').optional(),
    merchant_id: z.string().min(1, 'merchant_id es requerido').optional(),
    merchantId: z.string().min(1, 'merchantId es requerido').optional(),
    customer_id: z.string().min(1, 'customer_id es requerido').optional(),
    customerId: z.string().min(1, 'customerId es requerido').optional(),
    tipo_evento: eventTypeEnum.optional(),
    event_type: eventTypeEnum.optional(),
    channel_override: channelEnum.optional(),
    branch_id: z.string().optional().nullable(),
    payment_method: z.enum(['yape', 'plin', 'tarjeta', 'efectivo', 'payment_link']).optional(),
    simulate: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
  })
  .refine(
    (data) => data.merchant_id !== undefined || data.merchantId !== undefined,
    { message: 'El identificador del comercio (merchant_id o merchantId) es requerido', path: ['merchant_id'] }
  )
  .refine(
    (data) => data.customer_id !== undefined || data.customerId !== undefined,
    { message: 'El identificador del cliente (customer_id o customerId) es requerido', path: ['customer_id'] }
  );

const sendDirectSchema = z.object({
  merchant_id: z.string().min(1, 'merchant_id es requerido'),
  customer_id: z.string().optional(),
  recipient_type: z.enum(['customer', 'merchant']).default('customer'),
  channel: z.enum(['whatsapp', 'email']),
  target: z.string().min(3, 'target (teléfono o correo) es requerido'),
  recipient_name: z.string().min(1, 'recipient_name es requerido'),
  message: z.string().min(3, 'message es requerido'),
  subject: z.string().optional(),
});

export class NotificationController {
  /**
   * POST /api/notifications/events
   * Endpoint principal: recibe un evento (nuevo_consumo, liberacion_premio, nuevo_cliente_qr, etc.)
   * Determina automáticamente si corresponde enviar WhatsApp / Email a cliente y/o comercio
   */
  public static async handleEvent(req: Request, res: Response) {
    try {
      const parsed = eventNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          errors: parsed.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const body = parsed.data;
      const merchantId = (body.merchant_id || body.merchantId)!;
      const customerId = (body.customer_id || body.customerId)!;
      const rawEventType = (body.tipo_evento || body.event_type || 'nuevo_consumo') as NotificationEventType;
      const amount = Number(body.monto ?? body.amount ?? 0);

      const result = await NotificationService.processEvent(
        {
          merchant_id: merchantId,
          customer_id: customerId,
          tipo_evento: rawEventType,
          monto: amount,
          channel_override: body.channel_override as any,
          branch_id: body.branch_id,
          payment_method: body.payment_method,
          metadata: body.metadata,
        },
        {
          channelOverride: body.channel_override as any,
          simulate: Boolean(body.simulate),
        }
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[notifications-service] Error procesando evento:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error interno al procesar notificación de evento',
      });
    }
  }

  /**
   * POST /api/notifications/preview
   * Evalúa las reglas y genera el texto sin despacharlo al proveedor
   */
  public static async previewEvent(req: Request, res: Response) {
    try {
      const parsed = eventNotificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          errors: parsed.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const body = parsed.data;
      const merchantId = (body.merchant_id || body.merchantId)!;
      const customerId = (body.customer_id || body.customerId)!;
      const rawEventType = (body.tipo_evento || body.event_type || 'nuevo_consumo') as NotificationEventType;
      const amount = Number(body.monto ?? body.amount ?? 0);

      const result = await NotificationService.processEvent(
        {
          merchant_id: merchantId,
          customer_id: customerId,
          tipo_evento: rawEventType,
          monto: amount,
          channel_override: body.channel_override as any,
          branch_id: body.branch_id,
          payment_method: body.payment_method,
          metadata: body.metadata,
        },
        {
          channelOverride: body.channel_override as any,
          simulate: true,
        }
      );

      return res.status(200).json({
        success: true,
        preview: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Error generando vista previa de notificación',
      });
    }
  }

  /**
   * POST /api/notifications/send
   * Envía una notificación manual o directa
   */
  public static async sendDirect(req: Request, res: Response) {
    try {
      const parsed = sendDirectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          errors: parsed.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const result = await NotificationService.sendDirect(parsed.data);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Error enviando notificación directa',
      });
    }
  }

  /**
   * GET /api/notifications/history
   * Consulta logs de notificaciones enviadas
   */
  public static async getHistory(req: Request, res: Response) {
    try {
      const merchantId = req.query.merchant_id as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      const logs = await NotificationService.getLogs(merchantId, limit);
      return res.status(200).json({
        success: true,
        total: logs.length,
        data: logs,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Error consultando historial de notificaciones',
      });
    }
  }

  /**
   * GET /api/notifications/templates
   * Lista las plantillas y reglas de fidelización configuradas
   */
  public static getTemplates(req: Request, res: Response) {
    res.json({
      success: true,
      templates: [
        {
          id: 'nuevo_consumo_falta_1',
          name: 'Alerta Último Consumo Faltante',
          event: 'nuevo_consumo',
          trigger: 'Cuando el cliente acumula 9 sellos (le falta 1 consumo para su premio)',
          example: '🔥 ¡ESTÁS A UN PASO DE TU PREMIO EN CAFÉ BARRANQUEÑO! ⭐ ¡Te falta 1 consumo para liberar 1/4 Pollo a la Brasa!',
          channel: 'WhatsApp (prioritario) / Email',
        },
        {
          id: 'nuevo_consumo_progreso',
          name: 'Progreso de Sellos / Saldo Bloqueado',
          event: 'nuevo_consumo',
          trigger: 'Consumo calificado regular >= S/ 30',
          example: '🎉 ¡Nuevo sello acreditado! Llevas 4/10 sellos. Te faltan 6 visitas para tu premio.',
          channel: 'WhatsApp',
        },
        {
          id: 'liberacion_premio_cliente',
          name: 'Liberación de Premio (Cliente)',
          event: 'liberacion_premio',
          trigger: 'Al alcanzar el décimo consumo (10 sellos en tarjeta)',
          example: '🏆 ¡FELICITACIONES! Has completado tus 10 sellos. Tu cupón de canje es PREMIO10-9842 por S/ 20.00.',
          channel: 'WhatsApp / Email',
        },
        {
          id: 'liberacion_premio_comercio',
          name: 'Alerta de Premio Liberado (Comercio)',
          event: 'liberacion_premio',
          trigger: 'Notifica al dueño/personal del comercio sobre un cliente VIP que liberó beneficio',
          example: '🌟 ¡Alerta de Fidelización! Tu cliente Juan Pérez acaba de liberar su premio: Postre de la Casa.',
          channel: 'WhatsApp / Email',
        },
        {
          id: 'bienvenida_qr_cliente',
          name: 'Bienvenida Enrolamiento QR',
          event: 'nuevo_cliente_qr',
          trigger: 'Cuando un cliente escanea el QR en el punto de venta y activa su tarjeta digital',
          example: '👋 ¡Bienvenido a Café Barranqueño en eXpandeMoney! Tu tarjeta digital ya está activada.',
          channel: 'WhatsApp',
        },
        {
          id: 'nuevo_cliente_qr_comercio',
          name: 'Nuevo Cliente QR (Comercio)',
          event: 'nuevo_cliente_qr',
          trigger: 'Notifica al comercio cuando un nuevo usuario se enrola en su sede',
          example: '📲 Nuevo cliente registrado vía QR: Carlos Mendoza (+51 987654321) se unió a tu programa.',
          channel: 'WhatsApp / Email',
        },
        {
          id: 'cambio_nivel_cliente',
          name: 'Ascenso de Nivel',
          event: 'cambio_nivel',
          trigger: 'Cuando el cliente pasa a nivel Plata (10 visitas) u Oro (>30 visitas)',
          example: '🚀 ¡SUBISTE DE NIVEL A ORO! Ahora recibes 8% de cashback en cada consumo.',
          channel: 'WhatsApp',
        },
      ],
    });
  }
}
