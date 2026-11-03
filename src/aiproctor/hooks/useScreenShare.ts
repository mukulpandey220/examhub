import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket.js';

export interface ScreenLogEntry {
  timestamp: number;
  displaySurface: string;
  trackLabel: string;
  resolution: string;
  isEntireScreen: boolean;
  snapshotBase64?: string;
}

export interface UseScreenShareReturn {
  screenStream: MediaStream | null;
  isScreenSharing: boolean;
  displaySurface: string | null;
  isDisplaySurfaceValid: boolean;
  isEntireScreen: boolean;
  hasVirtualDevice: boolean;
  virtualDevices: string[];
  isMultiMonitor: boolean;
  isScreenTerminated: boolean;
  screenLogs: ScreenLogEntry[];
  error: string | null;
  advisory: string | null;
  startScreenShare: () => Promise<boolean>;
  stopScreenShare: () => void;
  recheckDevices: () => Promise<void>;
  resetTermination: () => void;
  captureScreenLog: (sessionId?: string) => Promise<ScreenLogEntry | null>;
}

// Strictly target video-spoofing virtual cameras (Exclude all audio drivers, Teams, Zoom, etc.)
const PROHIBITED_VIDEO_KEYWORDS = [
  'obs-camera',
  'obs virtual camera',
  'manycam',
  'epoccam',
  'camtwist',
  'droidcam',
  'iriun webcam',
  'fake webcam',
  'splitcam video',
];

export function useScreenShare(): UseScreenShareReturn {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [displaySurface, setDisplaySurface] = useState<string | null>(null);
  const [isDisplaySurfaceValid, setIsDisplaySurfaceValid] = useState(false);
  const [isEntireScreen, setIsEntireScreen] = useState(false);
  const [hasVirtualDevice, setHasVirtualDevice] = useState(false);
  const [virtualDevices, setVirtualDevices] = useState<string[]>([]);
  const [isMultiMonitor, setIsMultiMonitor] = useState(false);
  const [isScreenTerminated, setIsScreenTerminated] = useState(false);
  const [screenLogs, setScreenLogs] = useState<ScreenLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [advisory, setAdvisory] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const offscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const logTimerRef = useRef<any>(null);

  // 1. Scan for background video spoofing tools (excludes legitimate audio devices like Microsoft Teams / Zoom)
  const recheckDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const detectedVirtual: string[] = [];

      for (const dev of devices) {
        // Only inspect video input devices; ignore all microphones, speakers, and audio drivers
        if (dev.kind !== 'videoinput') continue;

        const label = (dev.label || '').toLowerCase();
        // Ignore benign conferencing software audio/video bridges
        if (label.includes('teams') || label.includes('zoom') || label.includes('facetime')) {
          continue;
        }

        for (const kw of PROHIBITED_VIDEO_KEYWORDS) {
          if (label.includes(kw)) {
            detectedVirtual.push(dev.label || kw);
            break;
          }
        }
      }

      setHasVirtualDevice(detectedVirtual.length > 0);
      setVirtualDevices(detectedVirtual);

      // Check for extended multi-monitor displays
      const isExtended = Boolean(
        (window.screen as any).isExtended ||
        window.screen.availWidth > window.screen.width * 1.45
      );
      setIsMultiMonitor(isExtended);
    } catch (err) {
      console.warn('Failed to enumerate media devices:', err);
    }
  }, []);

  useEffect(() => {
    recheckDevices();
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', recheckDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', recheckDevices);
      };
    }
  }, [recheckDevices]);

  // Helper to capture a lightweight snapshot frame and log metadata
  const captureScreenLog = useCallback(async (sessionId?: string): Promise<ScreenLogEntry | null> => {
    const stream = streamRef.current;
    if (!stream || !stream.active) return null;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return null;

    const settings = videoTrack.getSettings() as any;
    const surface = settings.displaySurface || 'unknown';
    const resolution = `${settings.width || 1280}x${settings.height || 720}`;
    const trackLabel = videoTrack.label || 'Screen Stream';

    let snapshotBase64: string | undefined;

    try {
      if (!offscreenVideoRef.current) {
        const v = document.createElement('video');
        v.muted = true;
        v.playsInline = true;
        offscreenVideoRef.current = v;
      }
      const v = offscreenVideoRef.current;
      if (v.srcObject !== stream) {
        v.srcObject = stream;
        await v.play().catch(() => {});
      }

      if (v.videoWidth > 0 && v.videoHeight > 0) {
        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement('canvas');
        }
        const canvas = offscreenCanvasRef.current;
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(v, 0, 0, 320, 180);
          snapshotBase64 = canvas.toDataURL('image/jpeg', 0.5);
        }
      }
    } catch {
      // Best-effort thumbnail capture
    }

    const entry: ScreenLogEntry = {
      timestamp: Date.now(),
      displaySurface: surface,
      trackLabel,
      resolution,
      isEntireScreen: surface === 'monitor',
      snapshotBase64,
    };

    setScreenLogs((prev) => [entry, ...prev.slice(0, 19)]);

    // Dispatch log to backend socket gateway
    if (sessionId) {
      try {
        const socket = getSocket();
        socket.emit('client:screenshare_log', {
          sessionId,
          displaySurface: surface,
          trackLabel,
          resolution,
          snapshotBase64,
          isSuspiciousSurface: surface !== 'monitor',
        });
      } catch {
        // Socket offline fallback
      }
    }

    return entry;
  }, []);

  // 2. Request Screen Share (Entire Screen, Window, or Tab allowed; logs captured for all)
  const startScreenShare = useCallback(async (): Promise<boolean> => {
    setError(null);
    setAdvisory(null);
    setIsScreenTerminated(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing API is not supported in this browser.');
      }

      // Re-check virtual capture tools
      await recheckDevices();

      // Request screen stream with monitor preference
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 10, max: 15 },
        } as any,
        audio: false,
      });

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('No video track returned from screen share.');
      }

      const settings = videoTrack.getSettings() as any;
      const surface = settings.displaySurface || 'window';
      const isEntire = surface === 'monitor';

      setDisplaySurface(surface);
      setIsEntireScreen(isEntire);
      setIsDisplaySurfaceValid(true);
      setIsScreenSharing(true);
      setScreenStream(stream);
      streamRef.current = stream;

      if (!isEntire) {
        setAdvisory(
          `ℹ️ Advisory: You shared a single ${surface}. Screen logs are actively recorded for invigilator review.`
        );
      }

      // Initial screen log capture
      captureScreenLog();

      // Setup periodic screen log capture every 12 seconds
      if (logTimerRef.current) clearInterval(logTimerRef.current);
      logTimerRef.current = setInterval(() => {
        captureScreenLog();
      }, 12000);

      // Listen for when student stops sharing
      videoTrack.onended = () => {
        setIsScreenSharing(false);
        setIsScreenTerminated(true);
        if (logTimerRef.current) clearInterval(logTimerRef.current);
        setAdvisory('⚠️ Screen sharing was disconnected. You can re-share screen at any time.');
      };

      return true;
    } catch (err: any) {
      setIsScreenSharing(false);
      if (err.name === 'NotAllowedError') {
        setError('Screen share was cancelled. Screen logging is recommended for examination compliance.');
      } else {
        setError(err.message || 'Failed to start screen sharing.');
      }
      return false;
    }
  }, [recheckDevices, captureScreenLog]);

  // 3. Stop screen share
  const stopScreenShare = useCallback(() => {
    if (logTimerRef.current) {
      clearInterval(logTimerRef.current);
      logTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);
    setIsScreenTerminated(false);
    setIsDisplaySurfaceValid(false);
    setIsEntireScreen(false);
  }, []);

  const resetTermination = useCallback(() => {
    setIsScreenTerminated(false);
    setError(null);
    setAdvisory(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (logTimerRef.current) clearInterval(logTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    screenStream,
    isScreenSharing,
    displaySurface,
    isDisplaySurfaceValid,
    isEntireScreen,
    hasVirtualDevice,
    virtualDevices,
    isMultiMonitor,
    isScreenTerminated,
    screenLogs,
    error,
    advisory,
    startScreenShare,
    stopScreenShare,
    recheckDevices,
    resetTermination,
    captureScreenLog,
  };
}
