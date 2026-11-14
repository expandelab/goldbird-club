'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import {
  QrCode,
  Copy,
  Check,
  Download,
  ExternalLink,
  Printer,
  Sparkles,
  Smartphone,
  Share2,
} from 'lucide-react';
import QRCode from 'qrcode';

export default function QrEnrollmentPage() {
  const [slug, setSlug] = useState('cafe-barranqueno');
  const [tableNumber, setTableNumber] = useState('');
  const [cashierId, setCashierId] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Construir URL dinámica
  const baseUrl = 'http://localhost:3001/enroll';
  let dynamicUrl = `${baseUrl}/${slug}`;
  const params = new URLSearchParams();
  if (tableNumber) params.append('table', tableNumber);
  if (cashierId) params.append('cashier', cashierId);
  const queryString = params.toString();
  if (queryString) {
    dynamicUrl += `?${queryString}`;
  }

  useEffect(() => {
    QRCode.toDataURL(
      dynamicUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#064e3b', // Esmeralda expandeMoney
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [dynamicUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(dynamicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-enrolamiento-${slug}${tableNumber ? `-mesa-${tableNumber}` : ''}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar merchantName="Café Alma — Barranco" merchantSlug={slug} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Links y QR Dinámicos de Enrolamiento
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Coloca este código QR en acrílicos en barra, mesas o boletas. El cliente solo ingresa su WhatsApp y empieza a acumular saldo sin bajar aplicaciones.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Columna Izquierda: Configurador */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
              <h2 className="text-sm font-bold text-slate-900 border-b pb-3">
                Parámetros de Enrolamiento
              </h2>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Slug Único del Comercio
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Número de Mesa (Opcional)
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ej. 4"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Identificador de Caja / Mesero
                  </label>
                  <input
                    type="text"
                    value={cashierId}
                    onChange={(e) => setCashierId(e.target.value)}
                    placeholder="Ej. caja-1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  URL Pública Generada para el Consumidor
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={dynamicUrl}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 font-medium transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Beneficio de bienvenida configurado</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Todo nuevo cliente que escanee este QR recibe automáticamente <strong>S/ 5.00 en saldo bloqueado</strong> de bienvenida para garantizar su segunda visita.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar QR en Alta Resolución</span>
                </button>
                <a
                  href={dynamicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition-colors border"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Probar Flujo de Enrolamiento</span>
                </a>
              </div>
            </div>

            {/* Columna Derecha: Vista Previa Stand Acrílico */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-sm bg-white rounded-3xl p-6 border-4 border-slate-900 shadow-2xl text-center space-y-4 relative">
                <div className="bg-emerald-600 text-white py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
                  Stand de Barra / Mesa
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Café Barranqueño
                  </h3>
                  <p className="text-xs text-emerald-700 font-semibold">
                    ¡Gana hasta 8% de Cashback en cada consumo!
                  </p>
                </div>

                <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-emerald-300 inline-block">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR de Enrolamiento expandeMoney"
                      className="w-48 h-48 mx-auto rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
                      Generando QR...
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-slate-600 text-xs">
                  <p className="font-bold text-slate-900">1. Escanea con la cámara de tu celular</p>
                  <p className="text-[11px] text-slate-500">2. Ingresa tu WhatsApp y listo, ¡sin apps!</p>
                </div>

                {tableNumber && (
                  <div className="bg-slate-100 py-1 px-3 rounded-lg text-xs font-mono font-bold text-slate-700">
                    MESA #{tableNumber}
                  </div>
                )}

                <div className="border-t pt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <span>Potenciado por</span>
                  <span className="font-bold text-slate-800">expandeMoney</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
