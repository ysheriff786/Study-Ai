'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  color?: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'emerald' | 'cyan' | 'indigo' | 'amber' | 'rose';
  trend?: {
    label: string;
    positive: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  color,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'cyan',
  trend,
  onClick,
}) => {
  const badgeStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/20',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-500/20',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-500/20',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-500/20',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-500/20',
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/70 p-5 shadow-xs transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          {title}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-cyan-400 border border-slate-200/60 dark:border-slate-700/60">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              {unit}
            </span>
          )}
        </div>
        {badge && (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border ${badgeStyles[badgeColor]}`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-normal">
          {subtitle}
        </p>
      )}

      {trend && (
        <div className="mt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span className={trend.positive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
            {trend.positive ? '↑' : '↓'} {trend.label}
          </span>
          <span>vs last week</span>
        </div>
      )}
    </div>
  );
};
