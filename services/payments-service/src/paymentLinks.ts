import { PaymentLink } from '@expandemoney/shared-types';
import { getSupabaseAdminClient } from '@expandemoney/supabase-client';

export interface CreatePaymentLinkDTO {
  merchantId: string;
  title: string;
  description?: string;
  amount: number;
  customSlug?: string;
}

export class PaymentLinkService {
  private static readonly FLAT_FEE_PCT = 5.0; // 5% tarifa plana expandeMoney

  public static async createLink(dto: CreatePaymentLinkDTO): Promise<PaymentLink> {
    const supabase = getSupabaseAdminClient();

    // Generar slug si no se proporcionó
    const baseSlug = (dto.customSlug || dto.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const finalSlug = `${baseSlug}-${randomSuffix}`;

    const { data, error } = await supabase
      .from('payment_links')
      .insert({
        merchant_id: dto.merchantId,
        title: dto.title,
        description: dto.description || null,
        amount: dto.amount,
        slug: finalSlug,
        fee_percentage: this.FLAT_FEE_PCT,
        status: 'active',
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Error al crear link de cobro: ${error?.message}`);
    }

    return data as PaymentLink;
  }

  public static async getBySlug(slug: string): Promise<PaymentLink | null> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('payment_links')
      .select('*, merchants(name, logo_url, brand_color)')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return data as any;
  }
}
