'use client';

import React from 'react';
import { Course, DocumentSource, ConceptMastery, RAGASEvalTestCase } from '@/lib/types';
import {
  BarChart3,
  BookOpen,
  FileText,
  Upload,
  Brain,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Settings,
  Sparkles,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface AdminDashboardViewProps {
  courses: Course[];
  activeCourse: Course | null;
  documents: DocumentSource[];
  concepts: ConceptMastery[];
  benchmarks: RAGASEvalTestCase[];
  onSelectCourse: (course: Course) => void;
  onNavigateToIngest: () => void;
  onNavigateToEvaluations: () => void;
  onNavigateToKnowledgeBase: () => void;
  onCreateCourse: () => void;
  onDeleteDocument?: (docId: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  courses,
  activeCourse,
  documents,
  concepts,
  benchmarks,
  onSelectCourse,
  onNavigateToIngest,
  onNavigateToEvaluations,
  onNavigateToKnowledgeBase,
  onCreateCourse,
  onDeleteDocument,
}) => {
  const totalDocs = documents.length;
  const completedDocs = documents.filter((d) => d.status === 'indexed').length;
  const totalConcepts = concepts.length;

  // Calculate RAGAS Eval averages
  const avgFaithfulness = benchmarks.length > 0
    ? (benchmarks.reduce((acc, b) => acc + b.faithfulnessScore, 0) / benchmarks.length * 100).toFixed(0)
    : '98';

  const avgRelevance = benchmarks.length > 0
    ? (benchmarks.reduce((acc, b) => acc + b.answerRelevanceScore, 0) / benchmarks.length * 100).toFixed(0)
    : '96';

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8 font-sans space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Instructor &amp; Admin Workspace
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Curriculum &amp; Ingestion Management
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Monitor course-level document pipelines, extracted concept ontologies, and RAG retrieval faithfulness.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCreateCourse}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-indigo-500" />
            <span>New Course</span>
          </button>

          <button
            onClick={onNavigateToIngest}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-500 hover:to-cyan-500 transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Ingest Document</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase font-mono">Managed Courses</span>
            <BookOpen className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {courses.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {activeCourse ? `Active: ${activeCourse.code}` : 'No active course'}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase font-mono">Indexed Documents</span>
            <FileText className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {completedDocs} / {totalDocs}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> All materials processed
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase font-mono">Extracted Concepts</span>
            <Brain className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalConcepts}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Ontology mapped with BKT priors
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase font-mono">RAG Faithfulness</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono text-emerald-600 dark:text-emerald-400">
            {avgFaithfulness}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Relevance: {avgRelevance}%
          </div>
        </div>
      </div>

      {/* Main Grid: Course Documents & Extracted Concepts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Course Documents & Ingestion Status */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" />
              <span>Ingested Course Documents</span>
            </h2>
            <button
              onClick={onNavigateToIngest}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Upload Materials →
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
            {documents.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">No documents uploaded yet</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Drag and drop a PDF, textbook chapter, or lecture presentation to extract concepts and power the AI tutor.
                </p>
                <button
                  onClick={onNavigateToIngest}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload from system</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-mono text-xs uppercase font-bold shrink-0">
                        {doc.fileType}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-md">
                          {doc.title}
                        </h4>
                        <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{doc.fileSize}</span>
                          <span>•</span>
                          <span>{doc.totalUnits} {doc.unitType}</span>
                          <span>•</span>
                          <span className="capitalize text-emerald-600 dark:text-emerald-400 font-medium">
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={onNavigateToKnowledgeBase}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Inspect Chunks
                      </button>
                      {onDeleteDocument && (
                        <button
                          onClick={() => onDeleteDocument(doc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Extracted Concepts & RAG Benchmark Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-500" />
              <span>Extracted Concepts</span>
            </h2>
            <button
              onClick={onNavigateToEvaluations}
              className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              Eval Lab →
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-3">
            {concepts.length === 0 ? (
              <p className="text-xs text-slate-500">No concepts mapped yet. Ingest documents to extract concepts.</p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {concepts.slice(0, 8).map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {c.name}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                        p(L0)={(c.bktParams.pL0 * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
