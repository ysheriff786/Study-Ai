'use client';

import React, { useState } from 'react';
import { Course, ConceptMastery, AssessmentQuestion, SourceChunk } from '@/lib/types';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  Layers,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { calculateBKTUpdate } from '@/lib/bkt';

interface AssessmentRunnerProps {
  course: Course;
  concepts: ConceptMastery[];
  initialQuestions: AssessmentQuestion[];
  chunks: SourceChunk[];
  targetConceptId?: string | null;
  onUpdateMastery: (conceptId: string, isCorrect: boolean, prevP: number, newP: number) => void;
  onInspectSource: (docTitle: string, unitLabel: string, quote: string) => void;
}

export const AssessmentRunner: React.FC<AssessmentRunnerProps> = ({
  course,
  concepts,
  initialQuestions,
  chunks,
  targetConceptId,
  onUpdateMastery,
  onInspectSource,
}) => {
  const [selectedConceptFilter, setSelectedConceptFilter] = useState<string>(
    targetConceptId || 'all'
  );
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastBktUpdate, setLastBktUpdate] = useState<{
    conceptName: string;
    prevP: number;
    newP: number;
    delta: number;
    isCorrect: boolean;
  } | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [scoreStats, setScoreStats] = useState({ total: 0, correct: 0 });

  const activeQuestions =
    selectedConceptFilter === 'all'
      ? questions
      : questions.filter(q => q.conceptId === selectedConceptFilter);

  const currentQ = activeQuestions[currentIndex] || activeQuestions[0];

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted || !currentQ) return;

    const isCorrect = selectedOption === currentQ.correctOptionIndex;
    setIsSubmitted(true);

    // Find the concept to update BKT
    const matchedConcept = concepts.find(
      c => c.id === currentQ.conceptId || c.name.toLowerCase().includes(currentQ.conceptName.toLowerCase())
    ) || concepts[0];

    if (matchedConcept) {
      const prevP = matchedConcept.currentMastery;
      const { newMastery, delta } = calculateBKTUpdate(prevP, isCorrect, matchedConcept.bktParams);

      setLastBktUpdate({
        conceptName: matchedConcept.name,
        prevP,
        newP: newMastery,
        delta,
        isCorrect,
      });

      onUpdateMastery(matchedConcept.id, isCorrect, prevP, newMastery);
    }

    setScoreStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setLastBktUpdate(null);
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleGenerateNewQuestions = async () => {
    setIsGenerating(true);
    try {
      const targetConceptsList =
        selectedConceptFilter === 'all'
          ? concepts.map(c => c.name).slice(0, 3)
          : [concepts.find(c => c.id === selectedConceptFilter)?.name || 'Course Concept'];

      const res = await fetch('/api/gemini/generate-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetConcepts: targetConceptsList,
          courseTitle: course.title,
          retrievedChunks: chunks.slice(0, 4),
          count: 2,
        }),
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        setQuestions(prev => [...prev, ...data.questions]);
        setCurrentIndex(activeQuestions.length); // Jump to new question
        setSelectedOption(null);
        setIsSubmitted(false);
        setLastBktUpdate(null);
      }
    } catch (err) {
      console.error('Error generating questions:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full px-4 py-6 space-y-6 overflow-y-auto">
      {/* Top Bar / Concept Filter & Session Score */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Adaptive Diagnostic Assessment
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{course.code}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Score: {scoreStats.correct}/{scoreStats.total} (
                {scoreStats.total > 0
                  ? Math.round((scoreStats.correct / scoreStats.total) * 100)
                  : 0}
                %)
              </span>
            </div>
          </div>
        </div>

        {/* Concept Filter selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">Filter Concept:</label>
          <select
            value={selectedConceptFilter}
            onChange={e => {
              setSelectedConceptFilter(e.target.value);
              setCurrentIndex(0);
              setSelectedOption(null);
              setIsSubmitted(false);
              setLastBktUpdate(null);
            }}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer max-w-[220px] truncate"
          >
            <option value="all">All Course Concepts</option>
            {concepts.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!currentQ ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
          <p className="text-xs text-slate-400">
            No questions available for this specific filter.
          </p>
          <button
            onClick={handleGenerateNewQuestions}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Generate Questions with Gemini</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Question Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
            {/* Question Header & Meta */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sky-400 font-semibold">
                  Question {currentIndex + 1} of {activeQuestions.length}
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-300 font-medium">{currentQ.conceptName}</span>
              </div>

              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">
                {currentQ.difficulty}
              </span>
            </div>

            {/* Question Statement */}
            <h3 className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed font-sans">
              {currentQ.questionText}
            </h3>

            {/* Multiple Choice Options */}
            <div className="space-y-2.5 pt-1">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = selectedOption === oIdx;
                let optionStyle =
                  'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300';

                if (isSubmitted) {
                  if (oIdx === currentQ.correctOptionIndex) {
                    optionStyle = 'border-emerald-500/60 bg-emerald-950/30 text-emerald-200';
                  } else if (isSelected) {
                    optionStyle = 'border-rose-500/60 bg-rose-950/30 text-rose-200';
                  } else {
                    optionStyle = 'border-slate-800/50 bg-slate-950/20 text-slate-500 opacity-60';
                  }
                } else if (isSelected) {
                  optionStyle = 'border-sky-500 bg-sky-950/30 text-slate-100 shadow-sm';
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    disabled={isSubmitted}
                    className={`w-full text-left rounded-lg border p-3.5 text-xs font-normal transition-all flex items-start gap-3 cursor-pointer ${optionStyle}`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[11px] font-semibold border ${
                        isSelected
                          ? 'border-sky-400 bg-sky-600 text-white'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="flex-1 leading-relaxed">{opt}</span>

                    {isSubmitted && oIdx === currentQ.correctOptionIndex && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    )}
                    {isSubmitted && isSelected && oIdx !== currentQ.correctOptionIndex && (
                      <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Submission Action */}
            {!isSubmitted ? (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
                >
                  Verify Answer
                </button>
              </div>
            ) : null}
          </div>

          {/* Feedback & BKT Update Banner */}
          {isSubmitted && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 animate-in fade-in duration-200">
              {/* Correctness Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  {selectedOption === currentQ.correctOptionIndex ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-400">
                        Correct Answer
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-rose-400" />
                      <span className="text-sm font-semibold text-rose-400">
                        Incorrect Answer
                      </span>
                    </>
                  )}
                </div>

                {/* BKT Probability Delta Tag */}
                {lastBktUpdate && (
                  <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 px-3 py-1 rounded-md border border-slate-800">
                    <span className="text-slate-400">{lastBktUpdate.conceptName}:</span>
                    <span className="text-slate-300">
                      {Math.round(lastBktUpdate.prevP * 100)}%
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                    <span
                      className={`font-semibold ${
                        lastBktUpdate.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {Math.round(lastBktUpdate.newP * 100)}%
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({lastBktUpdate.delta >= 0 ? `+${Math.round(lastBktUpdate.delta * 100)}` : Math.round(lastBktUpdate.delta * 100)}% BKT)
                    </span>
                  </div>
                )}
              </div>

              {/* Technical Explanation */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Scientific Explanation:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {currentQ.explanation}
                </p>
              </div>

              {/* Source Citation Reference */}
              {currentQ.sourceCitation && (
                <div className="rounded-lg border border-sky-500/20 bg-sky-950/20 p-3 text-xs">
                  <div className="flex items-center justify-between text-sky-400 font-medium mb-1">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{currentQ.sourceCitation.docTitle}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{currentQ.sourceCitation.unitLabel}</span>
                    </div>
                    <button
                      onClick={() =>
                        onInspectSource(
                          currentQ.sourceCitation.docTitle,
                          currentQ.sourceCitation.unitLabel,
                          currentQ.sourceCitation.quote
                        )
                      }
                      className="text-[11px] underline hover:text-sky-300 cursor-pointer"
                    >
                      Inspect Source
                    </button>
                  </div>
                  <p className="text-[11px] text-sky-200 font-mono italic">
                    &ldquo;{currentQ.sourceCitation.quote}&rdquo;
                  </p>
                </div>
              )}

              {/* Next Question / Generator actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleGenerateNewQuestions}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                  )}
                  <span>Generate More Questions (Gemini)</span>
                </button>

                <button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition-colors shadow-sm cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
