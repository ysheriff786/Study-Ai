'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Course, SourceChunk, ChatMessage, CitedSource, ConceptMastery } from '@/lib/types';
import { CitationCard } from '@/components/ui/citation-card';
import {
  Send,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
  Lightbulb,
  AlertTriangle,
  Upload,
  RefreshCw,
  Search,
} from 'lucide-react';

interface TutorViewProps {
  course: Course | null;
  chunks: SourceChunk[];
  concepts: ConceptMastery[];
  onOpenSourceInspector: (citation: CitedSource) => void;
  onNavigateToQuiz: (conceptId?: string) => void;
  onOpenUpload?: () => void;
}

let tutorMsgCounter = 0;
function createMessageId(prefix: string): string {
  tutorMsgCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${tutorMsgCounter}`;
}

export const TutorView: React.FC<TutorViewProps> = ({
  course,
  chunks,
  concepts,
  onOpenSourceInspector,
  onNavigateToQuiz,
  onOpenUpload,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [activeSideCitation, setActiveSideCitation] = useState<CitedSource | null>(null);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, loadingStatus]);

  const hasCourse = Boolean(course);
  const hasUploadedMaterial = chunks && chunks.length > 0;

  const handleSendMessage = async (queryText?: string, forceMode?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || !hasUploadedMaterial || !course) return;

    // Cancel old in-flight request if user submits a new question
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMessage: ChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: [],
      conceptsDiscussed: [],
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);
    setLoadingStatus('Searching your uploaded material...');

    try {
      const res = await fetch('/api/gemini/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          query: textToSend,
          courseId: course.id,
          courseCode: course.code,
          forceMode,
          history: messages.slice(-6).map(m => ({ role: m.role, text: m.text })),
        }),
      });

      if (!res.ok) throw new Error('Tutor query failed');
      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: createMessageId('assistant'),
        role: 'assistant',
        text: data.text || data.answer || 'Explanation generated from verified course materials.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: data.citations || [],
        conceptsDiscussed: data.conceptsDiscussed || data.related_concepts || [],
        suggestedFollowUps: data.suggestedFollowUps || data.suggested_follow_ups || [],
        latencyMs: data.latencyMs,
      };

      setMessages(prev => [...prev, assistantMessage]);
      if (data.citations && data.citations[0]) {
        setActiveSideCitation(data.citations[0]);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Tutor chat error:', err);
      }
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // Distinct quick action handler that retrieves fresh evidence
  const handleQuickAction = (actionType: 'simple' | 'example' | 'compare' | 'source' | 'quiz' | 'summary') => {
    const lastUserQuery = [...messages].reverse().find(m => m.role === 'user')?.text || '';

    switch (actionType) {
      case 'simple':
        handleSendMessage(`Explain simply for a beginner: "${lastUserQuery || 'this concept'}"`, 'simple_explanation');
        break;
      case 'example':
        handleSendMessage(`Give a concrete step-by-step example of: "${lastUserQuery || 'this concept'}"`, 'example');
        break;
      case 'compare':
        handleSendMessage(`Compare "${lastUserQuery || 'this concept'}" with another related mechanism from the materials`, 'comparison');
        break;
      case 'summary':
        handleSendMessage(`Summarize the core rules of "${lastUserQuery || 'this concept'}" in 3 clear points`, 'summary');
        break;
      case 'quiz':
        onNavigateToQuiz();
        break;
      case 'source':
        if (activeSideCitation) {
          onOpenSourceInspector(activeSideCitation);
        }
        break;
    }
  };

  // Markdown rendering helper with citation buttons
  const renderMessageText = (text: string, citations: CitedSource[]) => {
    const citationRegex = /\[(?:Citation:\s*)?([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      const citationText = match[1];
      const matchedCitation = citations.find(
        c =>
          citationText.toLowerCase().includes(c.docTitle.toLowerCase()) ||
          citationText.toLowerCase().includes(c.unitLabel.toLowerCase())
      ) || citations[0];

      parts.push(
        <button
          key={`cite-${matchIndex}`}
          onClick={() => {
            if (matchedCitation) {
              setActiveSideCitation(matchedCitation);
              onOpenSourceInspector(matchedCitation);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/40 bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-900/50 hover:text-cyan-100 px-2 py-0.5 text-[11px] font-mono transition-colors mx-1 cursor-pointer align-baseline"
          title="Click to inspect verified citation context"
        >
          <BookOpen className="h-3 w-3 text-cyan-500 dark:text-cyan-400" />
          <span>{citationText}</span>
        </button>
      );

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // Determine conversation badge for assistant message
  const getMessageBadge = (msg: ChatMessage) => {
    const text = msg.text.toLowerCase();
    if (text.includes('not covered clearly') || text.includes('not covered in the uploaded')) {
      return {
        label: 'Not covered in your material',
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        icon: AlertTriangle,
      };
    }
    if (text.includes('building on the earlier')) {
      return {
        label: 'Based on a previous answer',
        className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
        icon: RefreshCw,
      };
    }
    if (text.includes('you asked a similar question')) {
      return {
        label: 'Follow-up explanation',
        className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        icon: Lightbulb,
      };
    }
    if (msg.citations && msg.citations.length > 0) {
      return {
        label: 'Grounded in your material',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: ShieldCheck,
      };
    }
    return {
      label: 'Verified Reference',
      className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
      icon: Info,
    };
  };

  // Empty State: No Course or No Uploaded Material
  if (!course || !hasUploadedMaterial) {
    return (
      <div className="flex flex-col h-full items-center justify-center max-w-2xl mx-auto px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 mb-5 text-cyan-600 dark:text-cyan-400 shadow-xs">
          <BookOpen className="h-8 w-8" />
        </div>
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-2">
          Source-Grounded Tutor
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Your tutor is ready. Upload course material to begin.
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          Upload course material first. The tutor answers from your indexed content. Every statement is verified with clickable citations to exact pages and slides.
        </p>
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium px-5 py-2.5 text-sm shadow-md transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Material</span>
          </button>
        )}
      </div>
    );
  }

  // Active Workspace with Uploaded Course Materials
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 h-full w-full overflow-hidden">
      {/* 1. LEFT TOPIC NAVIGATION (3 cols) */}
      <div className="hidden lg:flex lg:col-span-3 flex-col border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#090d16]/50 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
            <Layers className="h-3.5 w-3.5 text-cyan-500" />
            <span>INDEXED CONCEPTS</span>
          </div>
          <span className="text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-slate-600 dark:text-slate-400">
            {concepts.length}
          </span>
        </div>

        {/* Concept Pill List */}
        <div className="space-y-1.5 flex-1">
          <button
            onClick={() => setSelectedTopicFilter('all')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
              selectedTopicFilter === 'all'
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <span>All Uploaded Concepts</span>
            <span className="text-[10px] text-slate-400">{chunks.length} chunks</span>
          </button>

          {concepts.map(concept => (
            <button
              key={concept.id}
              onClick={() => {
                setSelectedTopicFilter(concept.name);
                handleSendMessage(`Explain the fundamental principles of ${concept.name}`);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex flex-col gap-1 ${
                selectedTopicFilter === concept.name
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold truncate">{concept.name}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {Math.round(concept.currentMastery * 100)}%
                </span>
              </div>
              <span className="text-[11px] text-slate-400 truncate">{concept.topicName}</span>
            </button>
          ))}
        </div>

        {/* Upload More Card */}
        {onOpenUpload && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onOpenUpload}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-cyan-500" />
              <span>Add Document to Course</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. CENTER CONVERSATIONAL TUTOR (6 cols) */}
      <div className="col-span-1 lg:col-span-6 flex flex-col h-full bg-slate-50/50 dark:bg-[#070b14] overflow-hidden">
        {/* Course Banner */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3 bg-white/70 dark:bg-[#090d16]/70 backdrop-blur-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400">
              <span className="font-bold">{course.code}</span>
              <span>·</span>
              <span className="text-slate-500 dark:text-slate-400">{course.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="h-3 w-3" />
              <span>Grounded ({chunks.length} chunks)</span>
            </span>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                Ask anything from your uploaded materials
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                The tutor searches only your indexed material and provides verified citations to exact pages and slides.
              </p>
              {concepts.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 max-w-md">
                  {concepts.slice(0, 3).map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleSendMessage(`What are the key points of ${c.name}?`)}
                      className="text-xs rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:border-cyan-500 transition-colors cursor-pointer"
                    >
                      &quot;What is {c.name}?&quot;
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map(msg => {
              const isAssistant = msg.role === 'assistant';
              const badge = isAssistant ? getMessageBadge(msg) : null;
              const isUnsupported = isAssistant && msg.text.toLowerCase().includes('not covered clearly');

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} space-y-2`}
                >
                  {/* Role Header */}
                  <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isAssistant ? 'StudyForge Tutor' : 'You'}
                    </span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                    {badge && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${badge.className}`}>
                        <badge.icon className="h-3 w-3" />
                        <span>{badge.label}</span>
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-5 py-4 max-w-2xl text-sm leading-relaxed ${
                      isAssistant
                        ? isUnsupported
                          ? 'bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/30 text-amber-950 dark:text-amber-200 shadow-xs'
                          : 'bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-slate-800/90 text-slate-800 dark:text-slate-200 shadow-xs'
                        : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {isAssistant ? renderMessageText(msg.text, msg.citations) : msg.text}
                    </div>

                    {/* Section 9: Unsupported Query Alert & Alternatives */}
                    {isUnsupported && (
                      <div className="mt-4 pt-3 border-t border-amber-500/20 flex flex-col gap-2">
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                          Not covered in your uploaded material
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {onOpenUpload && (
                            <button
                              onClick={onOpenUpload}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 font-medium cursor-pointer"
                            >
                              <Upload className="h-3 w-3" />
                              <span>Upload material covering this</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTopicFilter('all')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            <Search className="h-3 w-3" />
                            <span>Browse covered topics</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Citation Chips */}
                    {isAssistant && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2 items-center">
                        <span className="text-[11px] font-mono text-slate-400">Cited Sources:</span>
                        {msg.citations.map((cite, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveSideCitation(cite);
                              onOpenSourceInspector(cite);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 text-xs font-mono transition-colors cursor-pointer"
                          >
                            <BookOpen className="h-3 w-3 text-cyan-500" />
                            <span>{cite.docTitle} · {cite.unitLabel}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Section 11: Quick Action Strip under every answer */}
                    {isAssistant && !isUnsupported && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleQuickAction('simple')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          Explain simply
                        </button>
                        <button
                          onClick={() => handleQuickAction('example')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          Give an example
                        </button>
                        <button
                          onClick={() => handleQuickAction('compare')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          Compare with another concept
                        </button>
                        <button
                          onClick={() => handleQuickAction('summary')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          Summarize in 3 points
                        </button>
                        <button
                          onClick={() => handleQuickAction('quiz')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-medium text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                        >
                          Quiz me
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading Indicator with Section 10 prompt */}
          {isLoading && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md">
              <div className="h-4 w-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {loadingStatus || 'Searching your uploaded material...'}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#090d16]/70 backdrop-blur-xs">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 max-w-3xl mx-auto"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder="Ask a question grounded in your course materials..."
              className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. RIGHT CITATION / SOURCE PANEL (3 cols) */}
      <div className="hidden lg:flex lg:col-span-3 flex-col border-l border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#090d16]/50 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
            <BookOpen className="h-3.5 w-3.5 text-cyan-500" />
            <span>SOURCE EVIDENCE</span>
          </div>
        </div>

        {activeSideCitation ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold uppercase">
                  {activeSideCitation.fileType} · {activeSideCitation.unitLabel}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {Math.round(activeSideCitation.relevanceScore * 100)}% Match
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                {activeSideCitation.docTitle}
              </h4>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed max-h-60 overflow-y-auto">
                &quot;{activeSideCitation.snippet || activeSideCitation.fullContent}&quot;
              </div>

              <button
                onClick={() => onOpenSourceInspector(activeSideCitation)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition-colors cursor-pointer"
              >
                <span>Open in Source Inspector</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 p-4">
            <BookOpen className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-xs">
              Click any citation badge in a tutor message to view verbatim evidence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
