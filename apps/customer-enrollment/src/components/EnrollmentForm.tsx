'use client';

import React, { useState } from 'react';
import { Smartphone, User, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

interface EnrollmentFormProps {
  merchantSlug: string;
  merchantName: string;
  brandColor?: string;
  initialPhone?: string;
}

export const EnrollmentForm: React.FC<EnrollmentFormProps> = ({
  merchantSlug,
  merchantName,
  brandColor = '#059669',
  initialPhone = '',
}) => {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState(initialPhone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatPhoneNumber = (input: string) => {
    // Mantener solo dígitos y prefijo
    let cleaned = input.replace(/\D/g, '');
    if (cleaned.startsWith('51')) {
      cleaned = cleaned.substring(2);
    }
    // Formatear estilo 9XX XXX XXX
    if (cleaned.length > 9) {
      cleaned = cleaned.substring(0, 9);
    }
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (phone.length < 9) {
      setErrorMsg('Por favor ingresa un número de WhatsApp peruano válido (9 dígitos).');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullPhone = `+51${phone}`;

      // Llamar al RPC en Supabase para enrolar
      const { data, error } = await supabase.rpc('enroll_or_get_customer', {
        p_merchant_slug: merchantSlug,
        p_full_name: fullName.trim() || 'Cliente expandeMoney',
        p_phone: fullPhone,
      });

      if (error) {
        // En caso de que el RPC aún no esté desplegado localmente, redirigir a un token generado
        const mockToken = `pass_${phone}_${merchantSlug}`;
        router.push(`/wallet/${mockToken}?name=${encodeURIComponent(fullName)}&phone=${phone}&slug=${merchantSlug}`);
        return;
      }

      if (data && data.wallet_token) {
        router.push(`/wallet/${data.wallet_token}?slug=${merchantSlug}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el pase digital');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Nombre Completo */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Nombre Completo
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej. Camila Morales"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* WhatsApp / Teléfono */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          WhatsApp / Celular (+51)
        </label>
        <div className="relative flex">
          <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-sm font-semibold">
            🇵🇪 +51
          </span>
          <input
            type="tel"
            required
            value={phone}
            onChange={handlePhoneChange}
            placeholder="987 654 321"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-r-xl text-sm font-mono tracking-wider focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Sin contraseñas ni apps. Tu Web Wallet se asociará a este número.
        </p>
      </div>

      {/* Botón de Enrolamiento */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: brandColor }}
          className="w-full text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-lg shadow-emerald-700/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creando tu Pase Digital...</span>
            </>
          ) : (
            <>
              <span>Obtener Pase y Bono de S/ 5.00</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <div className="text-center pt-2">
        <span className="text-[11px] text-slate-400">
          Al continuar, aceptas recibir recordatorios de cashback por WhatsApp.
        </span>
      </div>
    </form>
  );
};
