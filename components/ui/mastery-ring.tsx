'use client';

import React from 'react';

interface MasteryRingProps {
  value: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  showPercent?: boolean;
}

export const MasteryRing: React.FC<MasteryRingProps> = ({
  value,
  size = 120,
  strokeWidth = 9,
  label,
  sublabel,
  showPercent = true,
}) => {
  const percentage = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="masteryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan */}
            <stop offset="50%" stopColor="#6366f1" /> {/* Indigo */}
            <stop offset="100%" stopColor="#8b5cf6" /> {/* Violet */}
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-800/80"
          fill="none"
        />
        {/* Progress fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#masteryGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      {/* Inner Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        {showPercent && (
          <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {percentage}%
          </span>
        )}
        {label && (
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
            {label}
          </span>
        )}
      </div>
      {sublabel && (
        <span className="text-xs text-slate-600 dark:text-slate-400 mt-2 text-center">
          {sublabel}
        </span>
      )}
    </div>
  );
};
