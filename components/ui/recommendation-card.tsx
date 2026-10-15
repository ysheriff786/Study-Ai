'use client';

import React from 'react';
import { Sparkles, ArrowRight, Clock, AlertCircle } from 'lucide-react';

interface RecommendationCardProps {
  title: string;
  conceptName: string;
  reason: string;
  estimatedTime?: string;
  currentMastery: number; // 0 to 1
  onAction: () => void;
  actionLabel?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  title = 'Your next best action',
  conceptName,
  reason,
  estimatedTime = '3 mins',
  currentMastery,
  onAction,
  actionLabel = 'Start Practice Drill',
}) => {
  const percent = Math.round(currentMastery * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/40 dark:border-indigo-500/30 dark:bg-gradient-to-br dark:from-indigo-950/40 dark:via-slate-900/90 dark:to-violet-950/20 p-5 shadow-xs">
      {/* Decorative gradient corner glow */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 h-36 w-36 rounded-full bg-gradient-to-bl from-cyan-400/20 via-indigo-500/20 to-transparent blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-cyan-400 border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-950 dark:text-indigo-300">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{estimatedTime}</span>
        </div>
      </div>

      <div className="space-y-1 mb-3.5">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>{conceptName}</span>
          <span className="text-xs font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/20">
            P(L): {percent}%
          </span>
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {reason}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-indigo-100 dark:border-slate-800/80">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          Adaptive BKT Spaced Repetition
        </span>

        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:from-indigo-500 hover:to-violet-500 transition-all cursor-pointer"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
