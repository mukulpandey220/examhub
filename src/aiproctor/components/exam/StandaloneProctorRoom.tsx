import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Maximize2,
  Lock,
  Volume2,
  Eye,
  CheckCircle2,
  LogOut,
  Timer,
  AlertTriangle,
  Smartphone,
  ScreenShare,
  Puzzle,
} from 'lucide-react';
import { Examination, ExamAttempt, ProctoringSession, DetectedObject } from '../../types/index.js';

interface StandaloneProctorRoomProps {
  examination: Examination;
  attempt: ExamAttempt;
  session: ProctoringSession | null;
  isFullscreen: boolean;
  onEnterFullscreen: () => void;
  onConcludeSession: () => void;
  tabSwitchCount: number;
  windowSwitchCount: number;
  fullscreenExitCount: number;
  suspectDeviceAlert?: DetectedObject | null;
  onDismissDeviceAlert?: () => void;
  isScreenSharing?: boolean;
  isScreenTerminated?: boolean;
  onReStartScreenShare?: () => Promise<boolean>;
}

export const StandaloneProctorRoom: React.FC<StandaloneProctorRoomProps> = ({
  examination,
  attempt,
  session,
  isFullscreen,
  onEnterFullscreen,
  onConcludeSession,
  tabSwitchCount,
  windowSwitchCount,
  fullscreenExitCount,
  suspectDeviceAlert,
  onDismissDeviceAlert,
  isScreenSharing = true,
  isScreenTerminated = false,
  onReStartScreenShare,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalViolations = tabSwitchCount + windowSwitchCount + fullscreenExitCount;

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6">
      {/* Top Session Status Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Proctoring Shield Active
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Session: {session?.id ? session.id.slice(0, 8) : 'Live'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {examination.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Automated behavioral monitoring, computer vision verification, and audit logging active.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Session Timer */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-slate-800 dark:text-slate-200 font-mono font-bold text-lg">
              <Timer className="h-5 w-5 text-blue-600" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>

            {/* Conclude Session Button */}
            <button
              onClick={onConcludeSession}
              className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold px-4 py-2 text-sm shadow-md transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>End Proctoring</span>
            </button>
          </div>
        </div>

        {/* Real-time Enforced Security Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          {/* Pillar 1: Fullscreen */}
          <div
            className={`rounded-xl p-3 border transition-all ${
              isFullscreen
                ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40'
                : 'bg-red-50/60 border-red-200 dark:bg-red-950/20 dark:border-red-800/40 cursor-pointer'
            }`}
            onClick={!isFullscreen ? onEnterFullscreen : undefined}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Fullscreen Mode</span>
              <Maximize2 className={`h-4 w-4 ${isFullscreen ? 'text-emerald-600' : 'text-red-500'}`} />
            </div>
            <div className="text-xs font-semibold">
              {isFullscreen ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Locked Active
                </span>
              ) : (
                <span className="text-red-600 font-bold underline">Click to Re-enter ⛶</span>
              )}
            </div>
          </div>

          {/* Pillar 2: Screen & Process Defense */}
          <div
            className={`rounded-xl p-3 border transition-all ${
              isScreenSharing && !isScreenTerminated
                ? 'bg-blue-50/60 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/40'
                : 'bg-red-50/60 border-red-200 dark:bg-red-950/20 dark:border-red-800/40 cursor-pointer'
            }`}
            onClick={(!isScreenSharing || isScreenTerminated) && onReStartScreenShare ? () => onReStartScreenShare() : undefined}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Screen & Process</span>
              <ScreenShare className={`h-4 w-4 ${isScreenSharing && !isScreenTerminated ? 'text-blue-600' : 'text-red-500'}`} />
            </div>
            <div className="text-xs font-semibold">
              {isScreenSharing && !isScreenTerminated ? (
                <span className="text-blue-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Entire Screen Active
                </span>
              ) : (
                <span className="text-red-600 font-bold underline">Click to Re-share ⛶</span>
              )}
            </div>
          </div>

          {/* Pillar 3: Keyboard Defense */}
          <div className="rounded-xl p-3 bg-indigo-50/60 border border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Keyboard Defense</span>
              <Lock className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              F1–F12 & DevTools Shielded
            </div>
          </div>

          {/* Pillar 4: Gaze & Face Tracking */}
          <div className="rounded-xl p-3 bg-purple-50/60 border border-purple-200 dark:bg-purple-950/20 dark:border-purple-800/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Vision Inference</span>
              <Eye className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              MediaPipe Hybrid Tracking
            </div>
          </div>

          {/* Pillar 5: Extension Shield */}
          <div className="rounded-xl p-3 bg-emerald-50/60 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Extension Shield</span>
              <Puzzle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              DOM Injections Blocked
            </div>
          </div>
        </div>
      </div>

      {/* Main Guidance Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Examination Proctoring Workspace Instructions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your test session is actively recorded and protected.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <p>
            This standalone proctor session is actively running. All observable visual signals (face presence, head orientation, lighting levels) and browser telemetry (tab switches, window focus changes, function keys) are securely relayed to the authorized invigilator dashboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                1. Stay in Fullscreen
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Do not minimize the browser or press Escape. If fullscreen is exited, an immediate alert and beep will trigger.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                2. Gaze Centered
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Keep your camera centered on your face. Repeated or prolonged looking away from the screen will be marked for review.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                3. Zero External Windows
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Opening other tabs or external programs (Alt+Tab, Cmd+Tab) is logged as an environment switch event.
              </p>
            </div>
          </div>

          {/* Current Session Telemetry Counters */}
          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Candidate Behavior Telemetry</span>
              <span className={totalViolations > 0 ? 'text-amber-500 font-bold' : 'text-emerald-600 font-semibold'}>
                {totalViolations === 0 ? '✓ Clean Record' : `⚠️ ${totalViolations} Event(s) Recorded`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-white dark:bg-slate-900 p-3 shadow-sm border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Tab Switches</span>
                <div className={`text-xl font-bold mt-1 ${tabSwitchCount > 0 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>
                  {tabSwitchCount}
                </div>
              </div>

              <div className="rounded-lg bg-white dark:bg-slate-900 p-3 shadow-sm border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Window Blurs</span>
                <div className={`text-xl font-bold mt-1 ${windowSwitchCount > 0 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>
                  {windowSwitchCount}
                </div>
              </div>

              <div className="rounded-lg bg-white dark:bg-slate-900 p-3 shadow-sm border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Fullscreen Exits</span>
                <div className={`text-xl font-bold mt-1 ${fullscreenExitCount > 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                  {fullscreenExitCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 Suspicious Device Detected High-Priority Modal Popup */}
      {suspectDeviceAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border-2 border-red-500 bg-white p-7 shadow-2xl dark:bg-slate-900 text-center space-y-5 ring-8 ring-red-500/20">
            {/* Pulsing Alarm Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xl shadow-red-500/30 animate-pulse">
              <Smartphone className="h-10 w-10" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-950/80 px-3 py-1 text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest mb-2 border border-red-200 dark:border-red-800">
                🚨 Security Violation Alert
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Suspicious Device Detected!
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                The AI Proctor computer vision engine has identified an unauthorized electronic or recording device (<span className="font-extrabold text-red-600 capitalize">{suspectDeviceAlert.label.replace(/_/g, ' ')}</span>, confidence: <span className="font-mono font-bold text-slate-900 dark:text-white">{Math.round(suspectDeviceAlert.confidence * 100)}%</span>) in your camera field of view.
              </p>
            </div>

            {/* Instruction Checklist */}
            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-xs text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 text-left space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>Immediate Corrective Actions Required:</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 pl-1 leading-relaxed">
                <li>Remove any mobile phones, cameras, smartwatches, or tablets completely from your desk and sight line.</li>
                <li>Ensure both hands remain on the keyboard/mouse and your gaze stays forward.</li>
                <li>This incident timestamp and snapshot have been relayed to the exam audit log.</li>
              </ul>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={onDismissDeviceAlert}
              className="w-full rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 py-3.5 px-6 font-bold text-white text-sm shadow-lg shadow-red-500/30 hover:from-red-700 hover:to-rose-800 active:scale-[0.98] transition-all cursor-pointer"
            >
              I Have Removed the Device
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ Screen Sharing Disconnected Advisory Banner */}
      {isScreenTerminated && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2.5 shadow-xl flex items-center justify-between border-b border-amber-700 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
            <span>⚠️ Screen Sharing Disconnected: Screen activity logging is paused (Incident logged for invigilator review).</span>
          </div>
          {onReStartScreenShare && (
            <button
              onClick={onReStartScreenShare}
              className="rounded-lg bg-white px-3.5 py-1 text-xs font-bold text-amber-800 shadow-md hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <ScreenShare className="h-3.5 w-3.5" />
              <span>Re-share Screen ⛶</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

