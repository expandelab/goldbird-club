'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { Header } from '../../components/Header';
import { GoldBirdLogo } from '../../components/GoldBirdLogo';

export default function TerminosPage() {
  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-neutral-950 text-white">
      <Header showBack backHref="/" />

      <main className="p-4 sm:p-5 text-left space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al inicio</span>
          </Link>
          <GoldBirdLogo size={32} showText={false} />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Reglamento Oficial</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Términos del Programa</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Condiciones del piloto Gold Bird Club en Cafetería Barranca.
          </p>
        </div>

        <div className="space-y-4 text-xs text-neutral-300 leading-relaxed bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 shadow-xl">
          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>1. Mecánica de 6 Sellos y Premio</span>
            </h2>
            <p>
              El cliente acumula 1 sello por cada visita en la que realice consumo en Cafetería Barranca.
            </p>
            <p>
              Al completar <strong>6 sellos</strong>, la tarjeta habilita automáticamente el estado <strong>&quot;Premio Disponible&quot;</strong>, correspondiente a <strong>1 Café Americano o Capuccino gratis</strong> (o bebida de especialidad de la carta a convenir con el barista).
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>2. Reglas Antifraude y Límites</span>
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-neutral-400">
              <li><strong>1 sello por visita:</strong> Máximo un sello por cliente en cada compra calificada.</li>
              <li><strong>Cooldown de 3 horas:</strong> Debe transcurrir al menos 3 horas entre sellos para un mismo cliente.</li>
              <li><strong>QR dinámico efímero:</strong> El código QR expira y se refresca cada 3 minutos con firma HMAC. No se admiten capturas de pantalla fijas.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>3. Vigencia de 90 Días</span>
            </h2>
            <p>
              Los sellos acumulados tienen una vigencia de <strong>90 días</strong> a partir del último sello registrado. Si el cliente no registra una visita en ese lapso, los sellos no canjeados expiran, conservando su historial de nivel alcanzado.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>4. Niveles de Fidelidad (Tiers)</span>
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-neutral-400">
              <li><strong>Bronce (0-6 visitas):</strong> Acceso a tarjeta de sellos y obsequio al completar su primera tarjeta.</li>
              <li><strong>Plata (7-30 visitas):</strong> Saldo a favor para consumo y 3% de descuento permanente en el local.</li>
              <li><strong>Oro (31+ visitas):</strong> Saldo a favor, 5% de descuento permanente y acceso a catas privadas o lanzamientos VIP.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>5. Canje en Mostrador</span>
            </h2>
            <p>
              El canje se realiza escaneando el QR en vivo desde el Modo Comercio. Una vez confirmado, el contador de sellos se reinicia a 0. Los premios son personales e intransferibles.
            </p>
          </section>
        </div>
      </main>

      <footer className="p-5 border-t border-neutral-800 text-center text-[11px] text-neutral-500">
        <p>Gold Bird Club • Cafetería Barranca • hola@goldbird.club</p>
      </footer>
    </div>
  );
}
