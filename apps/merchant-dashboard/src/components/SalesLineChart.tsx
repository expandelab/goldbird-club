'use client';

import React, { useState } from 'react';
import { formatPEN } from '../lib/utils';
import { Calendar, TrendingUp } from 'lucide-react';

interface SalesDataPoint {
  day: string;
  amount: number;
}

interface SalesLineChartProps {
  data: SalesDataPoint[];
  selectedDays?: number;
  onRangeChange?: (days: number) => void;
}

export const SalesLineChart: React.FC<SalesLineChartProps> = ({
  data,
  selectedDays = 14,
  onRangeChange,
}) => {
  const [range, setRange] = useState<number>(selectedDays);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; day: string; amount: number } | null>(null);

  const handleRange = (days: number) => {
    setRange(days);
    if (onRangeChange) onRangeChange(days);
  };

  const chartData = data.slice(-range);
  const n = chartData.length;
  const values = chartData.map((d) => d.amount);
  const maxVal = Math.max(...values, 100);
  const minVal = 0;

  const w = 640;
  const h = 220;
  const pl = 24;
  const pr = 24;
  const pt = 20;
  const pb = 32;

  const iw = w - pl - pr;
  const ih = h - pt - pb;
  const step = n > 1 ? iw / (n - 1) : iw;

  const points = chartData.map((d, i) => {
    const x = pl + i * step;
    const y = pt + ih - ((d.amount - minVal) / (maxVal - minVal || 1)) * ih;
    return { x, y, day: d.day, amount: d.amount };
  });

  // Smooth bezier curve generator
  const linePath = points.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x},${curr.y}`;
    const prev = points[idx - 1];
    const cp1x = (prev.x + curr.x) / 2;
    const cp1y = prev.y;
    const cp2x = (prev.x + curr.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
  }, '');

  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x},${pt + ih} L ${points[0].x},${pt + ih} Z`
    : '';

  const totalSales = chartData.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="bg-white dark:bg-[#121824] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      {/* Header con títulos y selector de rango */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Ventas registradas por día
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00e676] border border-emerald-500/20">
              {range} días
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monto de consumos en punto de venta, cupones y cobros digitales
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleRange(d)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  range === d
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-[#00e676] shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mini resumen de total en periodo */}
      <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800/60 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Total en el periodo:</span>{' '}
          <strong className="font-mono text-emerald-600 dark:text-[#00e676] font-bold text-sm">
            {formatPEN(totalSales)}
          </strong>
        </div>
        <div className="text-slate-400">•</div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Promedio diario:</span>{' '}
          <strong className="font-mono text-slate-900 dark:text-white font-bold">
            {formatPEN(totalSales / range)}
          </strong>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-[220px] overflow-visible"
          role="img"
          aria-label="Gráfico de ventas por día"
        >
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00e676" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00e676" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines horizontales */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => (
            <line
              key={idx}
              x1={pl}
              y1={pt + ih * pct}
              x2={w - pr}
              y2={pt + ih * pct}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800/60"
              strokeDasharray="4 4"
            />
          ))}

          {/* Área sombreada bajo la curva */}
          <path d={areaPath} fill="url(#salesGrad)" />

          {/* Línea principal */}
          <path
            d={linePath}
            fill="none"
            stroke="#00e676"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="filter drop-shadow-[0_2px_8px_rgba(0,230,118,0.4)]"
          />

          {/* Puntos de datos */}
          {points.map((p, idx) => {
            const isHovered = hoveredPoint?.day === p.day;
            return (
              <g key={idx} className="cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 3.5}
                  className="fill-white dark:fill-[#0b0f17] stroke-emerald-500 dark:stroke-[#00e676] transition-all duration-200"
                  strokeWidth="2.5"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* Labels del Eje X */}
          {points.map((p, idx) => {
            const every = Math.ceil(n / 6);
            if (idx % every !== 0 && idx !== n - 1) return null;
            return (
              <text
                key={idx}
                x={p.x}
                y={h - 6}
                textAnchor="middle"
                className="fill-slate-400 dark:fill-slate-500 text-[10px] font-sans"
              >
                {p.day}
              </text>
            );
          })}
        </svg>

        {/* Tooltip flotante interactivo */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs px-2.5 py-1.5 rounded-xl shadow-xl font-mono border border-slate-700/50 dark:border-slate-200"
            style={{
              left: `${(hoveredPoint.x / w) * 100}%`,
              top: `${(hoveredPoint.y / h) * 100}%`,
            }}
          >
            <div className="font-bold">{formatPEN(hoveredPoint.amount)}</div>
            <div className="text-[10px] opacity-70">{hoveredPoint.day}</div>
          </div>
        )}
      </div>
    </div>
  );
};
