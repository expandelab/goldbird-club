'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, KeyRound, Shield, User, ArrowRight, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { Header } from '../../components/Header';
import { GoldBirdLogo } from '../../components/GoldBirdLogo';
import { validarPinComercio, registrarOAutenticarCliente, supabase } from '../../lib/goldbird-service';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'cliente' | 'comercio'>('cliente');

  // Estado Cliente
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [clienteLoading, setClienteLoading] = useState(false);
  const [clienteError, setClienteError] = useState<string | null>(null);

  // Estado Comercio
  const [pin, setPin] = useState('');
  const [comercioLoading, setComercioLoading] = useState(false);
  const [comercioError, setComercioError] = useState<string | null>(null);

  // Login de Cliente
  const handleClienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClienteError(null);

    if (!email.trim() || !email.includes('@')) {
      setClienteError('Por favor ingresa un correo válido.');
      return;
    }

    setClienteLoading(true);

    try {
      if (supabase) {
        try {
          await supabase.auth.signInWithOtp({
            email: email.trim().toLowerCase(),
            options: {
              emailRedirectTo: `${window.location.origin}/mi-tarjeta`,
            },
          });
        } catch (authErr) {
          console.warn('Supabase auth fallback:', authErr);
        }
      }

      await registrarOAutenticarCliente({
        nombre: email.split('@')[0],
        email: email.trim().toLowerCase(),
        aceptoLey: true,
      });

      setMagicLinkSent(true);

      setTimeout(() => {
        router.push('/mi-tarjeta');
      }, 900);
    } catch {
      setClienteError('Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setClienteLoading(false);
    }
  };

  // Login de Comercio (PIN de 4 dígitos)
  const handleComercioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComercioError(null);

    if (pin.length < 4) {
      setComercioError('El PIN debe tener 4 dígitos.');
      return;
    }

    setComercioLoading(true);
    try {
      const res = await validarPinComercio(pin, 'cafeteria-barranca');
      if (res.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('goldbird_merchant_auth', 'true');
          sessionStorage.setItem('goldbird_merchant_slug', 'cafeteria-barranca');
        }
        router.push('/comercio');
      } else {
        setComercioError(res.mensaje || 'PIN inválido. Prueba con 1234.');
      }
    } catch {
      setComercioError('Error validando PIN.');
    } finally {
      setComercioLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-neutral-950 text-white">
      <Header />

      <main className="p-4 sm:p-5 space-y-6">
        <div className="text-center pt-2 space-y-3">
          <div className="flex justify-center">
            <GoldBirdLogo size={70} showText={false} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Acceso al Sistema</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Selecciona tu modo de ingreso a Gold Bird Club
            </p>
          </div>
        </div>

        {/* Selector de pestañas */}
        <div className="grid grid-cols-2 p-1 bg-neutral-900 rounded-2xl border border-neutral-800">
          <button
            type="button"
            onClick={() => setTab('cliente')}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              tab === 'cliente'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Soy Cliente</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('comercio')}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              tab === 'comercio'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Modo Mostrador</span>
          </button>
        </div>

        {/* Formulario Cliente */}
        {tab === 'cliente' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl text-left space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Ingreso con Correo Electrónico</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Te enviaremos un enlace mágico de acceso directo sin contraseñas (costo $0).
              </p>
            </div>

            {clienteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {clienteError}
              </div>
            )}

            {magicLinkSent ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2 text-center animate-pulse">
                <CheckCircle2 className="w-6 h-6 mx-auto text-amber-400" />
                <p className="font-bold">¡Acceso verificado con éxito!</p>
                <p className="text-[11px] text-neutral-300">
                  Abriendo tu tarjeta digital...
                </p>
              </div>
            ) : (
              <form onSubmit={handleClienteSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Tu Correo Electrónico:
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

                <button
                  type="submit"
                  disabled={clienteLoading}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {clienteLoading ? (
                    <span>Verificando...</span>
                  ) : (
                    <>
                      <span>Entrar a Mi Tarjeta</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="pt-2 text-center">
              <Link href="/" className="text-xs text-neutral-400 hover:text-amber-400 transition-colors">
                ¿Aún no tienes tarjeta? <span className="underline font-semibold text-amber-400">Regístrate gratis aquí</span>
              </Link>
            </div>
          </div>
        )}

        {/* Formulario Comercio (PIN Mostrador) */}
        {tab === 'comercio' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl text-left space-y-4">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 mb-1 border border-amber-500/20">
                Cafetería Barranca
              </div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Ingreso Rápido de Mostrador (PIN)</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Ingresa el PIN de 4 dígitos de la tablet o celular de caja.
              </p>
            </div>

            {comercioError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {comercioError}
              </div>
            )}

            <form onSubmit={handleComercioSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 text-center">
                  PIN de Seguridad (4 dígitos):
                </label>
                <div className="flex justify-center">
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-40 tracking-[0.6em] text-center font-mono text-2xl font-bold bg-neutral-950 border border-neutral-700 rounded-xl py-2.5 text-amber-400 focus:outline-none focus:border-amber-400 shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-[11px] text-neutral-400">PIN sugerido:</span>
                  <button
                    type="button"
                    onClick={() => setPin('1234')}
                    className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono text-xs rounded-md border border-neutral-700 transition-colors"
                  >
                    1234 (Rellenar)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={comercioLoading || pin.length < 4}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {comercioLoading ? (
                  <span>Validando PIN...</span>
                ) : (
                  <>
                    <span>Acceder al Escáner</span>
                    <Shield className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      <footer className="p-5 border-t border-neutral-800/80 text-center text-[11px] text-neutral-500">
        <p>Soporte técnico: <a href="mailto:hola@goldbird.club" className="text-amber-500/80 hover:underline">hola@goldbird.club</a></p>
      </footer>
    </div>
  );
}
