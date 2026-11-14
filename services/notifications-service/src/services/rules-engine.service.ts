import {
  LoyaltyTier,
  NotificationChannel,
  NotificationEventType,
} from '@expandemoney/shared-types';
import {
  GeneratedMessage,
  NotificationEvaluationContext,
  ProcessEventOptions,
} from '../types/notification.types';

export interface RulesEvaluationOutput {
  shouldNotify: boolean;
  reason: string;
  messages: GeneratedMessage[];
}

export class RulesEngineService {
  private static enrollmentBaseUrl =
    process.env.NEXT_PUBLIC_CUSTOMER_ENROLLMENT_URL || 'http://localhost:3001';

  /**
   * Evalúa el evento recibido y decide si se debe notificar, a quiénes y por qué canales
   */
  public static evaluate(
    context: NotificationEvaluationContext,
    options?: ProcessEventOptions
  ): RulesEvaluationOutput {
    const { merchant, customer, event } = context;
    const eventType = this.normalizeEventType(event.type);
    const messages: GeneratedMessage[] = [];

    const walletUrl = customer.wallet_token
      ? `${this.enrollmentBaseUrl}/wallet/${customer.wallet_token}`
      : `${this.enrollmentBaseUrl}/enroll/${merchant.slug || 'comercio'}`;

    const preferredCustomerChannel: NotificationChannel =
      options?.channelOverride === 'email'
        ? 'email'
        : options?.channelOverride === 'whatsapp'
        ? 'whatsapp'
        : customer.phone
        ? 'whatsapp'
        : 'email';

    switch (eventType) {
      case 'nuevo_consumo':
      case 'consumption_recorded': {
        const minSpend = merchant.min_spend_for_stamp || 30.0;
        const qualifiesForStamp = event.amount >= minSpend;
        const targetStamps = 10;
        const currentStamps = customer.current_cycle_visits % targetStamps;
        const stampsRemaining = Math.max(0, targetStamps - currentStamps);
        const rewardTitle = merchant.reward_title || 'Premio de Fidelización';
        const rewardValue = merchant.reward_value || 20.0;
        const lockedBalance = customer.locked_balance || 0;
        const balanceToRelease =
          event.metadata?.balance_to_release ??
          (lockedBalance > 0 ? lockedBalance : 5.0);

        // 1. Mensaje de Alerta Motivacional de Progreso al Cliente
        let customerText = '';

        if (!qualifiesForStamp) {
          customerText =
            `☕ *¡Gracias por tu consumo en ${merchant.commercial_name}!* 🧾\n\n` +
            `Hola *${customer.full_name}*, registramos tu pago de *S/ ${event.amount.toFixed(2)}*.\n` +
            `💡 Recuerda que consumos desde *S/ ${minSpend.toFixed(2)}* acumulan sellos para liberar tu premio.\n\n` +
            `📲 Consulta tu billetera digital: ${walletUrl}`;
        } else if (stampsRemaining === 1) {
          // Caso destacado: ¡Te falta solo 1 consumo!
          customerText =
            `🔥 *¡ESTÁS A UN PASO DE TU PREMIO EN ${merchant.commercial_name.toUpperCase()}!* 🎯\n\n` +
            `¡Hola *${customer.full_name}*! Registramos tu consumo calificado de *S/ ${event.amount.toFixed(2)}*.\n\n` +
            `⭐ *¡Te falta 1 consumo para liberar ${rewardTitle} (Valor S/ ${rewardValue.toFixed(2)})!*\n` +
            `🎁 En tu siguiente visita recibirás tu cupón de regalo para canje inmediato.\n\n` +
            `👉 Revisa tu tarjeta de sellos aquí: ${walletUrl}`;
        } else if (customer.current_tier === 'bronce' && lockedBalance > 0) {
          // Alerta de saldo bloqueado acumulado
          customerText =
            `🎉 *¡Sumaste un nuevo sello en ${merchant.commercial_name}!* ⭐\n\n` +
            `Hola *${customer.full_name}*, tu consumo de *S/ ${event.amount.toFixed(2)}* fue registrado.\n\n` +
            `💰 Tienes *S/ ${lockedBalance.toFixed(2)}* en Saldo Bloqueado acumulado.\n` +
            `🎯 *¡Te faltan ${stampsRemaining} consumos para liberar S/ ${balanceToRelease.toFixed(2)}!* al completar tu tarjeta.\n\n` +
            `📲 Tu progreso en vivo: ${walletUrl}`;
        } else {
          // Consumo regular calificado
          customerText =
            `🎉 *¡Nuevo sello acreditado en ${merchant.commercial_name}!* ☕\n\n` +
            `Hola *${customer.full_name}*, registramos tu consumo de *S/ ${event.amount.toFixed(2)}*.\n\n` +
            `📊 Llevas *${currentStamps}/${targetStamps} sellos* acumulados.\n` +
            `🎁 Te faltan *${stampsRemaining} visita(s)* para ganar tu premio: *${rewardTitle}*.\n\n` +
            `📲 Abre tu tarjeta sin app: ${walletUrl}`;
        }

        // Registrar mensaje para el cliente
        messages.push({
          channel: preferredCustomerChannel,
          recipient_type: 'customer',
          recipient_target:
            preferredCustomerChannel === 'whatsapp'
              ? customer.phone
              : customer.email || customer.phone,
          recipient_name: customer.full_name,
          subject: `Actualización de tus sellos en ${merchant.commercial_name}`,
          message: customerText,
          template_id: stampsRemaining === 1 ? 'nuevo_consumo_falta_1' : 'nuevo_consumo_progreso',
          variables: {
            amount: event.amount,
            stampsRemaining,
            currentStamps,
            targetStamps,
            rewardTitle,
            rewardValue,
          },
        });

        // 2. Si el comercio tiene configurado recibir alertas transaccionales
        if (merchant.rep_phone && (stampsRemaining === 1 || event.amount >= 100)) {
          const merchantText =
            `🔔 *Alerta de Consumo en ${merchant.commercial_name}* 🔔\n\n` +
            `El cliente *${customer.full_name}* (+51 ${customer.phone.replace(/[^0-9]/g, '').slice(-9)}) ` +
            `acaba de registrar un consumo de *S/ ${event.amount.toFixed(2)}*.\n` +
            `Progreso: ${currentStamps}/10 sellos (${stampsRemaining === 1 ? '¡A 1 consumo de ganar el premio!' : 'Cliente activo'}).`;

          messages.push({
            channel: 'whatsapp',
            recipient_type: 'merchant',
            recipient_target: merchant.rep_phone,
            recipient_name: merchant.commercial_name,
            subject: `Consumo registrado - ${customer.full_name}`,
            message: merchantText,
            template_id: 'merchant_consumption_alert',
          });
        }

        return {
          shouldNotify: true,
          reason: 'Evento de nuevo consumo evaluado con éxito',
          messages,
        };
      }

      case 'liberacion_premio':
      case 'reward_unlocked': {
        const rewardTitle =
          event.metadata?.reward_title || merchant.reward_title || 'Premio de Fidelización';
        const rewardValue =
          event.metadata?.reward_value ?? merchant.reward_value ?? 20.0;
        const couponCode =
          event.metadata?.coupon_code ||
          `PREMIO10-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // 1. WhatsApp / Email al cliente final celebrando la liberación
        const customerText =
          `🏆 *¡FELICITACIONES ${customer.full_name.toUpperCase()}!* 🎊🎉\n\n` +
          `¡Has completado tus *10 sellos de fidelización* en *${merchant.commercial_name}*!\n\n` +
          `🎁 *Premio Liberado*: *${rewardTitle}* (Valor S/ ${Number(rewardValue).toFixed(2)})\n` +
          `🎟️ *Tu Cupón de Canje*: *${couponCode}*\n` +
          `⏳ *Vigencia*: 30 días para hacerlo efectivo en caja.\n\n` +
          `👉 Muestra este mensaje o abre tu cupón en tu billetera digital:\n${walletUrl}\n\n` +
          `¡Gracias por ser un cliente fiel de ${merchant.commercial_name}! 💙`;

        messages.push({
          channel: preferredCustomerChannel,
          recipient_type: 'customer',
          recipient_target:
            preferredCustomerChannel === 'whatsapp'
              ? customer.phone
              : customer.email || customer.phone,
          recipient_name: customer.full_name,
          subject: `¡Felicidades! Has liberado tu premio en ${merchant.commercial_name}`,
          message: customerText,
          template_id: 'liberacion_premio_cliente',
          variables: {
            rewardTitle,
            rewardValue,
            couponCode,
          },
        });

        // 2. Alerta al Comercio (WhatsApp o Email del Representante)
        const merchantContact = merchant.rep_phone || merchant.rep_email;
        if (merchantContact) {
          const isPhone = Boolean(merchant.rep_phone);
          const merchantText =
            `🌟 *¡ALERTA DE FIDELIZACIÓN - PREMIO LIBERADO!* 🌟\n\n` +
            `El cliente *${customer.full_name}* (Cel: +51 ${customer.phone.replace(/[^0-9]/g, '').slice(-9)}) ` +
            `acaba de completar sus 10 consumos en *${merchant.commercial_name}*.\n\n` +
            `🎁 *Premio a entregar*: ${rewardTitle} (S/ ${Number(rewardValue).toFixed(2)})\n` +
            `🎟️ *Código Cupón*: ${couponCode}\n\n` +
            `El cliente presentará este código en caja para canjear su beneficio. ¡Felicítalo en su visita! 🚀`;

          messages.push({
            channel: isPhone ? 'whatsapp' : 'email',
            recipient_type: 'merchant',
            recipient_target: merchantContact,
            recipient_name: merchant.commercial_name,
            subject: `¡Cliente VIP liberó premio! - ${customer.full_name}`,
            message: merchantText,
            template_id: 'liberacion_premio_comercio',
            variables: {
              customerName: customer.full_name,
              couponCode,
              rewardTitle,
            },
          });
        }

        return {
          shouldNotify: true,
          reason: 'Premio de 10 consumos liberado',
          messages,
        };
      }

      case 'nuevo_cliente_qr':
      case 'qr_registration': {
        const rewardTitle = merchant.reward_title || 'Premio de Bienvenida';

        // 1. Notificación de bienvenida al cliente
        const customerText =
          `👋 *¡Bienvenido(a) a ${merchant.commercial_name} en eXpandeMoney!* ✨\n\n` +
          `Hola *${customer.full_name}*, tu tarjeta de fidelización digital sin apps ya está activada con tu celular *${customer.phone}*.\n\n` +
          `💳 En cada visita y consumo calificado acumularás sellos y cashback en dinero real.\n` +
          `🎯 Tu meta actual: Acumula 10 consumos y recibe *${rewardTitle}*.\n\n` +
          `📲 Accede siempre a tu tarjeta digital aquí:\n${walletUrl}`;

        messages.push({
          channel: preferredCustomerChannel,
          recipient_type: 'customer',
          recipient_target:
            preferredCustomerChannel === 'whatsapp'
              ? customer.phone
              : customer.email || customer.phone,
          recipient_name: customer.full_name,
          subject: `Bienvenido a ${merchant.commercial_name}`,
          message: customerText,
          template_id: 'bienvenida_qr_cliente',
        });

        // 2. Notificación al comercio: "Nuevo cliente registrado vía QR"
        const merchantContact = merchant.rep_phone || merchant.rep_email;
        if (merchantContact) {
          const isPhone = Boolean(merchant.rep_phone);
          const merchantText =
            `📲 *Nuevo cliente registrado vía QR* 👥\n\n` +
            `*${customer.full_name}* (+51 ${customer.phone.replace(/[^0-9]/g, '').slice(-9)}) ` +
            `acaba de escanear el QR y enrolarse en tu programa de fidelización de *${merchant.commercial_name}*.\n\n` +
            `¡Un cliente más fidelizado para tu negocio! 🎉`;

          messages.push({
            channel: isPhone ? 'whatsapp' : 'email',
            recipient_type: 'merchant',
            recipient_target: merchantContact,
            recipient_name: merchant.commercial_name,
            subject: `Nuevo cliente registrado vía QR - ${customer.full_name}`,
            message: merchantText,
            template_id: 'nuevo_cliente_qr_comercio',
          });
        }

        return {
          shouldNotify: true,
          reason: 'Nuevo cliente registrado vía QR',
          messages,
        };
      }

      case 'cambio_nivel':
      case 'tier_upgrade': {
        const newTier = (event.metadata?.new_tier || customer.current_tier || 'plata') as LoyaltyTier;
        const tierName = newTier.toUpperCase();
        const cashbackPct = newTier === 'oro' ? '8%' : '5%';

        const customerText =
          `🚀 *¡SUBISTE DE NIVEL A ${tierName} EN ${merchant.commercial_name.toUpperCase()}!* 🌟\n\n` +
          `¡Felicidades *${customer.full_name}*! Tu constancia tiene recompensa.\n\n` +
          `💎 Como cliente *${tierName}*, ahora disfrutas de *${cashbackPct} de cashback* acreditado directamente como Saldo Disponible en cada consumo.\n\n` +
          `📲 Conoce todos tus nuevos beneficios aquí: ${walletUrl}`;

        messages.push({
          channel: preferredCustomerChannel,
          recipient_type: 'customer',
          recipient_target:
            preferredCustomerChannel === 'whatsapp'
              ? customer.phone
              : customer.email || customer.phone,
          recipient_name: customer.full_name,
          subject: `¡Subiste a nivel ${tierName} en ${merchant.commercial_name}!`,
          message: customerText,
          template_id: 'cambio_nivel_cliente',
        });

        return {
          shouldNotify: true,
          reason: `Cliente ascendido a nivel ${tierName}`,
          messages,
        };
      }

      case 'recordatorio_saldo': {
        const available = customer.available_balance || 0;
        if (available <= 0) {
          return {
            shouldNotify: false,
            reason: 'Cliente sin saldo disponible para recordar',
            messages: [],
          };
        }

        const customerText =
          `⏰ *¡Tienes S/ ${available.toFixed(2)} esperándote en ${merchant.commercial_name}!* 💰\n\n` +
          `Hola *${customer.full_name}*, no olvides que tienes saldo acumulado listo para descontar de tu próxima cuenta.\n\n` +
          `📲 Abre tu billetera y muéstrala en caja: ${walletUrl}`;

        messages.push({
          channel: preferredCustomerChannel,
          recipient_type: 'customer',
          recipient_target:
            preferredCustomerChannel === 'whatsapp'
              ? customer.phone
              : customer.email || customer.phone,
          recipient_name: customer.full_name,
          subject: `Tienes saldo disponible en ${merchant.commercial_name}`,
          message: customerText,
          template_id: 'recordatorio_saldo_cliente',
        });

        return {
          shouldNotify: true,
          reason: 'Recordatorio de saldo enviado',
          messages,
        };
      }

      default: {
        return {
          shouldNotify: false,
          reason: `Tipo de evento no reconocido: ${event.type}`,
          messages: [],
        };
      }
    }
  }

  /**
   * Normaliza alias en español e inglés
   */
  private static normalizeEventType(type: NotificationEventType): NotificationEventType {
    switch (type) {
      case 'consumption_recorded':
        return 'nuevo_consumo';
      case 'reward_unlocked':
        return 'liberacion_premio';
      case 'qr_registration':
        return 'nuevo_cliente_qr';
      case 'tier_upgrade':
        return 'cambio_nivel';
      default:
        return type;
    }
  }
}
