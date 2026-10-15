'use client';

import React from 'react';
import { Course } from '@/lib/types';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  FileBox,
  BarChart3,
  BookOpen,
  CheckCircle2,
  PlusCircle,
  Upload,
} from 'lucide-react';

interface LandingViewProps {
  courses: Course[];
  onSelectCourseAndEnter: (courseId: string, targetScreen: 'dashboard' | 'tutor' | 'assessment') => void;
  onEnterDashboard: () => void;
  onCreateCourse?: () => void;
  onOpenUpload?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  courses,
  onSelectCourseAndEnter,
  onEnterDashboard,
  onCreateCourse,
  onOpenUpload,
}) => {
  const hasCourses = courses && courses.length > 0;

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[1000px] rounded-full bg-gradient-to-b from-indigo-500/15 via-cyan-500/10 to-transparent blur-3xl" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#070b14]/70 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              StudyForge AI
            </span>
            <span className="hidden sm:inline-block ml-2 text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
              Source-Grounded Tutoring
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onEnterDashboard}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-cyan-500 transition-all cursor-pointer"
          >
            <span>{hasCourses ? 'Open Workspace' : 'Get Started'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-5xl px-6 pt-16 pb-20 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 dark:border-indigo-500/30 dark:bg-indigo-950/40 px-3.5 py-1 text-xs font-medium text-indigo-700 dark:text-cyan-300 mb-6 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-cyan-400" />
          <span>Upload-First · Strict Citations · Bayesian Knowledge Tracing</span>
        </div>

        {/* Hero headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Source-Grounded AI Tutoring, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-600 via-cyan-500 to-violet-500 bg-clip-text text-transparent">
            Mathematically Adaptive to Your Materials
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
          Upload your textbook, lecture slide deck, or course notes. StudyForge AI indexes your files, extracts key concepts, generates diagnostic quizzes, and answers questions strictly citing exact pages and slides.
        </p>

        {/* Hero CTA buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          {hasCourses ? (
            <button
              onClick={onEnterDashboard}
              className="inline-flex items-center gap-2.5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <span>Continue Learning in {courses[0].code}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <>
              {onCreateCourse && (
                <button
                  onClick={onCreateCourse}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-all cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Course</span>
                </button>
              )}
              {onOpenUpload && (
                <button
                  onClick={onOpenUpload}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer"
                >
                  <Upload className="h-4 w-4 text-cyan-500" />
                  <span>Upload Course Material</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Core Value Pillar Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Strict Source Grounding
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Every answer is verified against your uploaded documents. If an answer is not covered, the tutor informs you rather than hallucinating.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-4">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Bayesian Knowledge Tracing
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Your cognitive mastery is tracked mathematically across each concept using standard BKT posterior update formulas.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
              <FileBox className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Multimodal Ingestion
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload PDF textbooks, lecture slides (PPTX), and video transcripts with preserved locators (page numbers, slide titles, timestamps).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
