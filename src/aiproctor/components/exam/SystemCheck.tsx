import React, { useState, useEffect } from 'react';
import {
  Camera,
  Mic,
  Monitor,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ScreenShare,
  Puzzle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  detectActiveExtensions,
  startExtensionWatcher,
  DetectedExtension,
} from '../../utils/extensionDetector.js';

interface SystemCheckProps {
  onPassed: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  stream?: MediaStream | null;
  isCameraReady: boolean;
  cameraError: string | null;
  onRetryCamera: () => void;
  // Screen Sharing & Process Integrity
  screenStream: MediaStream | null;
  isScreenSharing: boolean;
  isDisplaySurfaceValid: boolean;
  isEntireScreen?: boolean;
  hasVirtualDevice: boolean;
  virtualDevices: string[];
  screenError: string | null;
  advisory?: string | null;
  onStartScreenShare: () => Promise<boolean>;
  onRecheckDevices: () => Promise<void>;
}

export const SystemCheck: React.FC<SystemCheckProps> = ({
  onPassed,
  videoRef,
  stream,
  isCameraReady,
  cameraError,
  onRetryCamera,
  screenStream,
  isScreenSharing,
  isDisplaySurfaceValid,
  isEntireScreen = false,
  hasVirtualDevice,
  virtualDevices,
  screenError,
  advisory,
  onStartScreenShare,
  onRecheckDevices,
}) => {
  const [micLevel, setMicLevel] = useState<number>(0);
  const [isMicDetected, setIsMicDetected] = useState(false);
  const [isResolutionOk, setIsResolutionOk] = useState(true);
  const [screenDim, setScreenDim] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Chrome Extension state
  const [activeExtensions, setActiveExtensions] = useState<DetectedExtension[]>([]);
  const [isScanningExtensions, setIsScanningExtensions] = useState(false);

  // Attach webcam stream to preview
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().catch(console.warn);
        };
      }
      if (video.paused) {
        video.play().catch(console.warn);
      }
    }
  }, [stream, videoRef]);

  // 1. Check screen dimensions
  useEffect(() => {
    const handleResize = () => {
      setScreenDim({ w: window.innerWidth, h: window.innerHeight });
      setIsResolutionOk(window.innerWidth >= 1024 && window.innerHeight >= 600);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Audio level meter test
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let localAudioStream: MediaStream | null = null;
    let animId: number;

    const setupMic = async () => {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localAudioStream = audioStream;
        setIsMicDetected(true);
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        microphone = audioContext.createMediaStreamSource(audioStream);
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
          setMicLevel(Math.min(100, Math.round(average * 1.5)));
          animId = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch (err) {
        setIsMicDetected(false);
      }
    };

    setupMic();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (localAudioStream) {
        localAudioStream.getTracks().forEach((track) => track.stop());
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

  // 3. Extension Scanner & Real-time Watcher
  const handleScanExtensions = () => {
    setIsScanningExtensions(true);
    const result = detectActiveExtensions();
    setActiveExtensions(result.extensions);
    setTimeout(() => setIsScanningExtensions(false), 400);
  };

  useEffect(() => {
    handleScanExtensions();
    const cleanupWatcher = startExtensionWatcher((ext) => {
      setActiveExtensions((prev) => {
        if (prev.some((e) => e.name === ext.name)) return prev;
        return [...prev, ext];
      });
    });
    return () => cleanupWatcher();
  }, []);

  // Policy: Let all students in! Capture logs, report warnings, and take action.
  const hasExtensions = activeExtensions.length > 0;
  const allPassed = isCameraReady && isResolutionOk;

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            Step 1 of 3: Pre-Flight Environmental Verification
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System, Extension & Screen Logging Verification
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Hardware readiness check, browser extension scanning, and screen sharing capture logs are actively initialized.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Video Preview & Active Screen Status */}
          <div className="lg:col-span-6 flex flex-col items-center space-y-4">
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-950 dark:border-slate-800 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover -scale-x-100"
              />

              {/* Status overlay */}
              {isCameraReady ? (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-medium text-white backdrop-blur shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Camera Active (640×480)</span>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="h-10 w-10 text-amber-500 animate-pulse" />
                  <p className="mt-3 text-sm font-semibold text-white">
                    {cameraError || 'Awaiting webcam permission...'}
                  </p>
                  <button
                    onClick={onRetryCamera}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Grant / Retry Camera</span>
                  </button>
                </div>
              )}

              {/* Screen Share Active badge */}
              {isScreenSharing && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-blue-600/90 px-3 py-1 text-xs font-bold text-white backdrop-blur shadow-sm">
                  <ScreenShare className="h-3.5 w-3.5" />
                  <span>{isEntireScreen ? 'Entire Screen Logged' : 'Window / Tab Logged'}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 text-center">
              Please face forward in good lighting. Screen activity and camera frames will be logged for invigilation.
            </p>
          </div>

          {/* Right: Security & Environmental Diagnostic Checklist */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Check 1: Camera */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isCameraReady ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Webcam Stream</p>
                    <p className="text-xs text-slate-500">
                      {isCameraReady ? 'Hardware Live & Validated' : 'Waiting for Camera Authorization'}
                    </p>
                  </div>
                </div>
                {isCameraReady ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
              </div>

              {/* Check 2: Microphone */}
              <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                      <Mic className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Audio Input Meter</p>
                      <p className="text-xs text-slate-500">
                        {isMicDetected ? 'Microphone responding' : 'Ambient sound test'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600">{micLevel}%</span>
                </div>
                <div className="mt-3 w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-75"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
              </div>

              {/* Check 3: Browser Extension Scanner */}
              <div
                className={`flex flex-col rounded-xl border p-3.5 transition-all ${
                  hasExtensions
                    ? 'border-amber-300 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        hasExtensions
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      }`}
                    >
                      <Puzzle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Chrome Extensions Status
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {hasExtensions
                          ? `⚠️ ${activeExtensions.length} Extension(s) Noted (Will be logged)`
                          : 'Zero Extensions Active (Clean Environment)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleScanExtensions}
                      title="Re-scan for extensions"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      <RefreshCw className={`h-4 w-4 ${isScanningExtensions ? 'animate-spin' : ''}`} />
                    </button>
                    {!hasExtensions ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                        Logged
                      </span>
                    )}
                  </div>
                </div>

                {hasExtensions && (
                  <div className="mt-3 pt-2 border-t border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-semibold">Extensions Identified:</p>
                    <ul className="list-disc list-inside space-y-0.5 pl-1">
                      {activeExtensions.map((ext, idx) => (
                        <li key={idx}>
                          <strong>{ext.name}</strong>: {ext.detail}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                      ℹ️ You may proceed. These extensions are captured in your session audit logs for the invigilator.
                    </p>
                  </div>
                )}
              </div>

              {/* Check 4: Screen Sharing & Log Capture */}
              <div
                className={`flex flex-col rounded-xl border p-3.5 transition-all ${
                  isScreenSharing
                    ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isScreenSharing
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                      }`}
                    >
                      <ScreenShare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Screen Sharing & Activity Logger
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isScreenSharing
                          ? `✓ Screen Logging Active (${isEntireScreen ? 'Entire Screen' : 'Window / Tab'})`
                          : 'Capture screen activity during test'}
                      </p>
                    </div>
                  </div>

                  {isScreenSharing ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <button
                      onClick={onStartScreenShare}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ScreenShare className="h-3.5 w-3.5" />
                      <span>Start Screen Share</span>
                    </button>
                  )}
                </div>

                {/* Virtual Video Device Advisory */}
                {hasVirtualDevice && (
                  <div className="mt-3 pt-2 border-t border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Virtual Camera Driver Noted:
                    </p>
                    <p className="font-mono text-[11px] bg-amber-100/80 dark:bg-amber-900/50 p-1.5 rounded">
                      {virtualDevices.join(', ')}
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      ℹ️ Virtual video driver logged. If unexpected, please ensure your physical webcam is selected.
                    </p>
                  </div>
                )}

                {/* Screen Share Advisory / Error */}
                {advisory && (
                  <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <Info className="h-4 w-4 shrink-0" />
                    <p className="font-medium leading-relaxed">{advisory}</p>
                  </div>
                )}

                {screenError && (
                  <div className="mt-3 pt-2 border-t border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-medium leading-relaxed">{screenError}</p>
                  </div>
                )}
              </div>

              {/* Check 5: Screen Resolution */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isResolutionOk ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Screen Viewport</p>
                    <p className="text-xs text-slate-500">{screenDim.w} × {screenDim.h} (Min: 1024×600)</p>
                  </div>
                </div>
                {isResolutionOk ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>

            {/* Action / Continue Button */}
            <div className="pt-2">
              <button
                disabled={!allPassed}
                onClick={onPassed}
                className={`w-full rounded-xl py-3 px-4 text-sm font-bold text-white transition-all shadow-lg ${
                  allPassed
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 active:scale-[0.98] cursor-pointer'
                    : 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500 dark:text-slate-400'
                }`}
              >
                {allPassed
                  ? hasExtensions || !isScreenSharing
                    ? 'Continue to Consent Disclosure (Warnings Logged) →'
                    : 'All Checks Verified → Continue to Consent Disclosure'
                  : !isCameraReady
                  ? '⚠️ Authorize Camera to Proceed'
                  : 'Complete Verification Checks to Proceed'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
