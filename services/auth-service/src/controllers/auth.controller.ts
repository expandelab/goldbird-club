import { Request, Response } from 'express';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@expandemoney/supabase-client';
import { TokenService } from '../services/token.service';

const merchantRegistrationSchema = z.object({
  legal_name: z.string().min(3, 'Razón social requerida'),
  commercial_name: z.string().min(2, 'Nombre comercial requerido'),
  ruc: z.string().regex(/^(10|20)[0-9]{9}$/, 'RUC peruano inválido (11 dígitos empezando con 10 o 20)'),
  category: z.string().min(2, 'Rubro requerido'),
  rep_name: z.string().min(3, 'Nombre del responsable requerido'),
  rep_dni: z.string().regex(/^[0-9]{8}$/, 'DNI debe tener 8 dígitos numéricos'),
  rep_phone: z.string().regex(/^\+?51[9][0-9]{8}$/, 'Celular peruano inválido (+519XXXXXXXX)'),
  rep_email: z.string().email('Correo de responsable inválido'),
  bank_name: z.string().min(2, 'Banco requerido'),
  bank_cci: z.string().regex(/^[0-9]{20}$/, 'El CCI debe tener exactamente 20 dígitos numéricos'),
  branches: z.array(
    z.object({
      name: z.string().min(2),
      address: z.string().min(3),
      district: z.string().min(2),
      city: z.string().default('Lima'),
      phone: z.string().optional(),
    })
  ).min(1, 'Debe registrar al menos una sede'),
  reward_type: z.enum(['free_product', 'balance_credit']).default('free_product'),
  reward_title: z.string().min(3, 'Título del premio configurable requerido'),
  reward_value: z.number().min(1).default(20.0),
  admin_password: z.string().min(8, 'Contraseña de al menos 8 caracteres'),
});

const merchantLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export class AuthController {
  /**
   * Registro y Alta del Comercio (Aprobación manual al inicio)
   * Recoge: Razón social, RUC, Nombre Comercial, Rubro, Sedes, Responsable, Cuenta bancaria y Reglas EM.R
   */
  public static async registerMerchant(req: Request, res: Response) {
    try {
      const parsed = merchantRegistrationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.errors });
      }

      const data = parsed.data;
      const supabase = getSupabaseAdminClient();

      // Generar slug a partir del nombre comercial
      const slugBase = data.commercial_name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const slug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;

      // 1. Insertar comercio en estado 'pending_approval' (Aprobación manual para control de calidad)
      const { data: merchant, error: mError } = await supabase
        .from('merchants')
        .insert({
          legal_name: data.legal_name,
          commercial_name: data.commercial_name,
          slug,
          ruc: data.ruc,
          category: data.category,
          status: 'pending_approval', // Requiere aprobación manual del equipo expandeMoney
          phone: data.rep_phone,
          email: data.rep_email,
          rep_name: data.rep_name,
          rep_dni: data.rep_dni,
          rep_phone: data.rep_phone,
          rep_email: data.rep_email,
          bank_name: data.bank_name,
          bank_cci: data.bank_cci,
          min_spend_for_stamp: 30.00, // Consumo de 30 soles en local
          reward_type: data.reward_type,
          reward_title: data.reward_title,
          reward_value: data.reward_value,
        })
        .select('*')
        .single();

      if (mError || !merchant) {
        return res.status(400).json({ success: false, error: mError?.message || 'Error registrando comercio' });
      }

      // 2. Registrar sedes
      const branchesToInsert = data.branches.map((b, idx) => ({
        merchant_id: merchant.id,
        name: b.name,
        address: b.address,
        district: b.district,
        city: b.city,
        phone: b.phone || data.rep_phone,
        is_main: idx === 0,
      }));

      await supabase.from('merchant_branches').insert(branchesToInsert);

      // 3. Crear usuario administrador en Auth
      const { data: authUser, error: aError } = await supabase.auth.admin.createUser({
        email: data.rep_email,
        password: data.admin_password,
        email_confirm: true,
        user_metadata: {
          full_name: data.rep_name,
          role: 'merchant_admin',
          merchant_id: merchant.id,
        },
      });

      if (authUser?.user) {
        await supabase.from('profiles').insert({
          id: authUser.user.id,
          role: 'merchant_admin',
          full_name: data.rep_name,
          phone: data.rep_phone,
          email: data.rep_email,
          merchant_id: merchant.id,
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Solicitud de alta de comercio recibida con éxito. Estado: Pendiente de aprobación manual.',
        merchant: {
          id: merchant.id,
          legal_name: merchant.legal_name,
          commercial_name: merchant.commercial_name,
          slug: merchant.slug,
          status: merchant.status,
          ruc: merchant.ruc,
        },
        reviewProcess: 'Un asesor de expandeMoney validará tu RUC y cuenta bancaria en menos de 24 horas para activar tus cobros y QR.',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Login para Admin del comercio o Cajero/Staff
   */
  public static async merchantLogin(req: Request, res: Response) {
    try {
      const parsed = merchantLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.errors });
      }

      const { email, password } = parsed.data;
      const supabase = getSupabaseAdminClient();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      }

      // Obtener perfil y rol
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, merchant_id, full_name, branch_id, merchants(commercial_name, status)')
        .eq('id', authData.user.id)
        .single();

      if (!profile) {
        return res.status(403).json({ success: false, error: 'Perfil no configurado' });
      }

      const session = TokenService.createAuthSession({
        userId: authData.user.id,
        email: authData.user.email,
        role: profile.role,
        merchantId: profile.merchant_id,
      });

      return res.json({
        success: true,
        session,
        profile: {
          fullName: profile.full_name,
          role: profile.role, // 'merchant_admin' o 'merchant_staff'
          merchantId: profile.merchant_id,
          branchId: profile.branch_id,
          merchantName: (profile as any).merchants?.commercial_name,
          merchantStatus: (profile as any).merchants?.status,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Aprobación manual del comercio (por super_admin)
   */
  public static async approveMerchant(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      const supabase = getSupabaseAdminClient();

      const { data, error } = await supabase
        .from('merchants')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', merchantId)
        .select('id, commercial_name, status')
        .single();

      if (error || !data) {
        return res.status(404).json({ success: false, error: 'Comercio no encontrado' });
      }

      return res.json({
        success: true,
        message: `Comercio ${data.commercial_name} aprobado y activado exitosamente.`,
        merchant: data,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
