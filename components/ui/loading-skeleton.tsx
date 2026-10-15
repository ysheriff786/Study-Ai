'use client';

import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      <div className="h-5 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
};
