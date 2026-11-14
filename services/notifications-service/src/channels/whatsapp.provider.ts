import { NotificationStatus } from '@expandemoney/shared-types';
import { GeneratedMessage, ProviderSendResult } from '../types/notification.types';

export class WhatsAppProvider {
  private static apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0';
  private static phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private static apiToken = process.env.WHATSAPP_API_TOKEN;

  /**
   * Normaliza números telefónicos al formato internacional de Perú (+51...)
   */
  public static normalizePhoneNumber(rawPhone: string): string {
    const cleaned = rawPhone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('51') && cleaned.length === 11) {
      return `+${cleaned}`;
    }
    if (cleaned.length === 9) {
      return `+51${cleaned}`;
    }
    return rawPhone.startsWith('+') ? rawPhone : `+${cleaned}`;
  }

  /**
   * Envía un mensaje transaccional por WhatsApp
   */
  public static async sendMessage(message: GeneratedMessage): Promise<ProviderSendResult> {
    const normalizedPhone = this.normalizePhoneNumber(message.recipient_target);
    const hasLiveCredentials = Boolean(this.phoneNumberId && this.apiToken);

    // Si existen credenciales reales de WhatsApp Cloud API (Meta)
    if (hasLiveCredentials) {
      try {
        const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
        const payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone.replace('+', ''),
          type: 'text',
          text: {
            preview_url: true,
            body: message.message,
          },
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data?.messages?.[0]?.id) {
          return {
            success: true,
            message_id: data.messages[0].id,
            status: 'sent',
            provider: 'whatsapp_cloud_api',
            details: data,
          };
        } else {
          return {
            success: false,
            message_id: `fail_${Date.now()}`,
            status: 'failed',
            provider: 'whatsapp_cloud_api',
            error: data?.error?.message || 'Error en WhatsApp Cloud API',
            details: data,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          message_id: `err_${Date.now()}`,
          status: 'failed',
          provider: 'whatsapp_cloud_api',
          error: err.message,
        };
      }
    }

    // Modo Sandbox / Simulación local sin credenciales externas
    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    const mockWamid = `wamid.HBgL${randomSuffix}==`;

    console.log(`\n================== [WHATSAPP SANDBOX OUTBOUND] ==================`);
    console.log(`Para: ${message.recipient_name} (${normalizedPhone}) [${message.recipient_type.toUpperCase()}]`);
    console.log(`Mensaje:`);
    console.log(message.message);
    console.log(`ID Simulado: ${mockWamid}`);
    console.log(`=================================================================\n`);

    return {
      success: true,
      message_id: mockWamid,
      status: 'simulated',
      provider: 'whatsapp_sandbox',
      details: {
        to: normalizedPhone,
        preview_url: true,
        sent_at: new Date().toISOString(),
      },
    };
  }
}
