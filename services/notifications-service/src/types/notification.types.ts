import {
  LoyaltyTier,
  NotificationChannel,
  NotificationEventType,
  NotificationRecipientType,
  NotificationStatus,
  PaymentMethod,
} from '@expandemoney/shared-types';

export interface NotificationEvaluationContext {
  merchant: {
    id: string;
    commercial_name: string;
    legal_name?: string;
    slug?: string;
    reward_type?: string;
    reward_title?: string;
    reward_value?: number;
    min_spend_for_stamp?: number;
    rep_phone?: string;
    rep_email?: string;
  };
  customer: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    current_tier: LoyaltyTier;
    total_visits: number;
    current_cycle_visits: number;
    available_balance: number;
    locked_balance: number;
    wallet_token?: string;
  };
  event: {
    type: NotificationEventType;
    amount: number;
    branch_id?: string | null;
    payment_method?: PaymentMethod;
    metadata?: Record<string, any>;
  };
}

export interface GeneratedMessage {
  channel: NotificationChannel;
  recipient_type: 'customer' | 'merchant';
  recipient_target: string;
  recipient_name: string;
  subject?: string;
  message: string;
  template_id?: string;
  variables?: Record<string, any>;
}

export interface ProviderSendResult {
  success: boolean;
  message_id: string;
  status: NotificationStatus;
  provider: string;
  error?: string;
  details?: Record<string, any>;
}

export interface ProcessEventOptions {
  channelOverride?: NotificationChannel | 'both';
  simulate?: boolean;
}
