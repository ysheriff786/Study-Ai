'use client';

import React, { useState } from 'react';
import { Course, FileType } from '@/lib/types';
import { SourceBadge } from '@/components/ui/source-badge';
import { ProcessingTimeline, TimelineStep } from '@/components/ui/processing-timeline';
import { FileDropzone } from '@/components/ingestion/file-dropzone';
import { ExtractedFileResult } from '@/lib/file-extractor';
import {
  Upload,
  FileText,
  Presentation,
  Video,
  FileEdit,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Database,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface IngestionViewProps {
  course: Course | null;
  onIngestSuccess: (data: { document: any; chunks: any[]; concepts: any[] }) => void;
  onViewKnowledgeBase: () => void;
  onCreateCourse?: () => void;
}

export const IngestionView: React.FC<IngestionViewProps> = ({
  course,
  onIngestSuccess,
  onViewKnowledgeBase,
  onCreateCourse,
}) => {
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState<FileType>('pdf');
  const [rawText, setRawText] = useState('');
  const [attachedFile, setAttachedFile] = useState<ExtractedFileResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedDoc, setCompletedDoc] = useState<any | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  // Ingestion processing timeline steps
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([
    {
      id: 'step-upload',
      label: 'Format Verification & Buffer Check',
      description: 'Validate MIME type and sanitize input string.',
      status: 'pending',
    },
    {
      id: 'step-extract',
      label: 'Multimodal Text & Metadata Extraction',
      description: 'Parse pages/slides/transcripts and structure document units.',
      status: 'pending',
    },
    {
      id: 'step-chunk',
      label: 'Semantic Text Chunking & Boundary Alignment',
      description: 'Split into coherent paragraphs preserving citations and equations.',
      status: 'pending',
    },
    {
      id: 'step-bkt',
      label: 'Cognitive BKT Concept Extraction',
      description: 'Identify target theoretical skills and configure Bayesian priors.',
      status: 'pending',
    },
    {
      id: 'step-index',
      label: 'Vector Index Construction & Verification',
      description: 'Register semantic chunks in FAISS vector store for citation retrieval.',
      status: 'pending',
    },
  ]);

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
        <Upload className="h-12 w-12 text-slate-400 mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          No course selected
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Please create a course before uploading or ingesting documents.
        </p>
        {onCreateCourse && (
          <button
            onClick={onCreateCourse}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 text-xs shadow-md transition-all cursor-pointer"
          >
            <span>Create Course First</span>
          </button>
        )}
      </div>
    );
  }

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
    setCompletedDoc(null);
  };

  const handleClearFile = () => {
    setAttachedFile(null);
    setTitle('');
    setRawText('');
    setCompletedDoc(null);
  };

  const handleApplyPreset = (preset: typeof presets[0]) => {
    setAttachedFile(null);
    setTitle(preset.title);
    setFileType(preset.type);
    setRawText(preset.text);
    setErrorMessage('');
    setCompletedDoc(null);
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) {
      setErrorMessage('Please provide both a title and text content, or drag/upload a file.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setCompletedDoc(null);

    // Simulate animated timeline progress
    setTimelineSteps(prev =>
      prev.map((s, idx) => (idx === 0 ? { ...s, status: 'in_progress' } : { ...s, status: 'pending' }))
    );

    try {
      setTimeout(() => {
        setTimelineSteps(prev =>
          prev.map((s, idx) =>
            idx === 0 ? { ...s, status: 'completed' } : idx === 1 ? { ...s, status: 'in_progress' } : s
          )
        );
      }, 500);

      setTimeout(() => {
        setTimelineSteps(prev =>
          prev.map((s, idx) =>
            idx <= 1 ? { ...s, status: 'completed' } : idx === 2 ? { ...s, status: 'in_progress' } : s
          )
        );
      }, 1000);

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

      if (!res.ok) throw new Error('Ingestion pipeline failed');
      const data = await res.json();

      setTimelineSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
      setCompletedDoc(data);
      onIngestSuccess(data);
    } catch (err: any) {
      console.error('Ingestion error:', err);
      setErrorMessage(err?.message || 'Error occurred during pipeline ingestion.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-medium text-cyan-600 dark:text-cyan-400 mb-1">
          <span>ADMIN INGESTION & PIPELINE</span>
          <span aria-hidden="true">·</span>
          <span>{course.code}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Multimodal Course Ingestion Pipeline
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Drag & drop files from your system, choose from your computer, or paste academic text to generate semantic chunks, assign unit anchors, and map concepts into Bayesian Knowledge Tracing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingestion Form (2 columns) */}
        <div className="lg:col-span-2 space-y-5">
          {/* System Drag-and-Drop / File Picker Card */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Option 1: Upload from Your System
              </span>
              <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                Drag & Drop or Browse
              </span>
            </div>

            <FileDropzone
              onFileExtracted={handleFileExtracted}
              onClearFile={handleClearFile}
              currentFile={attachedFile}
              disabled={isProcessing}
            />
          </div>

          {/* Presets Accordion */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-4 shadow-xs">
            <button
              type="button"
              onClick={() => setShowPresets(prev => !prev)}
              className="w-full flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <span>Option 2: Load Sample Academic Material Preset</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  showPresets ? 'rotate-180 text-indigo-500' : 'text-slate-400'
                }`}
              />
            </button>

            {showPresets && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition-colors cursor-pointer text-left"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <form
            onSubmit={handleProcess}
            className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 p-6 space-y-4 shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Document Title
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Format
                </label>
                <select
                  value={fileType}
                  onChange={e => setFileType(e.target.value as FileType)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="pdf">PDF Textbook</option>
                  <option value="pptx">Slide Deck (PPTX)</option>
                  <option value="video">Video Recording (MP4)</option>
                  <option value="notes">OCR Handwritten Notes</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Extracted Material & Notes Content
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
                rows={8}
                placeholder="Content extracted from uploaded system file or pasted transcript text..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed resize-none"
              />
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">
                Automated semantic chunking & concept graph
              </span>

              <button
                type="submit"
                disabled={isProcessing || !title.trim() || !rawText.trim()}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Ingest & Build Vector Index</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Rail: Processing Pipeline Timeline & Completion */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Ingestion Execution Timeline
            </h3>
            <ProcessingTimeline steps={timelineSteps} />
          </div>

          {/* Completion State Card */}
          {completedDoc && (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-950/20 p-5 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Knowledge Base Ingestion Complete</span>
              </div>
              <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed font-sans">
                Successfully created <strong className="font-semibold">{completedDoc.chunks?.length || 0} vector chunks</strong> and extracted <strong className="font-semibold">{completedDoc.concepts?.length || 0} prerequisite concepts</strong> into Bayesian Knowledge Tracing.
              </p>
              <button
                onClick={onViewKnowledgeBase}
                className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Explore Ingested Chunks</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
