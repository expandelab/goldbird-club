import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  deltaPct?: number;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  sparklineData?: number[];
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  deltaPct,
  icon: Icon,
  iconColor = 'text-emerald-600 dark:text-[#00e676]',
  iconBg = 'bg-emerald-50 dark:bg-emerald-950/40',
  sparklineData,
}) => {
  // Render mini-sparkline if data provided
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const w = 100;
    const h = 28;
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const st = w / Math.max(1, sparklineData.length - 1);

    const points = sparklineData
      .map((d, i) => `${(i * st).toFixed(1)},${(h - ((d - min) / range) * (h - 6) - 3).toFixed(1)}`)
      .join(' L ');

    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-none overflow-visible" aria-hidden="true">
        <path
          d={`M ${points}`}
          fill="none"
          stroke="var(--em, #00e676)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="bg-white dark:bg-[#121824] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white mt-1">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl border border-black/5 dark:border-white/5 ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {deltaPct !== undefined ? (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 ${
                deltaPct >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#00e676]'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              <span>{deltaPct >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(deltaPct).toFixed(1)}%</span>
            </span>
          ) : change ? (
            <span
              className={`text-xs font-bold ${
                isPositive ? 'text-emerald-600 dark:text-[#00e676]' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {change}
            </span>
          ) : subtitle ? (
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</span>
          ) : null}

          {subtitle && (deltaPct !== undefined || change) && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate hidden sm:inline">
              {subtitle}
            </span>
          )}
        </div>

        {renderSparkline()}
      </div>
    </div>
  );
};
