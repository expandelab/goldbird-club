import { getSupabaseAdminClient } from '@expandemoney/supabase-client';
import {
  NotificationDispatchItem,
  NotificationEvaluationResult,
  NotificationEventPayload,
  NotificationEventType,
  NotificationLog,
  NotificationStatus,
} from '@expandemoney/shared-types';
import {
  GeneratedMessage,
  NotificationEvaluationContext,
  ProcessEventOptions,
} from '../types/notification.types';
import { RulesEngineService } from './rules-engine.service';
import { WhatsAppProvider } from '../channels/whatsapp.provider';
import { EmailProvider } from '../channels/email.provider';

// Almacén en memoria de respaldo para ambientes de desarrollo / pruebas
const inMemoryLogs: NotificationLog[] = [];

export class NotificationService {
  /**
   * Procesa un evento transaccional o de fidelización
   */
  public static async processEvent(
    payload: NotificationEventPayload,
    options?: ProcessEventOptions
  ): Promise<NotificationEvaluationResult> {
    const merchantId = (payload.merchant_id || payload.merchantId)?.trim();
    const customerId = (payload.customer_id || payload.customerId)?.trim();
    const rawType = (payload.tipo_evento || payload.event_type || 'nuevo_consumo') as NotificationEventType;
    const amount = Number(payload.monto ?? payload.amount ?? 0);

    if (!merchantId) {
      throw new Error('merchant_id es requerido');
    }
    if (!customerId) {
      throw new Error('customer_id es requerido');
    }

    // 1. Obtener contexto del comercio y del cliente (BD Supabase o fallback)
    const context = await this.resolveContext(merchantId, customerId, rawType, amount, payload);

    // 2. Evaluar reglas de negocio y generar mensajes
    const evaluation = RulesEngineService.evaluate(context, options);

    if (!evaluation.shouldNotify || evaluation.messages.length === 0) {
      return {
        should_notify: false,
        reason: evaluation.reason,
        dispatches: [],
        event_type: rawType,
        customer_id: customerId,
        merchant_id: merchantId,
      };
    }

    // 3. Despachar mensajes a los canales correspondientes
    const dispatches: NotificationDispatchItem[] = [];

    for (const msg of evaluation.messages) {
      if (options?.simulate) {
        dispatches.push({
          channel: msg.channel,
          recipient_type: msg.recipient_type,
          recipient_target: msg.recipient_target,
          recipient_name: msg.recipient_name,
          message: msg.message,
          status: 'simulated',
          message_id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      let sendResult;
      if (msg.channel === 'whatsapp') {
        sendResult = await WhatsAppProvider.sendMessage(msg);
      } else {
        sendResult = await EmailProvider.sendMessage(msg);
      }

      const dispatchItem: NotificationDispatchItem = {
        channel: msg.channel,
        recipient_type: msg.recipient_type,
        recipient_target: msg.recipient_target,
        recipient_name: msg.recipient_name,
        message: msg.message,
        status: sendResult.status,
        message_id: sendResult.message_id,
        error: sendResult.error,
        timestamp: new Date().toISOString(),
      };

      dispatches.push(dispatchItem);

      // 4. Guardar log de auditoría
      await this.saveNotificationLog({
        merchant_id: merchantId,
        customer_id: customerId,
        event_type: rawType,
        recipient_type: msg.recipient_type,
        recipient_target: msg.recipient_target,
        channel: msg.channel,
        content: msg.message,
        status: sendResult.status,
        metadata: {
          template_id: msg.template_id,
          variables: msg.variables,
          provider_result: sendResult,
        },
      });
    }

    return {
      should_notify: true,
      reason: evaluation.reason,
      dispatches,
      event_type: rawType,
      customer_id: customerId,
      merchant_id: merchantId,
    };
  }

  /**
   * Resuelve los datos del comercio y cliente desde Supabase con fallback inteligente
   */
  private static async resolveContext(
    merchantId: string,
    customerId: string,
    eventType: NotificationEventType,
    amount: number,
    payload: NotificationEventPayload
  ): Promise<NotificationEvaluationContext> {
    const supabase = getSupabaseAdminClient();
    let merchantData: any = null;
    let customerData: any = null;

    try {
      const [mRes, cRes] = await Promise.all([
        supabase
          .from('merchants')
          .select('id, commercial_name, legal_name, slug, reward_type, reward_title, reward_value, min_spend_for_stamp, rep_phone, rep_email')
          .eq('id', merchantId)
          .maybeSingle(),
        supabase
          .from('customers')
          .select('id, full_name, phone, current_tier, total_visits, current_cycle_visits, available_balance, locked_balance, wallet_token')
          .eq('id', customerId)
          .maybeSingle(),
      ]);

      if (!mRes.error && mRes.data) {
        merchantData = mRes.data;
      }
      if (!cRes.error && cRes.data) {
        customerData = cRes.data;
      }
    } catch {
      // Si la base de datos está offline o no accesible en desarrollo, usamos fallbacks
    }

    // Defaults coherentes con los datos del monorepo
    const merchant = {
      id: merchantId,
      commercial_name: merchantData?.commercial_name || payload.metadata?.merchant_name || 'Comercio Afiliado',
      legal_name: merchantData?.legal_name || 'Comercio S.A.C.',
      slug: merchantData?.slug || 'comercio',
      reward_type: merchantData?.reward_type || payload.metadata?.reward_type || 'free_product',
      reward_title: merchantData?.reward_title || payload.metadata?.reward_title || 'Premio de Fidelización',
      reward_value: Number(merchantData?.reward_value || payload.metadata?.reward_value || 20.0),
      min_spend_for_stamp: Number(merchantData?.min_spend_for_stamp || payload.metadata?.min_spend || 30.0),
      rep_phone: merchantData?.rep_phone || payload.metadata?.rep_phone || '+51999888777',
      rep_email: merchantData?.rep_email || payload.metadata?.rep_email || 'comercio@expandemoney.pe',
    };

    const customer = {
      id: customerId,
      full_name: customerData?.full_name || payload.metadata?.customer_name || 'Cliente expandeMoney',
      phone: customerData?.phone || payload.metadata?.customer_phone || '+51987654321',
      email: customerData?.email || payload.metadata?.customer_email,
      current_tier: customerData?.current_tier || payload.metadata?.current_tier || 'bronce',
      total_visits: Number(customerData?.total_visits || payload.metadata?.total_visits || 9),
      current_cycle_visits: Number(customerData?.current_cycle_visits || payload.metadata?.current_cycle_visits || 9),
      available_balance: Number(customerData?.available_balance || payload.metadata?.available_balance || 0.0),
      locked_balance: Number(customerData?.locked_balance || payload.metadata?.locked_balance || 5.0),
      wallet_token: customerData?.wallet_token || payload.metadata?.wallet_token || 'token-demo-wallet',
    };

    return {
      merchant,
      customer,
      event: {
        type: eventType,
        amount,
        branch_id: payload.branch_id || null,
        payment_method: payload.payment_method,
        metadata: payload.metadata,
      },
    };
  }

  /**
   * Guarda un registro en notification_logs de Supabase o almacén en memoria
   */
  public static async saveNotificationLog(data: Omit<NotificationLog, 'id' | 'created_at'>): Promise<NotificationLog> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const logItem: NotificationLog = {
      id,
      ...data,
      created_at: new Date().toISOString(),
    };

    // Intentar en Supabase
    try {
      const supabase = getSupabaseAdminClient();
      await supabase.from('notification_logs').insert({
        merchant_id: data.merchant_id,
        customer_id: data.customer_id,
        event_type: data.event_type,
        recipient_type: data.recipient_type,
        recipient_target: data.recipient_target,
        channel: data.channel,
        content: data.content,
        status: data.status,
        metadata: data.metadata || {},
      });
    } catch {
      // Ignorar error si la tabla no existe en local
    }

    inMemoryLogs.unshift(logItem);
    if (inMemoryLogs.length > 200) {
      inMemoryLogs.pop();
    }

    return logItem;
  }

  /**
   * Consulta historial de notificaciones enviadas
   */
  public static async getLogs(merchantId?: string, limit = 50): Promise<NotificationLog[]> {
    const supabase = getSupabaseAdminClient();
    try {
      let query = supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (merchantId) {
        query = query.eq('merchant_id', merchantId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as NotificationLog[];
      }
    } catch {
      // Usar memoria si falla
    }

    if (merchantId) {
      return inMemoryLogs.filter(l => l.merchant_id === merchantId).slice(0, limit);
    }
    return inMemoryLogs.slice(0, limit);
  }

  /**
   * Envía un mensaje manual o directo
   */
  public static async sendDirect(params: {
    merchant_id: string;
    customer_id?: string;
    recipient_type: 'customer' | 'merchant';
    channel: 'whatsapp' | 'email';
    target: string;
    recipient_name: string;
    message: string;
    subject?: string;
  }): Promise<NotificationDispatchItem> {
    const msg: GeneratedMessage = {
      channel: params.channel,
      recipient_type: params.recipient_type,
      recipient_target: params.target,
      recipient_name: params.recipient_name,
      message: params.message,
      subject: params.subject,
    };

    const result = params.channel === 'whatsapp'
      ? await WhatsAppProvider.sendMessage(msg)
      : await EmailProvider.sendMessage(msg);

    const dispatch: NotificationDispatchItem = {
      channel: params.channel,
      recipient_type: params.recipient_type,
      recipient_target: params.target,
      recipient_name: params.recipient_name,
      message: params.message,
      status: result.status,
      message_id: result.message_id,
      error: result.error,
      timestamp: new Date().toISOString(),
    };

    await this.saveNotificationLog({
      merchant_id: params.merchant_id,
      customer_id: params.customer_id || null,
      event_type: 'alerta_comercio',
      recipient_type: params.recipient_type,
      recipient_target: params.target,
      channel: params.channel,
      content: params.message,
      status: result.status,
      metadata: { direct: true, provider: result.provider },
    });

    return dispatch;
  }
}
