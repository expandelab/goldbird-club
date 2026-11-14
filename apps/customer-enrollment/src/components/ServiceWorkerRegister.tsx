'use client';

import { useEffect } from 'react';

/**
 * Registro seguro de Service Worker en el cliente sin causar hydration mismatch
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        // Ignora silenciosamente errores de registro local
      });
    }
  }, []);

  return null;
}
