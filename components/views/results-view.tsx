'use client';

import React, { useState } from 'react';
import { Course, AssessmentQuestion } from '@/lib/types';
import { MasteryRing } from '@/components/ui/mastery-ring';
import { RecommendationCard } from '@/components/ui/recommendation-card';
import {
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  BookOpen,
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

interface ResultsViewProps {
  course: Course | null;
  results: {
    total: number;
    correct: number;
    userAnswers: { question: AssessmentQuestion; selectedOption: number; isCorrect: boolean }[];
    bktUpdates: { conceptName: string; prevP: number; newP: number; delta: number }[];
  };
  onRetake: () => void;
  onContinueToDashboard: () => void;
  onAskTutorAboutMistake: (questionText: string, conceptName: string) => void;
  onInspectSource: (docTitle: string, unitLabel: string, quote: string) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  course,
  results,
  onRetake,
  onContinueToDashboard,
  onAskTutorAboutMistake,
  onInspectSource,
}) => {
  const [selectedReviewIdx, setSelectedReviewIdx] = useState<number>(0);

  const percentage = Math.round((results.correct / (results.total || 1)) * 100);
  const reviewedAnswer = results.userAnswers[selectedReviewIdx] || results.userAnswers[0];
  const incorrectCount = results.total - results.correct;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 overflow-y-auto">
      {/* Top Banner & Celebration */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 shadow-xs">
        <div className="flex items-center gap-5">
          <MasteryRing value={percentage / 100} size={110} strokeWidth={9} label="Accuracy" />
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 mb-1">
              <Award className="h-4 w-4" />
              <span>ASSESSMENT COMPLETE · {course?.code || 'COURSE'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {percentage >= 80 ? 'Mastery Milestone Reached!' : percentage >= 50 ? 'Solid Conceptual Foundation' : 'Review Recommended'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              You correctly answered <strong className="text-slate-900 dark:text-slate-100">{results.correct} of {results.total}</strong> diagnostic questions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onRetake}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retake Drill</span>
          </button>
          <button
            onClick={onContinueToDashboard}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer shadow-xs"
          >
            <span>Back to Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* BKT Mastery Shifts Strip */}
      {results.bktUpdates.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Bayesian Knowledge Tracing Updates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.bktUpdates.map((update, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-mono"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate mb-1">
                  {update.conceptName}
                </span>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">P(L): {Math.round(update.prevP * 100)}%</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className={`font-bold ${update.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {Math.round(update.newP * 100)}% ({update.delta >= 0 ? `+${Math.round(update.delta * 100)}` : Math.round(update.delta * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Review & Misconception Analysis Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Interactive Answer Review ({results.userAnswers.length} Questions)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {results.correct} Correct · {incorrectCount} Missed
          </span>
        </div>

        {/* Question Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {results.userAnswers.map((ans, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedReviewIdx(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium border transition-colors cursor-pointer shrink-0 ${
                selectedReviewIdx === idx
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-950/40 dark:text-cyan-200 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              {ans.isCorrect ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-rose-500" />
              )}
              <span>Q{idx + 1}</span>
            </button>
          ))}
        </div>

        {/* Active Question Detail Card */}
        {reviewedAnswer && (
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {reviewedAnswer.question.conceptName}
              </span>
              <span
                className={`font-mono font-semibold px-2 py-0.5 rounded ${
                  reviewedAnswer.isCorrect
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                }`}
              >
                {reviewedAnswer.isCorrect ? 'Correct' : 'Missed'}
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
              {reviewedAnswer.question.questionText}
            </h4>

            {/* Options with feedback indicators */}
            <div className="space-y-2 text-xs sm:text-sm">
              {reviewedAnswer.question.options.map((opt, oIdx) => {
                const isSelected = reviewedAnswer.selectedOption === oIdx;
                const isCorrect = oIdx === reviewedAnswer.question.correctOptionIndex;

                let style = 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/60 text-slate-500';
                if (isCorrect) {
                  style = 'border-emerald-300 bg-emerald-50/60 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-200 font-medium';
                } else if (isSelected) {
                  style = 'border-rose-300 bg-rose-50/60 text-rose-900 dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-200';
                }

                return (
                  <div key={oIdx} className={`rounded-xl border p-3 flex items-start gap-2.5 ${style}`}>
                    <span className="font-mono font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                    <span className="flex-1">{opt}</span>
                    {isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                    {!isCorrect && isSelected && <XCircle className="h-4 w-4 text-rose-500 shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Explanation & Misconception Analysis */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span>Concept Mechanism & Misconception Breakdown</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {reviewedAnswer.question.explanation}
              </p>
            </div>

            {/* Verifiable Citation Footer */}
            {reviewedAnswer.question.sourceCitation && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-cyan-200 dark:border-cyan-500/20 bg-cyan-50/60 dark:bg-cyan-950/30 p-3.5 text-xs text-cyan-900 dark:text-cyan-200">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-cyan-500" />
                  <span className="font-semibold">{reviewedAnswer.question.sourceCitation.docTitle}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{reviewedAnswer.question.sourceCitation.unitLabel}</span>
                </div>
                <button
                  onClick={() =>
                    onInspectSource(
                      reviewedAnswer.question.sourceCitation.docTitle,
                      reviewedAnswer.question.sourceCitation.unitLabel,
                      reviewedAnswer.question.sourceCitation.quote
                    )
                  }
                  className="text-cyan-700 dark:text-cyan-300 hover:underline font-semibold cursor-pointer text-left sm:text-right"
                >
                  Inspect Syllabus Source
                </button>
              </div>
            )}

            {/* Ask Tutor About This Question */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() =>
                  onAskTutorAboutMistake(
                    reviewedAnswer.question.questionText,
                    reviewedAnswer.question.conceptName
                  )
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask Tutor: &ldquo;Why is my answer incorrect?&rdquo;</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
