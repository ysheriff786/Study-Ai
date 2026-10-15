'use client';

import React, { useState } from 'react';
import { Course, DocumentSource, SourceChunk, FileType } from '@/lib/types';
import {
  FileText,
  Presentation,
  Video,
  FileEdit,
  PlusCircle,
  Search,
  Filter,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

interface IngestionManagerProps {
  course: Course;
  documents: DocumentSource[];
  chunks: SourceChunk[];
  onOpenUpload: () => void;
  onInspectChunk: (chunk: SourceChunk) => void;
}

export const IngestionManager: React.FC<IngestionManagerProps> = ({
  course,
  documents,
  chunks,
  onOpenUpload,
  onInspectChunk,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'all' | FileType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | 'all'>('all');

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

  const getFormatIcon = (type: FileType) => {
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

  const getFormatBadge = (type: FileType) => {
    switch (type) {
      case 'pdf':
        return 'text-rose-400 border-rose-500/20 bg-rose-950/30';
      case 'pptx':
        return 'text-amber-400 border-amber-500/20 bg-amber-950/30';
      case 'video':
        return 'text-indigo-400 border-indigo-500/20 bg-indigo-950/30';
      case 'notes':
        return 'text-emerald-400 border-emerald-500/20 bg-emerald-950/30';
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full px-4 py-6 space-y-6 overflow-y-auto">
      {/* Top Controls Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>Multimodal Ingestion & Vector Index</span>
            <span className="text-xs font-mono text-sky-400 font-normal">
              {course.code}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Parsed PDFs, slide decks, video transcripts, and OCR notes segmented for source-grounded retrieval.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition-colors shadow-sm"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Ingest New Source</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {(['all', 'pdf', 'pptx', 'video', 'notes'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 capitalize ${
                selectedFormat === fmt
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {fmt === 'all' ? 'All Formats' : fmt.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search chunks, titles, concepts..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Ingested Documents Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Ingested Sources ({filteredDocs.length})
          </span>
          {selectedDocId !== 'all' && (
            <button
              onClick={() => setSelectedDocId('all')}
              className="text-xs text-sky-400 hover:underline"
            >
              Show all documents
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredDocs.map(doc => {
            const isSelected = selectedDocId === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDocId(isSelected ? 'all' : doc.id)}
                className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-950/20 shadow-md'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                      {getFormatIcon(doc.fileType)}
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${getFormatBadge(
                        doc.fileType
                      )}`}
                    >
                      {doc.fileType}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-100 truncate mb-1" title={doc.title}>
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2.5">
                    {doc.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>
                    {doc.totalUnits} {doc.unitType}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-sky-400 font-semibold">{doc.chunksCount} chunks</span>
                  <span aria-hidden="true">·</span>
                  <span>{doc.fileSize}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Semantic Chunk Inspector Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Vector Chunks & Lineage Inspector ({filteredChunks.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click any row to inspect context details
          </span>
        </div>

        {filteredChunks.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
            <p className="text-xs text-slate-400">No chunks match your current filter.</p>
            <button
              onClick={() => {
                setSelectedFormat('all');
                setSelectedDocId('all');
                setSearchQuery('');
              }}
              className="mt-2 text-xs text-sky-400 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Source & Anchor</th>
                    <th className="px-4 py-3">Extracted Content Excerpt</th>
                    <th className="px-4 py-3">Mapped Concepts</th>
                    <th className="px-4 py-3 text-right">Tokens</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-sans">
                  {filteredChunks.map(chunk => (
                    <tr
                      key={chunk.id}
                      onClick={() => onInspectChunk(chunk)}
                      className="hover:bg-slate-850/60 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getFormatIcon(chunk.fileType)}
                          <div>
                            <span className="font-semibold text-slate-200 block truncate max-w-[160px]">
                              {chunk.docTitle}
                            </span>
                            <span className="font-mono text-[11px] text-sky-400 block">
                              {chunk.unitLabel}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-md">
                        <p className="line-clamp-2 leading-relaxed text-[11px]">
                          {chunk.content}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {chunk.concepts.map((concept, cIdx) => (
                            <span
                              key={cIdx}
                              className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 border border-slate-700/60"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-400">
                        {chunk.tokensEstimate}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sky-400 group-hover:underline text-[11px]">
                          Inspect
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
