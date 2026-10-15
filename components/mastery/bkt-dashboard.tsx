'use client';

import React, { useState } from 'react';
import { ConceptMastery, Course } from '@/lib/types';
import {
  calculateBKTUpdate,
  computeOverallMastery,
  getMasteryLevel,
  simulateBKTTurns,
} from '@/lib/bkt';
import {
  BrainCircuit,
  Sliders,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  TrendingUp,
  History,
  Target,
} from 'lucide-react';

interface BKTDashboardProps {
  course: Course;
  concepts: ConceptMastery[];
  onStartQuizForConcept: (conceptId: string) => void;
  onUpdateConceptMastery: (conceptId: string, isCorrect: boolean) => void;
}

export const BKTDashboard: React.FC<BKTDashboardProps> = ({
  course,
  concepts,
  onStartQuizForConcept,
  onUpdateConceptMastery,
}) => {
  const [selectedConcept, setSelectedConcept] = useState<ConceptMastery>(concepts[0] || null);
  const [showSimulator, setShowSimulator] = useState(false);

  // Simulator State
  const [simInitialP, setSimInitialP] = useState(0.20);
  const [simPT, setSimPT] = useState(0.15);
  const [simPS, setSimPS] = useState(0.10);
  const [simPG, setSimPG] = useState(0.25);
  const [simResponses, setSimResponses] = useState<boolean[]>([true, true, false, true]);

  const overall = computeOverallMastery(concepts);

  // Compute live simulator progression
  const simTrajectory = simulateBKTTurns(simInitialP, simResponses, {
    pL0: simInitialP,
    pT: simPT,
    pS: simPS,
    pG: simPG,
  });

  const latestSimMastery = simTrajectory[simTrajectory.length - 1]?.mastery || simInitialP;

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full px-4 py-6 space-y-6 overflow-y-auto">
      {/* Header Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Aggregate Mastery */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Overall Course Mastery</span>
            <BrainCircuit className="h-4 w-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-100">
              {Math.round(overall.averageMastery * 100)}%
            </span>
            <span className="text-xs text-slate-400">Mean P(L)</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round(overall.averageMastery * 100)}%` }}
            />
          </div>
        </div>

        {/* Mastered Concepts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Mastered Concepts</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
              {overall.masteredCount}
            </span>
            <span className="text-xs text-slate-400">/ {concepts.length} total</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            P(L) ≥ 0.85 threshold
          </span>
        </div>

        {/* Developing Concepts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Developing / Active</span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-400">
              {overall.developingCount}
            </span>
            <span className="text-xs text-slate-400">In reinforcement</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            0.40 ≤ P(L) &lt; 0.85
          </span>
        </div>

        {/* Knowledge Gaps */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Critical Gaps (Novice)</span>
            <Target className="h-4 w-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-rose-400">
              {overall.strugglingCount}
            </span>
            <span className="text-xs text-slate-400">High priority</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            P(L) &lt; 0.40 drill target
          </span>
        </div>
      </div>

      {/* Simulator Toggle Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <Sliders className="h-4 w-4 text-sky-400" />
          <div>
            <span className="text-xs font-semibold text-slate-200 block">
              Bayesian Knowledge Tracing (BKT) Math Engine
            </span>
            <span className="text-[11px] text-slate-400 block">
              Corbett & Anderson standard cognitive modeling with live slip P(S) and guess P(G) dynamics
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowSimulator(prev => !prev)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
        >
          {showSimulator ? 'Hide BKT Sandbox' : 'Open BKT Sandbox Simulator'}
        </button>
      </div>

      {/* Interactive BKT Simulator (Collapsible) */}
      {showSimulator && (
        <div className="rounded-xl border border-sky-500/30 bg-slate-900/90 p-5 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Interactive BKT Sandbox</span>
                <span className="text-xs font-mono text-sky-400 font-normal">
                  P(Lt) → {Math.round(latestSimMastery * 100)}%
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate how Bayesian probabilities evolve step-by-step as student attempts drill questions.
              </p>
            </div>
            <button
              onClick={() => setSimResponses([])}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Turns</span>
            </button>
          </div>

          {/* Parameter Sliders */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">
                Prior P(L₀): <span className="font-mono text-slate-200 font-semibold">{simInitialP.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.01"
                value={simInitialP}
                onChange={e => setSimInitialP(parseFloat(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">
                Transition P(T): <span className="font-mono text-slate-200 font-semibold">{simPT.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.05"
                max="0.30"
                step="0.01"
                value={simPT}
                onChange={e => setSimPT(parseFloat(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">
                Slip P(S): <span className="font-mono text-slate-200 font-semibold">{simPS.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.02"
                max="0.25"
                step="0.01"
                value={simPS}
                onChange={e => setSimPS(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">
                Guess P(G): <span className="font-mono text-slate-200 font-semibold">{simPG.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.10"
                max="0.40"
                step="0.01"
                value={simPG}
                onChange={e => setSimPG(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          {/* Live Responses History & Action Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Simulation Sequence ({simResponses.length} attempts):
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSimResponses(prev => [...prev, true])}
                  className="flex items-center gap-1 rounded bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 text-xs hover:bg-emerald-600/40 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Correct (+)</span>
                </button>
                <button
                  onClick={() => setSimResponses(prev => [...prev, false])}
                  className="flex items-center gap-1 rounded bg-rose-600/20 border border-rose-500/40 text-rose-300 px-2.5 py-1 text-xs hover:bg-rose-600/40 transition-colors"
                >
                  <Minus className="h-3 w-3" />
                  <span>Incorrect (-)</span>
                </button>
              </div>
            </div>

            {/* Trajectory Step Visualizer */}
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {simTrajectory.map((step, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-800 bg-slate-950/80 min-w-[72px] text-center"
                >
                  <span className="text-[10px] text-slate-500">Step {step.step}</span>
                  <span className="text-xs font-bold font-mono text-slate-200 my-0.5">
                    {Math.round(step.mastery * 100)}%
                  </span>
                  {idx > 0 && (
                    <span
                      className={`text-[10px] font-mono ${
                        step.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {step.isCorrect ? '✓ Correct' : '✗ Miss'}
                    </span>
                  )}
                  {idx === 0 && <span className="text-[10px] text-slate-500">Prior</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Concept Matrix List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tracked Concepts for {course.code}
          </h3>
          <span className="text-xs text-slate-500">
            Select a concept to drill or simulate updates
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {concepts.map(concept => {
            const masteryInfo = getMasteryLevel(concept.currentMastery);
            const isSelected = selectedConcept?.id === concept.id;

            return (
              <div
                key={concept.id}
                onClick={() => setSelectedConcept(concept)}
                className={`flex flex-col justify-between rounded-xl border p-4.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-500/50 bg-slate-900/90 shadow-md'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">
                        {concept.topicName}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-100 mt-0.5">
                        {concept.name}
                      </h4>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${masteryInfo.badgeClass}`}
                    >
                      {masteryInfo.level}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {concept.description}
                  </p>

                  {/* Mastery Progress Bar */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">Knowledge P(Lt)</span>
                      <span className={`font-semibold tabular-nums ${masteryInfo.colorClass}`}>
                        {Math.round(concept.currentMastery * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          concept.currentMastery >= 0.85
                            ? 'bg-emerald-500'
                            : concept.currentMastery >= 0.65
                            ? 'bg-sky-500'
                            : concept.currentMastery >= 0.40
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.round(concept.currentMastery * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* BKT Params footer */}
                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/80">
                    <span>P(L₀)={concept.bktParams.pL0}</span>
                    <span aria-hidden="true">·</span>
                    <span>P(T)={concept.bktParams.pT}</span>
                    <span aria-hidden="true">·</span>
                    <span>P(S)={concept.bktParams.pS}</span>
                    <span aria-hidden="true">·</span>
                    <span>P(G)={concept.bktParams.pG}</span>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400">
                    <span className="font-mono tabular-nums text-slate-300 font-medium">
                      {concept.attemptsCount}
                    </span>{' '}
                    attempts ({concept.correctCount} correct)
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onStartQuizForConcept(concept.id);
                    }}
                    className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium"
                  >
                    <span>Test Concept</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
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
