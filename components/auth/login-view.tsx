'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Brain,
  FileCheck2,
  Loader2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

interface LoginViewProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onLoginSuccess?: (role: 'student' | 'instructor') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onLoginSuccess,
}) => {
  const { login, demoLogin, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState<'student' | 'instructor' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email.trim() || !password) {
      setFormError('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email, password, rememberMe);
      if (res.success) {
        if (onLoginSuccess && res.redirectTo) {
          const role = res.redirectTo.includes('/admin') ? 'instructor' : 'student';
          onLoginSuccess(role);
        }
      } else {
        setFormError(res.error || 'Incorrect email or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = async (role: 'student' | 'instructor') => {
    setFormError(null);
    clearError();
    setDemoSubmitting(role);
    try {
      const res = await demoLogin(role);
      if (res.success && onLoginSuccess) {
        onLoginSuccess(role);
      } else if (!res.success) {
        setFormError(res.error || 'Could not connect to demo account.');
      }
    } finally {
      setDemoSubmitting(null);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-900 text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* ======================================================== */}
      {/* LEFT SIDE: Deep Navy/Indigo Gradient with Highlights     */}
      {/* ======================================================== */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#060b18] via-[#0a122c] to-[#120f30] border-r border-slate-800/60 relative overflow-hidden">
        {/* Decorative background grid and glowing orbs */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              StudyForge <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">AI</span>
            </h1>
            <p className="text-xs text-slate-400">Verifiable Academic Intelligence</p>
          </div>
        </div>

        {/* Center: Educational Illustration / Knowledge Graph Card */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6 backdrop-blur-sm">
            <Brain className="h-3.5 w-3.5 text-indigo-400" />
            <span>Next-Generation Adaptive Learning Engine</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Learn from your material.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300">
              Master what matters.
            </span>
          </h2>

          <p className="mt-4 text-sm text-slate-300 max-w-lg leading-relaxed">
            A source-grounded AI tutor that turns your textbooks, slides and lectures into a personalized learning system with exact citations and Bayesian knowledge tracing.
          </p>

          {/* Abstract Knowledge Graph Graphic */}
          <div className="mt-8 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md relative max-w-lg shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
                <FileCheck2 className="h-3.5 w-3.5" /> Source-Grounded Knowledge Graph
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                100% Grounded
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-medium text-slate-200">Process Synchronization & Mutexes</span>
                </div>
                <span className="font-mono text-[11px] text-cyan-300">Slide 14 · p(L)=0.88</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  <span className="font-medium text-slate-200">Deadlock Prevention & Banker&apos;s Algorithm</span>
                </div>
                <span className="font-mono text-[11px] text-indigo-300">Page 42 · p(L)=0.64</span>
              </div>
            </div>
          </div>

          {/* Small Feature Highlights */}
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <ShieldCheck className="h-4 w-4 text-cyan-400 mb-1.5" />
              <h3 className="text-xs font-semibold text-slate-200">Source-Cited Tutoring</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Every response linked to exact page or slide.</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <Brain className="h-4 w-4 text-indigo-400 mb-1.5" />
              <h3 className="text-xs font-semibold text-slate-200">Adaptive Assessments</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Diagnostic quizzes that target weak concepts.</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <GraduationCap className="h-4 w-4 text-emerald-400 mb-1.5" />
              <h3 className="text-xs font-semibold text-slate-200">Mastery Tracking</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Bayesian model tracing concept retention.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
          <span>Enterprise B2B Academic Platform</span>
          <span>Argon2 &amp; JWT Protected</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT SIDE: Elevated Authentication Card                 */}
      {/* ======================================================== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-950 lg:bg-[#070b14]">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">StudyForge AI</span>
              <p className="text-xs text-slate-400">Verifiable Academic Intelligence</p>
            </div>
          </div>

          {/* Elevated Auth Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
            {/* Card Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-medium mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                <span>StudyForge Account Access</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-400">Continue your learning journey.</p>
            </div>

            {/* Error Banner */}
            {(formError || error) && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{formError || error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="name@university.edu"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={onNavigateToForgotPassword}
                    className="text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500/20 cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-400 cursor-pointer">
                  Remember me on this browser for 30 days
                </label>
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting || demoSubmitting !== null}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-3 text-slate-500 font-mono">or explore demo workspace</span>
              </div>
            </div>

            {/* Seeded Demo Buttons (Clearly labeled per specifications) */}
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={isSubmitting || demoSubmitting !== null}
                onClick={() => handleDemoClick('student')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600 text-xs text-slate-200 transition-all cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20">
                    <GraduationCap className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-200">Continue as Student</div>
                    <div className="text-[10px] text-slate-400">Alex Chen · CS 100 Course Workspace</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  {demoSubmitting === 'student' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>Demo Account →</>
                  )}
                </div>
              </button>

              <button
                type="button"
                disabled={isSubmitting || demoSubmitting !== null}
                onClick={() => handleDemoClick('instructor')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600 text-xs text-slate-200 transition-all cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20">
                    <UserCheck className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-200">Continue as Instructor</div>
                    <div className="text-[10px] text-slate-400">Prof. Sarah Lin · Course Ingestion &amp; Analytics</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  {demoSubmitting === 'instructor' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>Demo Account →</>
                  )}
                </div>
              </button>
            </div>

            {/* Bottom: Link to registration */}
            <div className="mt-6 text-center text-xs text-slate-400">
              New to StudyForge?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
              >
                Create an account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
