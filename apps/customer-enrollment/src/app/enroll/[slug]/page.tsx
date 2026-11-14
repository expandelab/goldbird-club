'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coffee, ShieldCheck, Sparkles, ArrowRight, Gift, CheckCircle2 } from 'lucide-react';
import { Header } from '../../../components/Header';
import { GoldBirdLogo } from '../../../components/GoldBirdLogo';
import { registrarOAutenticarCliente } from '../../../lib/goldbird-service';

export default function EnrollSlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || 'cafeteria-barranca';

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [aceptoLey, setAceptoLey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim()) {
      setErrorMsg('Por favor ingresa tu nombre completo.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!aceptoLey) {
      setErrorMsg('Debes aceptar el tratamiento de datos conforme a la Ley N° 29733.');
      return;
    }

    setLoading(true);
    try {
      await registrarOAutenticarCliente({
        nombre,
        email,
        celular,
        aceptoLey,
      });

      router.push('/mi-tarjeta');
    } catch {
      setErrorMsg('Error al generar tu tarjeta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      <Header showBack backHref="/" />

      <main className="p-5 space-y-6">
        {/* Hero con Logo Oficial Gold Bird */}
        <div className="text-center pt-2 space-y-3">
          <div className="flex justify-center">
            <GoldBirdLogo size={80} showText={false} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Club de Fidelidad Oficial</span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
            Tarjeta Digital de Sellos <br />
            <span className="gold-gradient-text">Cafetería Barranca</span>
          </h1>

          <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
            Acumula 6 sellos en tus visitas y gana <strong className="text-white">1 café de cortesía</strong>.
            Sin descargas en tiendas.
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl text-left space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Únete al Club de Lealtad</h2>
            <p className="text-xs text-neutral-400">Ingresa tus datos para activar tu tarjeta instantánea.</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Nombre y Apellido *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Valeria Benavides"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Celular / WhatsApp <span className="text-neutral-500 text-[10px]">(Opcional)</span>
              </label>
              <input
                type="tel"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                placeholder="+51 987 654 321"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={aceptoLey}
                  onChange={(e) => setAceptoLey(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500/30 accent-amber-500"
                />
                <span className="text-[11px] text-neutral-300 leading-tight">
                  Acepto el tratamiento de mis datos conforme a la{' '}
                  <strong className="text-amber-400">Ley N° 29733 (Perú)</strong> y los{' '}
                  <Link href="/terminos" className="underline text-amber-400 hover:text-amber-300" target="_blank">
                    Términos del Club
                  </Link>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Creando Tarjeta...</span>
              ) : (
                <>
                  <span>Obtener mi Tarjeta de Sellos</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="p-5 border-t border-neutral-800 text-center text-[11px] text-neutral-500">
        <p>Gold Bird Club • Contacto: <a href="mailto:hola@goldbird.club" className="text-amber-400 underline">hola@goldbird.club</a></p>
      </footer>
    </div>
  );
}
