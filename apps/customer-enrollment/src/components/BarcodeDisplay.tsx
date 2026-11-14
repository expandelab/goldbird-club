'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Scan, Share2, Download, BookmarkPlus } from 'lucide-react';

interface BarcodeDisplayProps {
  walletToken: string;
  phone: string;
}

export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({ walletToken, phone }) => {
  const [qrSrc, setQrSrc] = useState('');

  useEffect(() => {
    QRCode.toDataURL(
      walletToken,
      {
        width: 240,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrSrc(url);
        }
      }
    );
  }, [walletToken]);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
        <Scan className="w-4 h-4 text-emerald-600" />
        <span>Muestra este código al pagar en caja</span>
      </div>

      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
        {qrSrc ? (
          <img src={qrSrc} alt="Pase de Fidelización" className="w-48 h-48 mx-auto rounded-lg" />
        ) : (
          <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
            Cargando código...
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="font-mono text-sm font-bold text-slate-800 tracking-wider">
          {phone || walletToken.slice(0, 16)}
        </div>
        <p className="text-[11px] text-slate-400">
          El cajero escaneará tu código para acumular o canjear tu saldo al instante.
        </p>
      </div>

      <div className="pt-2 flex gap-2">
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Mi Web Wallet expandeMoney',
                text: 'Guarda tu pase digital de cashback',
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('¡Enlace a tu Web Wallet copiado al portapapeles!');
            }
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Compartir / Guardar</span>
        </button>
      </div>
    </div>
  );
};
