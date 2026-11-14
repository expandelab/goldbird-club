'use client';

import React, { useState } from 'react';
import { RewardRuleConfig, DemoClient, INITIAL_REWARD_RULES } from '../lib/demoData';
import { formatPEN } from '../lib/utils';
import { Gift, Award, Sparkles, Crown, Save, CheckCircle2, Clock, Send } from 'lucide-react';

interface RewardsConfigSectionProps {
  clients?: DemoClient[];
  onRulesUpdate?: (rules: RewardRuleConfig[]) => void;
}

export const RewardsConfigSection: React.FC<RewardsConfigSectionProps> = ({
  clients = [],
  onRulesUpdate,
}) => {
  const [rules, setRules] = useState<RewardRuleConfig[]>(INITIAL_REWARD_RULES);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Birthday config state
  const [bdayActive, setBdayActive] = useState(true);
  const [bdayAutoSend, setBdayAutoSend] = useState(false);
  const [bdayGiftType, setBdayGiftType] = useState('cup');
  const [bdayDiscountPct, setBdayDiscountPct] = useState(15);
  const [bdayGiftBalance, setBdayGiftBalance] = useState(10);
  const [bdayAdvanceDays, setBdayAdvanceDays] = useState(3);
  const [bdayValidityDays, setBdayValidityDays] = useState(30);

  const handleRuleChange = (idx: number, field: keyof RewardRuleConfig, value: any) => {
    const updated = [...rules];
    updated[idx] = { ...updated[idx], [field]: value };
    setRules(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRulesUpdate) onRulesUpdate(rules);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Clientes cerca de completar tarjeta (>= 7 visitas)
  const nearRewardClients = clients
    .filter((c) => c.tier !== 'oro' && c.visits >= 7)
    .sort((a, b) => b.visits - a.visits);

  return (
    <div className="space-y-6">
      {/* Header con botón para editar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
            Reglas de Fidelización por Nivel (EM.R)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reglas de saldo acumulado y beneficios desbloqueados aplicadas automáticamente a cada consumo
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-[#00e676] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardado exitosamente</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            {isEditing ? 'Cancelar edición' : 'Personalizar valores'}
          </button>
        </div>
      </div>

      {/* Grid de 3 Tarjetas de Reglas por Nivel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rules.map((rule, idx) => {
          const isGold = rule.tier === 'oro';
          const isSilver = rule.tier === 'plata';
          const isBronze = rule.tier === 'bronce';

          const cardStyles = isBronze
            ? {
                borderColor: 'border-amber-700/30 dark:border-amber-600/40',
                titleColor: 'text-amber-800 dark:text-[#E9A867]',
                bg: 'bg-amber-50/50 dark:bg-[#1a120b]/70',
                badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-[#E9A867]',
                accentColor: 'text-amber-700 dark:text-[#E9A867]',
                icon: Award,
              }
            : isSilver
            ? {
                borderColor: 'border-slate-300 dark:border-slate-600/50',
                titleColor: 'text-slate-800 dark:text-[#C9D1DC]',
                bg: 'bg-slate-50/60 dark:bg-[#121824]/70',
                badgeBg: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-[#C9D1DC]',
                accentColor: 'text-slate-700 dark:text-[#C9D1DC]',
                icon: Sparkles,
              }
            : {
                borderColor: 'border-amber-400/60 dark:border-[#FFD95A]/50',
                titleColor: 'text-amber-900 dark:text-[#FFD95A]',
                bg: 'bg-amber-50/70 dark:bg-[#201908]/70',
                badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-[#FFD95A]',
                accentColor: 'text-amber-600 dark:text-[#F5C542]',
                icon: Crown,
              };

          const IconComponent = cardStyles.icon;

          return (
            <div
              key={rule.tier}
              className={`rounded-2xl p-5 border ${cardStyles.borderColor} ${cardStyles.bg} transition-all duration-200 flex flex-col justify-between space-y-4`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`w-4 h-4 ${cardStyles.titleColor}`} />
                    <h3 className={`font-heading font-black text-base ${cardStyles.titleColor}`}>
                      {rule.title}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-black/5 dark:border-white/10 ${cardStyles.badgeBg}`}>
                    {rule.rangeText}
                  </span>
                </div>

                {/* Monto de Saldo Abonado por Consumo */}
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Saldo abonado por consumo (≥ S/ 30):
                  </span>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-mono text-slate-400">S/</span>
                      <input
                        type="number"
                        step="0.10"
                        value={rule.cashbackPerSpend}
                        onChange={(e) => handleRuleChange(idx, 'cashbackPerSpend', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-sm font-mono font-bold bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  ) : (
                    <div className="font-heading font-black text-2xl text-emerald-600 dark:text-[#00e676] font-mono tracking-tight">
                      {formatPEN(rule.cashbackPerSpend)}
                    </div>
                  )}
                </div>

                {/* Explicación del beneficio */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {!isGold ? (
                    <>
                      por consumo, <strong className="text-slate-800 dark:text-white">bloqueado</strong>. Al completar 10 consumos se liberan{' '}
                      <strong className="text-emerald-600 dark:text-[#00e676] font-mono">
                        {formatPEN(rule.rewardAmountOnComplete)}
                      </strong>{' '}
                      al saldo disponible y la tarjeta se reinicia.
                    </>
                  ) : (
                    <>
                      por consumo, <strong className="text-emerald-600 dark:text-[#00e676]">disponible al instante</strong>. Sin tarjeta ni saldo bloqueado (acceso VIP inmediato).
                    </>
                  )}
                </p>
              </div>

              {/* Botón de guardar si está en modo edición */}
              {isEditing && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full mt-2 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-[#00e676] dark:text-[#0b0f17] transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar regla {rule.title}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Configuración de Cumpleaños (Birthday Module) */}
      <div className="bg-white dark:bg-[#121824] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Configuración de Recompensas de Cumpleaños
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define qué regalo reciben tus clientes en su fecha especial y cuándo se envía automáticamente
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {bdayAutoSend ? 'Automático' : 'Manual'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Toggles */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={bdayActive}
                onChange={(e) => setBdayActive(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold">Activar saludo de cumpleaños</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={bdayAutoSend}
                onChange={(e) => setBdayAutoSend(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold">Enviar regalo automáticamente</span>
            </label>
          </div>

          {/* Tipo de Regalo */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
              Regalo predeterminado
            </label>
            <select
              value={bdayGiftType}
              onChange={(e) => setBdayGiftType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
            >
              <option value="cup">Cupón de descuento</option>
              <option value="sal">Saldo de regalo</option>
              <option value="caf">Bebida de cortesía</option>
            </select>
          </div>

          {/* Descuento o Saldo */}
          {bdayGiftType === 'cup' ? (
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
                Descuento del cupón (%)
              </label>
              <input
                type="number"
                min={5}
                max={50}
                value={bdayDiscountPct}
                onChange={(e) => setBdayDiscountPct(parseInt(e.target.value) || 15)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
              />
            </div>
          ) : (
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
                Saldo de regalo (S/)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={bdayGiftBalance}
                onChange={(e) => setBdayGiftBalance(parseFloat(e.target.value) || 10)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
              />
            </div>
          )}

          {/* Anticipación y Vigencia */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
              Enviar con anticipación
            </label>
            <select
              value={bdayAdvanceDays}
              onChange={(e) => setBdayAdvanceDays(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
            >
              <option value={0}>El mismo día</option>
              <option value={1}>1 día antes</option>
              <option value={3}>3 días antes</option>
              <option value={7}>7 días antes</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          Regalo activo: <strong>{bdayGiftType === 'cup' ? `Cupón de ${bdayDiscountPct}% de descuento` : bdayGiftType === 'sal' ? `S/ ${bdayGiftBalance.toFixed(2)} de saldo de regalo` : 'Bebida de cortesía'}</strong> · Vigencia: <strong>{bdayValidityDays} días</strong> · Enviar: <strong>{bdayAdvanceDays === 0 ? 'El mismo día del cumpleaños' : `${bdayAdvanceDays} días antes`}</strong>.
        </p>
      </div>

      {/* Clientes cerca de su premio */}
      <div className="bg-white dark:bg-[#121824] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Clientes cerca de su premio
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Les faltan 3 consumos o menos para completar la tarjeta de 10 sellos y liberar saldo
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {nearRewardClients.map((client) => {
            const left = 10 - client.visits;
            const rewardAmt = client.tier === 'plata' ? 7.00 : 5.00;
            return (
              <div key={client.id} className="py-3.5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-white">
                    {client.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {client.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize">{client.tier}</span>
                      <span>•</span>
                      <span className="font-mono">{client.visits}/10 consumos</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00e676] border border-emerald-500/20">
                    Faltan {left} {left === 1 ? 'consumo' : 'consumos'} · Libera {formatPEN(rewardAmt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
