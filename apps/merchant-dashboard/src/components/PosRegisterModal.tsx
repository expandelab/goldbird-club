'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Calculator, Sparkles, Loader2, Award, Gift, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPEN } from '../lib/utils';
import { PaymentMethod } from '@expandemoney/shared-types';
import { DemoClient } from '../lib/demoData';

interface PosRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantId?: string;
  minSpendForStamp?: number;
  onSuccess?: (saleData?: any) => void;
  clients?: DemoClient[];
  selectedClient?: DemoClient | null;
}

export const PosRegisterModal: React.FC<PosRegisterModalProps> = ({
  isOpen,
  onClose,
  merchantId = 'a1111111-1111-1111-1111-111111111111',
  minSpendForStamp = 30.0,
  onSuccess,
  clients = [],
  selectedClient,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(selectedClient?.id || '');
  const [phone, setPhone] = useState(selectedClient?.code || '+51987654321');
  const [fullName, setFullName] = useState(selectedClient?.name || 'Valeria Quispe');
  const [amount, setAmount] = useState('35.00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('yape');
  const [redeemCashback, setRedeemCashback] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (selectedClient) {
      setSelectedClientId(selectedClient.id);
      setFullName(selectedClient.name);
      setPhone(selectedClient.code);
    } else if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
      setFullName(clients[0].name);
      setPhone(clients[0].code);
    }
  }, [selectedClient, clients]);

  if (!isOpen) return null;

  const currentSelected = clients.find((c) => c.id === selectedClientId) || selectedClient;
  const currentTier = currentSelected?.tier || 'bronce';
  const isGold = currentTier === 'oro';

  const numericAmount = parseFloat(amount) || 0;
  const qualifiesForStamp = numericAmount >= minSpendForStamp;

  // Calculo anticipado según nivel
  const cashbackEstimated = !qualifiesForStamp ? 0 : isGold ? 1.0 : currentTier === 'plata' ? 0.7 : 0.5;
  const willCompleteTenth = (currentSelected?.visits || 0) + 1 >= 10;

  const handleClientSelectChange = (id: string) => {
    setSelectedClientId(id);
    const client = clients.find((c) => c.id === id);
    if (client) {
      setFullName(client.name);
      setPhone(client.code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (numericAmount <= 0) {
        throw new Error('Ingrese un monto válido');
      }

      // 1. Intentar llamar al RPC de Supabase si está disponible
      let saleResult: any = null;
      try {
        const { data, error } = await supabase.rpc('process_quick_sale', {
          p_merchant_id: merchantId,
          p_phone: phone.trim(),
          p_full_name: fullName.trim() || 'Cliente expandeMoney',
          p_gross_amount: numericAmount,
          p_redeem_cashback: redeemCashback,
          p_coupon_code: couponCode.trim() || null,
          p_payment_method: paymentMethod,
        });
        if (!error && data) {
          saleResult = data;
        }
      } catch (e) {
        // Fallback local
      }

      if (!saleResult) {
        // Fallback dinámico para demo funcional
        const refCode = `EXP-${Date.now().toString().slice(-6)}`;
        saleResult = {
          reference_code: refCode,
          gross_amount: numericAmount,
          net_to_pay: numericAmount,
          qualifies_for_stamp: qualifiesForStamp,
          customer_tier: currentTier,
          customer_name: fullName,
          customer_id: selectedClientId,
          credit_earned: cashbackEstimated,
          is_tenth_visit_reward: !isGold && qualifiesForStamp && willCompleteTenth,
          reward_title: 'Desayuno Completo o Postre Artesanal Gratis',
          reward_amount: currentTier === 'plata' ? 7.0 : 5.0,
        };
      }

      setResult(saleResult);
      if (onSuccess) onSuccess(saleResult);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error procesando cobro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setAmount('35.00');
    setCouponCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#121824] rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-[#0b0f17] px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 dark:text-[#00e676] flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm">Terminal de Caja POS</h3>
              <p className="text-[11px] text-slate-400">expandeMoney · Registro inmediato de consumos</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido / Resultado */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {result ? (
            /* Vista de Éxito */
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00e676] flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                  ¡Consumo Registrado con Éxito!
                </h4>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ref: {result.reference_code}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Cliente:</span>
                  <strong className="text-slate-900 dark:text-white">{result.customer_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Monto cobrado:</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{formatPEN(result.gross_amount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Sello calificado (≥ S/ 30):</span>
                  <strong className={result.qualifies_for_stamp ? 'text-emerald-600 dark:text-[#00e676]' : 'text-slate-400'}>
                    {result.qualifies_for_stamp ? 'Sí (+1 Sello otorgado)' : 'No (< S/ 30)'}
                  </strong>
                </div>
                {result.credit_earned > 0 && (
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                    <span className="text-slate-500 dark:text-slate-400">Saldo abonado:</span>
                    <strong className="font-mono text-emerald-600 dark:text-[#00e676]">+{formatPEN(result.credit_earned)}</strong>
                  </div>
                )}
              </div>

              {result.is_tenth_visit_reward && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-900 dark:text-[#FFD95A] text-left flex items-start gap-3">
                  <Gift className="w-5 h-5 text-amber-500 flex-none mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs">¡Tarjeta de 10 Consumos Completada!</h5>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      Se ha liberado el premio: <strong>{result.reward_title}</strong> (S/ {result.reward_amount.toFixed(2)}).
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleReset}
                type="button"
                className="w-full py-3 rounded-2xl font-bold text-xs bg-slate-900 dark:bg-[#00e676] text-white dark:text-[#0b0f17] hover:bg-slate-800 dark:hover:bg-[#00c764] transition-all"
              >
                Listo / Nueva Venta
              </button>
            </div>
          ) : (
            /* Formulario de Cobro */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Selector de Cliente */}
              {clients.length > 0 && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    Seleccionar Cliente Enrolado
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelectChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.code} · Nivel {c.tier.toUpperCase()} ({c.visits}/10)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Monto del consumo */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Monto del consumo (S/)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="35.00"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl font-mono text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Feedback previo de la regla EM.R */}
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] leading-relaxed">
                  {qualifiesForStamp ? (
                    <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                      ✓ Consumo calificado (≥ S/ 30.00). Sumará{' '}
                      <strong className="font-mono text-emerald-600 dark:text-[#00e676]">
                        +{formatPEN(cashbackEstimated)}
                      </strong>{' '}
                      {isGold
                        ? 'disponible al instante (Oro VIP).'
                        : `bloqueado (${Math.min((currentSelected?.visits || 0) + 1, 10)}/10).`}
                      {willCompleteTenth && !isGold && (
                        <span className="block text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                          ⭐ ¡Completará su tarjeta y liberará premio!
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-500 dark:text-slate-400">
                      Consumo menor a S/ 30.00: Registra la venta pero no otorga sello EM.R.
                    </div>
                  )}
                </div>
              </div>

              {/* Medio de Pago */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Medio de Pago en Caja
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'yape', label: 'Yape' },
                    { id: 'plin', label: 'Plin' },
                    { id: 'tarjeta', label: 'Tarjeta' },
                    { id: 'efectivo', label: 'Efectivo' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2 rounded-xl font-bold transition-all border ${
                        paymentMethod === m.id
                          ? 'bg-slate-900 dark:bg-[#00e676] text-white dark:text-[#0b0f17] border-slate-900 dark:border-[#00e676] shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón Registrar */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 dark:bg-[#00e676] dark:hover:bg-[#00c764] text-white dark:text-[#0b0f17] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmar Consumo y Otorgar Sello</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
