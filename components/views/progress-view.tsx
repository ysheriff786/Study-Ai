'use client';

import React from 'react';
import { Course, ConceptMastery } from '@/lib/types';
import { MasteryRing } from '@/components/ui/mastery-ring';
import { computeOverallMastery, getMasteryLevel } from '@/lib/bkt';
import {
  BrainCircuit,
  Target,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface ProgressViewProps {
  course: Course | null;
  concepts: ConceptMastery[];
  onDrillConcept: (conceptId: string) => void;
  onNavigateToQuiz?: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  course,
  concepts,
  onDrillConcept,
  onNavigateToQuiz,
}) => {
  const hasHistory = concepts.some(c => c.attemptsCount > 0);

  if (!course || concepts.length === 0 || !hasHistory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] max-w-md mx-auto px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 mb-4">
          <BrainCircuit className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          No learning history yet
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Complete your first assessment to begin tracking mastery.
        </p>
        {onNavigateToQuiz && (
          <button
            onClick={onNavigateToQuiz}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold px-5 py-2.5 text-sm shadow-md cursor-pointer"
          >
            <span>Take Diagnostic Assessment</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  const overall = computeOverallMastery(concepts);

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 overflow-y-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-medium text-cyan-600 dark:text-cyan-400 mb-1">
          <span>PROGRESS & COGNITIVE MODELING</span>
          <span aria-hidden="true">·</span>
          <span>{course.code}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Mastery Analytics & BKT Cognitive State
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Grounded cognitive modeling based on actual assessment responses.
        </p>
      </div>

      {/* Top Banner: Ring + Mathematical Formula Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-6 flex flex-col items-center justify-center text-center shadow-xs">
          <MasteryRing value={overall.averageMastery} size={130} strokeWidth={10} label="Curriculum" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3">
            {course.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Overall Curriculum Mastery: {Math.round(overall.averageMastery * 100)}%
          </p>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold uppercase mb-2">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Bayesian Knowledge Tracing Model</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Cognitive Trajectory Statistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-400">Total Attempts</div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {concepts.reduce((acc, c) => acc + c.attemptsCount, 0)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-400">Mastered Nodes</div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {overall.masteredCount} / {concepts.length}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-400">Average P(L)</div>
                <div className="text-base font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                  {overall.averageMastery.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Concept Breakdown Table */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-6 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
          Individual Concept Cognitive States
        </h3>
        <div className="space-y-3">
          {concepts.map(c => {
            const level = getMasteryLevel(c.currentMastery);
            return (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${level.badgeClass}`}>
                      {level.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {c.topicName} · {c.attemptsCount} attempts ({c.correctCount} correct)
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      P(L) = {c.currentMastery.toFixed(2)}
                    </div>
                    <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${Math.round(c.currentMastery * 100)}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => onDrillConcept(c.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                  >
                    Drill
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
