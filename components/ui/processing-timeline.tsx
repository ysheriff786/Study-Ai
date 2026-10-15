'use client';

import React from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

export interface TimelineStep {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface ProcessingTimelineProps {
  steps: TimelineStep[];
  currentStepId?: string;
}

export const ProcessingTimeline: React.FC<ProcessingTimelineProps> = ({ steps }) => {
  return (
    <div className="space-y-3 py-2">
      {steps.map((step, idx) => {
        const isCompleted = step.status === 'completed';
        const isInProgress = step.status === 'in_progress';

        return (
          <div key={step.id} className="flex items-start gap-3">
            <div className="mt-0.5 flex flex-col items-center">
              {isCompleted ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              ) : isInProgress ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-500 dark:text-cyan-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full text-slate-300 dark:text-slate-700">
                  <Circle className="h-3.5 w-3.5" />
                </div>
              )}

              {idx < steps.length - 1 && (
                <div
                  className={`w-0.5 h-6 mt-1 ${
                    isCompleted ? 'bg-emerald-500/40' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </div>

            <div className="flex-1 pb-1">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold ${
                    isCompleted
                      ? 'text-slate-900 dark:text-slate-200'
                      : isInProgress
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  {isCompleted ? 'Done' : isInProgress ? 'Processing' : 'Pending'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
