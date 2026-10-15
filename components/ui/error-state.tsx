'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something interrupted this request',
  message = 'We encountered an unexpected error while retrieving this learning module. You can retry immediately.',
  onRetry,
}) => {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/60 dark:border-rose-500/30 dark:bg-rose-950/20 p-5 text-center max-w-lg mx-auto my-6">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mb-3">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200 mb-1">
        {title}
      </h4>
      <p className="text-xs text-rose-700/80 dark:text-rose-300/80 max-w-sm mx-auto leading-relaxed mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 dark:border-rose-500/40 bg-white dark:bg-rose-900/30 px-3.5 py-1.5 text-xs font-medium text-rose-800 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
