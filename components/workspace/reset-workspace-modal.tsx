'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';

interface ResetWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetComplete: () => void;
}

export const ResetWorkspaceModal: React.FC<ResetWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onResetComplete,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleReset = async () => {
    setIsResetting(true);
    setError('');

    try {
      const res = await fetch('/api/workspace/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });

      if (!res.ok) {
        throw new Error('Reset request failed');
      }

      onResetComplete();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to reset workspace');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-[#0b101e] p-6 shadow-2xl transition-all">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reset Workspace to Clean State
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Permanently clear courses, documents & learning records
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          <strong>Warning:</strong> This action permanently deletes all uploaded textbooks, slide decks, video transcripts, extracted chunks, BKT concepts, and chat histories. It returns StudyForge AI to a pristine upload-first empty state.
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isResetting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Confirm Reset</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
