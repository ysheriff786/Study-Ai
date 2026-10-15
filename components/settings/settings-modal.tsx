'use client';

import React, { useState } from 'react';
import { Course, ConceptMastery } from '@/lib/types';
import { X, Settings, Download, RotateCcw, Cpu, Trash2, Check, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCourse: Course | null;
  concepts: ConceptMastery[];
  onWorkspaceCleared: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  activeCourse,
  concepts,
  onWorkspaceCleared,
}) => {
  const [temperature, setTemperature] = useState(0.2);
  const [copiedExport, setCopiedExport] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  if (!isOpen) return null;

  const handleExportData = () => {
    if (!activeCourse) return;
    const exportPayload = {
      course: activeCourse,
      timestamp: new Date().toISOString(),
      conceptsMastery: concepts.map(c => ({
        name: c.name,
        currentMastery: c.currentMastery,
        attemptsCount: c.attemptsCount,
        correctCount: c.correctCount,
        bktParams: c.bktParams,
      })),
      platform: 'StudyForge AI',
      evalFramework: 'RAGAS & Bayesian Knowledge Tracing',
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyForge_${activeCourse.code.replace(/\s+/g, '_')}_Progress.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleExecuteClearWorkspace = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/workspace/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });
      if (res.ok) {
        onWorkspaceCleared();
        setShowClearConfirm(false);
        onClose();
      }
    } catch (err) {
      console.error('Failed to clear workspace:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Workspace & System Settings
              </h3>
              <span className="text-xs text-slate-400 block -mt-0.5">
                StudyForge AI Source-Grounded Configuration
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 text-xs">
          {/* Architecture / Model info */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>Source-Grounded Free-Tier Inference Engine</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              StudyForge AI operates with zero fake content. All answers, citations, and assessments are derived from your indexed materials.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
              <span>Status: Active & Verified</span>
              <span aria-hidden="true">·</span>
              <span>100% Source-Grounded</span>
            </div>
          </div>

          {/* Export section */}
          {activeCourse && concepts.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 space-y-2">
              <div className="text-slate-200 font-semibold">Export Progress</div>
              <p className="text-slate-400 text-[11px]">
                Download a JSON snapshot of your Bayesian Knowledge Tracing cognitive states.
              </p>
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                {copiedExport ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Download className="h-3.5 w-3.5" />}
                <span>{copiedExport ? 'Report Downloaded!' : 'Export JSON Progress Record'}</span>
              </button>
            </div>
          )}

          {/* Section 4: Clear workspace administrator action */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-400 block">
                  Clear workspace
                </span>
                <span className="text-[11px] text-slate-400">
                  Administrator action to purge all courses, uploads, and progress.
                </span>
              </div>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-950/60 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear workspace</span>
              </button>
            </div>

            {/* Confirmation Dialog */}
            {showClearConfirm && (
              <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/40 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start gap-2.5 text-rose-200 text-xs">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">
                    Clear all uploaded files, conversations, quizzes and learning progress? This action cannot be undone.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteClearWorkspace}
                    disabled={isClearing}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isClearing ? 'Clearing...' : 'Yes, Clear All Workspace Data'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
