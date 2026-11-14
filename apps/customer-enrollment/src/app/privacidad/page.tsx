'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Mail } from 'lucide-react';
import { Header } from '../../components/Header';
import { GoldBirdLogo } from '../../components/GoldBirdLogo';

export default function PrivacidadPage() {
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
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Marco Legal Peruano</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Política de Privacidad</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Conforme a la Ley N° 29733 (Ley de Protección de Datos Personales del Perú) y su Reglamento D.S. 003-2013-JUS.
          </p>
        </div>

        <div className="space-y-4 text-xs text-neutral-300 leading-relaxed bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 shadow-xl">
          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>1. Titular del Banco de Datos</span>
            </h2>
            <p>
              El programa digital de fidelización <strong>Gold Bird Club</strong> (operado para el piloto oficial en <strong>Cafetería Barranca</strong>) es el titular y responsable del banco de datos personales de clientes participantes.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>2. Datos Personales Recopilados</span>
            </h2>
            <p>
              Se recopilan únicamente los datos mínimos indispensables para gestionar el programa de sellos:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-400">
              <li>Nombre y apellido del cliente.</li>
              <li>Correo electrónico (identificador para ingreso con Magic Link).</li>
              <li>Número de teléfono celular (opcional, para avisos de sellos y premios).</li>
              <li>Historial de visitas, sellos acumulados y canjes en Cafetería Barranca.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>3. Finalidad del Tratamiento</span>
            </h2>
            <p>
              Los datos se tratan con las siguientes finalidades legítimas:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-400">
              <li>Acreditar sellos y visitas en Cafetería Barranca.</li>
              <li>Calcular el nivel de lealtad (Bronce, Plata, Oro) y aplicar sus descuentos correspondientes.</li>
              <li>Validar y ejecutar el canje de premios (1 Café gratis cada 6 sellos).</li>
              <li>Prevenir fraudes mediante tokens QR efímeros cifrados con HMAC.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>4. Ejercicio de Derechos ARCO</span>
            </h2>
            <p>
              Usted puede ejercer en cualquier momento sus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong> dirigiendo una comunicación escrita a:
            </p>
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center gap-2 text-amber-300 font-mono text-xs">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <a href="mailto:hola@goldbird.club" className="underline hover:text-amber-200">hola@goldbird.club</a>
            </div>
            <p className="text-[11px] text-neutral-400">
              Su solicitud será atendida en los plazos previstos por la normativa vigente.
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
