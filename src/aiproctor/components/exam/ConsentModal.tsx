import React, { useState } from 'react';
import { Shield, Eye, Lock, CheckSquare, Square, AlertTriangle } from 'lucide-react';

interface ConsentModalProps {
  onAgreeAndStart: () => void;
  examTitle: string;
  durationMinutes: number;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  onAgreeAndStart,
  examTitle,
  durationMinutes,
}) => {
  const [agreedTelemetry, setAgreedTelemetry] = useState(false);
  const [agreedHonorCode, setAgreedHonorCode] = useState(false);

  const canProceed = agreedTelemetry && agreedHonorCode;

  return (
    <div className="mx-auto max-w-3xl py-8 px-4 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            Step 2 of 3: Ethical AI Monitoring & Consent Disclosure
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Institutional Examination Consent
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Please read the transparent monitoring principles governing <strong>{examTitle}</strong> ({durationMinutes} minutes).
          </p>
        </div>

        {/* Ethical Guarantees & Transparency Cards */}
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
            <div className="flex gap-3">
              <Eye className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">What Behavioral Signals Are Monitored</h4>
                <ul className="mt-1 list-disc list-inside text-xs text-blue-800/80 dark:text-blue-200/80 space-y-1">
                  <li>Face presence and multiple-face detection in the webcam frame.</li>
                  <li>Head pose orientation (prolonged looking away from the primary display).</li>
                  <li>Browser tab visibility, window focus changes, and function keys (F1–F12).</li>
                  <li>Entire screen activity to verify zero unauthorized background processes (Discord, Zoom, AI tools).</li>
                  <li>Browser extension injection monitoring: all Chrome extensions must remain turned off.</li>
                  <li>Camera hardware availability and network connectivity.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Student Privacy Protections</h4>
                <ul className="mt-1 list-disc list-inside text-xs text-emerald-800/80 dark:text-emerald-200/80 space-y-1">
                  <li><strong>No Identity Recognition:</strong> The system does not match your face against external biometric databases.</li>
                  <li><strong>Human-in-the-Loop Only:</strong> AI outputs are evidentiary review signals. <em>No student is ever automatically disqualified or accused by an algorithm</em>.</li>
                  <li><strong>Access Restricted:</strong> Snapshots of flagged events are strictly restricted to authorized human invigilators with audit logging.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">Technical Issues & False Positives</h4>
                <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-200/80">
                  Temporary lighting drops, coughing, or brief occlusions are handled with debounced duration thresholds. If a technical issue occurs, notify your human invigilator via the interface.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Checkbox Acknowledgment */}
        <div className="mt-6 space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setAgreedTelemetry(!agreedTelemetry)}
              className="mt-0.5 text-blue-600 focus:outline-none"
            >
              {agreedTelemetry ? (
                <CheckSquare className="h-5 w-5" />
              ) : (
                <Square className="h-5 w-5 text-slate-400" />
              )}
            </button>
            <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              I acknowledge and consent to the automated capture of camera frames and behavioral telemetry for real-time invigilator review during this examination.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setAgreedHonorCode(!agreedHonorCode)}
              className="mt-0.5 text-blue-600 focus:outline-none"
            >
              {agreedHonorCode ? (
                <CheckSquare className="h-5 w-5" />
              ) : (
                <Square className="h-5 w-5 text-slate-400" />
              )}
            </button>
            <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              I certify that I am completing this examination independently, without unauthorized collaboration or unapproved external devices.
            </span>
          </label>
        </div>

        {/* Enter Exam Room Button */}
        <div className="mt-6">
          <button
            disabled={!canProceed}
            onClick={onAgreeAndStart}
            className={`w-full rounded-xl py-3 px-4 text-sm font-bold text-white transition-all shadow-lg ${
              canProceed
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 active:scale-[0.98]'
                : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500'
            }`}
          >
            {canProceed ? 'Agree & Enter Examination Room 🚀' : 'Confirm Both Agreements Above'}
          </button>
        </div>
      </div>
    </div>
  );
};

