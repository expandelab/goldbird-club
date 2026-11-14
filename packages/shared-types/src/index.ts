/**
 * @expandemoney/shared-types
 * Tipos e interfaces de dominio para expandeMoney (Fintech B2B2C Perú)
 * Reglas de Negocio EM.R adaptadas para salida al mercado (Soft Launch)
 */

export type LoyaltyTier = 'bronce' | 'plata' | 'oro';

export type UserRole = 'merchant_admin' | 'merchant_staff' | 'customer' | 'super_admin';

export type MerchantStatus = 'pending_approval' | 'active' | 'rejected' | 'suspended';

export type RewardType = 'free_product' | 'balance_credit';

export type TransactionType =
  | 'in_store_sale'
  | 'payment_link'
  | 'cashback_redemption'
  | 'coupon_redemption';

export type TransactionStatus = 'pending' | 'completed' | 'refunded' | 'cancelled';

export type CouponStatus = 'active' | 'redeemed' | 'expired';

export type PaymentMethod =
  | 'yape'
  | 'plin'
  | 'tarjeta'
  | 'efectivo'
  | 'payment_link';

export interface MerchantBranch {
  id: string;
  merchant_id: string;
  name: string;        // Ej. "Sede Barranco"
  address: string;     // Ej. "Av. Pedro de Osma 135"
  district: string;    // Ej. "Barranco"
  city: string;        // Ej. "Lima"
  phone?: string;
  is_main: boolean;
  created_at: string;
}

export interface Merchant {
  id: string;
  legal_name: string;          // Razón Social (ej. "GASTRONOMIA DEL SUR S.A.C.")
  commercial_name: string;     // Nombre Comercial (ej. "Café Barranqueño")
  name?: string;               // Alias para compatibilidad con UI
  slug: string;
  ruc: string;                 // RUC 11 dígitos
  category: string;            // Rubro (ej. "Cafetería & Panadería Artesanal")
  status: MerchantStatus;      // Aprobación manual: 'pending_approval' o 'active'
  phone: string;
  email: string;
  logo_url?: string;
  brand_color: string;
  flat_fee_percentage: number; // Por defecto 5%

  // Datos del Responsable
  rep_name: string;            // Nombre completo del representante
  rep_dni: string;             // DNI (8 dígitos)
  rep_phone: string;           // Celular (+51)
  rep_email: string;           // Correo electrónico

  // Cuenta para Liquidación de Pagos
  bank_name: string;           // Banco (BCP, Interbank, BBVA, etc.)
  bank_cci: string;            // Código de Cuenta Interbancario (20 dígitos)

  // Reglas de Negocio EM.R (Configurables por comercio)
  min_spend_for_stamp: number; // Consumo mínimo para obtener 1 sello (S/ 30.00)
  reward_type: RewardType;     // 'free_product' (Producto gratis) o 'balance_credit' (Saldo)
  reward_title: string;        // Ej. "1/4 de Pollo a la Brasa Gratis" o "S/ 25 de Saldo"
  reward_value: number;        // Valor monetario de la recompensa en S/.
  reward_description?: string; // Términos o detalle del beneficio

  // Sedes asociadas
  branches?: MerchantBranch[];

  created_at: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  merchant_id: string;
  full_name: string;
  phone: string;               // Formato +51 9XXXXXXXX
  current_tier: LoyaltyTier;   // Bronce (1-9), Plata (10-30), Oro (>30)
  total_visits: number;        // Total de consumos calificados (>= S/ 30)
  current_cycle_visits: number;// Progreso 1 a 10 sellos para el premio EM.R
  available_balance: number;   // Saldo disponible en S/.
  locked_balance: number;      // Saldo bloqueado promocional
  total_spent: number;         // Consumo acumulado en S/.
  wallet_token: string;        // Token único para URL /wallet/[token]
  created_at: string;
  last_visit_at: string;
}

export interface Transaction {
  id: string;
  merchant_id: string;
  branch_id?: string | null;
  customer_id?: string | null;
  customer_name?: string;
  customer_phone?: string;
  type: TransactionType;
  gross_amount: number;         // Monto bruto en S/.
  qualified_for_stamp: boolean; // True si gross_amount >= min_spend_for_stamp (S/ 30.00)
  platform_fee_pct: number;     // 5.0%
  platform_fee_amount: number;  // Tarifa expandeMoney
  net_merchant_amount: number;  // Monto neto para el comercio
  cashback_pct_applied: number; // % de cashback según tier
  cashback_earned: number;      // Saldo generado (bloqueado/disponible)
  cashback_redeemed: number;    // Saldo usado como descuento
  status: TransactionStatus;
  payment_method: PaymentMethod;
  reference_code: string;       // Código de operación ej. EXP-261111-ABC
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Coupon {
  id: string;
  merchant_id: string;
  customer_id: string;
  code: string;                 // Ej. PREMIO10-9842
  title: string;                // Ej. "Premio 10 Consumos: Postre de la Casa Gratis"
  reward_type: RewardType;      // 'free_product' o 'balance_credit'
  discount_amount: number;      // Monto de descuento en S/.
  min_spend: number;            // Consumo mínimo requerido en S/.
  status: CouponStatus;
  expires_at: string;
  redeemed_at?: string | null;
  created_at: string;
}

export interface PaymentLink {
  id: string;
  merchant_id: string;
  title: string;
  description?: string;
  amount: number;
  slug: string;
  fee_percentage: number;
  status: 'active' | 'paid' | 'expired';
  customer_id?: string | null;
  created_at: string;
}

export interface MerchantMetrics {
  total_sales: number;           // Ventas registradas S/.
  total_credited_balance: number;// Saldo / premios abonados S/.
  loyalty_cost_pct: number;      // Costo de fidelización %
  total_customers: number;
  active_coupons_count: number;
  customers_by_tier: {
    bronce: number;              // 1 a 9 consumos
    plata: number;               // 10 a 30 consumos
    oro: number;                 // Más de 30 consumos
  };
  today_sales: number;
  today_transactions_count: number;
  avg_ticket: number;
  avg_ticket_recurring: number;
  avg_ticket_new: number;
}

export interface AuthSession {
  user_id: string;
  email?: string;
  phone?: string;
  role: UserRole;
  merchant_id?: string;
  merchant_status?: MerchantStatus;
  token: string;
  expires_at: number;
}

export interface QuickSalePayload {
  merchant_id: string;
  branch_id?: string;
  phone: string;
  full_name?: string;
  gross_amount: number;
  redeem_cashback?: boolean;
  coupon_code?: string;
  payment_method: PaymentMethod;
}

export interface MerchantOnboardingDTO {
  legal_name: string;          // Razón Social
  commercial_name: string;     // Nombre Comercial
  ruc: string;                 // RUC 11 dígitos
  category: string;            // Rubro
  branches: {
    name: string;
    address: string;
    district: string;
    city: string;
    phone?: string;
  }[];
  rep_name: string;            // Responsable: Nombre
  rep_dni: string;             // DNI (8 dígitos)
  rep_phone: string;           // Celular (+51)
  rep_email: string;           // Correo
  bank_name: string;           // Banco
  bank_cci: string;            // CCI (20 dígitos)
  reward_type: RewardType;     // 'free_product' | 'balance_credit'
  reward_title: string;        // Título del premio
  reward_value: number;        // Valor en S/.
  reward_description?: string;
}

export type BalanceCreditType = 'locked' | 'available';

export interface RecordConsumptionPayload {
  merchant_id: string;
  customer_id: string;
  monto: number;
  branch_id?: string;
  payment_method?: PaymentMethod;
  redeem_cashback?: boolean;
  coupon_code?: string;
}

export interface CustomerLoyaltyStatus {
  customer: {
    id: string;
    full_name: string;
    phone: string;
    wallet_token: string;
  };
  merchant: {
    id: string;
    commercial_name: string;
    slug: string;
  };
  tier: {
    current_tier: LoyaltyTier;
    name: string;
    perks: string;
    next_tier: LoyaltyTier | null;
    visits_to_next_tier: number;
    progress_pct_to_next_tier: number;
  };
  visits: {
    total_accumulated_visits: number;
    total_spent: number;
    last_visit_at: string;
  };
  balance: {
    available_balance: number;
    locked_balance: number;
    total_balance: number;
    cashback_rate_pct: number;
    balance_mode: BalanceCreditType;
    explanation: string;
  };
  card_progress: {
    current_stamps: number;
    target_stamps: number;
    stamps_remaining: number;
    progress_pct: number;
    min_spend_per_stamp: number;
    reward: {
      title: string;
      type: RewardType;
      value: number;
    };
  };
  active_coupons: Coupon[];
}

export interface RewardRule {
  id?: string;
  merchant_id: string;
  tier: LoyaltyTier; // 'bronce' | 'plata' | 'oro'
  consumption_goal: number; // Meta de consumos (ej. 10 consumos)
  cashback_rate_pct: number; // % o saldo cashback por visita
  balance_to_release: number; // Saldo a liberar (S/.)
  min_spend: number; // Consumo mínimo calificado (S/.)
  reward_type: RewardType; // 'free_product' | 'balance_credit'
  reward_title: string; // Título de la recompensa
  reward_description?: string; // Detalle de la recompensa
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrUpdateRewardRuleDTO {
  merchant_id?: string;
  merchantId?: string;
  tier: LoyaltyTier;
  consumption_goal?: number;
  consumptionGoal?: number;
  meta_consumos?: number;
  cashback_rate_pct?: number;
  cashbackRatePct?: number;
  cashback_balance_per_visit?: number;
  saldo_cashback_visita?: number;
  balance_to_release?: number;
  balanceToRelease?: number;
  saldo_a_liberar?: number;
  min_spend?: number;
  minSpend?: number;
  monto_minimo?: number;
  reward_type?: RewardType;
  rewardType?: RewardType;
  reward_title?: string;
  rewardTitle?: string;
  reward_description?: string;
  rewardDescription?: string;
  is_active?: boolean;
  isActive?: boolean;
}

export interface MerchantRewardProgram {
  merchant_id: string;
  merchant_name?: string;
  rules: RewardRule[];
  default_used: boolean;
  updated_at?: string;
}

// ==========================================
// NOTIFICATIONS SERVICE TYPES
// ==========================================

export type NotificationEventType =
  | 'nuevo_consumo'
  | 'liberacion_premio'
  | 'nuevo_cliente_qr'
  | 'cambio_nivel'
  | 'recordatorio_saldo'
  | 'alerta_comercio'
  | 'consumption_recorded'
  | 'reward_unlocked'
  | 'qr_registration'
  | 'tier_upgrade';

export type NotificationChannel = 'whatsapp' | 'email' | 'sms' | 'push';

export type NotificationRecipientType = 'customer' | 'merchant' | 'both';

export type NotificationStatus = 'sent' | 'simulated' | 'failed' | 'skipped';

export interface NotificationEventPayload {
  monto?: number;
  amount?: number;
  merchant_id?: string;
  merchantId?: string;
  customer_id?: string;
  customerId?: string;
  tipo_evento?: NotificationEventType;
  event_type?: NotificationEventType;
  channel_override?: NotificationChannel | 'both';
  branch_id?: string | null;
  payment_method?: PaymentMethod;
  metadata?: {
    coupon_code?: string;
    reward_title?: string;
    reward_value?: number;
    stamps?: number;
    target_stamps?: number;
    stamps_remaining?: number;
    balance_to_release?: number;
    locked_balance?: number;
    available_balance?: number;
    new_tier?: LoyaltyTier;
    previous_tier?: LoyaltyTier;
    qr_code_url?: string;
    wallet_url?: string;
    [key: string]: any;
  };
}

export interface NotificationDispatchItem {
  channel: NotificationChannel;
  recipient_type: 'customer' | 'merchant';
  recipient_target: string; // Celular (+51...) o correo
  recipient_name: string;
  message: string;
  status: NotificationStatus;
  message_id?: string;
  error?: string;
  timestamp: string;
}

export interface NotificationEvaluationResult {
  should_notify: boolean;
  reason?: string;
  dispatches: NotificationDispatchItem[];
  event_type: NotificationEventType;
  customer_id?: string;
  merchant_id?: string;
}

export interface NotificationLog {
  id: string;
  merchant_id: string;
  customer_id?: string | null;
  event_type: NotificationEventType;
  recipient_type: 'customer' | 'merchant';
  recipient_target: string;
  channel: NotificationChannel;
  content: string;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  created_at: string;
}


