'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import {
  Sparkles,
  GraduationCap,
  UserCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  BookOpen,
} from 'lucide-react';

interface RegisterViewProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess?: (role: UserRole) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onNavigateToLogin,
  onRegisterSuccess,
}) => {
  const { register, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Live Password Strength & Criteria Calculation
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]/.test(password);

  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (hasUppercase) score += 20;
  if (hasNumber) score += 20;
  if (hasSpecial) score += 20;
  score = Math.min(100, score);

  let strengthLabel = 'Weak';
  let strengthColor = 'bg-rose-500 text-rose-400';
  let strengthWidth = 'w-1/4';
  if (score >= 80) {
    strengthLabel = 'Strong';
    strengthColor = 'bg-emerald-500 text-emerald-400';
    strengthWidth = 'w-full';
  } else if (score >= 60) {
    strengthLabel = 'Good';
    strengthColor = 'bg-cyan-500 text-cyan-400';
    strengthWidth = 'w-3/4';
  } else if (score >= 40) {
    strengthLabel = 'Fair';
    strengthColor = 'bg-amber-500 text-amber-400';
    strengthWidth = 'w-2/4';
  }

  const isPasswordValid = minLength && hasUppercase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Enter a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      setFormError('Use at least 8 characters, including a number, an uppercase letter, and a symbol.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        role,
      });

      if (res.success) {
        if (onRegisterSuccess) {
          onRegisterSuccess(role);
        }
      } else {
        setFormError(res.error || 'Failed to create account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-8 bg-slate-950 font-sans selection:bg-cyan-500/30">
      {/* Background ambient accents */}
      <div className="fixed inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            StudyForge <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">AI</span>
          </span>
        </div>

        {/* Elevated Register Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-9 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Create your learning workspace</h1>
            <p className="mt-1 text-sm text-slate-400">
              Join StudyForge AI to access source-grounded tutoring and adaptive assessments.
            </p>
          </div>

          {/* Error Banner */}
          {formError && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300">
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{formError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Alex Chen or Dr. Sarah Lin"
                required
                className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>

            {/* Role Selector Cards */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Account role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex flex-col items-start p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                    role === 'student'
                      ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/30'
                      : 'border-slate-800 bg-slate-800/30 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className={`h-4 w-4 ${role === 'student' ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className={`text-xs font-bold ${role === 'student' ? 'text-white' : 'text-slate-300'}`}>
                      Student
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Learn with AI tutor, take adaptive quizzes &amp; track concept mastery.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('instructor')}
                  className={`flex flex-col items-start p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                    role === 'instructor'
                      ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                      : 'border-slate-800 bg-slate-800/30 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck className={`h-4 w-4 ${role === 'instructor' ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className={`text-xs font-bold ${role === 'instructor' ? 'text-white' : 'text-slate-300'}`}>
                      Instructor / Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Create courses, ingest multimodal materials &amp; inspect RAG evals.
                  </p>
                </button>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
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

              {/* Live Password Strength Meter */}
              {password.length > 0 && (
                <div className="mt-2.5 space-y-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Password strength:</span>
                    <span className={`font-semibold ${strengthColor.split(' ')[1]}`}>
                      {strengthLabel} ({score}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strengthColor.split(' ')[0]} ${strengthWidth}`}
                    />
                  </div>

                  {/* Requirements checklist */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${minLength ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {minLength ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {hasUppercase ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>1 uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {hasNumber ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>1 number</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {hasSpecial ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>1 special symbol</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-0.5"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Terms text per Requirement 4 */}
            <div className="rounded-xl p-3 bg-slate-800/30 border border-slate-700/40 text-[11px] text-slate-400 leading-relaxed">
              By creating an account, you agree to use uploaded course material responsibly and keep your credentials secure.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating your account...</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Back to sign in */}
            <div className="pt-2 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
