'use client';

import React from 'react';

interface GoldBirdLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export const GoldBirdLogo: React.FC<GoldBirdLogoProps> = ({
  className = '',
  size = 40,
  showText = false,
  textClassName = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Isotipo Oficial Gold Bird (PNG Transparente Alta Resolución en Oro Pulido y Cobre 3D) */}
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 flex items-center justify-center transition-transform duration-300 hover:scale-105 drop-shadow-[0_4px_16px_rgba(245,158,11,0.35)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/goldbird-logo.png"
          alt="Gold Bird Official Brand Logo"
          width={size}
          height={size}
          className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(217,119,6,0.4)]"
          loading="eager"
        />
      </div>

      {/* Tipografía Oficial de Marca */}
      {showText && (
        <div className={`flex flex-col text-left ${textClassName}`}>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-black text-lg sm:text-xl tracking-tight text-white drop-shadow-sm">
              Gold<span className="text-amber-400">Bird</span>
            </span>
            <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Club
            </span>
          </div>
          <span className="text-[10px] text-amber-200/70 font-medium tracking-wide mt-1">
            Cafetería Barranca
          </span>
        </div>
      )}
    </div>
  );
};
