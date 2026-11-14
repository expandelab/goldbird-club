import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '../components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Gold Bird Club | Fidelización y Sellos - Cafetería Barranca',
  description:
    'Tarjeta digital de sellos y recompensas exclusivas en Cafetería Barranca. 6 sellos = 1 café gratis. Sin descargas pesadas.',
  manifest: '/manifest.json',
  icons: {
    icon: '/goldbird-icon.svg',
    apple: '/goldbird-icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gold Bird Club',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/goldbird-icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/goldbird-icon.svg" />
      </head>
      <body
        className="bg-neutral-950 text-neutral-100 antialiased font-sans flex justify-center min-h-screen selection:bg-amber-500/30 selection:text-amber-200"
        suppressHydrationWarning
      >
        {/* Contenedor Responsivo: Mobile First con adaptación fluida a Desktop */}
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl bg-neutral-950 min-h-screen flex flex-col border-x border-neutral-800/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative transition-all duration-200">
          {children}
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
