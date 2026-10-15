'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Course, AssessmentQuestion, ConceptMastery, SourceChunk } from '@/lib/types';
import { calculateBKTUpdate } from '@/lib/bkt';
import {
  Award,
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Upload,
  RefreshCw,
} from 'lucide-react';

interface AssessmentViewProps {
  course: Course | null;
  questions: AssessmentQuestion[];
  concepts: ConceptMastery[];
  chunks: SourceChunk[];
  targetConceptId?: string | null;
  onCompleteQuiz: (results: {
    total: number;
    correct: number;
    userAnswers: { question: AssessmentQuestion; selectedOption: number; isCorrect: boolean }[];
    bktUpdates: { conceptName: string; prevP: number; newP: number; delta: number }[];
  }) => void;
  onOpenSourceInspector: (docTitle: string, unitLabel: string, quote: string) => void;
  onQuestionsGenerated?: (questions: AssessmentQuestion[]) => void;
  onOpenUpload?: () => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  course,
  questions,
  concepts,
  chunks,
  targetConceptId,
  onCompleteQuiz,
  onOpenSourceInspector,
  onQuestionsGenerated,
  onOpenUpload,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const filteredQuestions = targetConceptId
    ? questions.filter(q => q.conceptId === targetConceptId)
    : questions;
  const activeQuestions = filteredQuestions.length > 0 ? filteredQuestions : questions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showSourcePreview, setShowSourcePreview] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Accumulate answers for the results page
  const [sessionAnswers, setSessionAnswers] = useState<
    { question: AssessmentQuestion; selectedOption: number; isCorrect: boolean }[]
  >([]);
  const [bktUpdates, setBktUpdates] = useState<
    { conceptName: string; prevP: number; newP: number; delta: number }[]
  >([]);

  // Live timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && activeQuestions.length > 0) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, activeQuestions.length]);

  const handleGenerateQuestions = async () => {
    if (!course || chunks.length === 0) return;
    setIsGenerating(true);
    setGenerateError('');
    try {
      const res = await fetch('/api/gemini/generate-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          courseTitle: course.title,
          retrievedChunks: chunks.slice(0, 5),
          targetConcepts: concepts.map(c => c.name),
          count: 3,
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        if (onQuestionsGenerated) {
          onQuestionsGenerated(data.questions);
        }
      } else {
        setGenerateError('Could not generate questions. Ensure uploaded material contains sufficient paragraphs.');
      }
    } catch (err: any) {
      setGenerateError(err.message || 'Question generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProceed = useCallback(() => {
    if (selectedOption === null || !activeQuestions[currentIndex]) return;

    const currentQ = activeQuestions[currentIndex];
    const isCorrect = selectedOption === currentQ.correctOptionIndex;

    const updatedAnswers = [
      ...sessionAnswers,
      { question: currentQ, selectedOption, isCorrect },
    ];
    setSessionAnswers(updatedAnswers);

    // Compute BKT Bayesian update
    const concept = concepts.find(
      c => c.name.toLowerCase() === currentQ.conceptName.toLowerCase() || c.id === currentQ.conceptId
    );

    const prevP = concept ? concept.currentMastery : 0.20;
    const bkt = calculateBKTUpdate(
      prevP,
      isCorrect,
      concept?.bktParams || { pL0: 0.20, pT: 0.12, pS: 0.10, pG: 0.25 }
    );

    const updatedBKT = [
      ...bktUpdates,
      {
        conceptName: currentQ.conceptName,
        prevP,
        newP: bkt.newMastery,
        delta: bkt.delta,
      },
    ];
    setBktUpdates(updatedBKT);

    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowSourcePreview(false);
    } else {
      setIsTimerActive(false);
      onCompleteQuiz({
        total: activeQuestions.length,
        correct: updatedAnswers.filter(a => a.isCorrect).length,
        userAnswers: updatedAnswers,
        bktUpdates: updatedBKT,
      });
    }
  }, [
    selectedOption,
    currentIndex,
    activeQuestions,
    sessionAnswers,
    concepts,
    bktUpdates,
    onCompleteQuiz,
  ]);

  // Empty State 1: No uploaded material in course
  if (!chunks || chunks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4">
          <HelpCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Upload course material first
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Assessments are generated strictly from your uploaded textbook, slides, or notes to ensure verified source grounding.
        </p>
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-medium px-5 py-2.5 text-sm shadow-md cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Material</span>
          </button>
        )}
      </div>
    );
  }

  // Empty State 2: Uploaded material exists, but assessment questions need generation
  if (activeQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 mb-4">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Ready for Diagnostic Assessment
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Generate an adaptive multiple-choice diagnostic quiz strictly grounded in your {chunks.length} uploaded source chunks.
        </p>
        {generateError && (
          <p className="text-xs text-red-500 mb-4">{generateError}</p>
        )}
        <button
          onClick={handleGenerateQuestions}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold px-5 py-2.5 text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Generating Questions from Uploads...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generate Assessment from Uploaded Material</span>
            </>
          )}
        </button>
      </div>
    );
  }

  const currentQ = activeQuestions[currentIndex];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 overflow-y-auto">
      {/* Top Banner: Progress + Timer */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-cyan-600 dark:text-cyan-400 mb-1">
            <span>QUESTION {currentIndex + 1} OF {activeQuestions.length}</span>
            <span>·</span>
            <span className="uppercase text-slate-400">{currentQ.difficulty}</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Topic: {currentQ.conceptName}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-mono text-slate-700 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 text-cyan-500" />
            <span>{formatTime(secondsElapsed)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-6 sm:p-8 space-y-6 shadow-xs">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
          {currentQ.questionText}
        </h3>

        {/* Options Grid */}
        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left p-4 rounded-xl text-sm border transition-all flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-900 dark:text-cyan-200 font-medium'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-mono font-bold ${
                    isSelected
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="leading-snug pt-0.5">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Source Citation Preview Disclosure */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => setShowSourcePreview(prev => !prev)}
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>
              {showSourcePreview ? 'Hide verified source passage' : 'Show verified source passage'}
            </span>
            {showSourcePreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showSourcePreview && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {currentQ.sourceCitation.docTitle} · {currentQ.sourceCitation.unitLabel}
              </div>
              <p className="font-mono text-[11px] leading-relaxed">
                &quot;{currentQ.sourceCitation.quote}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Submit & Next Button */}
        <div className="flex items-center justify-end pt-4">
          <button
            onClick={handleProceed}
            disabled={selectedOption === null}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold px-6 py-2.5 text-sm shadow-md hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            <span>{currentIndex + 1 === activeQuestions.length ? 'Submit Assessment' : 'Next Question'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
