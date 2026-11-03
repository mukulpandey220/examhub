import React, { useState, useEffect } from 'react';
import { Sun, Minimize2, Maximize2, AlertCircle, Smartphone } from 'lucide-react';
import { AIFrameResponse } from '../../types/index.js';
import { ProctoringWarning } from '../../hooks/useProctoringStream.js';

interface WebcamMonitorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream?: MediaStream | null;
  isCameraReady: boolean;
  aiResponse: AIFrameResponse | null;
  warnings: ProctoringWarning[];
  onDismissWarning: (id: string) => void;
  latencyMs?: number;
  fps?: number;
  tabSwitchCount?: number;
  windowSwitchCount?: number;
  isWindowFocused?: boolean;
  isTabVisible?: boolean;
}

export const WebcamMonitor: React.FC<WebcamMonitorProps> = ({
  videoRef,
  stream,
  isCameraReady,
  aiResponse,
  warnings,
  onDismissWarning,
  latencyMs = 0,
  fps = 0,
  tabSwitchCount = 0,
  windowSwitchCount = 0,
  isWindowFocused = true,
  isTabVisible = true,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Bind the media stream to this video element as soon as it mounts in the DOM
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
        video.play().catch((err) => {
          console.warn('Webcam playback auto-play was blocked or delayed:', err);
        });
      }
    }
  }, [stream, videoRef]);

  const faceCount = aiResponse ? aiResponse.face_count : null;
  const isDeviated = aiResponse?.head_pose?.is_deviated ?? false;
  const deviationDir = aiResponse?.head_pose?.deviation_direction;
  const lightingStatus = aiResponse?.lighting?.status ?? (isCameraReady ? 'adequate' : 'offline');
  const detectedObjects = aiResponse?.objects || [];
  const hasSuspiciousDevice = detectedObjects.length > 0;
  const isNoFaceWarningActive = warnings.some((w) => w.eventType === 'NO_FACE_DETECTED');

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2 pointer-events-none">
      {/* Dynamic Warning Notification Banners */}
      <div className="w-80 space-y-2 pointer-events-auto">
        {warnings.map((w) => (
          <div
            key={w.id}
            className={`flex items-start justify-between rounded-xl p-3 shadow-lg backdrop-blur-md transition-all animate-bounce ${
              w.severity === 'high'
                ? 'bg-red-500/95 text-white'
                : w.severity === 'technical'
                ? 'bg-amber-500/95 text-white'
                : 'bg-indigo-600/95 text-white'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-90">{w.eventType.replace(/_/g, ' ')}</p>
                <p className="text-xs font-medium mt-0.5 leading-snug">{w.message}</p>
              </div>
            </div>
            <button
              onClick={() => onDismissWarning(w.id)}
              className="text-white/80 hover:text-white text-xs font-bold ml-2 px-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Floating Camera Preview Widget */}
      <div className="w-72 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 pointer-events-auto transition-all">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-2 py-1 text-xs border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCameraReady ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isCameraReady ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">AI Proctor Feed</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({latencyMs > 0 ? `${latencyMs}ms` : 'active'})
            </span>
          </div>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
            title={isMinimized ? 'Expand Camera Preview' : 'Minimize Camera Preview'}
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Video Canvas Container (always kept mounted in DOM so stream & frame capture never drop) */}
        <div className={isMinimized ? 'hidden' : 'space-y-2'}>
          <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-950 transition-all ${
            hasSuspiciousDevice
              ? 'border-2 border-red-500 shadow-lg shadow-red-500/30'
              : 'border border-slate-200 dark:border-slate-800'
          }`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover -scale-x-100"
            />

            {/* Status Overlay Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {/* Suspicious Device Alert Badge */}
              {hasSuspiciousDevice && (
                <span className="rounded-md px-2 py-0.5 text-[10px] font-black backdrop-blur bg-red-600/95 text-white shadow-md animate-pulse flex items-center gap-1 border border-red-300">
                  <Smartphone className="h-3 w-3" />
                  <span>🚨 {detectedObjects[0].label} Detected</span>
                </span>
              )}

              {/* Face count / Detection status chip */}
              {faceCount !== null ? (
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur text-white shadow-sm ${
                    faceCount === 1
                      ? 'bg-emerald-500/80'
                      : faceCount === 0
                      ? isNoFaceWarningActive
                        ? 'bg-red-600 font-extrabold animate-pulse border border-red-300'
                        : 'bg-red-500/90'
                      : 'bg-amber-500/90'
                  }`}
                >
                  {faceCount === 1
                    ? '1 Face Visible'
                    : faceCount === 0
                    ? isNoFaceWarningActive
                      ? '⚠️ Suspicious: No Face (>15s)'
                      : 'No Face Detected'
                    : `${faceCount} Faces Detected`}
                </span>
              ) : (
                <span className="rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur bg-blue-500/80 text-white shadow-sm">
                  {isCameraReady ? 'Analyzing Video...' : 'Connecting Camera...'}
                </span>
              )}

              {/* Gaze Chip */}
              {faceCount !== null && faceCount > 0 && (
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur text-white shadow-sm ${
                    isDeviated ? 'bg-amber-500/90' : 'bg-blue-500/80'
                  }`}
                >
                  {isDeviated ? `Looking ${deviationDir || 'Away'}` : 'Gaze Centered'}
                </span>
              )}
            </div>

            {/* Lighting Badge bottom right */}
            <div className="absolute bottom-2 right-2">
              <span
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium backdrop-blur text-white ${
                  lightingStatus === 'adequate'
                    ? 'bg-black/60'
                    : 'bg-amber-500/80'
                }`}
              >
                <Sun className="h-3 w-3" />
                <span>{lightingStatus}</span>
              </span>
            </div>
          </div>

          {/* Bottom telemetry indicators */}
          <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-slate-500 pt-1">
            <div className="rounded bg-slate-100 dark:bg-slate-800 py-1">
              <span className="block font-bold text-slate-700 dark:text-slate-300">Rate</span>
              <span>{fps > 0 ? `${fps} FPS` : isCameraReady ? '1.0 FPS' : '0 FPS'}</span>
            </div>
            <div className="rounded bg-slate-100 dark:bg-slate-800 py-1">
              <span className="block font-bold text-slate-700 dark:text-slate-300">Focus</span>
              {!isTabVisible ? (
                <span className="text-red-500 font-bold animate-pulse">Tab Left ({tabSwitchCount})</span>
              ) : !isWindowFocused ? (
                <span className="text-amber-500 font-bold">Blur ({windowSwitchCount})</span>
              ) : (
                <span className="text-emerald-600 font-semibold">Active</span>
              )}
            </div>
            <div className="rounded bg-slate-100 dark:bg-slate-800 py-1">
              <span className="block font-bold text-slate-700 dark:text-slate-300">Switches</span>
              <span className={tabSwitchCount + windowSwitchCount > 0 ? 'text-amber-500 font-bold' : 'text-slate-600'}>
                {tabSwitchCount + windowSwitchCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
