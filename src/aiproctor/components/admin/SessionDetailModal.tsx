import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Shield,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Search,
} from 'lucide-react';
import { ProctoringSession, ProctoringEvent } from '../../types/index.js';
import { api } from '../../services/api.js';
import { EvidenceViewer } from './EvidenceViewer.js';
import { ReviewDecisionForm } from './ReviewDecisionForm.js';

interface SessionDetailModalProps {
  session: ProctoringSession;
  onClose: () => void;
  onSessionUpdated: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  onClose,
  onSessionUpdated,
}) => {
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventForEvidence, setSelectedEventForEvidence] = useState<ProctoringEvent | null>(null);
  const [activeReviewEvent, setActiveReviewEvent] = useState<ProctoringEvent | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSessionEvents(session.id);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load session events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [session.id]);

  const handleExport = async () => {
    try {
      const report = await api.exportSessionReport(session.id);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `proctoring_report_${session.id.substring(0, 8)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filterType === 'ALL') return true;
    return e.event_type === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <img
              src={session.student?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'}
              alt="Candidate"
              className="h-10 w-10 rounded-full border border-slate-300 bg-white dark:border-slate-700"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {session.student?.full_name || 'Candidate Alex Mercer'}
                </h3>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {session.student?.student_id || 'STU-2026-8911'}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                  session.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {session.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Session ID: <span className="font-mono">{session.id}</span> • Started {new Date(session.started_at).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Audit Report</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body Layout: Timeline (Left 7 cols) + Review Desk (Right 5 cols) */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
          {/* Chronological Event Timeline */}
          <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 lg:col-span-7 overflow-hidden dark:border-slate-800">
            {/* Filter Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Chronological Event Log ({filteredEvents.length})
              </span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="ALL">All Event Types</option>
                <option value="TAB_SWITCH_DETECTED">Tab Switch Detected</option>
                <option value="WINDOW_SWITCH_DETECTED">Window Switch Detected</option>
                <option value="FULLSCREEN_EXITED">Fullscreen Exited</option>
                <option value="FUNCTION_KEY_PRESSED">Function Key Pressed</option>
                <option value="NO_FACE_DETECTED">No Face Detected</option>
                <option value="MULTIPLE_FACES_DETECTED">Multiple Faces</option>
                <option value="HEAD_POSE_DEVIATION">Head Pose / Gaze</option>
                <option value="BROWSER_FOCUS_LOST">Browser Focus Lost</option>
                <option value="CAMERA_DISCONNECTED">Camera Disconnected</option>
              </select>
            </div>

            {/* Event List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <p className="text-center py-10 text-xs text-slate-500">Loading timeline...</p>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                  <p className="text-xs font-medium">No behavioral or technical flags detected.</p>
                </div>
              ) : (
                filteredEvents.map((ev) => {
                  const isSelectedForReview = activeReviewEvent?.id === ev.id;
                  return (
                    <div
                      key={ev.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        isSelectedForReview
                          ? 'border-blue-500 bg-blue-50/40 dark:border-blue-700 dark:bg-blue-950/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            ev.severity === 'high' ? 'bg-red-500' : ev.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            {ev.event_type.replace(/_/g, ' ')}
                          </h4>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {(ev.confidence * 100).toFixed(0)}% Conf
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(ev.observed_at).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        {ev.event_type === 'FUNCTION_KEY_PRESSED' ? (
                          <div className="flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
                            <span className="rounded bg-red-100 dark:bg-red-950/50 px-1.5 py-0.5 font-mono font-bold">
                              {ev.metadata?.key}
                            </span>
                            <span>{ev.metadata?.purpose || 'Function / Inspection Key'} pressed</span>
                          </div>
                        ) : ev.metadata?.reason || `Observed deviation lasting ${(ev.duration_ms / 1000).toFixed(1)}s.`}
                      </div>

                      {/* Action buttons */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                        <span className={`text-[11px] font-semibold capitalize ${
                          ev.review_status === 'reviewed_no_concern'
                            ? 'text-emerald-600'
                            : ev.review_status === 'requires_follow_up'
                            ? 'text-amber-600'
                            : ev.review_status === 'technical_issue'
                            ? 'text-blue-600'
                            : 'text-slate-500'
                        }`}>
                          ● {ev.review_status.replace(/_/g, ' ')}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedEventForEvidence(ev)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Snapshot</span>
                          </button>
                          <button
                            onClick={() => setActiveReviewEvent(ev)}
                            className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 shadow-sm"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Active Review Form or Candidate Info */}
          <div className="lg:col-span-5 p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
            {activeReviewEvent ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Determining Flag: {activeReviewEvent.event_type.replace(/_/g, ' ')}
                  </h4>
                  <button
                    onClick={() => setActiveReviewEvent(null)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Close Review Desk
                  </button>
                </div>

                <ReviewDecisionForm
                  event={activeReviewEvent}
                  onReviewed={(updated) => {
                    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
                    setActiveReviewEvent(null);
                    onSessionUpdated();
                  }}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                    Candidate Session Diagnostics
                  </h4>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-xs space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Candidate Name:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{session.student?.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student Email:</span>
                      <span className="text-slate-700 dark:text-slate-300">{session.student?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Client IP Address:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{session.client_ip || '192.168.1.104'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">User Agent:</span>
                      <span className="truncate max-w-[200px] text-slate-600" title={session.user_agent}>
                        {session.user_agent || 'Chrome 122 (macOS)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Heartbeat Status:</span>
                      <span className="text-emerald-600 font-bold">Active Stream</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-300 space-y-2">
                  <h5 className="font-bold flex items-center gap-1.5">
                    <Shield className="h-4 w-4" />
                    <span>Human Invigilator Authority Principle</span>
                  </h5>
                  <p className="leading-relaxed">
                    Select any timeline event on the left to inspect the evidentiary frame snapshot or to assign an institutional determination. The student will not be disqualified without authorized human review.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Snapshot Evidence Viewer Modal */}
      {selectedEventForEvidence && (
        <EvidenceViewer
          event={selectedEventForEvidence}
          onClose={() => setSelectedEventForEvidence(null)}
        />
      )}
    </div>
  );
};

