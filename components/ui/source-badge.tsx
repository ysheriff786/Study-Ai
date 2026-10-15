'use client';

import React from 'react';
import { FileType } from '@/lib/types';
import { FileText, Presentation, Video, FileEdit } from 'lucide-react';

interface SourceBadgeProps {
  type: FileType;
  label?: string;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ type, label, className = '' }) => {
  const getIcon = () => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-3 w-3 text-rose-500 dark:text-rose-400" />;
      case 'pptx':
        return <Presentation className="h-3 w-3 text-amber-500 dark:text-amber-400" />;
      case 'video':
        return <Video className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />;
      case 'notes':
        return <FileEdit className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />;
    }
  };

  const getStyle = () => {
    switch (type) {
      case 'pdf':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/20';
      case 'pptx':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/20';
      case 'video':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500/20';
      case 'notes':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/20';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono border ${getStyle()} ${className}`}
    >
      {getIcon()}
      <span>{label || type.toUpperCase()}</span>
    </span>
  );
};
