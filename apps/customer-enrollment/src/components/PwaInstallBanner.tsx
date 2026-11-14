'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalado o en modo standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500/10 via-neutral-900 to-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between shadow-lg text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Instalar Gold Bird en tu pantalla</h4>
            <p className="text-[10px] text-neutral-400">Acceso instantáneo sin App Store</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-neutral-950 font-bold text-[11px] hover:bg-amber-400 transition-colors shadow-sm"
          >
            {isIos ? 'Ver Cómo' : 'Instalar'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-neutral-400 hover:text-white rounded-md transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal Guía iOS */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-3xl p-5 text-center space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
              <span>Agregar a Pantalla de Inicio en iPhone</span>
            </h3>

            <div className="space-y-3 text-xs text-neutral-300 text-left">
              <div className="flex items-start gap-2.5 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                <Share className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.</span>
              </div>
              <div className="flex items-start gap-2.5 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                <PlusSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>2. Desplázate y selecciona <strong>&quot;Agregar a pantalla de inicio&quot;</strong>.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
