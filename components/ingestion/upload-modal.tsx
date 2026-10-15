'use client';

import React, { useState } from 'react';
import { Course, FileType } from '@/lib/types';
import { X, Upload, Sparkles, Loader2, FileText, ChevronDown } from 'lucide-react';
import { FileDropzone } from './file-dropzone';
import { ExtractedFileResult } from '@/lib/file-extractor';

interface UploadModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onIngestSuccess: (data: { document: any; chunks: any[]; concepts: any[] }) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  course,
  isOpen,
  onClose,
  onIngestSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState<FileType>('pdf');
  const [rawText, setRawText] = useState('');
  const [attachedFile, setAttachedFile] = useState<ExtractedFileResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  if (!isOpen || !course) return null;

  const presets = [
    {
      label: 'Chandy-Lamport Distributed Snapshot (PDF)',
      title: 'Chandy_Lamport_Distributed_Snapshots.pdf',
      type: 'pdf' as FileType,
      text: 'The Chandy-Lamport algorithm records a consistent global state (snapshot) of a distributed system without halting execution. A process initiates the snapshot by recording its local state and sending a Marker message on all outgoing communication channels. When a process receives a Marker message on channel c: if it has not yet recorded its local state, it records its state and sends Markers along all outgoing channels; if it has already recorded its state, it records the state of channel c as the sequence of messages received on c after its own state was recorded and before receiving the marker.',
    },
    {
      label: 'CRISPR Prime Editing & Nickase (PPTX)',
      title: 'Lecture14_Prime_Editing_Mechanisms.pptx',
      type: 'pptx' as FileType,
      text: 'Prime editing enables precise search-and-replace genome edits without requiring double-strand breaks (DSBs) or donor DNA templates. The prime editor (PE) fusion construct comprises a catalytically impaired Cas9 nickase (H840A mutant) fused to an engineered reverse transcriptase (RT) enzyme. The prime editing guide RNA (pegRNA) specifies the genomic target and encodes the desired edit in an extension sequence copied directly by reverse transcriptase.',
    },
    {
      label: 'Paxos Consensus vs Raft (Video Transcript)',
      title: 'Seminar_Paxos_Single_Decree_Review.mp4',
      type: 'video' as FileType,
      text: 'Paxos separates consensus into Proposers, Acceptors, and Learners. In Phase 1a (Prepare), a Proposer chooses a proposal number n and sends a prepare request to a majority of Acceptors. In Phase 1b (Promise), Acceptors promise not to accept proposals numbered less than n and return the highest-numbered proposal accepted so far. In Phase 2a (Accept), the Proposer sends an accept request. Unlike Raft which enforces strict leader continuity, Paxos allows concurrent proposers which can cause dueling proposer live-locks.',
    },
  ];

  const handleFileExtracted = (extracted: ExtractedFileResult) => {
    setAttachedFile(extracted);
    setTitle(extracted.fileName);
    setFileType(extracted.detectedType);
    setRawText(extracted.rawText);
    setErrorMessage('');
  };

  const handleClearFile = () => {
    setAttachedFile(null);
    setTitle('');
    setRawText('');
  };

  const handleApplyPreset = (preset: typeof presets[0]) => {
    setAttachedFile(null);
    setTitle(preset.title);
    setFileType(preset.type);
    setRawText(preset.text);
    setErrorMessage('');
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) {
      setErrorMessage('Please provide both a title and text content or attach a file.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/gemini/ingest-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          courseId: course.id,
          fileType,
          rawText: rawText.trim(),
          fileSize: attachedFile?.fileSizeFormatted,
          fileData: attachedFile?.base64
            ? { base64: attachedFile.base64, mimeType: attachedFile.mimeType }
            : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Ingestion failed with status ${res.status}`);
      }

      const result = await res.json();
      onIngestSuccess(result);
      onClose();
    } catch (err: any) {
      console.error('Ingestion error:', err);
      setErrorMessage(err?.message || 'Failed to analyze and index document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-cyan-400 border border-indigo-200 dark:border-indigo-900/50 shadow-xs">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Upload & Ingest Academic Material
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 block -mt-0.5">
                Target course: <strong className="font-semibold text-slate-700 dark:text-slate-300">{course.code}</strong> ({course.title})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleIngest} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
          {/* System Drag & Drop / File Picker */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
              Upload from Your System
            </label>
            <FileDropzone
              onFileExtracted={handleFileExtracted}
              onClearFile={handleClearFile}
              currentFile={attachedFile}
              disabled={isProcessing}
            />
          </div>

          {/* Sample Academic Presets (Collapsible) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3">
            <button
              type="button"
              onClick={() => setShowPresets(prev => !prev)}
              className="w-full flex items-center justify-between text-left text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <span>Or load sample academic material preset:</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  showPresets ? 'rotate-180 text-indigo-500' : 'text-slate-400'
                }`}
              />
            </button>

            {showPresets && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-400 dark:hover:border-sky-500 transition-colors text-left cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & File Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Document Title / Filename
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Distributed_Lock_Managers_Ch4.pdf"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Material Format
              </label>
              <select
                value={fileType}
                onChange={e => setFileType(e.target.value as FileType)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="pdf">PDF Textbook</option>
                <option value="pptx">Slide Deck (PPTX)</option>
                <option value="video">Video Recording</option>
                <option value="notes">OCR / Notes</option>
              </select>
            </div>
          </div>

          {/* Content / Transcript */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Extracted Text & Notes Content
              </label>
              {rawText && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {rawText.length.toLocaleString()} characters
                </span>
              )}
            </div>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={6}
              placeholder="Source text extracted from uploaded file or pasted notes..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed resize-none"
            />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
              The ingestion engine will automatically generate semantic chunks, assign unit anchors (Page/Slide/Time), and extract key concepts for Bayesian Knowledge Tracing.
            </span>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/20 p-2.5 text-xs text-rose-700 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !title.trim() || !rawText.trim()}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Analyzing & Indexing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Process with Gemini</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
