'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Course } from '@/lib/types';
import {
  UserCheck,
  BookOpen,
  Calendar,
  Lock,
  Users,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface InstructorOnboardingModalProps {
  isOpen: boolean;
  onFinish: (newCourse?: Course) => void;
}

export const InstructorOnboardingModal: React.FC<InstructorOnboardingModalProps> = ({
  isOpen,
  onFinish,
}) => {
  const { user, updateProfile } = useAuth();

  const [courseName, setCourseName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [examDate, setExamDate] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'shared'>('private');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await updateProfile({ onboardingCompleted: true });
      onFinish();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!courseName.trim() || !subject.trim()) {
      setFormError('Course name and subject are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Mark onboarding completed in user profile
      await updateProfile({ onboardingCompleted: true });

      // 2. Generate course code
      const words = courseName.trim().split(/\s+/);
      const code = (words.length > 1 ? words.map(w => w[0]).join('') : courseName.slice(0, 3)).toUpperCase() + ' 101';

      // 3. Create course in backend
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: courseName.trim(),
          code,
          subject: subject.trim(),
          description: description.trim() || `Course curriculum for ${subject.trim()}.`,
          iconName: 'BookOpen',
          ownerId: user?.id,
          examDate: examDate || null,
          visibility,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create initial course.');
      }

      const createdCourse = await res.json();
      onFinish(createdCourse);
    } catch {
      setFormError('Failed to create course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn text-slate-100 font-sans">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl relative overflow-hidden">
        {/* Subtle glowing header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-400" />

        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">
              Instructor Onboarding
            </span>
            <h2 className="text-lg font-bold text-white">Set up your first course</h2>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Create an initial academic workspace where you can upload textbooks, lecture slides, and notes for student tutoring and benchmark evaluation.
        </p>

        {formError && (
          <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Course Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g., Operating Systems &amp; Concurrency"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Subject <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Computer Science"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Optional Exam Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Course Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief summary of the course scope and syllabus..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Course Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  visibility === 'private'
                    ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}
              >
                <Lock className={`h-4 w-4 ${visibility === 'private' ? 'text-indigo-400' : 'text-slate-400'}`} />
                <div>
                  <div className={`text-xs font-bold ${visibility === 'private' ? 'text-white' : 'text-slate-300'}`}>Private</div>
                  <div className="text-[10px] text-slate-400">Only you have access</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('shared')}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  visibility === 'shared'
                    ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}
              >
                <Users className={`h-4 w-4 ${visibility === 'shared' ? 'text-indigo-400' : 'text-slate-400'}`} />
                <div>
                  <div className={`text-xs font-bold ${visibility === 'shared' ? 'text-white' : 'text-slate-300'}`}>Shared by Invite</div>
                  <div className="text-[10px] text-slate-400">Permit student enrollment</div>
                </div>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSkip}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Skip and create later
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-600 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-cyan-500 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating course...</span>
                </>
              ) : (
                <>
                  <span>Create Course &amp; Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
