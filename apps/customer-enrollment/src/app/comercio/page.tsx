'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Camera,
  BarChart3,
  Coffee,
  Gift,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Sparkles,
  Award,
  Clock,
  UserCheck,
  ChevronRight,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { CameraQrScanner } from '../../components/CameraQrScanner';
import { GoldBirdLogo } from '../../components/GoldBirdLogo';
import { playSuccessSound, playErrorSound } from '../../lib/audio';
import {
  validarPinComercio,
  inspeccionarQR,
  registrarSello,
  canjearPremio,
  obtenerKPIsComercio,
  COMERCIO_PILOTO_DEFAULT,
} from '../../lib/goldbird-service';
import { Tarjeta, Cliente, KPIsComercio } from '../../lib/types';

export default function ModoComercioPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState<boolean>(false);

  // Pestaña activa: 'escaner' | 'resumen'
  const [activeTab, setActiveTab] = useState<'escaner' | 'resumen'>('escaner');

  // Estado del Escaneo
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [clienteData, setClienteData] = useState<Cliente | null>(null);
  const [tarjetaData, setTarjetaData] = useState<Tarjeta | null>(null);
  const [horasRestantesCooldown, setHorasRestantesCooldown] = useState<number>(0);
  const [scanStatusMsg, setScanStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // KPIs
  const [kpis, setKpis] = useState<KPIsComercio | null>(null);
  const [kpisLoading, setKpisLoading] = useState<boolean>(false);

  const launchConfetti = (count: number = 80) => {
    if (typeof window !== 'undefined') {
      import('canvas-confetti').then((module) => {
        module.default({
          particleCount: count,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#9333EA', '#FBBF24', '#FFFFFF'],
        });
      }).catch(() => {});
    }
  };

  // Verificar si ya tiene sesión de mostrador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('goldbird_merchant_auth');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Cargar KPIs
  const cargarKPIs = useCallback(async () => {
    setKpisLoading(true);
    try {
      const data = await obtenerKPIsComercio(COMERCIO_PILOTO_DEFAULT.id);
      setKpis(data);
    } catch (err) {
      console.warn('Error cargando KPIs:', err);
    } finally {
      setKpisLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'resumen') {
      cargarKPIs();
    }
  }, [isAuthenticated, activeTab, cargarKPIs]);

  // Manejo de autenticación por PIN
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinLoading(true);

    try {
      const res = await validarPinComercio(pinInput);
      if (res.success) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('goldbird_merchant_auth', 'true');
        }
      } else {
        setPinError(res.mensaje || 'PIN incorrecto.');
      }
    } catch {
      setPinError('Error al validar el PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleQuickDemoAccess = () => {
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('goldbird_merchant_auth', 'true');
    }
  };

  const handleLogoutComercio = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('goldbird_merchant_auth');
    }
    setIsAuthenticated(false);
    setPinInput('');
  };

  // Callback cuando la cámara detecta un QR
  const handleQrDetected = async (token: string) => {
    if (actionLoading || scannedToken === token) return;

    setScannedToken(token);
    setActionLoading(true);
    setScanStatusMsg(null);

    try {
      const res = await inspeccionarQR(token);
      if (res.valido && res.tarjeta && res.cliente) {
        setTarjetaData(res.tarjeta);
        setClienteData(res.cliente);
        setHorasRestantesCooldown(res.horasRestantesCooldown || 0);

        playSuccessSound();

        if (res.tarjeta.premio_disponible || res.tarjeta.sellos_actuales >= 6) {
          setScanStatusMsg({
            type: 'success',
            text: '¡El cliente tiene 1 Café gratis disponible para canjear!',
          });
        } else if (res.horasRestantesCooldown && res.horasRestantesCooldown > 0) {
          setScanStatusMsg({
            type: 'info',
            text: `Regla Antifraude: Ya recibió sello hace poco. Cooldown activo (faltan ${res.horasRestantesCooldown}h).`,
          });
        } else {
          setScanStatusMsg({
            type: 'info',
            text: 'Cliente verificado. Selecciona la acción a realizar:',
          });
        }
      } else {
        playErrorSound();
        setScanStatusMsg({
          type: 'error',
          text: res.error || 'Código QR no válido o expirado.',
        });
      }
    } catch {
      playErrorSound();
      setScanStatusMsg({
        type: 'error',
        text: 'Error al procesar el código QR.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Acción: Sumar 1 Sello
  const handleSumarSello = async () => {
    if (!scannedToken) return;
    setActionLoading(true);

    try {
      const res = await registrarSello(scannedToken, COMERCIO_PILOTO_DEFAULT.id);
      if (res.success && res.tarjeta) {
        setTarjetaData(res.tarjeta);
        playSuccessSound();

        if (res.premio_alcanzado) {
          launchConfetti(90);
        }

        setScanStatusMsg({
          type: 'success',
          text: res.mensaje,
        });
      } else {
        playErrorSound();
        setScanStatusMsg({
          type: 'error',
          text: res.mensaje,
        });
      }
    } catch {
      playErrorSound();
      setScanStatusMsg({
        type: 'error',
        text: 'Error al registrar el sello.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Acción: Confirmar Canje de Premio
  const handleCanjearPremio = async () => {
    if (!scannedToken) return;
    setActionLoading(true);

    try {
      const res = await canjearPremio(scannedToken, COMERCIO_PILOTO_DEFAULT.id);
      if (res.success && res.tarjeta) {
        setTarjetaData(res.tarjeta);
        playSuccessSound();
        launchConfetti(120);

        setScanStatusMsg({
          type: 'success',
          text: res.mensaje,
        });
      } else {
        playErrorSound();
        setScanStatusMsg({
          type: 'error',
          text: res.mensaje,
        });
      }
    } catch {
      playErrorSound();
      setScanStatusMsg({
        type: 'error',
        text: 'Error al procesar el canje.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetScanner = () => {
    setScannedToken(null);
    setClienteData(null);
    setTarjetaData(null);
    setScanStatusMsg(null);
    setHorasRestantesCooldown(0);
  };

  // Si no está autenticado, mostrar formulario de PIN
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col justify-between min-h-screen bg-neutral-950 text-white">
        <Header />
        <main className="p-5 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full text-center space-y-5">
          <div className="flex justify-center">
            <GoldBirdLogo size={75} showText={false} />
          </div>

          <div>
            <h1 className="text-xl font-black text-white">Modo Mostrador</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Ingresa el PIN de 4 dígitos de Cafetería Barranca
            </p>
          </div>

          {pinError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {pinError}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="flex justify-center">
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-40 tracking-[0.6em] text-center font-mono text-2xl font-bold bg-neutral-900 border border-neutral-700 rounded-2xl py-3 text-amber-400 focus:outline-none focus:border-amber-400 shadow-inner"
              />
            </div>
            <p className="text-[10px] text-neutral-500">PIN predeterminado: 1234</p>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={pinLoading || pinInput.length < 4}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
              >
                {pinLoading ? 'Validando...' : 'Entrar al Modo Mostrador'}
              </button>

              <button
                type="button"
                onClick={handleQuickDemoAccess}
                className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 text-xs font-semibold border border-neutral-700 transition-colors"
              >
                Acceso Rápido con PIN 1234
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-neutral-950 text-white">
      {/* Header Comercio */}
      <header className="px-4 py-3 border-b border-neutral-800 bg-neutral-950 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <GoldBirdLogo size={34} showText={false} />
          <div className="text-left">
            <h2 className="text-xs font-black text-white">Cafetería Barranca</h2>
            <span className="text-[10px] text-amber-400 font-semibold">Modo Mostrador</span>
          </div>
        </div>

        <button
          onClick={handleLogoutComercio}
          className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
          title="Salir"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-[11px]">Cerrar turno</span>
        </button>
      </header>

      {/* Tabs: Escáner vs Resumen */}
      <div className="p-3 border-b border-neutral-800/80 bg-neutral-900/50">
        <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-2xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('escaner')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'escaner'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Escanear QR</span>
          </button>
          <button
            onClick={() => setActiveTab('resumen')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'resumen'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Resumen del Día</span>
          </button>
        </div>
      </div>

      <main className="p-4 sm:p-5 flex-1 space-y-4">
        {activeTab === 'escaner' ? (
          <div className="space-y-4">
            {!scannedToken ? (
              <div className="space-y-3">
                <div className="text-center">
                  <h3 className="text-sm font-bold text-white">Escanea el QR del Cliente</h3>
                  <p className="text-[11px] text-neutral-400">
                    Apunta la cámara al teléfono del cliente para sumar sello o canjear premio.
                  </p>
                </div>

                <CameraQrScanner
                  onScan={handleQrDetected}
                  isScanningActive={!scannedToken}
                />
              </div>
            ) : (
              /* Ficha del Cliente Escaneado */
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl text-left space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-sm">
                      {clienteData?.nombre?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">{clienteData?.nombre}</h3>
                      <p className="text-[11px] text-neutral-400">{clienteData?.email}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold capitalize">
                    {tarjetaData?.nivel_actual || 'Bronce'}
                  </span>
                </div>

                {/* Métricas del cliente */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold">Sellos Actuales</span>
                    <p className="text-xl font-black text-amber-400 mt-0.5">
                      {tarjetaData?.sellos_actuales} <span className="text-xs text-neutral-500">/ 6</span>
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold">Visitas Totales</span>
                    <p className="text-xl font-black text-white mt-0.5">
                      {tarjetaData?.visitas_totales}
                    </p>
                  </div>
                </div>

                {/* Feedback status */}
                {scanStatusMsg && (
                  <div
                    className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
                      scanStatusMsg.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : scanStatusMsg.type === 'error'
                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                        : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {scanStatusMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{scanStatusMsg.text}</span>
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="space-y-2.5 pt-1">
                  {/* Botón: Sumar 1 Sello */}
                  <button
                    onClick={handleSumarSello}
                    disabled={actionLoading || horasRestantesCooldown > 0}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                  >
                    <Coffee className="w-4 h-4" />
                    <span>Sumar 1 Sello (+1)</span>
                  </button>

                  {/* Botón: Confirmar Canje de Premio */}
                  <button
                    onClick={handleCanjearPremio}
                    disabled={
                      actionLoading ||
                      (!tarjetaData?.premio_disponible && (tarjetaData?.sellos_actuales || 0) < 6)
                    }
                    className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      tarjetaData?.premio_disponible || (tarjetaData?.sellos_actuales || 0) >= 6
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400 animate-pulse'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    <span>Confirmar Canje de Premio (Café Gratis)</span>
                  </button>

                  {/* Reiniciar Visor */}
                  <button
                    type="button"
                    onClick={handleResetScanner}
                    className="w-full py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold transition-colors mt-2"
                  >
                    Escanear Otro Cliente
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Pestaña: Resumen del Día */
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">KPIs de Hoy</h3>
                <p className="text-[11px] text-neutral-400">Actividad del mostrador en tiempo real</p>
              </div>
              <button
                onClick={cargarKPIs}
                disabled={kpisLoading}
                className="p-2 text-neutral-400 hover:text-amber-400 rounded-xl bg-neutral-900 border border-neutral-800 transition-colors"
                title="Actualizar métricas"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${kpisLoading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>

            {/* Grid 4 KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Visitas Hoy</span>
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {kpis?.visitas_hoy || 0}
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>Clientes Nuevos</span>
                </div>
                <div className="text-2xl font-black text-purple-300 mt-1">
                  {kpis?.clientes_nuevos_hoy || 0}
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sellos Dados</span>
                </div>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {kpis?.sellos_otorgados_hoy || 0}
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                  <Gift className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Canjes Hoy</span>
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {kpis?.premios_canjeados_hoy || 0}
                </div>
              </div>
            </div>

            {/* Últimos Movimientos */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Últimos Movimientos del Día
              </h4>

              <div className="space-y-2">
                {kpis?.ultimos_movimientos && kpis.ultimos_movimientos.length > 0 ? (
                  kpis.ultimos_movimientos.map((mov) => (
                    <div
                      key={mov.id}
                      className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            mov.tipo === 'canje'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {mov.tipo === 'canje' ? (
                            <Gift className="w-3.5 h-3.5" />
                          ) : (
                            <Coffee className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{mov.cliente_nombre}</p>
                          <p className="text-[10px] text-neutral-400">{mov.descripcion}</p>
                        </div>
                      </div>

                      <span className="text-[10px] text-neutral-500 font-mono">
                        {new Date(mov.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-500 text-center py-4">
                    No hay movimientos registrados hoy todavía.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
