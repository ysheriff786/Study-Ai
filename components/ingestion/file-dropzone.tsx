'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileText,
  Presentation,
  Video,
  FileEdit,
  X,
  CheckCircle2,
  Loader2,
  HardDrive,
  FileCheck,
} from 'lucide-react';
import { FileType } from '@/lib/types';
import { extractFileContent, ExtractedFileResult } from '@/lib/file-extractor';

interface FileDropzoneProps {
  onFileExtracted: (result: ExtractedFileResult) => void;
  onClearFile?: () => void;
  currentFile?: ExtractedFileResult | null;
  disabled?: boolean;
  compact?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileExtracted,
  onClearFile,
  currentFile,
  disabled = false,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file) return;
      setIsExtracting(true);
      setExtractError(null);

      try {
        const result = await extractFileContent(file);
        onFileExtracted(result);
      } catch (err: any) {
        console.error('File extraction error:', err);
        setExtractError(err?.message || 'Could not read file from system.');
      } finally {
        setIsExtracting(false);
      }
    },
    [onFileExtracted]
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isExtracting) return;
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isExtracting) return;
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDragging(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    if (disabled || isExtracting) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  const handleTriggerPicker = () => {
    if (disabled || isExtracting) return;
    fileInputRef.current?.click();
  };

  const getFormatIcon = (type: FileType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-rose-500" />;
      case 'pptx':
        return <Presentation className="h-5 w-5 text-amber-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-indigo-500" />;
      case 'notes':
        return <FileEdit className="h-5 w-5 text-emerald-500" />;
      default:
        return <FileText className="h-5 w-5 text-slate-400" />;
    }
  };

  const getFormatBadge = (type: FileType) => {
    switch (type) {
      case 'pdf':
        return 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-900';
      case 'pptx':
        return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-900';
      case 'video':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950/40 dark:border-indigo-900';
      case 'notes':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-900';
    }
  };

  return (
    <div className="w-full space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.pptx,.ppt,.key,.odp,.txt,.md,.markdown,.vtt,.srt,.docx,.doc,.csv,.json,.py,.ts,.js,.tex"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isExtracting}
      />

      {/* When a file is already loaded from system, show the File Preview Card */}
      {currentFile ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 p-3.5 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              {getFormatIcon(currentFile.detectedType)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100 max-w-[240px] sm:max-w-[340px]">
                  {currentFile.fileName}
                </span>
                <span
                  className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide ${getFormatBadge(
                    currentFile.detectedType
                  )}`}
                >
                  {currentFile.detectedType}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{currentFile.fileSizeFormatted}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  Loaded from system
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleTriggerPicker}
              className="text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 px-2 py-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Replace
            </button>
            {onClearFile && (
              <button
                type="button"
                onClick={onClearFile}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Dropzone Active / Idle Area */
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleTriggerPicker}
          className={`relative group rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
            compact ? 'p-4' : 'p-6 sm:p-7'
          } ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 ring-4 ring-indigo-500/10 scale-[1.008]'
              : 'border-slate-300 dark:border-slate-700/80 bg-white/60 dark:bg-slate-950/40 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
          }`}
        >
          <div className="flex flex-col items-center justify-center text-center">
            {isExtracting ? (
              <div className="flex flex-col items-center py-2 space-y-2">
                <Loader2 className="h-7 w-7 text-indigo-500 animate-spin" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reading file from system...
                </span>
              </div>
            ) : (
              <>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 mb-2.5 ${
                    isDragging
                      ? 'bg-indigo-600 text-white scale-110 shadow-md'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 group-hover:scale-105'
                  }`}
                >
                  <UploadCloud className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isDragging ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                        Drop file here to upload from system
                      </span>
                    ) : (
                      <>
                        <span className="text-indigo-600 dark:text-indigo-400 hover:underline">
                          Click to browse system files
                        </span>{' '}
                        <span className="text-slate-600 dark:text-slate-400 font-normal">
                          or drag & drop here
                        </span>
                      </>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    PDF textbooks, PowerPoint slides (.pptx), video transcripts (.vtt/.srt), notes (.txt, .md)
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <FileText className="h-2.5 w-2.5 text-rose-500" /> PDF
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <Presentation className="h-2.5 w-2.5 text-amber-500" /> PPTX / Slides
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <Video className="h-2.5 w-2.5 text-indigo-500" /> Video Transcripts
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <FileEdit className="h-2.5 w-2.5 text-emerald-500" /> Notes / Markdown
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {extractError && (
        <p className="text-xs text-rose-500 font-medium">{extractError}</p>
      )}
    </div>
  );
};
