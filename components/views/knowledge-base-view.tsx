'use client';

import React, { useState } from 'react';
import { Course, DocumentSource, SourceChunk, FileType } from '@/lib/types';
import { SourceBadge } from '@/components/ui/source-badge';
import {
  FileBox,
  Search,
  Filter,
  BookOpen,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  Trash2,
  Upload,
} from 'lucide-react';

interface KnowledgeBaseViewProps {
  course: Course | null;
  documents: DocumentSource[];
  chunks: SourceChunk[];
  onOpenUpload: () => void;
  onInspectChunk: (chunk: SourceChunk) => void;
  onDeleteDocument?: (docId: string) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  course,
  documents,
  chunks,
  onOpenUpload,
  onInspectChunk,
  onDeleteDocument,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'all' | FileType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | 'all'>('all');
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
        <FileBox className="h-12 w-12 text-slate-400 mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          No active course selected
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Create or select a course to view indexed knowledge base sources.
        </p>
      </div>
    );
  }

  const filteredDocs = documents.filter(doc => {
    const matchesFormat = selectedFormat === 'all' || doc.fileType === selectedFormat;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFormat && matchesSearch;
  });

  const filteredChunks = chunks.filter(chunk => {
    const matchesFormat = selectedFormat === 'all' || chunk.fileType === selectedFormat;
    const matchesDoc = selectedDocId === 'all' || chunk.documentId === selectedDocId;
    const matchesSearch =
      chunk.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chunk.docTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chunk.concepts.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFormat && matchesDoc && matchesSearch;
  });

  const handleDelete = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (deletingDocId === docId) {
      if (onDeleteDocument) {
        onDeleteDocument(docId);
      }
      setDeletingDocId(null);
    } else {
      setDeletingDocId(docId);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-cyan-600 dark:text-cyan-400 mb-1">
            <span>KNOWLEDGE BASE & RETRIEVAL REPOSITORY</span>
            <span aria-hidden="true">·</span>
            <span>{course.code}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Multimodal Source Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Indexed course materials verified for source-grounded retrieval.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-xs cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-12 text-center">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto mb-3">
            <Upload className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No documents in this course knowledge base yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
            Upload course materials to begin semantic chunking and source-grounded tutoring.
          </p>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-xs font-semibold px-4 py-2 shadow-sm cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Upload First Document</span>
          </button>
        </div>
      ) : (
        <>
          {/* Filter Tabs & Search Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {(['all', 'pdf', 'pptx', 'video', 'notes'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap shrink-0 capitalize cursor-pointer ${
                    selectedFormat === fmt
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {fmt === 'all' ? 'All Formats' : fmt.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search documents or concepts..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Document Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Indexed Documents ({filteredDocs.length})
              </h3>
              {selectedDocId !== 'all' && (
                <button
                  onClick={() => setSelectedDocId('all')}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  View all sources
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map(doc => {
                const isSelected = selectedDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(isSelected ? 'all' : doc.id)}
                    className={`flex flex-col justify-between rounded-2xl border p-4.5 transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/20'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <SourceBadge type={doc.fileType} />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                            Completed
                          </span>
                          {onDeleteDocument && (
                            <button
                              onClick={e => handleDelete(e, doc.id)}
                              className={`p-1 rounded transition-colors text-xs flex items-center gap-1 cursor-pointer ${
                                deletingDocId === doc.id
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold px-2 py-0.5 border border-rose-500/30'
                                  : 'text-slate-400 hover:text-red-500'
                              }`}
                              title={deletingDocId === doc.id ? 'Click again to permanently delete' : 'Delete document and chunks'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingDocId === doc.id && <span>Confirm?</span>}
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mb-1" title={doc.title}>
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {doc.summary}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span>{doc.totalUnits} {doc.unitType}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{doc.chunksCount} chunks</span>
                      <span aria-hidden="true">·</span>
                      <span>{doc.fileSize}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vector Chunks & Citation Lineage Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Semantic Chunks ({filteredChunks.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Click row to inspect source context
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Source & Anchor</th>
                      <th className="px-4 py-3.5">Extracted Paragraph Content</th>
                      <th className="px-4 py-3.5">Mapped Concepts</th>
                      <th className="px-4 py-3.5 text-right font-mono">Tokens</th>
                      <th className="px-4 py-3.5 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-sans">
                    {filteredChunks.map(chunk => (
                      <tr
                        key={chunk.id}
                        onClick={() => onInspectChunk(chunk)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <SourceBadge type={chunk.fileType} label={chunk.unitLabel} />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]" title={chunk.docTitle}>
                              {chunk.docTitle}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 max-w-md">
                          <p className="line-clamp-2 leading-relaxed text-[11px]">
                            {chunk.content}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {chunk.concepts.map((concept, cIdx) => (
                              <span
                                key={cIdx}
                                className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {concept}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {chunk.tokensEstimate}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-cyan-600 dark:text-cyan-400 group-hover:underline text-[11px] font-medium">
                            View
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
