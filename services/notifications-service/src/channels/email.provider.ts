import { NotificationStatus } from '@expandemoney/shared-types';
import { GeneratedMessage, ProviderSendResult } from '../types/notification.types';

export class EmailProvider {
  private static fromEmail = process.env.NOTIFICATION_FROM_EMAIL || 'notificaciones@expandemoney.pe';
  private static fromName = process.env.NOTIFICATION_FROM_NAME || 'eXpandeMoney Alertas';
  private static resendApiKey = process.env.RESEND_API_KEY;

  /**
   * Envía un correo electrónico transaccional
   */
  public static async sendMessage(message: GeneratedMessage): Promise<ProviderSendResult> {
    const to = message.recipient_target;
    const subject = message.subject || 'Notificación de eXpandeMoney';

    // Generar formato HTML amigable para email corporativo / cliente
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px; background-color: #FFFFFF;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #4F46E5; margin: 0; font-size: 24px; font-weight: 800;">eXpandeMoney</h2>
          <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0 0;">Plataforma de Fidelización & Pagos</p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="white-space: pre-line; color: #1F2937; line-height: 1.6; margin: 0; font-size: 15px;">
            ${message.message}
          </p>
        </div>
        <div style="text-align: center; border-top: 1px solid #E5E7EB; padding-top: 16px; font-size: 12px; color: #9CA3AF;">
          <p style="margin: 0;">Este es un mensaje automático emitido por la red de comercios afiliados a eXpandeMoney Perú.</p>
        </div>
      </div>
    `;

    // Si existe integración con Resend API
    if (this.resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${this.fromName} <${this.fromEmail}>`,
            to: [to],
            subject: subject,
            text: message.message,
            html: htmlBody,
          }),
        });

        const data = await response.json();

        if (response.ok && data?.id) {
          return {
            success: true,
            message_id: data.id,
            status: 'sent',
            provider: 'resend',
            details: data,
          };
        } else {
          return {
            success: false,
            message_id: `fail_${Date.now()}`,
            status: 'failed',
            provider: 'resend',
            error: data?.message || 'Error al despachar email vía Resend',
            details: data,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          message_id: `err_${Date.now()}`,
          status: 'failed',
          provider: 'resend',
          error: err.message,
        };
      }
    }

    // Modo Sandbox / Simulación local
    const mockEmailId = `msg_${Math.random().toString(36).substring(2, 12)}`;

    console.log(`\n=================== [EMAIL SANDBOX OUTBOUND] ===================`);
    console.log(`De: ${this.fromName} <${this.fromEmail}>`);
    console.log(`Para: ${message.recipient_name} <${to}> [${message.recipient_type.toUpperCase()}]`);
    console.log(`Asunto: ${subject}`);
    console.log(`Contenido:`);
    console.log(message.message);
    console.log(`ID Simulado: ${mockEmailId}`);
    console.log(`================================================================\n`);

    return {
      success: true,
      message_id: mockEmailId,
      status: 'simulated',
      provider: 'email_sandbox',
      details: {
        to,
        subject,
        sent_at: new Date().toISOString(),
      },
    };
  }
}
