'use client';

import React from 'react';
import {
  GraduationCap,
  MessageSquareText,
  CheckCircle2,
  BrainCircuit,
  FileBox,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Course } from '@/lib/types';

interface SidebarProps {
  currentView: 'tutor' | 'assessment' | 'mastery' | 'ingestion' | 'evaluation';
  onSelectView: (view: 'tutor' | 'assessment' | 'mastery' | 'ingestion' | 'evaluation') => void;
  courses: Course[];
  activeCourse: Course;
  onSelectCourse: (course: Course) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  courses,
  activeCourse,
  onSelectCourse,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
}) => {
  const navSections = [
    {
      group: 'LEARNING',
      items: [
        {
          id: 'tutor' as const,
          label: 'Tutor & Citations',
          icon: MessageSquareText,
          description: 'Source-grounded academic chat',
        },
        {
          id: 'assessment' as const,
          label: 'Diagnostic Quiz',
          icon: CheckCircle2,
          description: 'Adaptive testing with BKT updates',
        },
      ],
    },
    {
      group: 'ADAPTIVE ENGINE',
      items: [
        {
          id: 'mastery' as const,
          label: 'BKT Mastery Matrix',
          icon: BrainCircuit,
          description: 'Bayesian Knowledge Tracing',
        },
      ],
    },
    {
      group: 'KNOWLEDGE & RAG',
      items: [
        {
          id: 'ingestion' as const,
          label: 'Multimodal Ingestion',
          icon: FileBox,
          description: 'PDF, PPTX, Video, OCR notes',
        },
        {
          id: 'evaluation' as const,
          label: 'RAGAS Eval Lab',
          icon: BarChart3,
          description: 'Faithfulness & Groundedness',
        },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800 bg-slate-950/90 transition-all duration-300 z-20 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-slate-100 block">
                StudyForge AI
              </span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Adaptive RAG Tutoring
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30">
            <GraduationCap className="h-5 w-5" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors ${
            isCollapsed ? 'mx-auto mt-2' : ''
          }`}
          title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Active Course Selector */}
      <div className="p-3 border-b border-slate-800/80">
        {!isCollapsed ? (
          <div>
            <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase block mb-1.5 px-1">
              Active Curriculum
            </label>
            <div className="relative">
              <select
                value={activeCourse.id}
                onChange={e => {
                  const found = courses.find(c => c.id === e.target.value);
                  if (found) onSelectCourse(found);
                }}
                className="w-full appearance-none rounded-lg border border-slate-800 bg-slate-900/90 py-2 pl-3 pr-8 text-xs font-medium text-slate-200 hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors cursor-pointer"
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id} className="bg-slate-900 text-slate-200">
                    {course.code} · {course.title}
                  </option>
                ))}
              </select>
              <BookOpen className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-[10px] font-bold text-sky-400 block" title={activeCourse.title}>
              {activeCourse.code.split(' ')[0]}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map(section => (
          <div key={section.group}>
            {!isCollapsed && (
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-2 mb-2 block">
                {section.group}
              </span>
            )}
            <div className="space-y-1">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate whitespace-nowrap text-left">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info & Settings */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {!isCollapsed && (
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
              <Sparkles className="h-3 w-3 text-sky-400" />
              <span className="font-medium text-slate-300">Free Tier Engine</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 truncate">
              gemini-3.1-flash-lite (Free)
            </div>
          </div>
        )}

        <button
          onClick={onOpenSettings}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors border border-transparent ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Configuration & Settings"
        >
          <Settings className="h-4 w-4 shrink-0 text-slate-500" />
          {!isCollapsed && <span>Model & BKT Config</span>}
        </button>
      </div>
    </aside>
  );
};
