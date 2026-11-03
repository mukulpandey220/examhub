import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { AIFrameResponse, DetectedObject } from '../types/index.js';
import { playWarningBeep } from '../utils/audioAlert.js';
import { startExtensionWatcher } from '../utils/extensionDetector.js';

export interface ProctoringWarning {
  id: string;
  eventType: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'technical';
  timestamp: number;
}

export function useProctoringStream(
  sessionId: string | null,
  examId: string | null,
  videoRef: React.RefObject<HTMLVideoElement>,
  isCameraReady: boolean,
  sampleIntervalMs = 1500,
  isScreenTerminated = false
) {
  const [latestAiResponse, setLatestAiResponse] = useState<AIFrameResponse | null>(null);
  const [suspectDeviceAlert, setSuspectDeviceAlert] = useState<DetectedObject | null>(null);
  const [warnings, setWarnings] = useState<ProctoringWarning[]>([]);
  const [isSampling, setIsSampling] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);

  // Behavioral counts and environment state
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [windowSwitchCount, setWindowSwitchCount] = useState<number>(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState<number>(0);
  const [isWindowFocused, setIsWindowFocused] = useState<boolean>(true);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false;
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<any>(null);
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(Date.now());

  const tabHiddenStartTimeRef = useRef<number | null>(null);
  const windowBlurStartTimeRef = useRef<number | null>(null);
  const lastDeviceAlertTimeRef = useRef<number>(0);
  const faceAbsenceStartTimeRef = useRef<number | null>(null);
  const faceAbsenceAlertDispatchedRef = useRef<boolean>(false);

  // Helper to push warnings with audio alert and auto-dismiss
  const pushWarning = useCallback((warning: {
    eventType: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'technical';
  }) => {
    const newWarning: ProctoringWarning = {
      id: Math.random().toString(36).substring(2, 9),
      eventType: warning.eventType,
      message: warning.message,
      severity: warning.severity,
      timestamp: Date.now(),
    };

    // Synthesize audible warning tone (Web Audio API)
    playWarningBeep(warning.severity);

    setWarnings((prev) => [newWarning, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setWarnings((prev) => prev.filter((w) => w.id !== newWarning.id));
    }, 7000);
  }, []);

  // Fullscreen trigger helper
  const enterFullscreen = useCallback(async () => {
    try {
      if (typeof document !== 'undefined' && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen entry request delayed or cancelled:', err);
    }
  }, []);

  // Socket setup & Event Listeners
  useEffect(() => {
    if (!sessionId || !examId) return;
    const socket = getSocket();

    socket.emit('join:session', { sessionId, examId, role: 'student' });

    // Handle non-punitive warnings from the server rule engine
    socket.on('student:warning', (warning: { eventType: string; message: string; severity: any; timestamp: number }) => {
      pushWarning({
        eventType: warning.eventType,
        message: warning.message,
        severity: warning.severity || 'high',
      });
    });

    // -------------------------------------------------------------
    // 1. Tab Switching Detection (document.visibilitychange)
    // -------------------------------------------------------------
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsTabVisible(isVisible);

      if (!isVisible) {
        // Candidate switched away from the exam tab
        tabHiddenStartTimeRef.current = Date.now();
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          socket.emit('client:tab_switch', {
            sessionId,
            status: 'hidden',
            count: next,
          });

          pushWarning({
            eventType: 'TAB_SWITCH_DETECTED',
            message: `⚠️ Tab Switch Detected: Leaving the examination tab is prohibited (Count #${next}).`,
            severity: 'high',
          });

          return next;
        });
      } else {
        // Candidate returned to the exam tab
        const durationAway = tabHiddenStartTimeRef.current
          ? Date.now() - tabHiddenStartTimeRef.current
          : 0;
        tabHiddenStartTimeRef.current = null;

        socket.emit('client:tab_switch', {
          sessionId,
          status: 'visible',
          durationMs: durationAway,
        });
      }

      socket.emit('client:focus_change', {
        sessionId,
        hasFocus: isVisible,
        visibilityState: document.visibilityState,
      });
    };

    // -------------------------------------------------------------
    // 2. Window / Application Switching Detection (window.blur / focus)
    // -------------------------------------------------------------
    const handleWindowBlur = () => {
      setIsWindowFocused(false);
      windowBlurStartTimeRef.current = Date.now();

      // If document is visible but window blurred, candidate clicked outside or Alt-Tabbed
      const isVisible = document.visibilityState === 'visible';
      if (isVisible) {
        setWindowSwitchCount((prev) => {
          const next = prev + 1;
          socket.emit('client:window_switch', {
            sessionId,
            hasFocus: false,
            count: next,
          });

          pushWarning({
            eventType: 'WINDOW_SWITCH_DETECTED',
            message: `⚠️ Window Switch Detected: Focus lost from examination window (Count #${next}).`,
            severity: 'high',
          });

          return next;
        });
      }

      socket.emit('client:focus_change', {
        sessionId,
        hasFocus: false,
        visibilityState: document.visibilityState,
      });
    };

    const handleWindowFocus = () => {
      setIsWindowFocused(true);
      const durationAway = windowBlurStartTimeRef.current
        ? Date.now() - windowBlurStartTimeRef.current
        : 0;
      windowBlurStartTimeRef.current = null;

      socket.emit('client:window_switch', {
        sessionId,
        hasFocus: true,
        durationMs: durationAway,
      });

      socket.emit('client:focus_change', {
        sessionId,
        hasFocus: true,
        visibilityState: document.visibilityState,
      });
    };

    // -------------------------------------------------------------
    // 3. Fullscreen Exit Monitoring
    // -------------------------------------------------------------
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);

      if (!active) {
        setFullscreenExitCount((prev) => {
          const next = prev + 1;
          socket.emit('client:fullscreen_exit', {
            sessionId,
            count: next,
          });

          pushWarning({
            eventType: 'FULLSCREEN_EXITED',
            message: `⚠️ Fullscreen Exited: Fullscreen is mandatory during the examination (Exit #${next}). Click the button to re-enter.`,
            severity: 'high',
          });

          return next;
        });
      }
    };

    // -------------------------------------------------------------
    // 4. Function Key & Restricted Shortcut Strict Prohibition
    // -------------------------------------------------------------
    const getRestrictedKeyPurpose = (key: string, e: KeyboardEvent): string | null => {
      // Function keys F1 through F12 strictly prohibited
      if (/^F[1-9]$|^F1[0-2]$/i.test(key)) {
        if (key === 'F12') return 'Developer Tools / DOM Inspector';
        if (key === 'F5') return 'Page Reload';
        if (key === 'F11') return 'Fullscreen Toggle';
        if (key === 'F1') return 'Browser Help';
        if (key === 'F3') return 'Search in Page';
        return `Function Key ${key}`;
      }

      // DevTools shortcuts (Ctrl+Shift+I, Cmd+Option+I, etc.)
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'I' || e.key === 'i')) return 'Developer Tools';
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'J' || e.key === 'j')) return 'Console Inspector';
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'C' || e.key === 'c')) return 'Element Inspector';

      // View Source (Ctrl+U / Cmd+U)
      if (isCmdOrCtrl && (e.key === 'u' || e.key === 'U')) return 'View Page Source';

      // Reload shortcut (Ctrl+R / Cmd+R)
      if (isCmdOrCtrl && (e.key === 'r' || e.key === 'R')) return 'Page Refresh';

      // Screenshot (PrintScreen)
      if (key === 'PrintScreen') return 'Screen Capture';

      // Escape key when in exam room (often used to cancel fullscreen)
      if (key === 'Escape' && document.fullscreenElement) {
        return 'Escape Fullscreen';
      }

      return null;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const purpose = getRestrictedKeyPurpose(e.key, e);
      if (purpose) {
        // Prevent default browser action
        e.preventDefault();
        e.stopPropagation();

        socket.emit('client:function_key', {
          sessionId,
          key: e.key,
          code: e.code,
          purpose,
          altKey: e.altKey,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
        });

        pushWarning({
          eventType: 'FUNCTION_KEY_PRESSED',
          message: `⚠️ Prohibited Key: ${e.key} (${purpose}) is restricted during the examination.`,
          severity: 'high',
        });
      }
    };

    // Right-click context menu prohibition
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      pushWarning({
        eventType: 'FUNCTION_KEY_PRESSED',
        message: '⚠️ Right-click context menu is disabled during the examination.',
        severity: 'medium',
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    // 5. Active Chrome Extension Live Detection & Watcher
    const cleanupExtensionWatcher = startExtensionWatcher((ext) => {
      socket.emit('client:extension_detected', {
        sessionId,
        name: ext.name,
        signature: ext.signature,
      });

      pushWarning({
        eventType: 'EXTENSION_DETECTED',
        message: `⚠️ Active Chrome Extension: "${ext.name}" is running. Extensions are strictly prohibited during the exam.`,
        severity: 'high',
      });
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      socket.off('student:warning');
      cleanupExtensionWatcher();
    };
  }, [sessionId, examId, pushWarning]);

  // Screen share termination watcher
  useEffect(() => {
    if (isScreenTerminated && sessionId) {
      const socket = getSocket();
      socket.emit('client:screenshare_status', {
        sessionId,
        active: false,
        reason: 'screenshare_disconnected',
      });

      pushWarning({
        eventType: 'SCREENSHARE_TERMINATED',
        message: '🚨 Screen Sharing Terminated: Entire screen sharing was stopped. Entire screen must remain shared to monitor background processes.',
        severity: 'high',
      });
    }
  }, [isScreenTerminated, sessionId, pushWarning]);

  // Frame capture and analysis step
  const captureAndProcessFrame = useCallback(async () => {
    if (!videoRef.current || !isCameraReady || !sessionId) return;
    const video = videoRef.current;

    // If stream is attached but playback was suspended, trigger play
    if (video.srcObject && video.paused) {
      video.play().catch(console.warn);
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 640, 480);
    const jpegBase64 = canvas.toDataURL('image/jpeg', 0.75);

    try {
      const t0 = performance.now();
      const aiResponse = await api.analyzeFrame(jpegBase64, sessionId);
      const totalLatency = performance.now() - t0;

      setLatestAiResponse(aiResponse);
      setLatencyMs(Math.round(totalLatency));

      // Immediate high-visibility notification on phone / camera device detection
      if (aiResponse.objects && aiResponse.objects.length > 0) {
        const primaryObj = aiResponse.objects[0];
        setSuspectDeviceAlert(primaryObj);

        const now = Date.now();
        if (now - lastDeviceAlertTimeRef.current > 4000) {
          lastDeviceAlertTimeRef.current = now;
          pushWarning({
            eventType: 'SUSPICIOUS_OBJECT_DETECTED',
            message: `🚨 Suspicious Device Detected: ${primaryObj.label} identified in camera view. Remove immediately.`,
            severity: 'high',
          });
        }
      }

      // 15-second Face Absence Tracking
      const isFacePresent = Boolean(aiResponse.is_face_present && aiResponse.face_count > 0);
      if (!isFacePresent) {
        if (faceAbsenceStartTimeRef.current === null) {
          faceAbsenceStartTimeRef.current = Date.now();
        } else if (Date.now() - faceAbsenceStartTimeRef.current >= 15000 && !faceAbsenceAlertDispatchedRef.current) {
          faceAbsenceAlertDispatchedRef.current = true;
          pushWarning({
            eventType: 'NO_FACE_DETECTED',
            message: '⚠️ Suspicious Activity Detected: Face not detected for more than 15 seconds. Please return to camera view immediately.',
            severity: 'high',
          });
        }
      } else {
        faceAbsenceStartTimeRef.current = null;
        faceAbsenceAlertDispatchedRef.current = false;
      }

      // Calculate effective FPS dynamically
      frameCountRef.current += 1;
      const elapsedMs = Date.now() - lastFpsCalcRef.current;
      if (elapsedMs >= 1000) {
        const calculatedFps = (frameCountRef.current / (elapsedMs / 1000));
        setFps(Number(calculatedFps.toFixed(1)));
        if (elapsedMs >= 3000) {
          frameCountRef.current = 0;
          lastFpsCalcRef.current = Date.now();
        }
      }

      // Relay structured telemetry to backend rule engine via WebSocket
      const socket = getSocket();
      socket.emit('client:telemetry', {
        sessionId,
        timestamp: Date.now(),
        faceCount: aiResponse.face_count,
        isFacePresent: aiResponse.is_face_present,
        faces: aiResponse.faces,
        headPose: aiResponse.head_pose,
        lighting: {
          meanLuminance: aiResponse.lighting.mean_luminance,
          status: aiResponse.lighting.status,
          isCompromised: aiResponse.lighting.is_compromised,
        },
        objects: aiResponse.objects,
        browserFocus: {
          hasFocus: document.hasFocus(),
          visibilityState: document.visibilityState,
        },
        cameraActive: true,
      });
    } catch (err) {
      // In case AI service is momentarily busy or network glitch, degrade gracefully
      console.warn('[AI Proctoring] Frame inference dropped:', err);
    }
  }, [sessionId, videoRef, isCameraReady, pushWarning]);

  // Main sampling loop
  useEffect(() => {
    if (!isCameraReady || !sessionId) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsSampling(false);
      return;
    }

    setIsSampling(true);
    // Initial immediate sample
    captureAndProcessFrame();

    timerRef.current = setInterval(() => {
      captureAndProcessFrame();
    }, sampleIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsSampling(false);
    };
  }, [isCameraReady, sessionId, sampleIntervalMs, captureAndProcessFrame]);

  // Wake up immediate capture when video starts playing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handlePlaying = () => {
      if (isCameraReady && sessionId) {
        captureAndProcessFrame();
      }
    };
    video.addEventListener('playing', handlePlaying);
    return () => {
      video.removeEventListener('playing', handlePlaying);
    };
  }, [videoRef, isCameraReady, sessionId, captureAndProcessFrame]);

  const dismissWarning = (id: string) => {
    setWarnings((prev) => prev.filter((w) => w.id !== id));
  };

  const dismissDeviceAlert = () => {
    setSuspectDeviceAlert(null);
  };

  return {
    latestAiResponse,
    suspectDeviceAlert,
    dismissDeviceAlert,
    warnings,
    isSampling,
    latencyMs,
    fps,
    tabSwitchCount,
    windowSwitchCount,
    fullscreenExitCount,
    isWindowFocused,
    isTabVisible,
    isFullscreen,
    enterFullscreen,
    dismissWarning,
  };
}
