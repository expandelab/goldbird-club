'use client';

import React, { useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import {
  Store,
  Building2,
  MapPin,
  UserCheck,
  CreditCard,
  Gift,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react';
import { RewardType } from '@expandemoney/shared-types';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'profile' | 'branches' | 'onboarding'>('rules');

  // Estado del comercio actual
  const [minSpend, setMinSpend] = useState('30.00');
  const [rewardType, setRewardType] = useState<RewardType>('free_product');
  const [rewardTitle, setRewardTitle] = useState('Desayuno Completo o Postre Artesanal Gratis');
  const [rewardValue, setRewardValue] = useState('25.00');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Formulario de Alta de Nuevo Comercio (Aprobación manual)
  const [onboardingForm, setOnboardingForm] = useState({
    legalName: '',
    ruc: '',
    commercialName: '',
    category: 'Restaurante & Gastronomía',
    repName: '',
    repDni: '',
    repPhone: '',
    repEmail: '',
    bankName: 'BCP (Banco de Crédito)',
    bankCci: '',
    branchAddress: '',
    branchDistrict: '',
    rewardType: 'free_product' as RewardType,
    rewardTitle: '',
    rewardValue: '25.00',
  });
  const [onboardingSuccess, setOnboardingSuccess] = useState(false);

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar merchantName="Café Alma — Barranco" />

      <div className="flex flex-1">
        <Sidebar userRole="merchant_admin" />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Configuración & Reglas EM.R</h1>
            <p className="text-xs text-slate-500 mt-1">
              Personaliza tus premios de fidelidad de 10 consumos, sedes operativas y datos de liquidación.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 text-xs font-semibold space-x-6">
            <button
              onClick={() => setActiveTab('rules')}
              className={`pb-3 transition-colors ${
                activeTab === 'rules'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Reglas de Negocio EM.R
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 transition-colors ${
                activeTab === 'profile'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Datos del Comercio & Cuenta Bancaria
            </button>
            <button
              onClick={() => setActiveTab('branches')}
              className={`pb-3 transition-colors ${
                activeTab === 'branches'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sedes (Locales)
            </button>
            <button
              onClick={() => setActiveTab('onboarding')}
              className={`pb-3 transition-colors ${
                activeTab === 'onboarding'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              + Alta de Nuevo Comercio (Aprobación Manual)
            </button>
          </div>

          {/* TAB 1: Reglas EM.R */}
          {activeTab === 'rules' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Mecánica de Recompensas (Tarjeta de 10 Consumos)
                  </h2>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Configura el premio que se desbloquea al alcanzar los 10 consumos calificados en tu local.
                  </p>
                </div>
                <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                  Regla Base: 1 Sello ≥ S/ 30.00
                </span>
              </div>

              {savedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>¡Reglas de fidelización actualizadas correctamente!</span>
                </div>
              )}

              <form onSubmit={handleSaveRules} className="space-y-5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Consumo Mínimo por Sello en Local (S/.)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Definido en S/ 30.00 para la salida inicial al mercado.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-2">
                    Tipo de Premio al Completar los 10 Consumos
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                    <label
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        rewardType === 'free_product'
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reward_type"
                        checked={rewardType === 'free_product'}
                        onChange={() => setRewardType('free_product')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                          <Gift className="w-4 h-4 text-emerald-600" />
                          Producto Gratis
                        </span>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Un ítem o plato insignia de tu carta (ej. "1/4 de pollo a la brasa", "Postre artesanal gratis", "Corte de cabello gratis").
                        </p>
                      </div>
                    </label>

                    <label
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        rewardType === 'balance_credit'
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reward_type"
                        checked={rewardType === 'balance_credit'}
                        onChange={() => setRewardType('balance_credit')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-emerald-600" />
                          Saldo para el Consumo
                        </span>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Monto fijo en Soles que se abona a la Web Wallet del cliente para descontar en su siguiente cuenta (ej. "S/ 25 de saldo").
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nombre / Título del Premio Visible para el Cliente
                    </label>
                    <input
                      type="text"
                      required
                      value={rewardTitle}
                      onChange={(e) => setRewardTitle(e.target.value)}
                      placeholder="Ej. Hamburguesa Clásica Gratis"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Valor Estimado / Saldo (S/.)
                    </label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={rewardValue}
                      onChange={(e) => setRewardValue(e.target.value)}
                      placeholder="25.00"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm"
                  >
                    Guardar Configuración EM.R
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Perfil Fiscal y Cuenta Bancaria */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
              <div className="border-b pb-3">
                <h2 className="text-sm font-bold text-slate-900">Datos Fiscales y Liquidación Bancaria</h2>
                <p className="text-slate-500 text-[11px]">
                  Información registrada para facturación y abonos de ventas digitales y presenciales.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block">Razón Social:</span>
                  <span className="font-bold text-slate-900 text-sm">CAFE Y EXPERIENCIAS BARRANCO S.A.C.</span>
                </div>
                <div>
                  <span className="text-slate-500 block">RUC (Sunat):</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">20601234567</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nombre Comercial:</span>
                  <span className="font-bold text-slate-900 text-sm">Café Barranqueño</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Rubro:</span>
                  <span className="font-bold text-slate-900 text-sm">Cafetería & Panadería Artesanal</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Responsable / Representante:</span>
                  <span className="font-bold text-slate-900 text-sm">Rodrigo Alarcón Silva (DNI: 45892134)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Celular del Responsable:</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">+51 987 654 320</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Cuenta Bancaria de Liquidación</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Banco:</span>
                    <span className="block font-semibold text-slate-800">Banco de Crédito del Perú (BCP)</span>
                  </div>
                  <div>
                    <span className="text-slate-400">CCI (Código de Cuenta Interbancario):</span>
                    <span className="block font-mono font-bold text-slate-900">00219400234857291048</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Sedes */}
          {activeTab === 'branches' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Sedes Registradas</h2>
                  <p className="text-slate-500 text-[11px]">
                    Locales donde tus clientes pueden sumar sellos y canjear premios.
                  </p>
                </div>
                <button className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Sede</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900">Sede Principal Barranco</h4>
                      <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Av. Pedro de Osma 135, Barranco, Lima
                    </p>
                  </div>
                  <span className="text-slate-600 font-mono text-[11px]">+51 1 477-2819</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Sede Miraflores</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Calle Esperanza 184, Miraflores, Lima
                    </p>
                  </div>
                  <span className="text-slate-600 font-mono text-[11px]">+51 1 241-9283</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Alta de Nuevo Comercio (Aprobación Manual) */}
          {activeTab === 'onboarding' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
              <div className="border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    Control de Calidad
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">
                    Registro y Alta de Comercio (Aprobación Manual Inicial)
                  </h2>
                </div>
                <p className="text-slate-500 text-[11px] mt-1">
                  Para asegurar el control de calidad en la salida al mercado, cada comercio pasa por una revisión manual de RUC y cuenta bancaria antes de activar cobros.
                </p>
              </div>

              {onboardingSuccess ? (
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    ¡Solicitud de Alta Recibida Exitosamente!
                  </h3>
                  <p className="text-slate-600 text-xs max-w-md mx-auto leading-relaxed">
                    Estado: <strong className="text-amber-700">Pendiente de Aprobación Manual</strong>. Nuestro equipo de soporte validará los datos de tu RUC y CCI en menos de 24 horas hábiles.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Razón Social</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. INVERSIONES GASTRONOMICAS DEL PERU S.A.C."
                        value={onboardingForm.legalName}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, legalName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">RUC (11 dígitos Sunat)</label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        placeholder="20601234567"
                        value={onboardingForm.ruc}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, ruc: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nombre Comercial</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Hamburguesería Barranquina"
                        value={onboardingForm.commercialName}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, commercialName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Rubro</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Restaurante / Cafetería / Barbería"
                        value={onboardingForm.category}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="font-bold text-slate-900 mb-2">Datos de la Sede Principal</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Dirección Completa</label>
                        <input
                          type="text"
                          required
                          placeholder="Av. Larco 450"
                          value={onboardingForm.branchAddress}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, branchAddress: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Distrito (Lima / Provincias)</label>
                        <input
                          type="text"
                          required
                          placeholder="Miraflores"
                          value={onboardingForm.branchDistrict}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, branchDistrict: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="font-bold text-slate-900 mb-2">Responsable / Representante Legal</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          required
                          placeholder="Juan Pérez Morales"
                          value={onboardingForm.repName}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, repName: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">DNI (8 dígitos)</label>
                        <input
                          type="text"
                          required
                          maxLength={8}
                          placeholder="45892134"
                          value={onboardingForm.repDni}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, repDni: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Celular (+51)</label>
                        <input
                          type="tel"
                          required
                          placeholder="+51987654321"
                          value={onboardingForm.repPhone}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, repPhone: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                        <input
                          type="email"
                          required
                          placeholder="contacto@comercio.pe"
                          value={onboardingForm.repEmail}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, repEmail: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="font-bold text-slate-900 mb-2">Cuenta para el Pago (Liquidación)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Banco</label>
                        <select
                          value={onboardingForm.bankName}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, bankName: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                        >
                          <option>BCP (Banco de Crédito del Perú)</option>
                          <option>Interbank</option>
                          <option>BBVA Perú</option>
                          <option>Scotiabank</option>
                          <option>Banco Pichincha</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Código de Cuenta Interbancario (CCI - 20 dígitos)</label>
                        <input
                          type="text"
                          required
                          maxLength={20}
                          placeholder="00219400234857291048"
                          value={onboardingForm.bankCci}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, bankCci: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm"
                    >
                      Enviar Alta para Aprobación Manual
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
