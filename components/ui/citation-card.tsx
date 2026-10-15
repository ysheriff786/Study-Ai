'use client';

import React from 'react';
import { CitedSource } from '@/lib/types';
import { SourceBadge } from './source-badge';
import { ExternalLink, CheckCircle } from 'lucide-react';

interface CitationCardProps {
  citation: CitedSource;
  onInspect: (citation: CitedSource) => void;
  compact?: boolean;
}

export const CitationCard: React.FC<CitationCardProps> = ({
  citation,
  onInspect,
  compact = false,
}) => {
  return (
    <div
      onClick={() => onInspect(citation)}
      className="group relative rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 p-3.5 shadow-xs transition-all hover:border-cyan-500/50 hover:shadow-md cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 truncate">
          <SourceBadge type={citation.fileType} label={citation.unitLabel} />
          <span
            className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate"
            title={citation.docTitle}
          >
            {citation.docTitle}
          </span>
        </div>

        <span className="shrink-0 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
          {Math.round((citation.relevanceScore || 0.95) * 100)}% Match
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 font-mono italic line-clamp-2 leading-relaxed">
        &ldquo;{citation.snippet}&rdquo;
      </p>

      {!compact && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <CheckCircle className="h-3 w-3 text-cyan-500" />
            <span>Grounded in syllabus</span>
          </span>
          <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 group-hover:underline font-medium">
            Inspect source <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      )}
    </div>
  );
};
