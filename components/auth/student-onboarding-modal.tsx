'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ExplanationStyle } from '@/lib/types';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Trophy,
  Award,
  Compass,
  Upload,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react';

interface StudentOnboardingModalProps {
  isOpen: boolean;
  onFinish: (triggerUpload: boolean) => void;
}

export const StudentOnboardingModal: React.FC<StudentOnboardingModalProps> = ({
  isOpen,
  onFinish,
}) => {
  const { user, updateProfile } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [goal, setGoal] = useState<string>('University course');
  const [subject, setSubject] = useState<string>('');
  const [materialOption, setMaterialOption] = useState<'now' | 'later'>('now');
  const [style, setStyle] = useState<ExplanationStyle>('detailed');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        preferredExplanationStyle: style,
        onboardingCompleted: true,
      });
      onFinish(materialOption === 'now');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn text-slate-100 font-sans">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl relative overflow-hidden">
        {/* Subtle glowing header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-400" />

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                Student Setup · Step {step} of 4
              </span>
              <h2 className="text-base font-bold text-white">Personalize Your Workspace</h2>
            </div>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-all ${
                  i <= step ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* STEP 1: What are you preparing for?                      */}
        {/* ======================================================== */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">What are you preparing for?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Help StudyForge tune citation depth and assessment difficulty for your goals.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { title: 'University course', icon: BookOpen, desc: 'College or graduate curriculum' },
                { title: 'Competitive exam', icon: Trophy, desc: 'GRE, MCAT, USMLE, Bar, etc.' },
                { title: 'Certification', icon: Award, desc: 'Professional tech or industry cert' },
                { title: 'Personal learning', icon: Compass, desc: 'Self-paced deep subject mastery' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = goal === item.title;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setGoal(item.title)}
                    className={`flex flex-col items-start p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/30'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mb-2 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white">{item.title}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: What would you like to study?                    */}
        {/* ======================================================== */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">What would you like to study?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your course, topic, or subject area.
              </p>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Subject or Course Title
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Operating Systems, Organic Chemistry, Microeconomics"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                autoFocus
              />
              <p className="mt-2 text-[11px] text-slate-400">
                You can create additional course workspaces and upload specific textbooks or notes at any time.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: Do you have course material ready?               */}
        {/* ======================================================== */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Do you have course material ready?</h3>
              <p className="text-xs text-slate-400 mt-1">
                StudyForge grounds all explanations and assessments in your uploaded documents.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMaterialOption('now')}
                className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left cursor-pointer ${
                  materialOption === 'now'
                    ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2">
                  <Upload className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-white">Upload now</span>
                <span className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Upload a PDF, slides or notes now to begin tutoring immediately.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMaterialOption('later')}
                className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left cursor-pointer ${
                  materialOption === 'later'
                    ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-2">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-white">Upload later</span>
                <span className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Start with a clean dashboard and add materials whenever you are ready.
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: What explanation style do you prefer?            */}
        {/* ======================================================== */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">What explanation style do you prefer?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your AI tutor will personalize answer depth, examples, and formatting to this preference.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {[
                { id: 'simple' as ExplanationStyle, label: 'Simple', desc: 'Clear, concise breakdowns with plain terminology.' },
                { id: 'detailed' as ExplanationStyle, label: 'Detailed', desc: 'In-depth rigorous explanations with citations and underlying mechanisms.' },
                { id: 'exam-focused' as ExplanationStyle, label: 'Exam-focused', desc: 'High-yield formulas, key mnemonics, and common exam traps.' },
                { id: 'example-based' as ExplanationStyle, label: 'Example-based', desc: 'Practical step-by-step case studies and concrete code/problem walk-throughs.' },
              ].map((opt) => {
                const isSelected = style === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStyle(opt.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/30'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleComplete}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-xs font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-indigo-500 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving preferences...</span>
                </>
              ) : (
                <>
                  <span>Enter Dashboard</span>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
