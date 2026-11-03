import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { AdminOverview, ProctoringSession, ProctoringEvent } from '../../types/index.js';
import { api } from '../../services/api.js';
import { getSocket } from '../../services/socket.js';
import { ActiveSessionsGrid } from './ActiveSessionsGrid.js';
import { AnalyticsCharts } from './AnalyticsCharts.js';
import { SessionDetailModal } from './SessionDetailModal.js';

export const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [sessions, setSessions] = useState<ProctoringSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ProctoringSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminOverview();
      setOverview(data);
      setSessions(data.recentSessions || []);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for live flagged events via WebSocket
    const socket = getSocket();
    socket.emit('join:session', {
      sessionId: 'admin-global',
      examId: 'admin-global',
      role: 'invigilator',
    });

    socket.on('admin:event_flagged', (payload: { sessionId: string; event: ProctoringEvent }) => {
      // Refresh or increment counts in place
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === payload.sessionId) {
            return {
              ...s,
              total_events_count: s.total_events_count + 1,
              high_severity_events_count:
                payload.event.severity === 'high'
                  ? s.high_severity_events_count + 1
                  : s.high_severity_events_count,
            };
          }
          return s;
        })
      );
    });

    return () => {
      socket.off('admin:event_flagged');
    };
  }, []);

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.student?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student?.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.exam?.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            Institutional Command Center
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Invigilator Proctoring & Integrity Console
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Live behavioral signal monitoring, evidentiary audit inspection, and human determinations.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Active Sessions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Candidates</span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {overview.kpis.activeSessions}
            </p>
            <p className="mt-1 text-[11px] text-emerald-600 font-medium">● Continuous telemetry active</p>
          </div>

          {/* Total Conducted */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Examinations</span>
              <Layers className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {overview.kpis.totalExaminations}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Total institutional courses</p>
          </div>

          {/* Completed Sessions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Completed Sessions</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {overview.kpis.completedSessions}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Successfully submitted</p>
          </div>

          {/* Flags Awaiting Review */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-3 text-2xl font-bold text-amber-600">
              {overview.kpis.eventsAwaitingReview}
            </p>
            <p className="mt-1 text-[11px] text-amber-600 font-medium">Requires invigilator check</p>
          </div>

          {/* High Severity Flags */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">High-Priority Signals</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <p className="mt-3 text-2xl font-bold text-red-600">
              {overview.kpis.highSeverityCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Absence & multi-face alerts</p>
          </div>
        </div>
      )}

      {/* Analytics Visual Charts */}
      {overview && (
        <AnalyticsCharts
          eventTypeDistribution={overview.eventTypeDistribution}
          reviewStatusDistribution={overview.reviewStatusDistribution}
        />
      )}

      {/* Candidate Sessions Monitor Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Candidate Examination Streams ({filteredSessions.length})
            </h2>
            <p className="text-xs text-slate-500">Select any candidate to examine live status or audit timeline</p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="interrupted">Interrupted</option>
            </select>
          </div>
        </div>

        {/* Sessions Grid */}
        <ActiveSessionsGrid
          sessions={filteredSessions}
          onSelectSession={(s) => setSelectedSession(s)}
        />
      </div>

      {/* Detail & Timeline Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSessionUpdated={loadData}
        />
      )}
    </div>
  );
};

