'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppShell, AppScreen } from '@/components/layout/app-shell';
import { LandingView } from '@/components/views/landing-view';
import { DashboardView } from '@/components/views/dashboard-view';
import { TutorView } from '@/components/views/tutor-view';
import { AssessmentView } from '@/components/views/assessment-view';
import { ResultsView } from '@/components/views/results-view';
import { ProgressView } from '@/components/views/progress-view';
import { KnowledgeBaseView } from '@/components/views/knowledge-base-view';
import { IngestionView } from '@/components/views/ingestion-view';
import { RAGASEvalLab } from '@/components/ragas/ragas-eval-lab';
import { SourceInspectorModal } from '@/components/tutor/source-inspector-modal';
import { UploadModal } from '@/components/ingestion/upload-modal';
import { CreateCourseModal } from '@/components/workspace/create-course-modal';
import { ResetWorkspaceModal } from '@/components/workspace/reset-workspace-modal';
import {
  Course,
  DocumentSource,
  SourceChunk,
  ConceptMastery,
  AssessmentQuestion,
  RAGASEvalTestCase,
  CitedSource,
} from '@/lib/types';
import { INITIAL_RAGAS_BENCHMARKS } from '@/lib/seed-data';

export default function StudyForgeApp() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState<boolean>(true);

  // Core Data State
  const [documents, setDocuments] = useState<DocumentSource[]>([]);
  const [chunks, setChunks] = useState<SourceChunk[]>([]);
  const [concepts, setConcepts] = useState<ConceptMastery[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [benchmarks, setBenchmarks] = useState<RAGASEvalTestCase[]>(INITIAL_RAGAS_BENCHMARKS);

  // Modals & Navigation Helpers
  const [activeCitation, setActiveCitation] = useState<CitedSource | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [targetConceptForQuiz, setTargetConceptForQuiz] = useState<string | null>(null);

  // Stored Quiz Results for ResultsView
  const [lastQuizResults, setLastQuizResults] = useState<{
    total: number;
    correct: number;
    userAnswers: { question: AssessmentQuestion; selectedOption: number; isCorrect: boolean }[];
    bktUpdates: { conceptName: string; prevP: number; newP: number; delta: number }[];
  } | null>(null);

  // Load real workspace data from SQLite
  const loadWorkspace = useCallback(async (targetCourseId?: string) => {
    try {
      const url = targetCourseId
        ? `/api/workspace?courseId=${encodeURIComponent(targetCourseId)}`
        : '/api/workspace';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load workspace data');
      const data = await res.json();

      setCourses(data.courses || []);
      const active = (data.courses || []).find((c: Course) => c.id === data.activeCourseId) || data.courses?.[0] || null;
      setActiveCourse(active);

      setDocuments(data.documents || []);
      setChunks(data.chunks || []);
      setConcepts(data.concepts || []);
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Error loading workspace:', err);
    } finally {
      setIsLoadingWorkspace(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch('/api/workspace');
        if (!res.ok) return;
        const data = await res.json();
        if (ignore) return;
        setCourses(data.courses || []);
        const active = (data.courses || []).find((c: Course) => c.id === data.activeCourseId) || data.courses?.[0] || null;
        setActiveCourse(active);
        setDocuments(data.documents || []);
        setChunks(data.chunks || []);
        setConcepts(data.concepts || []);
        setQuestions(data.questions || []);
      } catch (err) {
        console.error('Error loading workspace:', err);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSelectCourse = (course: Course) => {
    setActiveCourse(course);
    setTargetConceptForQuiz(null);
    loadWorkspace(course.id);
  };

  const handleCourseCreated = (newCourse: Course) => {
    setCourses(prev => [newCourse, ...prev]);
    setActiveCourse(newCourse);
    loadWorkspace(newCourse.id);
    setCurrentScreen('dashboard');
  };

  const handleResetComplete = () => {
    setCourses([]);
    setActiveCourse(null);
    setDocuments([]);
    setChunks([]);
    setConcepts([]);
    setQuestions([]);
    setBenchmarks([]);
    setLastQuizResults(null);
    setCurrentScreen('dashboard');
  };

  const handleLoadDemoCourse = async () => {
    try {
      setIsLoadingWorkspace(true);
      const res = await fetch('/api/workspace/seed', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        const active = (data.courses || []).find((c: Course) => c.id === data.activeCourseId) || data.courses?.[0] || null;
        setActiveCourse(active);
        setDocuments(data.documents || []);
        setChunks(data.chunks || []);
        setConcepts(data.concepts || []);
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error('Failed to load demo course:', err);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const handleDrillConcept = (conceptId: string) => {
    setTargetConceptForQuiz(conceptId);
    setCurrentScreen('assessment');
  };

  const handleCompleteQuiz = async (results: {
    total: number;
    correct: number;
    userAnswers: { question: AssessmentQuestion; selectedOption: number; isCorrect: boolean }[];
    bktUpdates: { conceptName: string; prevP: number; newP: number; delta: number }[];
  }) => {
    setLastQuizResults(results);

    // Apply BKT updates to concepts
    const updatedConcepts = concepts.map(c => {
      const update = results.bktUpdates.find(
        u => u.conceptName.toLowerCase() === c.name.toLowerCase()
      );
      if (update) {
        return {
          ...c,
          currentMastery: update.newP,
          attemptsCount: c.attemptsCount + 1,
          correctCount: c.correctCount + (update.delta >= 0 ? 1 : 0),
          lastAssessedAt: new Date().toISOString(),
          history: [
            ...c.history,
            {
              timestamp: new Date().toISOString(),
              isCorrect: update.delta >= 0,
              previousMastery: update.prevP,
              newMastery: update.newP,
              questionSnippet: update.delta >= 0 ? 'Diagnostic drill correct' : 'Diagnostic drill miss',
            },
          ],
        };
      }
      return c;
    });

    setConcepts(updatedConcepts);

    // Persist quiz attempt and updated BKT concepts to server SQLite
    if (activeCourse) {
      try {
        await fetch('/api/workspace/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: activeCourse.id,
            total: results.total,
            correct: results.correct,
            answers: results.userAnswers,
            bktUpdates: results.bktUpdates,
            updatedConcepts,
          }),
        });
      } catch (err) {
        console.error('Failed to persist quiz attempt:', err);
      }
    }

    setCurrentScreen('results');
  };

  const handleInspectSpecificSource = (docTitle: string, unitLabel: string, quote: string) => {
    const matched =
      chunks.find(
        c =>
          c.docTitle.toLowerCase() === docTitle.toLowerCase() &&
          c.unitLabel.toLowerCase() === unitLabel.toLowerCase()
      ) ||
      chunks.find(c => c.docTitle.toLowerCase().includes(docTitle.toLowerCase())) ||
      chunks[0];

    setActiveCitation({
      chunkId: matched?.id || 'ref-chunk',
      docTitle,
      unitLabel,
      fileType: matched?.fileType || 'pdf',
      snippet: quote,
      fullContent: matched?.content,
      relevanceScore: 0.98,
    });
  };

  const handleIngestSuccess = () => {
    if (activeCourse) {
      loadWorkspace(activeCourse.id);
    } else {
      loadWorkspace();
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!activeCourse) return;
    try {
      const res = await fetch(`/api/courses/${activeCourse.id}/documents/${docId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadWorkspace(activeCourse.id);
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <AppShell
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        courses={courses}
        activeCourse={activeCourse}
        onSelectCourse={handleSelectCourse}
        onCreateCourse={() => setIsCreateCourseModalOpen(true)}
        onOpenSettings={() => setIsResetModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(prev => !prev)}
      >
        {/* 1. Landing View */}
        {currentScreen === 'landing' && (
          <LandingView
            courses={courses}
            onSelectCourseAndEnter={(cId, screen) => {
              const found = courses.find(c => c.id === cId);
              if (found) {
                setActiveCourse(found);
                loadWorkspace(found.id);
              }
              setCurrentScreen(screen);
            }}
            onEnterDashboard={() => setCurrentScreen('dashboard')}
            onCreateCourse={() => setIsCreateCourseModalOpen(true)}
            onOpenUpload={() => setIsUploadModalOpen(true)}
          />
        )}

        {/* 2. Student Dashboard */}
        {currentScreen === 'dashboard' && (
          <DashboardView
            course={activeCourse}
            concepts={concepts}
            documents={documents}
            onNavigate={setCurrentScreen}
            onDrillConcept={handleDrillConcept}
            onCreateCourse={() => setIsCreateCourseModalOpen(true)}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onLoadDemoCourse={handleLoadDemoCourse}
          />
        )}

        {/* 3. Tutor Workspace */}
        {currentScreen === 'tutor' && (
          <TutorView
            course={activeCourse}
            chunks={chunks}
            concepts={concepts}
            onOpenSourceInspector={setActiveCitation}
            onNavigateToQuiz={() => {
              setTargetConceptForQuiz(null);
              setCurrentScreen('assessment');
            }}
            onOpenUpload={() => setIsUploadModalOpen(true)}
          />
        )}

        {/* 4. Assessment Workspace */}
        {currentScreen === 'assessment' && (
          <AssessmentView
            course={activeCourse}
            questions={questions}
            concepts={concepts}
            chunks={chunks}
            targetConceptId={targetConceptForQuiz}
            onCompleteQuiz={handleCompleteQuiz}
            onOpenSourceInspector={handleInspectSpecificSource}
            onQuestionsGenerated={newQuestions => {
              setQuestions(prev => [...newQuestions, ...prev]);
            }}
            onOpenUpload={() => setIsUploadModalOpen(true)}
          />
        )}

        {/* 5. Results Page */}
        {currentScreen === 'results' && lastQuizResults && (
          <ResultsView
            course={activeCourse}
            results={lastQuizResults}
            onRetake={() => setCurrentScreen('assessment')}
            onContinueToDashboard={() => setCurrentScreen('dashboard')}
            onAskTutorAboutMistake={() => {
              setCurrentScreen('tutor');
            }}
            onInspectSource={handleInspectSpecificSource}
          />
        )}

        {/* 6. Progress Page */}
        {currentScreen === 'progress' && (
          <ProgressView
            course={activeCourse}
            concepts={concepts}
            onDrillConcept={handleDrillConcept}
            onNavigateToQuiz={() => {
              setTargetConceptForQuiz(null);
              setCurrentScreen('assessment');
            }}
          />
        )}

        {/* 7. Knowledge Base Page */}
        {currentScreen === 'knowledge' && (
          <KnowledgeBaseView
            course={activeCourse}
            documents={documents}
            chunks={chunks}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onDeleteDocument={handleDeleteDocument}
            onInspectChunk={chunk => {
              setActiveCitation({
                chunkId: chunk.id,
                docTitle: chunk.docTitle,
                unitLabel: chunk.unitLabel,
                fileType: chunk.fileType,
                snippet: chunk.content.slice(0, 160) + '...',
                fullContent: chunk.content,
                relevanceScore: 0.98,
              });
            }}
          />
        )}

        {/* 8. Admin Ingestion Page */}
        {currentScreen === 'ingestion' && (
          <IngestionView
            course={activeCourse}
            onIngestSuccess={handleIngestSuccess}
            onViewKnowledgeBase={() => setCurrentScreen('knowledge')}
            onCreateCourse={() => setIsCreateCourseModalOpen(true)}
          />
        )}

        {/* 9. RAGAS Eval Lab */}
        {currentScreen === 'evaluation' && (
          <RAGASEvalLab
            course={activeCourse}
            chunks={chunks}
            benchmarks={benchmarks}
            onAddBenchmarkResult={result => {
              setBenchmarks(prev => [result, ...prev]);
            }}
          />
        )}
      </AppShell>

      {/* Global Source Inspector Modal */}
      <SourceInspectorModal
        citation={activeCitation}
        chunk={chunks.find(c => c.id === activeCitation?.chunkId)}
        onClose={() => setActiveCitation(null)}
        onAskFollowUp={() => {
          setCurrentScreen('tutor');
        }}
      />

      {/* Upload Modal */}
      <UploadModal
        course={activeCourse}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onIngestSuccess={handleIngestSuccess}
      />

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={isCreateCourseModalOpen}
        onClose={() => setIsCreateCourseModalOpen(false)}
        onCourseCreated={handleCourseCreated}
      />

      {/* Reset Workspace Modal */}
      <ResetWorkspaceModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onResetComplete={handleResetComplete}
      />
    </div>
  );
}
