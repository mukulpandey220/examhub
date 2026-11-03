import React from 'react';
import { Eye, Shield, Lock, Clock, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { ProctoringEvent } from '../../types/index.js';

interface EvidenceViewerProps {
  event: ProctoringEvent;
  onClose: () => void;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({ event, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Authorized Evidence Snapshot Inspector
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Event ID: {event.id.substring(0, 13)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Simulated Snapshot Canvas with Model Bounding Guides */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
            {event.evidence_snapshot_url ? (
              <img
                src={event.evidence_snapshot_url}
                alt="Captured Snapshot"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                  <Shield className="h-8 w-8 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white uppercase tracking-wider">
                    {event.event_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Frame telemetry isolated at {new Date(event.observed_at).toLocaleTimeString()}.
                  </p>
                </div>
              </div>
            )}

            {/* Model Detection Tag */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-mono text-white backdrop-blur">
              <span>Confidence: {(event.confidence * 100).toFixed(1)}%</span>
              <span>•</span>
              <span>Duration: {(event.duration_ms / 1000).toFixed(1)}s</span>
            </div>

            {/* Signed Access Chip */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
              <Lock className="h-3 w-3" />
              <span>Signed Token Verified</span>
            </div>
          </div>

          {/* Model Telemetry & Audit Metadata */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-xs dark:bg-slate-800/40">
            <div>
              <span className="text-slate-500 block">Observed Timestamp:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {new Date(event.observed_at).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Severity Level:</span>
              <span className={`font-bold uppercase ${
                event.severity === 'high' ? 'text-red-600' : event.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'
              }`}>
                {event.severity}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Model Version:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {event.model_version}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Current Status:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                {event.review_status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Raw Detection JSON */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Structured Inference Telemetry
            </h4>
            <pre className="max-h-32 overflow-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 border border-slate-800">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
          <span>Human-in-the-loop validation principle active.</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-4 py-1.5 font-semibold text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

