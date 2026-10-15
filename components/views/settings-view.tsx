'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ExplanationStyle } from '@/lib/types';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  GraduationCap,
  UserCheck,
  RotateCcw,
  Clock,
  Calendar,
} from 'lucide-react';

interface SettingsViewProps {
  onOpenResetWorkspace?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenResetWorkspace }) => {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [style, setStyle] = useState<ExplanationStyle>(
    user?.preferredExplanationStyle || 'detailed'
  );
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user) return null;

  const isInstructor = user.role === 'instructor';

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    setIsUpdatingProfile(true);

    try {
      const res = await updateProfile({
        fullName: fullName.trim(),
        preferredExplanationStyle: style,
      });

      if (res.success) {
        setProfileSuccess('Profile preferences saved successfully.');
      } else {
        setProfileError(res.error || 'Failed to update profile.');
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setPasswordSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.error || 'Failed to change password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8 font-sans space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your personal profile, AI tutor explanation preferences, and account security.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div
            className={`h-14 w-14 rounded-2xl flex items-center justify-center text-lg font-bold font-mono text-white shadow-md ${
              isInstructor
                ? 'bg-gradient-to-tr from-indigo-600 to-indigo-400'
                : 'bg-gradient-to-tr from-cyan-600 to-cyan-400'
            }`}
          >
            {user.fullName
              ? user.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'SF'}
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user.fullName}</h2>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded-md border uppercase ${
                  isInstructor
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                    : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                }`}
              >
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleProfileSubmit} className="pt-6 space-y-5">
          {profileSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/30 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Preferred Tutor Explanation Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'simple' as ExplanationStyle, label: 'Simple', desc: 'Clear plain-language summaries' },
                { id: 'detailed' as ExplanationStyle, label: 'Detailed', desc: 'Academic depth with full source citations' },
                { id: 'exam-focused' as ExplanationStyle, label: 'Exam-focused', desc: 'High-yield points, key equations & pitfalls' },
                { id: 'example-based' as ExplanationStyle, label: 'Example-based', desc: 'Concrete code walkthroughs and diagrams' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStyle(opt.id)}
                  className={`flex items-start justify-between p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    style === opt.id
                      ? 'border-cyan-500 bg-cyan-500/10 text-slate-900 dark:text-white ring-1 ring-cyan-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{opt.desc}</div>
                  </div>
                  {style === opt.id && <CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Password & Security Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Security &amp; Password</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update your account password with bcrypt salt encryption.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="pt-5 space-y-4 max-w-lg">
          {passwordSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 number, 1 symbol"
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Updating password...</span>
              </>
            ) : (
              <span>Update Password</span>
            )}
          </button>
        </form>
      </div>

      {/* Admin / Danger Zone (Only for Instructor / Admin) */}
      {isInstructor && onOpenResetWorkspace && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-rose-500 dark:text-rose-400">
                Course Workspace Maintenance
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                Reset the local SQLite course database or clear documents for fresh test runs. This action can be undone by re-ingesting your materials.
              </p>
            </div>
            <button
              onClick={onOpenResetWorkspace}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Database</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
