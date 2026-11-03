import React, { useState, useEffect } from 'react';
import {
  Clock,
  Save,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Send,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { Examination, ExamQuestion, ExamAttempt } from '../../types/index.js';
import { QuestionPalette } from './QuestionPalette.js';

interface ExamWorkspaceProps {
  examination: Examination;
  questions: ExamQuestion[];
  attempt: ExamAttempt;
  onAutosave: (answers: Record<string, any>) => void;
  onSubmitExam: () => Promise<void>;
  isSubmitting: boolean;
}

export const ExamWorkspace: React.FC<ExamWorkspaceProps> = ({
  examination,
  questions,
  attempt,
  onAutosave,
  onSubmitExam,
  isSubmitting,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(attempt.answers || {});
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState(examination.duration_minutes * 60);
  const [lastSavedAt, setLastSavedAt] = useState<string>(new Date().toLocaleTimeString());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(attempt.status === 'submitted');

  // Countdown timer
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, onSubmitExam]);

  // Format timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: optionIndex };
    setAnswers(newAnswers);
    onAutosave(newAnswers);
    setLastSavedAt(new Date().toLocaleTimeString());
  };

  const handleClearAnswer = () => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion.id];
    setAnswers(newAnswers);
    onAutosave(newAnswers);
    setLastSavedAt(new Date().toLocaleTimeString());
  };

  const handleToggleMark = () => {
    if (!currentQuestion) return;
    setMarkedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  };

  const handleFinalSubmit = async () => {
    await onSubmitExam();
    setIsCompleted(true);
    setShowConfirmModal(false);
  };

  if (isCompleted) {
    return (
      <div className="mx-auto max-w-2xl py-16 px-4 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Award className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-slate-900 dark:text-white">
            Examination Submitted Successfully
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Your responses and accompanying proctoring session telemetry have been encrypted and submitted to the university evaluation repository.
          </p>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Attempt ID:</strong> {attempt.id}</p>
            <p><strong>Questions Attempted:</strong> {Object.keys(answers).length} of {questions.length}</p>
            <p><strong>Proctoring Audit Status:</strong> Logged & Sealed</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Banner: Timer and Autosave */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {examination.course_code}
          </span>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{examination.title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Autosave Status */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Save className="h-3.5 w-3.5" />
            <span>Autosaved at {lastSavedAt}</span>
          </div>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono font-bold shadow-sm ${
              secondsRemaining < 300
                ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900'
                : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span className="text-lg">{formatTime(secondsRemaining)}</span>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-[0.98]"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Question Workspace (Left) + Palette (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Active Question Box */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            {/* Header: Question order + Marks */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 font-bold text-xs text-white">
                  {currentIndex + 1}
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Question {currentIndex + 1} of {questions.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {currentQuestion?.marks || 1} Marks
                </span>

                <button
                  onClick={handleToggleMark}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium border transition-all ${
                    markedQuestions.has(currentQuestion?.id || '')
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5 fill-current" />
                  <span>{markedQuestions.has(currentQuestion?.id || '') ? 'Marked' : 'Mark for Review'}</span>
                </button>
              </div>
            </div>

            {/* Question Prompt */}
            <div className="py-6">
              <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                {currentQuestion?.prompt}
              </p>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {currentQuestion?.options.map((option, optIdx) => {
                const isSelected = answers[currentQuestion.id] === optIdx;
                return (
                  <label
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`flex items-start gap-3.5 rounded-xl border p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-950/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 text-slate-600 dark:border-slate-600'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-sm text-slate-800 dark:text-slate-200 leading-snug">
                      {option}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Bottom Actions: Clear, Prev, Next */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
              <button
                disabled={answers[currentQuestion?.id] === undefined}
                onClick={handleClearAnswer}
                className="text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-40 disabled:hover:text-slate-500"
              >
                Clear Selection
              </button>

              <div className="flex items-center gap-3">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <button
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40"
                >
                  <span>Next Question</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Palette */}
        <div className="lg:col-span-4 space-y-6">
          <QuestionPalette
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            markedQuestions={markedQuestions}
            onSelectQuestion={(idx) => setCurrentIndex(idx)}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/50">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Submit Examination?</h3>
                <p className="text-xs text-slate-500">Confirm final submission</p>
              </div>
            </div>

            <div className="my-5 rounded-xl bg-slate-50 p-4 text-xs dark:bg-slate-800/50 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Questions:</span>
                <span className="font-bold text-slate-900 dark:text-white">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Questions Answered:</span>
                <span className="font-bold text-emerald-600">{Object.keys(answers).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Marked for Review:</span>
                <span className="font-bold text-purple-600">{markedQuestions.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unanswered Questions:</span>
                <span className="font-bold text-amber-600">{questions.length - Object.keys(answers).length}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Return to Exam
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Final Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

