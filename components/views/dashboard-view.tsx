'use client';

import React from 'react';
import { Course, ConceptMastery, DocumentSource } from '@/lib/types';
import { MasteryRing } from '@/components/ui/mastery-ring';
import { StatCard } from '@/components/ui/stat-card';
import { computeOverallMastery } from '@/lib/bkt';
import {
  MessageSquareText,
  PlayCircle,
  FileBox,
  BrainCircuit,
  ArrowRight,
  Target,
  Sparkles,
  Upload,
  PlusCircle,
  BookOpen,
} from 'lucide-react';

interface DashboardViewProps {
  course: Course | null;
  concepts: ConceptMastery[];
  documents: DocumentSource[];
  onNavigate: (view: 'tutor' | 'assessment' | 'progress' | 'knowledge' | 'ingestion') => void;
  onDrillConcept: (conceptId: string) => void;
  onCreateCourse?: () => void;
  onOpenUpload?: () => void;
  onLoadDemoCourse?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  course,
  concepts,
  documents,
  onNavigate,
  onDrillConcept,
  onCreateCourse,
  onOpenUpload,
  onLoadDemoCourse,
}) => {
  // 1. Initial Empty State: No course created yet
  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] max-w-xl mx-auto px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 mb-6 shadow-xs">
          <BookOpen className="h-8 w-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
          Start with your course material
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
          Upload your textbook, slides, or notes to build a personalized source-grounded learning workspace with BKT mastery tracking. Or load the sample course to explore right away.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          {onLoadDemoCourse && (
            <button
              onClick={onLoadDemoCourse}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 text-sm shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Load Sample Course</span>
            </button>
          )}
          {onCreateCourse && (
            <button
              onClick={onCreateCourse}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold px-5 py-2.5 text-sm shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create course</span>
            </button>
          )}
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold px-5 py-2.5 text-sm transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4 text-cyan-500" />
              <span>Upload material</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Course exists, but no documents uploaded yet
  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col h-full max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 font-medium mb-1">
              <span>COURSE WORKSPACE</span>
              <span aria-hidden="true">·</span>
              <span>{course.code}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Empty Material Card */}
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
          <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-4">
            <Upload className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Upload course material first
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
            The tutor answers from your indexed content. Upload a PDF textbook, lecture slides (PPTX), or notes to automatically extract chunks, generate BKT concepts, and enable source-grounded answers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onLoadDemoCourse && (
              <button
                onClick={onLoadDemoCourse}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium px-5 py-2.5 text-sm shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Load Sample Materials</span>
              </button>
            )}
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium px-5 py-2.5 text-sm shadow-sm transition-all cursor-pointer"
              >
                <Upload className="h-4 w-4 text-cyan-500" />
                <span>Upload Material</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Normal State with Real Uploaded Documents
  const hasHistory = concepts.some(c => c.attemptsCount > 0);
  const overall = computeOverallMastery(concepts);
  const sortedByMastery = [...concepts].sort((a, b) => a.currentMastery - b.currentMastery);
  const nextBestConcept = sortedByMastery[0];
  const weakConcepts = sortedByMastery.filter(c => c.currentMastery < 0.65).slice(0, 3);

  // Group concepts by topic for topic cards
  const topicsMap: Record<string, ConceptMastery[]> = {};
  concepts.forEach(c => {
    if (!topicsMap[c.topicName]) topicsMap[c.topicName] = [];
    topicsMap[c.topicName].push(c);
  });

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 overflow-y-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 font-medium mb-1">
            <span>STUDENT DASHBOARD</span>
            <span aria-hidden="true">·</span>
            <span>{course.code}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {course.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {documents.length} verified {documents.length === 1 ? 'document' : 'documents'} indexed · {concepts.length} concepts tracked
          </p>
        </div>

        {/* Quick Action Button Strip */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('tutor')}
            className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <MessageSquareText className="h-3.5 w-3.5 text-cyan-500" />
            <span>Open Tutor</span>
          </button>
          <button
            onClick={() => onNavigate('assessment')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs hover:from-indigo-500 hover:to-indigo-600 transition-all cursor-pointer"
          >
            <PlayCircle className="h-3.5 w-3.5 text-cyan-300" />
            <span>Take Diagnostic</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Indexed Sources"
          value={documents.length}
          unit="files"
          subtitle={`${documents.reduce((acc, d) => acc + d.chunksCount, 0)} semantic chunks`}
          icon={FileBox}
          color="cyan"
        />
        <StatCard
          title="Tracked Concepts"
          value={concepts.length}
          unit="nodes"
          subtitle="Cognitive BKT model"
          icon={BrainCircuit}
          color="indigo"
        />
        <StatCard
          title="Cognitive Mastery"
          value={hasHistory ? `${Math.round(overall.averageMastery * 100)}%` : '0%'}
          subtitle={hasHistory ? `${overall.masteredCount} of ${concepts.length} mastered` : 'No attempts yet'}
          icon={Target}
          color="emerald"
        />
        <StatCard
          title="Assessment Drills"
          value={concepts.reduce((acc, c) => acc + c.attemptsCount, 0)}
          unit="attempts"
          subtitle={hasHistory ? 'Updated via Bayesian Tracing' : 'Ready to start'}
          icon={Sparkles}
          color="purple"
        />
      </div>

      {/* Section 3: Check if there is mastery history */}
      {!hasHistory ? (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No learning history yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Complete your first assessment to begin tracking mastery.
          </p>
          <button
            onClick={() => onNavigate('assessment')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 transition-colors cursor-pointer"
          >
            <PlayCircle className="h-4 w-4" />
            <span>Start First Diagnostic Quiz</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Mastery Ring */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-6 flex flex-col items-center justify-center text-center shadow-xs">
            <MasteryRing value={overall.averageMastery} size={150} strokeWidth={11} label="Curriculum" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4">
              Overall Subject Mastery
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Calculated using Bayesian Knowledge Tracing across your {concepts.length} extracted concepts.
            </p>
          </div>

          {/* Next Best Action Card */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Recommended Action
                </span>
                <span className="text-xs font-mono text-slate-400">
                  P(L) = {nextBestConcept ? nextBestConcept.currentMastery.toFixed(2) : '0.20'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {nextBestConcept ? `Reinforce: ${nextBestConcept.name}` : 'Review Course Concepts'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {nextBestConcept?.description || 'Strengthen foundational concepts with verified citations.'}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {nextBestConcept?.attemptsCount || 0} attempts completed
              </span>
              <button
                onClick={() => nextBestConcept && onDrillConcept(nextBestConcept.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
              >
                <span>Practice this concept</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Concepts Grid */}
      {concepts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Course Concept Mastery
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {concepts.map(c => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-mono truncate">{c.topicName}</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {Math.round(c.currentMastery * 100)}%
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {c.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {c.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-400 text-[11px]">{c.attemptsCount} attempts</span>
                  <button
                    onClick={() => onDrillConcept(c.id)}
                    className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    Drill Concept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
