'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, AlertCircle, Upload, Check } from 'lucide-react';

interface CameraQrScannerProps {
  onScan: (token: string) => void;
  isScanningActive: boolean;
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({
  onScan,
  isScanningActive,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [manualToken, setManualToken] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsInitializing(true);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setHasCamera(false);
      setCameraError('Este navegador no soporta acceso directo a la cámara.');
      setIsInitializing(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      console.warn('Error iniciando cámara:', error);
      setIsInitializing(false);

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Habilita los permisos en tu navegador.');
      } else {
        setCameraError('No se pudo acceder a la cámara. Puedes ingresar el código manualmente.');
      }
    }
  }, []);

  // Detección de QR en loop con BarcodeDetector si está disponible
  useEffect(() => {
    if (!isScanningActive) {
      stopCamera();
      return;
    }

    startCamera();

    let isDetecting = false;
    // Chequear BarcodeDetector nativo
    const hasBarcodeDetector = 'BarcodeDetector' in window;
    let barcodeDetector: unknown = null;

    if (hasBarcodeDetector) {
      try {
        const BarcodeDetectorClass = (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => unknown }).BarcodeDetector;
        barcodeDetector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      } catch {
        barcodeDetector = null;
      }
    }

    const scanFrame = async () => {
      if (!isScanningActive || !videoRef.current || videoRef.current.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      if (barcodeDetector && !isDetecting) {
        isDetecting = true;
        try {
          const detector = barcodeDetector as { detect: (target: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code && code.includes('.')) {
              onScan(code);
            }
          }
        } catch {
          // ignore detection frame errors
        } finally {
          isDetecting = false;
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      stopCamera();
    };
  }, [isScanningActive, onScan, startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      onScan(manualToken.trim());
      setManualToken('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Visor de Cámara */}
      <div className="relative aspect-square max-w-[320px] mx-auto rounded-3xl overflow-hidden bg-black border-2 border-neutral-800 shadow-2xl flex items-center justify-center">
        {cameraError ? (
          <div className="p-4 text-center space-y-3">
            <CameraOff className="w-10 h-10 text-neutral-500 mx-auto" />
            <p className="text-xs text-neutral-400">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-xs font-semibold text-neutral-200 border border-neutral-700 hover:bg-neutral-700 transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reintentar cámara
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Guía visual de escaneo */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Esquinas guía */}
              <div className="w-48 h-48 border-2 border-amber-400/80 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1 rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1 rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1 rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1 rounded-br-sm" />

                {/* Línea animada de escaneo */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
              </div>
            </div>

            {isInitializing && (
              <div className="absolute inset-0 bg-neutral-950/80 flex flex-col items-center justify-center text-amber-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-xs font-medium text-neutral-300">Iniciando cámara...</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-xs text-amber-400 hover:text-amber-300 underline font-medium transition-colors"
        >
          {showManualInput ? 'Ocultar ingreso manual' : '¿Problemas con la cámara? Ingresar código manual'}
        </button>
      </div>

      {/* Formulario de Entrada Manual / Pegar Token */}
      {showManualInput && (
        <form onSubmit={handleManualSubmit} className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2">
          <label className="block text-[11px] font-medium text-neutral-300 text-left">
            Código QR o Token del Cliente:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Pega aquí el código del QR..."
              className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors shrink-0"
            >
              Procesar
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
