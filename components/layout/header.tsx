'use client';

import React from 'react';
import { Course } from '@/lib/types';
import { PlusCircle, PlayCircle, BarChart3, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeCourse: Course;
  currentView: 'tutor' | 'assessment' | 'mastery' | 'ingestion' | 'evaluation';
  onSelectView: (view: 'tutor' | 'assessment' | 'mastery' | 'ingestion' | 'evaluation') => void;
  onOpenUpload: () => void;
  onStartQuiz: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCourse,
  currentView,
  onSelectView,
  onOpenUpload,
  onStartQuiz,
}) => {
  const viewTitles: Record<string, string> = {
    tutor: 'Tutor & Citations',
    assessment: 'Diagnostic Quiz',
    mastery: 'BKT Mastery Matrix',
    ingestion: 'Multimodal Ingestion',
    evaluation: 'RAGAS Evaluation Lab',
  };

  return (
    <header className="flex h-16 w-full items-center justify-between gap-8 px-6 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-10 shrink-0">
      {/* Zone 1: Breadcrumb trail */}
      <div className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap shrink-0">
        <span className="font-semibold text-slate-200">{activeCourse.code}</span>
        <span aria-hidden="true" className="text-slate-600">/</span>
        <span className="text-slate-300 font-medium">{viewTitles[currentView]}</span>
      </div>

      {/* Zone 2: Navigation Links / Segmented quick tabs */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800/80 text-xs">
        <button
          onClick={() => onSelectView('tutor')}
          className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'tutor'
              ? 'bg-slate-800 text-sky-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tutor & Citations
        </button>
        <button
          onClick={() => onSelectView('assessment')}
          className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'assessment'
              ? 'bg-slate-800 text-sky-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Diagnostic Quiz
        </button>
        <button
          onClick={() => onSelectView('mastery')}
          className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'mastery'
              ? 'bg-slate-800 text-sky-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          BKT Matrix
        </button>
        <button
          onClick={() => onSelectView('ingestion')}
          className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'ingestion'
              ? 'bg-slate-800 text-sky-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Knowledge Base
        </button>
        <button
          onClick={() => onSelectView('evaluation')}
          className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'evaluation'
              ? 'bg-slate-800 text-sky-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          RAGAS Benchmarks
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        {currentView === 'ingestion' ? (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Ingest Source</span>
          </button>
        ) : (
          <button
            onClick={onStartQuiz}
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            <span>Diagnostic Drill</span>
          </button>
        )}
      </div>
    </header>
  );
};
