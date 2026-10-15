'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  User,
  GraduationCap,
  UserCheck,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Shield,
  Sparkles,
} from 'lucide-react';

interface UserAccountMenuProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  isDarkMode,
  onToggleTheme,
  onOpenSettings,
}) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  // Extract initials
  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'SF';

  const isInstructor = user.role === 'instructor';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account trigger button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-1.5 sm:px-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        aria-label="User Account Menu"
      >
        <div
          className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono text-white shadow-sm ${
            isInstructor
              ? 'bg-gradient-to-tr from-indigo-600 to-indigo-400'
              : 'bg-gradient-to-tr from-cyan-600 to-cyan-400'
          }`}
        >
          {initials}
        </div>

        <div className="hidden sm:flex flex-col items-start text-left">
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
            {user.fullName}
          </span>
          <span
            className={`text-[10px] font-mono leading-none ${
              isInstructor ? 'text-indigo-600 dark:text-indigo-400' : 'text-cyan-600 dark:text-cyan-400'
            }`}
          >
            {isInstructor ? 'Instructor / Admin' : 'Student'}
          </span>
        </div>

        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {/* Account Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-2 z-50 text-slate-800 dark:text-slate-100 animate-fadeIn">
          {/* User info snippet */}
          <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user.fullName}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md border uppercase ${
                  isInstructor
                    ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20'
                    : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                }`}
              >
                {user.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Profile &amp; Settings</span>
            </button>

            <button
              onClick={() => {
                onToggleTheme();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
                <span>Interface Theme</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 capitalize">
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
            </button>
          </div>

          {/* Logout Action */}
          <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={async () => {
                setIsOpen(false);
                await logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-rose-500" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
