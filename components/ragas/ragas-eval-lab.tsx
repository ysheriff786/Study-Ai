'use client';

import React, { useState } from 'react';
import { Course, SourceChunk, RAGASEvalTestCase } from '@/lib/types';
import {
  BarChart3,
  ShieldCheck,
  Target,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  FileCheck2,
  AlertTriangle,
  Loader2,
  Info,
} from 'lucide-react';

interface RAGASEvalLabProps {
  course: Course | null;
  chunks: SourceChunk[];
  benchmarks: RAGASEvalTestCase[];
  onAddBenchmarkResult: (result: RAGASEvalTestCase) => void;
}

export const RAGASEvalLab: React.FC<RAGASEvalLabProps> = ({
  course,
  chunks,
  benchmarks,
  onAddBenchmarkResult,
}) => {
  const [sessionEvaluations, setSessionEvaluations] = useState<RAGASEvalTestCase[]>([]);
  const testCases = [...sessionEvaluations, ...(benchmarks || [])];
  const [activeQuery, setActiveQuery] = useState(
    'What conditions are required for a system deadlock to happen according to Coffman?'
  );
  const [activeConcept, setActiveConcept] = useState('Coffman Conditions');
  const [isRunningEval, setIsRunningEval] = useState(false);
  const [selectedEvalResult, setSelectedEvalResult] = useState<RAGASEvalTestCase | null>(null);
  const lastEvalResult = selectedEvalResult || testCases[0] || null;

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
        <BarChart3 className="h-12 w-12 text-slate-400 mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          No active course selected
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Create or select a course to evaluate retrieval faithfulness and answer relevance.
        </p>
      </div>
    );
  }

  // Compute aggregate averages
  const avgFaithfulness =
    testCases.reduce((acc, t) => acc + t.faithfulnessScore, 0) / (testCases.length || 1);
  const avgRelevance =
    testCases.reduce((acc, t) => acc + t.answerRelevanceScore, 0) / (testCases.length || 1);
  const avgPrecision =
    testCases.reduce((acc, t) => acc + t.contextPrecisionScore, 0) / (testCases.length || 1);
  const avgRecall =
    testCases.reduce((acc, t) => acc + t.contextRecallScore, 0) / (testCases.length || 1);

  const presetQueries = [
    {
      query: 'What conditions are required for a system deadlock to happen according to Coffman?',
      concept: 'Coffman Conditions',
    },
    {
      query: 'How does Banker\'s Algorithm verify if a state is safe before resource allocation?',
      concept: 'Banker\'s Algorithm Safety',
    },
    {
      query: 'Why are vector clocks strictly preferred over scalar clocks for detecting causal concurrency?',
      concept: 'Vector Clocks & Causality',
    },
    {
      query: 'How does Raft elect a new leader and prevent split vote deadlocks?',
      concept: 'Raft Leader Election',
    },
  ];

  const handleRunEvaluation = async () => {
    if (!activeQuery.trim() || isRunningEval) return;
    setIsRunningEval(true);

    try {
      const relevantChunks = chunks
        .filter(c =>
          c.content.toLowerCase().includes(activeQuery.toLowerCase().split(' ')[0] || '') ||
          c.concepts.some(cp => cp.toLowerCase().includes(activeConcept.toLowerCase()))
        )
        .slice(0, 3);

      const res = await fetch('/api/gemini/ragas-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: activeQuery,
          expectedConcept: activeConcept,
          retrievedChunks: relevantChunks.length > 0 ? relevantChunks : chunks.slice(0, 3),
        }),
      });

      if (!res.ok) throw new Error('Evaluation request failed');
      const data: RAGASEvalTestCase = await res.json();

      setSelectedEvalResult(data);
      setSessionEvaluations(prev => [data, ...prev]);
      onAddBenchmarkResult(data);
    } catch (err) {
      console.error('RAGAS evaluation error:', err);
    } finally {
      setIsRunningEval(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full px-4 py-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <span>RAGAS Automated Evaluation Laboratory</span>
          <span className="text-xs font-mono text-sky-400 font-normal">
            Retrieval Augmented Generation Assessment System
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Standardized LLM-as-a-judge evaluation measuring citation faithfulness, relevance, context precision, and recall.
        </p>
      </div>

      {/* Aggregate KPI Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Faithfulness */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Faithfulness (Groundedness)</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
              {Math.round(avgFaithfulness * 100)}%
            </span>
            <span className="text-xs text-slate-500">Benchmark: 90%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Proportion of answer claims directly verified in source chunks.
          </p>
        </div>

        {/* Answer Relevance */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Answer Relevance</span>
            <Target className="h-4 w-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-sky-400">
              {Math.round(avgRelevance * 100)}%
            </span>
            <span className="text-xs text-slate-500">Benchmark: 88%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Direct semantic alignment with user prompt without fluff.
          </p>
        </div>

        {/* Context Precision */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Context Precision</span>
            <FileCheck2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-indigo-400">
              {Math.round(avgPrecision * 100)}%
            </span>
            <span className="text-xs text-slate-500">Benchmark: 85%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Signal-to-noise ratio in top-k vector retrieval rankings.
          </p>
        </div>

        {/* Context Recall */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Context Recall</span>
            <BarChart3 className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-400">
              {Math.round(avgRecall * 100)}%
            </span>
            <span className="text-xs text-slate-500">Benchmark: 85%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Coverage of ground-truth syllabus facts in retrieved chunks.
          </p>
        </div>
      </div>

      {/* Live Evaluator Playground */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Run Live RAGAS Evaluation Test
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Powered by Gemini Judge (`gemini-3.8-flash`)
          </span>
        </div>

        {/* Preset queries */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
            Test Preset Query:
          </span>
          <div className="flex flex-wrap gap-2">
            {presetQueries.map((pq, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveQuery(pq.query);
                  setActiveConcept(pq.concept);
                }}
                className={`rounded-md border px-2.5 py-1 text-[11px] transition-colors text-left ${
                  activeQuery === pq.query
                    ? 'border-sky-500 bg-sky-950/40 text-sky-200'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {pq.concept}
              </button>
            ))}
          </div>
        </div>

        {/* Query Input & Trigger */}
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Evaluation Query Prompt
            </label>
            <input
              type="text"
              value={activeQuery}
              onChange={e => setActiveQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Testing against <span className="text-slate-300 font-mono">{chunks.length}</span> ingested chunks in {course.code}
            </div>

            <button
              onClick={handleRunEvaluation}
              disabled={isRunningEval || !activeQuery.trim()}
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
            >
              {isRunningEval ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Evaluating with Judge...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Run RAGAS Evaluation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Evaluation Result Display */}
        {lastEvalResult && (
          <div className="rounded-xl border border-sky-500/30 bg-slate-950/70 p-4 space-y-3.5 animate-in fade-in duration-200 mt-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
              <span className="font-semibold text-slate-200">
                Evaluation Output & Judge Audit
              </span>
              <span className="font-mono text-emerald-400">
                {lastEvalResult.citationsCount} verified citations retrieved
              </span>
            </div>

            {/* Generated Answer */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Generated Answer:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                {lastEvalResult.generatedAnswer}
              </p>
            </div>

            {/* 4 Scores Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
              <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60">
                <span className="text-[10px] text-slate-500 block">Faithfulness</span>
                <span className="text-base font-bold text-emerald-400">
                  {Math.round(lastEvalResult.faithfulnessScore * 100)}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60">
                <span className="text-[10px] text-slate-500 block">Relevance</span>
                <span className="text-base font-bold text-sky-400">
                  {Math.round(lastEvalResult.answerRelevanceScore * 100)}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60">
                <span className="text-[10px] text-slate-500 block">Context Precision</span>
                <span className="text-base font-bold text-indigo-400">
                  {Math.round(lastEvalResult.contextPrecisionScore * 100)}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60">
                <span className="text-[10px] text-slate-500 block">Context Recall</span>
                <span className="text-base font-bold text-amber-400">
                  {Math.round(lastEvalResult.contextRecallScore * 100)}%
                </span>
              </div>
            </div>

            {/* Judge reasoning */}
            <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-300">Judge Notes:</strong>{' '}
                {lastEvalResult.evaluationNotes}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Benchmark History Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Historical Benchmark Evaluation Suite ({testCases.length})
        </h3>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Evaluation Query</th>
                <th className="px-4 py-3">Ground Truth Concept</th>
                <th className="px-4 py-3 text-right">Faithfulness</th>
                <th className="px-4 py-3 text-right">Relevance</th>
                <th className="px-4 py-3 text-right">Precision</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {testCases.map((tc, idx) => (
                <tr
                  key={tc.id || idx}
                  onClick={() => setSelectedEvalResult(tc)}
                  className="hover:bg-slate-850/60 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3 max-w-xs truncate text-slate-200 font-medium">
                    {tc.query}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700">
                      {tc.groundTruthConcept}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-400 font-semibold">
                    {Math.round(tc.faithfulnessScore * 100)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-sky-400 font-semibold">
                    {Math.round(tc.answerRelevanceScore * 100)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-indigo-400 font-semibold">
                    {Math.round(tc.contextPrecisionScore * 100)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sky-400 group-hover:underline text-[11px]">
                      View
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
