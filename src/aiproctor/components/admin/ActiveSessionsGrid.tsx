import React from 'react';
import { Shield, Clock, AlertTriangle, Eye, ArrowUpRight } from 'lucide-react';
import { ProctoringSession } from '../../types/index.js';

interface ActiveSessionsGridProps {
  sessions: ProctoringSession[];
  onSelectSession: (session: ProctoringSession) => void;
}

export const ActiveSessionsGrid: React.FC<ActiveSessionsGridProps> = ({
  sessions,
  onSelectSession,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => {
        const hasHighFlags = session.high_severity_events_count > 0;
        return (
          <div
            key={session.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              {/* Header: Candidate Info + Status Chip */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={session.student?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'}
                    alt="Student"
                    className="h-11 w-11 rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {session.student?.full_name || 'Candidate Alex Mercer'}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      {session.student?.student_id || 'STU-2026-8911'}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    session.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {session.status}
                </span>
              </div>

              {/* Course Title */}
              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {session.exam?.title || 'CS-402: Distributed Systems'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Started at {new Date(session.started_at).toLocaleTimeString()}
                </p>
              </div>

              {/* Event Flags Counter */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/50">
                <span className="text-slate-500">Flags Logged:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {session.total_events_count} Events
                  </span>
                  {hasHighFlags && (
                    <span className="flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{session.high_severity_events_count} High</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Action */}
            <div className="mt-5">
              <button
                onClick={() => onSelectSession(session)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-600 transition-all dark:bg-slate-800 dark:hover:bg-blue-600"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Launch Invigilator Desk</span>
                <ArrowUpRight className="h-3 w-3 ml-0.5 opacity-60" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

