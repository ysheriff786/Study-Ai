'use client';

import React, { useState } from 'react';
import { Course } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { UserAccountMenu } from '@/components/auth/user-account-menu';
import {
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  PlayCircle,
  TrendingUp,
  FileBox,
  Upload,
  BarChart3,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  PlusCircle,
  Settings,
  Sparkles,
  LogIn,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export type AppScreen =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'tutor'
  | 'assessment'
  | 'results'
  | 'progress'
  | 'knowledge'
  | 'ingestion'
  | 'evaluation'
  | 'settings';

interface AppShellProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  courses: Course[];
  activeCourse: Course | null;
  onSelectCourse: (course: Course) => void;
  onCreateCourse?: () => void;
  onOpenSettings?: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentScreen,
  onNavigate,
  courses,
  activeCourse,
  onSelectCourse,
  onCreateCourse,
  onOpenSettings,
  isDarkMode,
  onToggleTheme,
  children,
}) => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const isInstructor = user?.role === 'instructor';

  // Role-Based Navigation Items
  const studentNavItems = [
    { id: 'dashboard' as AppScreen, label: 'Student Dashboard', icon: LayoutDashboard },
    { id: 'tutor' as AppScreen, label: 'Source-Grounded Tutor', icon: MessageSquareText },
    { id: 'assessment' as AppScreen, label: 'Diagnostic Quiz', icon: PlayCircle },
    { id: 'progress' as AppScreen, label: 'Mastery & BKT', icon: TrendingUp },
    { id: 'knowledge' as AppScreen, label: 'Knowledge Base', icon: FileBox },
  ];

  const instructorNavItems = [
    { id: 'dashboard' as AppScreen, label: 'Instructor Overview', icon: LayoutDashboard },
    { id: 'ingestion' as AppScreen, label: 'Multimodal Ingest', icon: Upload },
    { id: 'knowledge' as AppScreen, label: 'Course Documents', icon: FileBox },
    { id: 'evaluation' as AppScreen, label: 'RAGAS Eval Lab', icon: BarChart3 },
  ];

  const navItems = isInstructor ? instructorNavItems : studentNavItems;

  const screenTitles: Record<AppScreen, string> = {
    landing: 'Welcome',
    login: 'Sign In',
    register: 'Create Account',
    dashboard: isInstructor ? 'Instructor Overview' : 'Student Dashboard',
    tutor: 'Tutor Workspace',
    assessment: 'Diagnostic Assessment',
    results: 'Assessment Results',
    progress: 'Mastery & Progress',
    knowledge: isInstructor ? 'Course Curriculum & Chunks' : 'Course Materials',
    ingestion: 'Multimodal Ingestion Pipeline',
    evaluation: 'RAGAS Benchmarks & Retrieval Lab',
    settings: 'Account Settings',
  };

  // If on landing, login, or register page, render clean full-width without SaaS shell
  if (currentScreen === 'landing' || currentScreen === 'login' || currentScreen === 'register') {
    return <div className={isDarkMode ? 'dark' : ''}>{children}</div>;
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex h-full w-full bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-sans transition-colors">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#090f1d] transition-all duration-300 z-20 shrink-0 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Brand Wordmark */}
          <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-105 ${
                  isInstructor
                    ? 'bg-gradient-to-tr from-indigo-600 to-cyan-600'
                    : 'bg-gradient-to-tr from-cyan-600 to-indigo-600'
                }`}
              >
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white block">
                    StudyForge AI
                  </span>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 block -mt-0.5">
                    {isInstructor ? 'Instructor Console' : 'Adaptive Learning'}
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Active Course Selector */}
          <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/80">
            {!isSidebarCollapsed ? (
              <div>
                <div className="flex items-center justify-between mb-1 px-1">
                  <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                    Course Workspace
                  </label>
                  {onCreateCourse && isInstructor && (
                    <button
                      onClick={onCreateCourse}
                      className="text-[10px] font-medium text-indigo-500 hover:text-indigo-400 flex items-center gap-0.5 cursor-pointer"
                      title="Create new course"
                    >
                      <PlusCircle className="h-3 w-3" />
                      <span>New</span>
                    </button>
                  )}
                </div>

                <div className="relative">
                  <select
                    value={activeCourse?.id || ''}
                    onChange={(e) => {
                      const selected = courses.find((c) => c.id === e.target.value);
                      if (selected) onSelectCourse(selected);
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 px-3 py-2 pr-8 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer truncate"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} · {c.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div
                  className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400"
                  title={activeCourse?.title}
                >
                  {activeCourse?.code?.slice(0, 2) || 'CS'}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={item.label}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? isInstructor
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                        : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? isInstructor
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-cyan-600 dark:text-cyan-400'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
            <button
              onClick={() => onNavigate('settings')}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                currentScreen === 'settings'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              title="Account Settings"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              {!isSidebarCollapsed && <span>Settings</span>}
            </button>

            <button
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="hidden lg:flex w-full items-center justify-center py-1.5 text-[11px] font-mono text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {isSidebarCollapsed ? 'Expand →' : '← Collapse'}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col h-full overflow-hidden">
          {/* Top Navbar */}
          <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#070b14]/80 px-4 sm:px-6 backdrop-blur-md shrink-0 z-10">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="md:hidden rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {screenTitles[currentScreen]}
                </h2>
                {activeCourse && (
                  <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                    {activeCourse.code} · {activeCourse.title}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              <button
                onClick={onToggleTheme}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* User Account Menu in Top Nav */}
              {user ? (
                <UserAccountMenu
                  isDarkMode={isDarkMode}
                  onToggleTheme={onToggleTheme}
                  onOpenSettings={() => onNavigate('settings')}
                />
              ) : (
                <button
                  onClick={() => onNavigate('login')}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors shadow-xs"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </header>

          {/* Screen Content */}
          <main className="flex-1 overflow-hidden relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
