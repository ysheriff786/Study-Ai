'use client';

import React from 'react';
import { CitedSource, SourceChunk } from '@/lib/types';
import { X, FileText, Presentation, Video, FileEdit, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';

interface SourceInspectorModalProps {
  citation: CitedSource | null;
  chunk?: SourceChunk;
  onClose: () => void;
  onAskFollowUp?: (topic: string) => void;
}

export const SourceInspectorModal: React.FC<SourceInspectorModalProps> = ({
  citation,
  chunk,
  onClose,
  onAskFollowUp,
}) => {
  if (!citation) return null;

  const getFormatIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-rose-400" />;
      case 'pptx':
        return <Presentation className="h-4 w-4 text-amber-400" />;
      case 'video':
        return <Video className="h-4 w-4 text-indigo-400" />;
      case 'notes':
        return <FileEdit className="h-4 w-4 text-emerald-400" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const fullText = chunk?.content || citation.fullContent || citation.snippet;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
              {getFormatIcon(citation.fileType)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>{citation.docTitle}</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-mono text-sky-400">{citation.unitLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="uppercase">{citation.fileType} format</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-emerald-400">
                  {Math.round((citation.relevanceScore || 0.95) * 100)}% match confidence
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm">
          {/* Exact Citation Snippet Quote */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Verbatim Cited Excerpt
            </span>
            <div className="rounded-lg border border-sky-500/30 bg-sky-950/20 p-4 text-sky-200 font-mono text-xs leading-relaxed">
              &ldquo;{citation.snippet}&rdquo;
            </div>
          </div>

          {/* Complete Ingested Chunk Context */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Full Ingested Context Chunk
              </span>
              {chunk?.tokensEstimate && (
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  {chunk.tokensEstimate} tokens
                </span>
              )}
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-slate-300 text-xs leading-relaxed font-sans whitespace-pre-wrap">
              {fullText}
            </div>
          </div>

          {/* Concepts Associated */}
          {chunk?.concepts && chunk.concepts.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Knowledge Concepts Mapped
              </span>
              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                {chunk.concepts.map((concept, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1"
                  >
                    <CheckCircle className="h-3 w-3 text-sky-400" />
                    <span>{concept}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <div className="text-xs text-slate-400">
            Source-grounded via <span className="text-slate-300 font-medium">StudyForge RAG Vector Pipeline</span>
          </div>
          <div className="flex items-center gap-2">
            {onAskFollowUp && chunk?.concepts?.[0] && (
              <button
                onClick={() => {
                  onAskFollowUp(`Can you explain ${chunk.concepts[0]} in detail based on ${citation.docTitle}?`);
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                <span>Ask about this concept</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-sky-500 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
