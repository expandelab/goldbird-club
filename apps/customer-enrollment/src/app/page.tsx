'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coffee, ShieldCheck, Sparkles, ArrowRight, Gift, CheckCircle2, Award, Zap, Heart } from 'lucide-react';
import { Header } from '../components/Header';
import { GoldBirdLogo } from '../components/GoldBirdLogo';
import { registrarOAutenticarCliente, obtenerTarjetaActual } from '../lib/goldbird-service';

export default function LandingPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [aceptoLey, setAceptoLey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasExistingCard, setHasExistingCard] = useState(false);

  useEffect(() => {
    try {
      obtenerTarjetaActual().then(({ cliente, tarjeta }) => {
        if (cliente && tarjeta) {
          setHasExistingCard(true);
        }
      }).catch(() => {
        // Safe fallback
      });
    } catch {
      // Safe fallback
    }
  }, []);

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
      setErrorMsg('Debes aceptar la Política de Privacidad conforme a la Ley N° 29733 para unirte.');
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
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Ocurrió un error al crear tu tarjeta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-neutral-950 text-white">
      <Header />

      <main className="p-4 sm:p-5 space-y-6">
        {/* Hero Section con el nuevo Logo de Gold Bird */}
        <div className="text-center pt-3 pb-1 space-y-4">
          <div className="flex justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-orange-500/20 blur-3xl rounded-full pointer-events-none" />
            <GoldBirdLogo size={110} showText={false} />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Piloto Oficial • Cafetería Barranca</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Gold<span className="text-amber-400">Bird</span> Club
            </h1>

            <p className="text-xs sm:text-sm text-neutral-300 max-w-xs mx-auto leading-relaxed">
              Tu tarjeta digital de 6 sellos en <strong className="text-amber-300 font-semibold">Cafetería Barranca</strong>. Cada visita te acerca a tu próximo café de especialidad gratis.
            </p>
          </div>
        </div>

        {/* Banner de acceso rápido si ya tiene sesión */}
        {hasExistingCard && (
          <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-neutral-900 to-purple-500/15 border border-amber-400/50 rounded-2xl flex items-center justify-between text-left shadow-lg">
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Tarjeta Activa Detectada
              </span>
              <p className="text-xs text-white font-medium">Continúa sumando sellos</p>
            </div>
            <Link
              href="/mi-tarjeta"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black rounded-xl flex items-center gap-1 transition-all shadow-md"
            >
              <span>Ver Mi Tarjeta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Grid de 3 Beneficios Clave */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 mb-1.5">
              <Coffee className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-white">6 Sellos</span>
            <span className="text-[10px] text-neutral-400">1 Café gratis</span>
          </div>

          <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 mb-1.5">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-white">3 Niveles</span>
            <span className="text-[10px] text-neutral-400">Bronce, Plata, Oro</span>
          </div>

          <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mb-1.5">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-white">100% Web</span>
            <span className="text-[10px] text-neutral-400">Sin descargas</span>
          </div>
        </div>

        {/* Resumen de Niveles del Piloto */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 space-y-2.5 text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Gift className="w-4 h-4" />
            <span>Beneficios Exclusivos</span>
          </h3>

          <div className="space-y-2 text-xs text-neutral-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Bronce (0-6 visitas):</strong> Bienvenida + regalo sorpresa al completar 1ra tarjeta.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                <strong>Plata (7-30 visitas):</strong> Saldo a favor + 3% de descuento permanente en el local.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span>
                <strong>Oro (31+ visitas):</strong> Saldo a favor + 5% de descuento + catas y eventos VIP.
              </span>
            </div>
          </div>
        </div>

        {/* Formulario de Onboarding con Consentimiento Ley N° 29733 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl text-left space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Genera tu Tarjeta Inmediata</h2>
            <p className="text-xs text-neutral-400">Completa tus datos para empezar a sellar hoy mismo.</p>
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
                placeholder="Ej. Camila Morales"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
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
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Número de Celular <span className="text-neutral-500 text-[10px]">(Opcional para avisos WhatsApp)</span>
              </label>
              <input
                type="tel"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                placeholder="+51 987 654 321"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Checkbox Obligatorio Ley 29733 */}
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
                  Acepto el tratamiento de mis datos personales conforme a la{' '}
                  <strong className="text-amber-400">Ley N° 29733 (Perú)</strong>, así como los{' '}
                  <Link href="/terminos" className="underline text-amber-400 hover:text-amber-300">
                    Términos del Programa
                  </Link>{' '}
                  y la{' '}
                  <Link href="/privacidad" className="underline text-amber-400 hover:text-amber-300">
                    Política de Privacidad
                  </Link>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all disabled:opacity-50"
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

      {/* Footer y Enlaces Legales */}
      <footer className="p-5 border-t border-neutral-800/80 text-center space-y-2 text-[11px] text-neutral-500">
        <div className="flex items-center justify-center gap-4 text-neutral-400">
          <Link href="/login" className="hover:text-amber-400 transition-colors">
            Acceso Clientes & Mostrador
          </Link>
          <span>•</span>
          <Link href="/terminos" className="hover:text-amber-400 transition-colors">
            Términos
          </Link>
          <span>•</span>
          <Link href="/privacidad" className="hover:text-amber-400 transition-colors">
            Privacidad
          </Link>
        </div>
        <p>Contacto de soporte: <a href="mailto:hola@goldbird.club" className="text-amber-500/80 hover:underline">hola@goldbird.club</a></p>
        <p className="text-[10px]">Gold Bird Club © {new Date().getFullYear()} • Cafetería Barranca</p>
      </footer>
    </div>
  );
}
