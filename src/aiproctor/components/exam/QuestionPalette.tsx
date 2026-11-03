import React from 'react';
import { Bookmark, CheckCircle2, Circle } from 'lucide-react';
import { ExamQuestion } from '../../types/index.js';

interface QuestionPaletteProps {
  questions: ExamQuestion[];
  currentIndex: number;
  answers: Record<string, any>;
  markedQuestions: Set<string>;
  onSelectQuestion: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentIndex,
  answers,
  markedQuestions,
  onSelectQuestion,
}) => {
  const answeredCount = Object.keys(answers).length;
  const markedCount = markedQuestions.size;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
        Question Navigation
      </h3>

      {/* Status Counters */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="block text-base font-bold">{answeredCount}</span>
          <span className="text-[10px] uppercase font-semibold">Answered</span>
        </div>
        <div className="rounded-lg bg-purple-50 p-2 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
          <span className="block text-base font-bold">{markedCount}</span>
          <span className="text-[10px] uppercase font-semibold">Review</span>
        </div>
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <span className="block text-base font-bold">{unansweredCount}</span>
          <span className="text-[10px] uppercase font-semibold">Remaining</span>
        </div>
      </div>

      {/* Question Grid Buttons */}
      <div className="mt-5 grid grid-cols-5 gap-2">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = answers[q.id] !== undefined;
          const isMarked = markedQuestions.has(q.id);

          let buttonStyle = 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 hover:border-slate-400';

          if (isAnswered) {
            buttonStyle = 'border-emerald-500 bg-emerald-500 text-white font-bold shadow-sm';
          }
          if (isMarked) {
            buttonStyle = 'border-purple-500 bg-purple-500 text-white font-bold shadow-sm';
          }
          if (isCurrent) {
            buttonStyle += ' ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900';
          }

          return (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(idx)}
              className={`relative flex h-10 items-center justify-center rounded-xl border text-sm font-semibold transition-all ${buttonStyle}`}
            >
              <span>{idx + 1}</span>
              {isMarked && (
                <Bookmark className="absolute top-1 right-1 h-2.5 w-2.5 fill-current" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-purple-500" />
          <span>Marked for Review</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-slate-300 bg-white dark:bg-slate-800" />
          <span>Not Yet Answered</span>
        </div>
      </div>
    </div>
  );
};

