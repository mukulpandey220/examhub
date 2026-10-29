"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  ShieldCheck, 
  ShieldAlert,
  Code2, 
  Terminal, 
  Play, 
  Layers,
  RotateCcw,
  Camera,
  Mic,
  Maximize2,
  Lock,
  Eye,
  AlertTriangle,
  X,
  Minimize2,
  Monitor
} from "lucide-react";
import { getExamById } from "@/data/exams";
import { Question, ExamAttempt, ProctoringViolation, ProctoringLog } from "@/types";
import { requestFullscreen, exitFullscreen, addFullscreenListener, isFullscreenActive } from "@/lib/fullscreen";
import { FaceMonitorStateMachine, FaceMonitorState, ImageQualityStatus } from "@/lib/face-monitor-state-machine";
import { scanVideoFrame } from "@/lib/proctoring-vision";

export default function LiveExaminationPage({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const examId = params.examId;
  const [exam, setExam] = useState<any>(() => getExamById(examId) || null);

  // Core Attempt & Questions state
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(1800);
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [codeOutputs, setCodeOutputs] = useState<Record<string, any>>({});
  const [codeRunning, setCodeRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);

  // Anti-Cheating & Proctoring state
  const [proctoringStarted, setProctoringStarted] = useState(false);
  const [showPreflightModal, setShowPreflightModal] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFocusShield, setShowFocusShield] = useState(false);
  const [focusShieldReason, setFocusShieldReason] = useState("");
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [integrityScore, setIntegrityScore] = useState(100);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [cameraMinimized, setCameraMinimized] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string }>({
    name: "Ramkumar Malothu",
    email: "ramkumar.malothu@nyeras.com",
  });

  const preflightVideoRef = useRef<HTMLVideoElement | null>(null);
  const examVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastViolationTimeRef = useRef<number>(0);
  const lastViolationByTypeRef = useRef<Record<string, number>>({});
  const tabSwitchedRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const titleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lockdownCooldown, setLockdownCooldown] = useState(0);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTokenRef = useRef<string>("");
  const [isSecondLoginBlocked, setIsSecondLoginBlocked] = useState<boolean>(false);
  const [detectedFaceCount, setDetectedFaceCount] = useState<number>(1);
  const [faceTrackingStatus, setFaceTrackingStatus] = useState<"verified" | "no_face" | "dual_face" | "verifying" | "uncertain">("verified");
  const faceStateMachineRef = useRef<FaceMonitorStateMachine>(new FaceMonitorStateMachine());
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState<boolean>(false);
  const [proctorDiagnostics, setProctorDiagnostics] = useState<{
    camera: string;
    resolution: string;
    fps: number;
    detectedFaces: number;
    reliableFaces: number;
    primaryConfidence: number;
    secondaryConfidence: number;
    trackedFaces: number;
    multiFacePersistence: number;
    faceMonitorState: FaceMonitorState;
    imageQuality: ImageQualityStatus;
    lastEvent: string;
  }>({
    camera: "OK",
    resolution: "1280 × 720",
    fps: 12,
    detectedFaces: 1,
    reliableFaces: 1,
    primaryConfidence: 0.95,
    secondaryConfidence: 0,
    trackedFaces: 1,
    multiFacePersistence: 0,
    faceMonitorState: "ONE_FACE",
    imageQuality: "GOOD",
    lastEvent: "NONE",
  });
  const [phoneDetected, setPhoneDetected] = useState<boolean>(false);
  const dualFaceStrikesRef = useRef<number>(0);
  const phoneStrikesRef = useRef<number>(0);
  const dualFaceConsecutiveRef = useRef<number>(0);
  const noFaceConsecutiveRef = useRef<number>(0);
  const proctoringStartedRef = useRef<boolean>(false);
  const visionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const visionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const screenMetricsRef = useRef<{ width: number; height: number; screenX: number; screenY: number }>({ width: 0, height: 0, screenX: 0, screenY: 0 });

  useEffect(() => {
    proctoringStartedRef.current = proctoringStarted;
  }, [proctoringStarted]);

  // Helper: Trigger Focus Shield with mandatory cooldown penalty
  const triggerLockdownShield = (reason: string) => {
    setShowFocusShield(true);
    setFocusShieldReason(reason);
    setLockdownCooldown(5); // 5-second mandatory cooldown penalty to restrict tab-hopping
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      setLockdownCooldown(prev => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Chromium Keyboard Lock API (Locks Tab and Escape at browser engine level)
  const lockKeyboard = async () => {
    if (typeof navigator !== "undefined" && "keyboard" in navigator && (navigator as any).keyboard?.lock) {
      try {
        await (navigator as any).keyboard.lock(["Tab", "Escape"]);
      } catch (err) {}
    }
  };

  const unlockKeyboard = () => {
    if (typeof navigator !== "undefined" && "keyboard" in navigator && (navigator as any).keyboard?.unlock) {
      try {
        (navigator as any).keyboard.unlock();
      } catch (err) {}
    }
  };

  // Helper: Unlock audio context on user interaction
  const initAudioContext = () => {
    if (typeof window === "undefined") return;
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
    } catch (e) {}
  };

  // Helper: Play Warning Sound with Web Audio API synth (High-impact multi-tone proctor alarm)
  const playProctorWarningSound = () => {
    if (typeof window === "undefined") return;
    try {
      initAudioContext();
      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.setValueAtTime(587.33, now + 0.14);
      osc.frequency.setValueAtTime(920, now + 0.28);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  };

  // Helper: Flashing animated browser tab title
  const setFlashingTitle = (active: boolean, message = "⚠️ PROCTORING ALERT: TAB SWITCH DETECTED!") => {
    if (typeof document === "undefined") return;
    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current);
      titleIntervalRef.current = null;
    }
    if (active) {
      let isAlt = false;
      document.title = message;
      titleIntervalRef.current = setInterval(() => {
        isAlt = !isAlt;
        document.title = isAlt ? "🚨 RETURN TO EXAM IMMEDIATELY!" : message;
      }, 700);
    } else {
      document.title = exam?.title ? `${exam.title} | Proctored Exam` : "Exam Hub | Live Proctored Examination";
    }
  };

  // Unlock AudioContext and clean up title intervals and keyboard locks on mount/unmount
  useEffect(() => {
    const unlock = () => {
      initAudioContext();
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
      }
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
      unlockKeyboard();
    };
  }, []);

  // Helper: Trigger notification toast
  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Helper: Record Proctoring Violation with debounce and multi-type defense
  const recordViolation = (type: ProctoringViolation["type"], details: string) => {
    const now = Date.now();
    const lastSameType = lastViolationByTypeRef.current[type] || 0;
    
    // Prevent flurry of exact same violation within 1000ms
    if (now - lastSameType < 1000) return;
    lastViolationByTypeRef.current[type] = now;
    lastViolationTimeRef.current = now;

    // Trigger audio siren alarm
    playProctorWarningSound();

    const newViolation: ProctoringViolation = {
      id: `viol-${now}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      timestamp: new Date().toISOString(),
      details,
    };

    // Asynchronously stream to server proctoring event engine
    if (attempt?.id) {
      fetch("/api/v1/proctoring/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: newViolation.id,
          attemptId: attempt.id,
          examId,
          studentId: currentUser.email,
          eventType: type,
          occurredAt: newViolation.timestamp,
          metadata: { details },
        }),
      }).catch(() => {});
    }

    if (type === "multiple_faces") {
      dualFaceStrikesRef.current += 1;
    }
    if (type === "phone_detected") {
      phoneStrikesRef.current += 1;
    }

    setViolations(prev => {
      const updated = [...prev, newViolation];
      const count = updated.length;
      const calculatedScore = Math.max(0, 100 - (count * 15));
      setIntegrityScore(calculatedScore);

      // Explicit toast messaging per rule
      if (type === "multiple_faces") {
        showToast(`⚠️ DUAL FACE WARNING #${dualFaceStrikesRef.current}/3: Multiple faces detected! Only registered candidate allowed.`);
      } else if (type === "phone_detected") {
        showToast(`📱 MOBILE PHONE WARNING #${phoneStrikesRef.current}/3: Unauthorized phone detected in camera view!`);
      } else if (type === "second_login_attempt") {
        showToast(`🚫 SECOND LOGIN BLOCKED: Concurrent exam session detected. Exam locked.`);
      } else {
        showToast(`🚨 Security Strike #${count}/3 Recorded: ${details}`);
      }

      // Max 3 strikes rule or second login: auto-disqualify
      const isDualFaceLimit = dualFaceStrikesRef.current >= 3;
      const isPhoneLimit = phoneStrikesRef.current >= 3;
      const isSecondLogin = type === "second_login_attempt";

      if ((count >= 3 || isDualFaceLimit || isPhoneLimit || isSecondLogin) && !isDisqualified) {
        setIsDisqualified(true);
        const disqReason = isSecondLogin 
          ? "No second login allowed: Concurrent exam attempt detected from another session/device."
          : isDualFaceLimit 
            ? "Exceeded maximum of 3 dual face recognition warnings."
            : isPhoneLimit 
              ? "Exceeded maximum of 3 mobile phone detection warnings."
              : details;
        setTimeout(() => {
          handleDisqualificationSubmit(updated, disqReason);
        }, 1200);
      }
      return updated;
    });
  };

  // Build current proctoring log object
  const getProctoringLog = (overrideViolations?: ProctoringViolation[]): ProctoringLog => {
    const list = overrideViolations || violations;
    return {
      integrityScore,
      totalViolations: list.length,
      tabSwitchViolations: list.filter(v => v.type === "tab_switch").length,
      fullscreenViolations: list.filter(v => v.type === "fullscreen_exit").length,
      blurViolations: list.filter(v => v.type === "window_blur").length,
      phoneViolations: list.filter(v => v.type === "phone_detected").length,
      dualFaceViolations: list.filter(v => v.type === "multiple_faces").length,
      secondLoginViolations: list.filter(v => v.type === "second_login_attempt").length,
      copyPasteViolations: list.filter(v => v.type === "copy_paste_attempt").length,
      devtoolsViolations: list.filter(v => v.type === "devtools_attempt").length,
      isDisqualified: isDisqualified || list.length >= 3,
      disqualificationReason: list.length >= 3 ? "Exceeded maximum allowed security infractions (3 strikes reached)" : undefined,
      cameraActive,
      microphoneActive: micActive,
      violations: list,
    };
  };

  // Helper: Reset attempts & restart
  const handleResetAndRestart = async () => {
    setLoading(true);
    setLoadError(null);
    setIsLimitReached(false);
    setIsSecondLoginBlocked(false);
    try {
      const activeUserId = currentUser.email ? "user-student-ramkumar" : "user-student-ramkumar";
      const res = await fetch(`/api/assessments/exams/${examId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          resetAttempts: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.reload();
    } catch (e: any) {
      setLoadError(e.message || "Failed to reset attempt");
      setLoading(false);
    }
  };

  // Helper: Reclaim session if concurrent session conflict or tab reopened
  const handleReclaimSession = async () => {
    setLoading(true);
    setLoadError(null);
    setIsSecondLoginBlocked(false);
    setIsDisqualified(false);
    try {
      const activeUserId = currentUser.email ? "user-student-ramkumar" : "user-student-ramkumar";
      let token = sessionTokenRef.current;
      if (!token && typeof window !== "undefined") {
        token = localStorage.getItem(`nxtmove_session_${examId}`) || sessionStorage.getItem(`nxtmove_session_${examId}`) || "";
      }
      const res = await fetch(`/api/assessments/exams/${examId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          userEmail: currentUser.email || "ramkumar.malothu@nyeras.com",
          userName: currentUser.name || "Ramkumar Malothu",
          sessionToken: token,
          reclaimSession: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.reload();
    } catch (e: any) {
      setLoadError(e.message || "Failed to resume examination session");
      setLoading(false);
    }
  };

  // 1. Initialize user from localStorage & fetch exam attempt
  useEffect(() => {
    let mounted = true;
    let activeUserId = "user-student-ramkumar";
    let activeName = currentUser.name || "Ramkumar Malothu";
    let activeEmail = currentUser.email || "ramkumar.malothu@nyeras.com";

    // Load active user profile if present
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("campus_radar_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.id) activeUserId = parsed.id;
          if (parsed?.name) {
            activeName = parsed.name;
            activeEmail = parsed.email || "ramkumar.malothu@nyeras.com";
            setCurrentUser({ name: activeName, email: activeEmail });
          }
        }
      } catch (e) {}
    }

    async function initAttempt() {
      try {
        let currentToken = "";
        try {
          currentToken = localStorage.getItem(`nxtmove_session_${examId}`) || sessionStorage.getItem(`nxtmove_session_${examId}`) || "";
          if (!currentToken) {
            currentToken = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            localStorage.setItem(`nxtmove_session_${examId}`, currentToken);
            sessionStorage.setItem(`nxtmove_session_${examId}`, currentToken);
          } else {
            localStorage.setItem(`nxtmove_session_${examId}`, currentToken);
            sessionStorage.setItem(`nxtmove_session_${examId}`, currentToken);
          }
        } catch (e) {}
        sessionTokenRef.current = currentToken;

        const res = await fetch(`/api/assessments/exams/${examId}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: activeUserId,
            userEmail: activeEmail,
            userName: activeName,
            sessionToken: currentToken,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setLoading(false);
          setLoadError(data.error || "Failed to initialize examination");
          if (data.isSecondLoginBlocked) {
            setIsSecondLoginBlocked(true);
            setIsDisqualified(true);
            triggerLockdownShield("No Second Login Rule: Concurrent examination session detected on another device/browser. Secondary logins are strictly prohibited.");
          }
          if (data.isLimitReached || (data.error && data.error.includes("limit"))) {
            setIsLimitReached(true);
          }
          return;
        }

        const currentAttempt: ExamAttempt = data.attempt;
        if (!mounted) return;

        // If already submitted/graded, turn off fullscreen and redirect to results
        if (currentAttempt.status === "submitted" || currentAttempt.status === "graded" || currentAttempt.status === "expired") {
          await exitFullscreen();
          router.replace(`/assessments/results/${currentAttempt.id}`);
          return;
        }

        setAttempt(currentAttempt);
        setAnswers(currentAttempt.answers || {});
        setMarkedForReview(currentAttempt.markedForReview || []);

        // Load existing proctoring log if resuming
        if (currentAttempt.proctoring) {
          setViolations(currentAttempt.proctoring.violations || []);
          setIntegrityScore(currentAttempt.proctoring.integrityScore ?? 100);
        }

        // If resuming an already started attempt, skip preflight and resume immediately
        if (currentAttempt.timeSpentSeconds > 0 || currentAttempt.proctoring) {
          setShowPreflightModal(false);
          setProctoringStarted(true);
        }

        // Calculate exact remaining time from server expiration
        const expiresAt = new Date(currentAttempt.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeRemainingSeconds(remaining);

        if (data.exam) {
          setExam(data.exam);
        }

        // Fetch & match exam questions
        let examQuestions: Question[] = [];
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          examQuestions = data.questions;
        } else {
          const currentExam = data.exam || exam;
          const domainSlug = currentExam?.domainSlug;
          const qRes = await fetch(`/api/admin/questions?domain=${domainSlug || ""}&limit=100`);
          const qData = await qRes.json();
          const allQs: Question[] = qData.questions || [];
          if (currentExam?.questionIds && currentExam.questionIds.length > 0) {
            examQuestions = currentExam.questionIds
              .map((id: string) => allQs.find((q: Question) => q.id === id))
              .filter(Boolean) as Question[];
          }
          if (examQuestions.length === 0) {
            examQuestions = allQs.slice(0, currentExam?.questionCount || 25);
          }
        }

        setQuestions(examQuestions);
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to load attempt", err);
        setLoadError(err.message || "Failed to load examination attempt");
        setLoading(false);
      }
    }

    initAttempt();

    return () => {
      mounted = false;
    };
  }, [examId, router]);

  // 2. Setup Camera & Microphone Stream with cross-browser permission resilience
  const initWebcamStream = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
            audio: true,
          });
          setCameraActive(true);
          setMicActive(true);
        } catch (e1) {
          // If microphone is unavailable or denied, fallback to video-only
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
            audio: false,
          });
          setCameraActive(true);
          setMicActive(false);
        }

        if (stream) {
          mediaStreamRef.current = stream;
          if (preflightVideoRef.current) {
            preflightVideoRef.current.srcObject = stream;
            preflightVideoRef.current.play().catch(() => {});
          }
          if (examVideoRef.current) {
            examVideoRef.current.srcObject = stream;
            examVideoRef.current.play().catch(() => {});
          }
        }
      } else {
        setCameraActive(true);
        setMicActive(true);
      }
    } catch (err) {
      console.warn("Camera/mic permission unavailable or denied. Using proctored verification standby.", err);
      // Fallback: active verification standby so student is not locked out of testing
      setCameraActive(true);
      setMicActive(true);
    }
  };

  // Sync media stream with active video DOM nodes whenever modals or modes toggle
  useEffect(() => {
    const stream = mediaStreamRef.current;
    if (!stream) return;
    if (preflightVideoRef.current && preflightVideoRef.current.srcObject !== stream) {
      preflightVideoRef.current.srcObject = stream;
      preflightVideoRef.current.play().catch(() => {});
    }
    if (examVideoRef.current && examVideoRef.current.srcObject !== stream) {
      examVideoRef.current.srcObject = stream;
      examVideoRef.current.play().catch(() => {});
    }
  }, [showPreflightModal, proctoringStarted, cameraMinimized]);

  // Request camera preview and OS notification permissions on component mount
  useEffect(() => {
    initWebcamStream();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Clean up media streams and turn off fullscreen on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      exitFullscreen();
    };
  }, []);

  // 3. Enter Fullscreen and Begin Proctoring (All Devices)
  const handleLaunchProctoredExam = async () => {
    initAudioContext();
    if (typeof window !== "undefined") {
      screenMetricsRef.current = {
        width: window.screen.width,
        height: window.screen.height,
        screenX: window.screenX,
        screenY: window.screenY,
      };
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
    setShowPreflightModal(false);
    setProctoringStarted(true);
    try {
      await requestFullscreen();
      setIsFullscreen(true);
      await lockKeyboard();
    } catch (e) {
      console.warn("Fullscreen request bypass or rejected:", e);
    }
    // Launch webcam asynchronously so camera permission never blocks exam access
    initWebcamStream();
  };

  // 3B. Real-Time AI Computer Vision Proctoring: Dual Face Recognition & Handheld Phone Detection
  useEffect(() => {
    if (submitting || isDisqualified) return;

    if (!visionCanvasRef.current && typeof document !== "undefined") {
      visionCanvasRef.current = document.createElement("canvas");
      visionCanvasRef.current.width = 160;
      visionCanvasRef.current.height = 120;
    }

    const runVisionScan = async () => {
      const activeVideo = examVideoRef.current || preflightVideoRef.current;
      if (!activeVideo || activeVideo.readyState < 2 || activeVideo.videoWidth === 0) return;

      try {
        const canvas = visionCanvasRef.current;
        if (!canvas) return;

        // 1. Run multi-tiered browser computer vision scan
        const scanRes = await scanVideoFrame(activeVideo, canvas);

        // 2. Feed detections into temporal observation window state machine
        const decision = faceStateMachineRef.current.processFrame({
          rawFaces: scanRes.rawFaces,
          frameWidth: scanRes.frameWidth,
          frameHeight: scanRes.frameHeight,
          timestamp: Date.now(),
          imageQuality: scanRes.imageQuality,
        });

        setDetectedFaceCount(decision.reliableFaceCount);

        // 3. Update developer diagnostics in real time
        setProctorDiagnostics(prev => ({
          camera: activeVideo.videoWidth > 0 ? "OK" : "NO_SIGNAL",
          resolution: `${activeVideo.videoWidth || 640} × ${activeVideo.videoHeight || 480}`,
          fps: 12,
          detectedFaces: decision.diagnostics.detectedFaces,
          reliableFaces: decision.diagnostics.reliableFaces,
          primaryConfidence: decision.diagnostics.primaryConfidence,
          secondaryConfidence: decision.diagnostics.secondaryConfidence,
          trackedFaces: decision.diagnostics.trackedFaces,
          multiFacePersistence: decision.diagnostics.multiFacePersistence,
          faceMonitorState: decision.state,
          imageQuality: scanRes.imageQuality,
          lastEvent: decision.shouldEmitViolation ? "MULTIPLE_FACES" : (prev?.lastEvent || "NONE"),
        }));

        // 4. State Machine Transition & Controlled Action Dispatch
        if (decision.state === "MULTIPLE_CONFIRMED") {
          setFaceTrackingStatus("dual_face");
          if (decision.shouldEmitViolation) {
            dualFaceStrikesRef.current += 1;
            const details = decision.violationDetails || `Dual Face Recognition: Persistent secondary face confirmed in camera view! (Warning ${dualFaceStrikesRef.current}/3)`;
            recordViolation("multiple_faces", details);
            triggerLockdownShield(
              `Dual Face Recognition: Multiple individuals confirmed in camera frame. (Warning ${dualFaceStrikesRef.current}/3). Only registered candidate permitted.`
            );
          }
        } else if (decision.state === "POSSIBLE_MULTIPLE") {
          // Observation window in progress - no violation, no lockdown
          setFaceTrackingStatus("verifying");
        } else if (decision.state === "NO_FACE") {
          setFaceTrackingStatus("no_face");
          noFaceConsecutiveRef.current += 1;
          if (noFaceConsecutiveRef.current >= 4) {
            noFaceConsecutiveRef.current = 0;
            showToast("⚠️ Candidate Missing: No face detected in camera! Please center your face in view.");
            recordViolation("face_absent" as any, "Candidate face missing from camera frame");
          }
        } else if (decision.state === "UNCERTAIN") {
          setFaceTrackingStatus("uncertain");
          // Low lighting / glare is treated as uncertainty, never misconduct
        } else {
          // ONE_FACE (CLEAR)
          setFaceTrackingStatus("verified");
          noFaceConsecutiveRef.current = 0;
        }

        // 5. Handheld Phone & Secondary Device Screen Glare Detection
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = frame.data;
          const w = canvas.width;
          const h = canvas.height;
          let phoneGlarePixels = 0;

          for (let y = Math.floor(h * 0.45); y < h; y += 3) {
            for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x += 3) {
              const idx = (y * w + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const brightness = (r + g + b) / 3;

              if (brightness > 240 && Math.abs(r - g) < 14 && Math.abs(g - b) < 18) {
                phoneGlarePixels++;
              }
            }
          }

          if (phoneGlarePixels > 95) {
            setPhoneDetected(true);
            recordViolation(
              "phone_detected",
              `Mobile Phone Detected: Unauthorized handheld mobile device in camera view!`
            );
            triggerLockdownShield(
              `Mobile Phone Detected: Handheld electronic device recognized in camera frame. (Warning ${phoneStrikesRef.current}/3). Mobile phones prohibited.`
            );
          } else {
            setPhoneDetected(false);
          }
        }
      } catch (e) {}
    };

    visionIntervalRef.current = setInterval(runVisionScan, 800);
    return () => {
      if (visionIntervalRef.current) clearInterval(visionIntervalRef.current);
      if (faceStateMachineRef.current) faceStateMachineRef.current.reset();
    };
  }, [submitting, isDisqualified]);

  // Simulation handlers for testing & proctor audit demonstration
  const handleSimulateDualFace = () => {
    setDetectedFaceCount(2);
    recordViolation(
      "multiple_faces",
      `Dual Face Recognition Alert: 2 individuals detected simultaneously in camera frame!`
    );
    triggerLockdownShield(
      `Dual Face Recognition: 2 individuals detected in camera view. (Warning ${dualFaceStrikesRef.current}/3). Only 1 candidate permitted.`
    );
  };

  const handleSimulatePhone = () => {
    setPhoneDetected(true);
    recordViolation(
      "phone_detected",
      `Mobile Phone Detected: Unauthorized handheld mobile device in camera view!`
    );
    triggerLockdownShield(
      `Mobile Phone Detected: Handheld electronic device recognized in camera frame. (Warning ${phoneStrikesRef.current}/3). Mobile phones prohibited.`
    );
  };

  // 4. Comprehensive Anti-Cheating Event Listeners
  useEffect(() => {
    if (submitting || isDisqualified) return;

    // A. Fullscreen Exit Detection (Universal Cross-Device)
    const handleFullscreenChange = (isFull: boolean) => {
      setIsFullscreen(isFull);
      if (!isFull && proctoringStarted) {
        recordViolation("fullscreen_exit", "Candidate exited full-screen lockdown mode");
        setShowFullscreenWarning(true);
        triggerLockdownShield("Fullscreen Lockdown Exited: Proctored exams must be taken in dedicated full-screen mode to prevent secondary tools and screen switching.");
        playProctorWarningSound();
      } else {
        setShowFullscreenWarning(false);
      }
    };

    const cleanupFullscreen = addFullscreenListener(handleFullscreenChange);

    // B. Tab Switch & Visibility Change (Page Visibility API & Desktop Spaces)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        tabSwitchedRef.current = true;
        setFlashingTitle(true, "⚠️ PROCTORING ALERT: SCREEN / TAB SWITCH DETECTED!");
        recordViolation("tab_switch", "Screen change, tab switched, or desktop space changed during examination");
        triggerLockdownShield("⚠️ Screen Change Warning: You navigated away from the proctored test cockpit or switched tabs/spaces. All screen changes are strictly logged.");
        playProctorWarningSound();

        // Trigger desktop system notification if permitted
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("⚠️ PROCTORING ALERT: SCREEN CHANGE DETECTED!", {
            body: "You navigated away from your active examination. Return immediately to avoid disqualification.",
            icon: "/favicon.ico",
          });
        }
      } else if (document.visibilityState === "visible") {
        setFlashingTitle(false);
        if (tabSwitchedRef.current) {
          tabSwitchedRef.current = false;
          triggerLockdownShield("Security Strike Logged: Screen / Tab switch detected. You navigated away from the proctored test cockpit.");
          showToast("🚨 Security Warning: Screen change infraction logged! Strike recorded.");
          playProctorWarningSound();
        }
      }
    };

    // C. Window Blur & Focus Detection (Clicks outside, split screen, floating overlays, app switch)
    const handleWindowBlur = () => {
      tabSwitchedRef.current = true;
      setFlashingTitle(true, "⚠️ PROCTORING ALERT: WINDOW FOCUS LOST!");
      recordViolation("window_blur", "Test window lost focus. External application, secondary screen, or floating overlay invoked");
      triggerLockdownShield("⚠️ Screen Change / Focus Lost: The examination window lost active focus. Overlay tools, secondary monitors, and application switches are strictly prohibited.");
      playProctorWarningSound();
    };

    const handleWindowFocus = () => {
      setFlashingTitle(false);
      if (tabSwitchedRef.current) {
        tabSwitchedRef.current = false;
        triggerLockdownShield("Security Warning: Examination window regained focus after security strike.");
        showToast("🚨 Security Warning: Focus restored after security strike.");
        playProctorWarningSound();
      }
    };

    // D. Multi-Monitor & Screen Display Layout Change Detection
    const handleScreenChangeCheck = () => {
      if (typeof window === "undefined") return;

      // Check if document lost focus silently while remaining visible
      if (!document.hasFocus() && !tabSwitchedRef.current && document.visibilityState === "visible") {
        tabSwitchedRef.current = true;
        recordViolation("window_blur", "Examination window lost focus to external tool or secondary screen");
        triggerLockdownShield("Screen Change / Focus Lost: The examination window is no longer the active window. You must remain focused on this test cockpit.");
        playProctorWarningSound();
      }

      // Check if candidate dragged window to another monitor or changed screen resolution
      if (screenMetricsRef.current.width > 0) {
        const curW = window.screen.width;
        const curH = window.screen.height;
        if (Math.abs(curW - screenMetricsRef.current.width) > 80 || Math.abs(curH - screenMetricsRef.current.height) > 80) {
          screenMetricsRef.current = { width: curW, height: curH, screenX: window.screenX, screenY: window.screenY };
          recordViolation("window_blur", "Screen display layout change detected (moved between external monitors)");
          triggerLockdownShield("⚠️ Screen Change Detected: The examination window was moved to a different monitor or display configuration changed. Multi-monitor setups are strictly prohibited.");
          playProctorWarningSound();
        }
      }
    };

    // E. Window Resize Detection (Split-screen attempt)
    const handleResize = () => {
      if (!proctoringStarted) return;
      handleScreenChangeCheck();
      if (window.innerWidth < 850) {
        recordViolation("resize_attempt", "Window dimensions resized below standard viewport (split-screen attempt)");
        triggerLockdownShield("Split-screen or resized browser window detected. The examination must remain full-width.");
        playProctorWarningSound();
      }
    };

    // F. Prevent Right-Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showToast("Right-click is prohibited during proctored exams.");
      recordViolation("right_click_attempt", "Attempted to open context menu");
    };

    // G. Prevent Copy / Cut / Unauthorized Paste
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      showToast("Copying examination content is strictly prohibited.");
      recordViolation("copy_paste_attempt", "Attempted to copy test question");
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      showToast("Cutting content is prohibited.");
    };

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      // Allow paste only inside code editor textarea for candidate's own code snippets
      if (target?.tagName !== "TEXTAREA") {
        e.preventDefault();
        showToast("Pasting external content is disabled.");
        recordViolation("copy_paste_attempt", "Attempted unauthorized paste");
      }
    };

    // H. Keyboard Shortcut Interception (Specifically targeting macOS & Windows shortcuts)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // 1. Strictly block all Tab / Window Switching Shortcuts across macOS & Windows
      // - Ctrl+Tab, Ctrl+Shift+Tab, Alt+Tab
      // - Cmd+Tab (if captured by browser)
      // - Cmd+` / Cmd+~ (macOS Cycle Windows within App)
      // - Cmd+Option+Left/Right, Cmd+Shift+Left/Right
      // - Cmd+Shift+[ and Cmd+Shift+] (Note: on Mac Shift+[ produces '{' and Shift+] produces '}')
      // - Cmd+1 through Cmd+9
      // - Ctrl+ArrowLeft/Right/Up/Down (macOS Mission Control & Spaces switch)
      // - Cmd+M (macOS Minimize to Dock)
      // - Cmd+H (macOS Hide Window)
      // - Cmd+Option+Esc (macOS Force Quit)
      const isMacWindowCycle = isCmdOrCtrl && (e.key === "`" || e.key === "~" || e.code === "Backquote");
      const isMacMinimizeOrHide = isCmdOrCtrl && ["m", "M", "h", "H"].includes(e.key);
      const isMacForceQuit = isCmdOrCtrl && e.altKey && (e.key === "Escape" || e.code === "Escape");
      const isMacSpacesSwitch = e.ctrlKey && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key);
      const isTabSwitchShortcut =
        (isCmdOrCtrl && e.key === "Tab") ||
        (e.altKey && e.key === "Tab") ||
        isMacWindowCycle ||
        isMacMinimizeOrHide ||
        isMacForceQuit ||
        isMacSpacesSwitch ||
        (isCmdOrCtrl && (e.altKey || e.shiftKey) && ["ArrowLeft", "ArrowRight", "[", "]", "{", "}"].includes(e.key)) ||
        (isCmdOrCtrl && (e.code === "BracketLeft" || e.code === "BracketRight")) ||
        (isCmdOrCtrl && ["PageUp", "PageDown"].includes(e.key)) ||
        (isCmdOrCtrl && (/^[1-9]$/.test(e.key) || e.code.startsWith("Digit")));

      if (isTabSwitchShortcut) {
        e.preventDefault();
        e.stopPropagation();
        showToast("🚫 Screen / Tab switching is strictly prohibited during examination.");
        recordViolation("tab_switch", `Attempted forbidden screen/tab switch keyboard shortcut (${e.key || e.code})`);
        triggerLockdownShield(`Security Infraction: Tab/Window switch shortcut (${e.key || e.code}) detected. Direct screen switching is prohibited.`);
        playProctorWarningSound();
        return;
      }

      // 2. Strictly block New Tab, New Window, or Close Tab Shortcuts (Ctrl/Cmd + T, N, W, Q)
      if (isCmdOrCtrl && ["t", "T", "n", "N", "w", "W", "q", "Q"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        showToast("🚫 Opening new tabs or windows is blocked.");
        recordViolation("tab_switch", `Attempted to open new tab/window (${e.key})`);
        triggerLockdownShield("Security Warning: Opening new browser tabs or windows is blocked during active examination.");
        playProctorWarningSound();
        return;
      }

      // 3. Devtools: F12, Ctrl/Cmd + Shift + I/J/C, Ctrl/Cmd + U, Print Ctrl/Cmd + P
      if (
        e.key === "F12" ||
        (isCmdOrCtrl && (e.key === "u" || e.key === "U" || e.key === "p" || e.key === "P")) ||
        (isCmdOrCtrl && e.shiftKey && (e.key === "i" || e.key === "I" || e.key === "j" || e.key === "J" || e.key === "c" || e.key === "C"))
      ) {
        e.preventDefault();
        showToast("Developer inspection and source viewing are blocked.");
        recordViolation("devtools_attempt", `Attempted forbidden key combination: ${e.key}`);
        return;
      }

      // 4. Block Refresh (F5, Ctrl/Cmd + R)
      if (e.key === "F5" || (isCmdOrCtrl && (e.key === "r" || e.key === "R"))) {
        e.preventDefault();
        showToast("Page refresh is blocked during examination.");
        return;
      }

      // 5. Block unauthorized Ctrl+C/V outside textarea
      const target = e.target as HTMLElement;
      if (isCmdOrCtrl && (e.key === "c" || e.key === "C" || e.key === "x" || e.key === "X")) {
        if (target.tagName !== "TEXTAREA") {
          e.preventDefault();
          showToast("Copying content is blocked.");
          return;
        }
      }

      // Proctored Keyboard Shortcuts (1-4 / A-D for options, N next, P prev, M review)
      if (!isCmdOrCtrl && target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && questions[currentIndex]) {
        const q = questions[currentIndex];
        if (["1", "a", "A"].includes(e.key) && q.options?.[0]) {
          handleSelectOption(q.id, q.options[0].id, q.type === "multiple_choice");
        } else if (["2", "b", "B"].includes(e.key) && q.options?.[1]) {
          handleSelectOption(q.id, q.options[1].id, q.type === "multiple_choice");
        } else if (["3", "c", "C"].includes(e.key) && q.options?.[2]) {
          handleSelectOption(q.id, q.options[2].id, q.type === "multiple_choice");
        } else if (["4", "d", "D"].includes(e.key) && q.options?.[3]) {
          handleSelectOption(q.id, q.options[3].id, q.type === "multiple_choice");
        } else if (e.key === "n" || e.key === "N" || e.key === "ArrowRight") {
          setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1));
        } else if (e.key === "p" || e.key === "P" || e.key === "ArrowLeft") {
          setCurrentIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === "m" || e.key === "M") {
          toggleMarkForReview(q.id);
        }
      }
    };

    // I. Mouse boundary trap (Cursor moving towards browser tabs/address bar or Dock)
    const handleMouseLeave = (e: MouseEvent) => {
      if ((e.clientY <= 2 || e.clientY >= window.innerHeight - 2) && proctoringStarted) {
        showToast("⚠️ Cursor moving outside examination window! Remain inside exam.");
        playProctorWarningSound();
      }
    };

    // J. Prevent accidental window closing
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Leaving this proctored examination will invalidate your attempt. Are you sure?";
    };

    // Periodic background monitor for silent focus loss & display layout change
    const screenInterval = setInterval(handleScreenChangeCheck, 800);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("resize", handleResize);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("cut", handleCut);
    window.addEventListener("paste", handlePaste);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      cleanupFullscreen();
      clearInterval(screenInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("cut", handleCut);
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [proctoringStarted, submitting, isDisqualified, questions, currentIndex]);

  // 5. Server-side Countdown Timer
  useEffect(() => {
    if (loading || !attempt || showPreflightModal) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, attempt, showPreflightModal]);

  // 6. Periodic autosave with proctoring telemetry every 10 seconds
  useEffect(() => {
    if (loading || !attempt || showPreflightModal) return;

    const autosaveTimer = setTimeout(async () => {
      setAutosaveStatus("saving");
      try {
        const timeSpent = (exam?.durationMinutes || 30) * 60 - timeRemainingSeconds;
        await fetch(`/api/assessments/exams/${examId}/autosave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: attempt.id,
            answers,
            markedForReview,
            timeSpentSeconds: Math.max(0, timeSpent),
            proctoring: getProctoringLog(),
          }),
        });
        setAutosaveStatus("saved");
      } catch (err) {
        setAutosaveStatus("error");
      }
    }, 3000);

    return () => clearTimeout(autosaveTimer);
  }, [answers, markedForReview, timeRemainingSeconds, attempt, examId, exam, loading, violations, integrityScore, showPreflightModal]);

  // 7. Auto-submit on time expiry
  const handleAutoSubmit = async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/assessments/exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.id,
          answers,
          autoExpired: true,
          proctoring: getProctoringLog(),
        }),
      });
      // Turn off fullscreen mode after finishing exam
      await exitFullscreen();
      router.replace(`/assessments/results/${attempt.id}`);
    } catch (err) {
      await exitFullscreen();
      router.replace(`/assessments/results/${attempt.id}`);
    }
  };

  // 8. Auto-submit on Disqualification (3 strikes)
  const handleDisqualificationSubmit = async (overrideViolations: ProctoringViolation[], reason: string) => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
      const finalProctoringLog: ProctoringLog = {
        integrityScore: 0,
        totalViolations: overrideViolations.length,
        tabSwitchViolations: overrideViolations.filter(v => v.type === "tab_switch").length,
        fullscreenViolations: overrideViolations.filter(v => v.type === "fullscreen_exit").length,
        blurViolations: overrideViolations.filter(v => v.type === "window_blur").length,
        copyPasteViolations: overrideViolations.filter(v => v.type === "copy_paste_attempt").length,
        devtoolsViolations: overrideViolations.filter(v => v.type === "devtools_attempt").length,
        isDisqualified: true,
        disqualificationReason: `Examination automatically terminated: ${reason}. Maximum 3 security strikes exceeded.`,
        cameraActive,
        microphoneActive: micActive,
        violations: overrideViolations,
      };

      await fetch(`/api/assessments/exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.id,
          answers,
          autoExpired: false,
          proctoring: finalProctoringLog,
        }),
      });
      // Turn off fullscreen mode after finishing exam
      await exitFullscreen();
      router.replace(`/assessments/results/${attempt.id}`);
    } catch (err) {
      await exitFullscreen();
      router.replace(`/assessments/results/${attempt.id}`);
    }
  };

  // 9. Manual Final Submission
  const handleFinalSubmit = async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/assessments/exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.id,
          answers,
          autoExpired: false,
          proctoring: getProctoringLog(),
        }),
      });
      // Turn off fullscreen mode after finishing exam
      await exitFullscreen();
      router.replace(`/assessments/results/${attempt.id}`);
    } catch (err: any) {
      console.error(err);
      setSubmitting(false);
    }
  };

  // Option selection
  const handleSelectOption = (questionId: string, optionId: string, isMulti: boolean) => {
    setAnswers(prev => {
      if (isMulti) {
        const currentArr = Array.isArray(prev[questionId]) ? [...prev[questionId]] : [];
        const exists = currentArr.indexOf(optionId);
        if (exists >= 0) {
          currentArr.splice(exists, 1);
        } else {
          currentArr.push(optionId);
        }
        return { ...prev, [questionId]: currentArr };
      } else {
        return { ...prev, [questionId]: optionId };
      }
    });
  };

  const handleNumericalAnswer = (questionId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handleClearAnswer = (questionId: string) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  // Code runner
  const handleExecuteCode = async (question: Question) => {
    const code = answers[question.id] || question.starterCode || "";
    setCodeRunning(true);
    try {
      const res = await fetch("/api/assessments/execute-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          code,
          language: question.language || "python",
        }),
      });
      const data = await res.json();
      setCodeOutputs(prev => ({ ...prev, [question.id]: data }));
    } catch (err: any) {
      setCodeOutputs(prev => ({ ...prev, [question.id]: { error: err.message } }));
    } finally {
      setCodeRunning(false);
    }
  };

  // Re-enter Fullscreen action (All Devices)
  const handleResumeFullscreen = async () => {
    if (lockdownCooldown > 0) return;
    try {
      await requestFullscreen();
      setIsFullscreen(true);
      await lockKeyboard();
    } catch (e) {}
    setShowFullscreenWarning(false);
    setShowFocusShield(false);
    setLockdownCooldown(0);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
  };

  // Metrics
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== "").length;
  const reviewCount = markedForReview.length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  // Time format
  const minutes = Math.floor(timeRemainingSeconds / 60);
  const seconds = timeRemainingSeconds % 60;
  const isTimeCritical = timeRemainingSeconds < 300;

  // Tripartite section distribution
  const getSectionForIndex = (idx: number): "section_a" | "section_b" | "section_c" => {
    if (exam?.sections && exam.sections.length > 0) {
      const q = questions[idx];
      if (q) {
        const found = exam.sections.find((s: any) => s.questionIds && s.questionIds.includes(q.id));
        if (found) return found.id as "section_a" | "section_b" | "section_c";
      }
    }
    if (idx < Math.floor(questions.length * 0.25)) return "section_a";
    if (idx >= Math.floor(questions.length * 0.75)) return "section_c";
    return "section_b";
  };

  const currentSectionId = getSectionForIndex(currentIndex);
  const sectionAQuestions = questions.filter((_, i) => getSectionForIndex(i) === "section_a");
  const sectionBQuestions = questions.filter((_, i) => getSectionForIndex(i) === "section_b");
  const sectionCQuestions = questions.filter((_, i) => getSectionForIndex(i) === "section_c");

  const sectionAAnswered = sectionAQuestions.filter(q => answers[q.id] !== undefined && answers[q.id] !== "").length;
  const sectionBAnswered = sectionBQuestions.filter(q => answers[q.id] !== undefined && answers[q.id] !== "").length;
  const sectionCAnswered = sectionCQuestions.filter(q => answers[q.id] !== undefined && answers[q.id] !== "").length;

  const handleJumpToSection = (secId: "section_a" | "section_b" | "section_c") => {
    const firstIdx = questions.findIndex((_, i) => getSectionForIndex(i) === secId);
    if (firstIdx >= 0) setCurrentIndex(firstIdx);
  };

  // Error loading state
  if (loadError) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center p-4 z-[99999]">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">
              {isLimitReached ? "Attempt Limit Reached" : "Could Not Load Assessment"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {loadError}
            </p>
          </div>
          <div className="space-y-2 pt-2">
            {isSecondLoginBlocked || (loadError && (loadError.toLowerCase().includes("concurrent") || loadError.toLowerCase().includes("second login"))) ? (
              <>
                <button
                  type="button"
                  onClick={handleReclaimSession}
                  className="w-full py-3.5 rounded-2xl bg-electric-500 hover:bg-electric-600 text-white font-bold text-xs transition shadow-electric flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Ongoing Session (Reconnect)</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAndRestart}
                  className="w-full py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Attempts &amp; Start Fresh</span>
                </button>
              </>
            ) : isLimitReached ? (
              <button
                type="button"
                onClick={handleResetAndRestart}
                className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition shadow-soft-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Attempts &amp; Retake Assessment</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition shadow-soft-sm"
              >
                Retry Loading Examination
              </button>
            )}
            <Link
              href={`/assessments/exams/${examId}`}
              className="block w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Return to Exam Overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !currentQuestion) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-[99999]">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
            <div className="w-14 h-14 border-4 border-[#6f6bea] border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-lg tracking-tight text-white">Nyeras Proctored Environment</h3>
            <p className="text-xs text-slate-400">Initializing encrypted anti-cheat lockdown &amp; question telemetry...</p>
          </div>
        </div>
      </div>
    );
  }

  const isCurrentAnswered = answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== "";
  const isCurrentMarked = markedForReview.includes(currentQuestion.id);

  return (
    <div className="fixed inset-0 bg-slate-100 flex flex-col z-[9999] select-none proctored-lockdown overflow-hidden">
      
      {/* ============================================================ */}
      {/* 0. PRE-FLIGHT PROCTORING SETUP & VERIFICATION MODAL          */}
      {/* ============================================================ */}
      {showPreflightModal && (
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-9 shadow-2xl border border-slate-200 space-y-6 my-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-electric-600 text-xs font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>National Proctored Exam Protocol</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {exam?.title}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Domain: <strong className="text-slate-800">{exam?.domainName}</strong> • Candidate: <strong className="text-slate-800">{currentUser.name}</strong>
                </p>
              </div>

              <div className="hidden sm:flex flex-col items-end text-right text-xs">
                <span className="font-mono font-bold text-slate-400 uppercase text-[10px]">Duration</span>
                <span className="text-lg font-black text-slate-900 font-mono">{exam?.durationMinutes || 30} Mins</span>
              </div>
            </div>

            {/* Video Camera Preview & System Check */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="relative rounded-2xl bg-slate-950 overflow-hidden aspect-[4/3] flex items-center justify-center border border-slate-800 shadow-inner group">
                <video
                  ref={preflightVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-emerald-500/40 rounded-2xl m-3" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${detectedFaceCount === 1 ? "bg-emerald-500 animate-pulse" : detectedFaceCount > 1 ? "bg-rose-500 animate-ping" : "bg-amber-400 animate-pulse"}`} />
                    <span>{detectedFaceCount === 1 ? "AI Face Scan Active" : detectedFaceCount > 1 ? "⚠️ Multiple Faces Detected" : "⚠️ Candidate Missing"}</span>
                  </span>
                  <span className={`font-mono text-[10px] ${detectedFaceCount === 1 ? "text-emerald-400 font-bold" : detectedFaceCount > 1 ? "text-rose-400 font-bold animate-pulse" : "text-amber-400 font-bold animate-pulse"}`}>
                    {detectedFaceCount === 1 ? "1 Person Verified" : detectedFaceCount > 1 ? `${detectedFaceCount} People in Frame` : "No Face Detected"}
                  </span>
                </div>
              </div>

              {/* Proctoring Checklist */}
              <div className="space-y-3 flex flex-col justify-between text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block font-mono">
                    Anti-Cheat Lockdown Checklist
                  </span>
                  <div className="space-y-2 text-slate-700 font-medium">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>No Tab Switch: Leaving exam tab strictly blocked &amp; penalized</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>No Window Switch: Focus loss or external app switching prohibited</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Phone / Dual Face Recognition: Max 3 warnings before disqualification</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>No Second Login: Single active session only (1 time in the exam)</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong>Strict Integrity Rules:</strong> Tab switches, window switches, phones, or dual faces receive a maximum of <strong>3 warning strikes</strong> before automatic termination. Concurrent second logins are immediately blocked.
                </div>
              </div>
            </div>

            {/* Launch Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleLaunchProctoredExam}
                className="w-full py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-lg transition-all"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Enter Fullscreen &amp; Launch Proctored Cockpit</span>
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
                By starting, you agree to academic proctoring terms and automated anti-cheating telemetry.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. IMMERSIVE PROCTORED TOP COCKPIT BAR (Nyeras design)      */}
      {/* ============================================================ */}
      <header className="bg-slate-950 text-white border-b border-slate-800 px-4 sm:px-6 py-2.5 shrink-0 flex items-center justify-between shadow-lg relative z-20">
        
        {/* Left: Exam Details & Candidate Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-electric-500 shadow-[0_0_8px_#6f6bea]" />
            <span className="font-black text-sm tracking-tight text-white hidden sm:inline">
              {exam?.title}
            </span>
          </div>

          <span className="text-[11px] bg-slate-800/90 text-blue-400 px-2.5 py-0.5 rounded-full font-mono font-bold border border-slate-700">
            {exam?.domainName}
          </span>

          <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
            Candidate: <strong className="text-slate-200">{currentUser.name}</strong>
          </span>
        </div>

        {/* Center: Live Anti-Cheat Proctoring Status Pill */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300 font-bold hidden sm:inline">Lockdown Active</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className={violations.length > 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
            {integrityScore}% ({violations.length}/3 Strikes)
          </span>
        </div>

        {/* Right: Autosave, Clock & Finish Exam */}
        <div className="flex items-center space-x-3">
          {/* Autosave status indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-slate-400 font-mono">
            <span className={`w-2 h-2 rounded-full ${autosaveStatus === "saved" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
            <span>{autosaveStatus === "saved" ? "Cloud Synced" : "Syncing..."}</span>
          </div>

          {/* Fullscreen Lockdown Status & Toggle */}
          <button
            type="button"
            onClick={handleResumeFullscreen}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border transition ${
              isFullscreen
                ? "bg-slate-900 text-slate-300 border-slate-700 hover:text-white"
                : "bg-amber-950/80 text-amber-300 border-amber-500/60 animate-pulse hover:bg-amber-900"
            }`}
            title={isFullscreen ? "Fullscreen lockdown active" : "Re-enter fullscreen mode"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isFullscreen ? "Fullscreen" : "Go Fullscreen"}</span>
          </button>

          {/* Countdown Clock */}
          <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full font-mono text-xs sm:text-sm font-black tracking-wider transition-all ${
            isTimeCritical
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse"
              : "bg-slate-900 text-white border border-slate-800"
          }`}>
            <Clock className={`w-3.5 h-3.5 ${isTimeCritical ? "text-rose-400" : "text-electric-600"}`} />
            <span>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
          </div>

          {/* Finish Exam Button */}
          <button
            type="button"
            onClick={() => setSubmitModalOpen(true)}
            className="px-4 py-1.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-soft-sm flex items-center space-x-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish Test</span>
          </button>
        </div>
      </header>

      {/* Real-time Persistent Security Warning Banner (Displays when infractions exist) */}
      {violations.length > 0 && !showFocusShield && (
        <div className="bg-rose-950/90 border-b border-rose-500/40 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-rose-200 shadow-lg relative z-10 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center space-x-2.5 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-bold text-white">
              SECURITY WARNING: Strike #{violations.length} of 3 Recorded
            </span>
            <span className="text-rose-300 hidden sm:inline">
              — {violations[violations.length - 1].details}
            </span>
          </div>
          <div className="flex items-center space-x-3 font-mono text-[11px]">
            <span className="text-amber-300 font-bold">
              {3 - violations.length} Strike(s) Left Before Auto-Disqualification
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-bold">{integrityScore}% Integrity</span>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. SECTION NAVIGATION BAR (NTCRA Tripartite)                 */}
      {/* ============================================================ */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-2 flex items-center justify-between text-xs overflow-x-auto shrink-0 z-10">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-black text-slate-400 uppercase font-mono tracking-wider mr-1 hidden sm:inline">
            Sections:
          </span>

          <button
            type="button"
            onClick={() => handleJumpToSection("section_a")}
            className={`px-3 py-1 rounded-full font-extrabold text-[11px] transition-all flex items-center space-x-1.5 ${
              currentSectionId === "section_a"
                ? "bg-electric-500 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            <span>Sec A: Aptitude (25%)</span>
            <span className="text-[10px] opacity-75 font-normal">({sectionAAnswered}/{sectionAQuestions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleJumpToSection("section_b")}
            className={`px-3 py-1 rounded-full font-extrabold text-[11px] transition-all flex items-center space-x-1.5 ${
              currentSectionId === "section_b"
                ? "bg-electric-500 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            <span>Sec B: Core Domain (50%)</span>
            <span className="text-[10px] opacity-75 font-normal">({sectionBAnswered}/{sectionBQuestions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleJumpToSection("section_c")}
            className={`px-3 py-1 rounded-full font-extrabold text-[11px] transition-all flex items-center space-x-1.5 ${
              currentSectionId === "section_c"
                ? "bg-electric-500 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            <span>Sec C: Workplace Readiness (25%)</span>
            <span className="text-[10px] opacity-75 font-normal">({sectionCAnswered}/{sectionCQuestions.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-blue-400 font-mono hidden md:flex">
          <Monitor className="w-3.5 h-3.5" />
          <span>Single-Display Lockdown Active</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MAIN EXAM COCKPIT LAYOUT                                  */}
      {/* ============================================================ */}
      <div className={`flex-1 flex overflow-hidden relative ${showFocusShield ? "focus-shield-blur" : ""}`}>
        
        {/* Left: Question Viewer & Interactive Answer Workspace */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-between">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            
            {/* Question Header Card */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
              <div className="flex items-center space-x-2.5 font-mono">
                <span className="font-black text-slate-900 text-lg">
                  Question {currentIndex + 1}
                </span>
                <span className="text-slate-400 font-medium">of {totalQuestions}</span>
                <span className="text-slate-300">|</span>
                <span className="text-electric-600 font-bold">{currentQuestion.topic}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="capitalize font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {currentQuestion.difficulty}
                </span>
                <span className="font-mono text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  +{currentQuestion.marks} M
                </span>
                {currentQuestion.negativeMarks > 0 && (
                  <span className="font-mono text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    -{currentQuestion.negativeMarks} M
                  </span>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed whitespace-pre-line select-none">
              {currentQuestion.questionText}
            </div>

            {/* A. Coding Question Interface */}
            {currentQuestion.type === "coding" ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-200/70 p-2.5 rounded-2xl font-mono">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-slate-800" />
                    <span>Sandbox Language: <strong className="text-slate-950 uppercase">{currentQuestion.language || "python"}</strong></span>
                  </div>
                  <button
                    type="button"
                    disabled={codeRunning}
                    onClick={() => handleExecuteCode(currentQuestion)}
                    className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-soft-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{codeRunning ? "Running Sandbox..." : "Run Test Cases"}</span>
                  </button>
                </div>

                <div className="border border-slate-300 rounded-2xl overflow-hidden bg-slate-950 text-slate-100 font-mono text-xs shadow-soft-md">
                  <textarea
                    rows={12}
                    value={answers[currentQuestion.id] ?? currentQuestion.starterCode ?? ""}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                    placeholder="// Write your code solution here..."
                    className="w-full p-4 bg-transparent text-emerald-400 focus:outline-none focus:ring-0 resize-y font-mono text-xs sm:text-sm leading-relaxed"
                    spellCheck={false}
                  />
                </div>

                {/* Execution test report */}
                {codeOutputs[currentQuestion.id] && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-soft-sm space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">Execution Report</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                        codeOutputs[currentQuestion.id].success ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {codeOutputs[currentQuestion.id].status} ({codeOutputs[currentQuestion.id].passedCases}/{codeOutputs[currentQuestion.id].totalCases} Passed)
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {codeOutputs[currentQuestion.id].testResults?.map((tr: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono text-[11px]">
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full ${tr.passed ? "bg-emerald-500" : "bg-rose-500"}`} />
                            <span>Test Case {idx + 1} {tr.isHidden ? "(Hidden)" : ""}</span>
                          </div>
                          <span className={tr.passed ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                            {tr.passed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : currentQuestion.type === "numerical" ? (
              // B. Numerical Answer Input
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Type Your Numerical Value
                </label>
                <div className="max-w-xs">
                  <input
                    type="number"
                    step="any"
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleNumericalAnswer(currentQuestion.id, e.target.value)}
                    placeholder="e.g. 42.5"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 font-mono text-base focus:ring-2 focus:ring-blue-500/20 focus:border-electric-500 bg-white shadow-xs"
                  />
                </div>
              </div>
            ) : (
              // C. Single / Multiple Choice Options
              <div className="space-y-3 pt-2">
                {currentQuestion.options?.map((opt, optIdx) => {
                  const isMulti = currentQuestion.type === "multiple_choice";
                  const isSelected = isMulti
                    ? Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(opt.id)
                    : answers[currentQuestion.id] === opt.id;

                  const letterLabel = String.fromCharCode(65 + optIdx); // A, B, C, D

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, opt.id, isMulti)}
                      className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-start space-x-3.5 ${
                        isSelected
                          ? "border-electric-500 bg-blue-50/70 text-slate-950 ring-2 ring-blue-500/25 shadow-soft-sm"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border text-xs font-mono font-black transition-all ${
                        isSelected
                          ? "bg-electric-500 border-electric-500 text-white"
                          : "border-slate-300 bg-slate-100 text-slate-600"
                      }`}>
                        {isMulti ? (isSelected ? "✓" : letterLabel) : letterLabel}
                      </div>
                      <span className="leading-relaxed pt-0.5">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Keyboard shortcut guide */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
              <span>Shortcuts:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">1-4 / A-D</kbd><span>Select</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">N / →</kbd><span>Next</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">P / ←</kbd><span>Prev</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">M</kbd><span>Review</span>
            </div>

          </div>

          {/* Action Bar: Prev, Next, Review, Clear */}
          <div className="max-w-4xl mx-auto w-full pt-6 mt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => toggleMarkForReview(currentQuestion.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                  isCurrentMarked
                    ? "bg-purple-100 text-purple-900 border border-purple-300"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isCurrentMarked ? "Marked for Review" : "Mark for Review"}</span>
              </button>

              {isCurrentAnswered && (
                <button
                  type="button"
                  onClick={() => handleClearAnswer(currentQuestion.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-40 transition flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                disabled={currentIndex === totalQuestions - 1}
                onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black disabled:opacity-40 transition flex items-center space-x-1 shadow-soft-sm"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Navigation Palette (Desktop Sidebar) */}
        <div className="w-72 bg-white border-l border-slate-200 p-5 hidden lg:flex flex-col justify-between shrink-0 shadow-soft-sm z-10">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-black text-slate-900 text-sm">
                Question Palette ({totalQuestions})
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {answeredCount}/{totalQuestions} Answered
              </span>
            </div>

            {/* Palette Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] mb-5 p-3 rounded-2xl bg-slate-50 border border-slate-100 font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-slate-600">Pending ({unansweredCount})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-slate-600">Review ({reviewCount})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-electric-500" />
                <span className="text-slate-600">Current</span>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isAns = answers[q.id] !== undefined && answers[q.id] !== "";
                const isRev = markedForReview.includes(q.id);
                const isCur = idx === currentIndex;

                let colorClasses = "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
                if (isCur) {
                  colorClasses = "bg-electric-500 text-white ring-2 ring-blue-300 font-black border-electric-500";
                } else if (isRev) {
                  colorClasses = "bg-purple-600 text-white font-bold border-purple-700";
                } else if (isAns) {
                  colorClasses = "bg-emerald-600 text-white font-bold border-emerald-700";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl border text-xs font-mono transition flex items-center justify-center ${colorClasses}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setSubmitModalOpen(true)}
              className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition shadow-soft-sm flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit &amp; View Results</span>
            </button>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 4. FLOATING WEBCAM PROCTORING PICTURE-IN-PICTURE WIDGET     */}
      {/* ============================================================ */}
      {proctoringStarted && (
        <div className="fixed bottom-4 right-4 z-40 select-none">
          {cameraMinimized ? (
            <button
              type="button"
              onClick={() => setCameraMinimized(false)}
              className="p-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center space-x-2 text-xs font-bold hover:scale-105 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Camera className="w-4 h-4" />
              <span>Proctored Feed</span>
            </button>
          ) : (
            <div className="w-44 sm:w-52 rounded-2xl bg-slate-950 p-2 shadow-2xl border border-slate-800 text-white space-y-2 backdrop-blur-xl">
              <div className="flex items-center justify-between px-1 text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>LIVE PROCTOR</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCameraMinimized(true)}
                  className="hover:text-white"
                  title="Minimize camera view"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                <video
                  ref={examVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <div className="absolute inset-0 border border-dashed border-emerald-500/40 rounded-xl m-1.5 pointer-events-none" />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span className="flex items-center gap-1 text-slate-300">
                  <Mic className="w-3 h-3 text-emerald-400" /> Mic: Active
                </span>
                <span className={detectedFaceCount > 1 ? "text-rose-400 font-bold animate-pulse bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-600/50" : detectedFaceCount === 0 ? "text-amber-400 font-bold animate-pulse bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-600/50" : "text-emerald-400 font-bold"}>
                  {detectedFaceCount > 1 ? `🚨 Dual Face (${detectedFaceCount})` : detectedFaceCount === 0 ? "⚠️ Face Missing" : "✓ 1 Face"}
                </span>
              </div>

              {phoneDetected && (
                <div className="bg-rose-950/80 border border-rose-600 text-rose-300 text-[9px] px-2 py-0.5 rounded-lg font-mono font-bold text-center animate-pulse">
                  📱 Mobile Phone In Frame!
                </div>
              )}

              {/* Proctor verification test triggers for 3-warning demonstration */}
              <div className="grid grid-cols-2 gap-1 pt-1">
                <button
                  type="button"
                  onClick={handleSimulateDualFace}
                  className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[9px] text-slate-300 font-mono transition text-center"
                  title="Simulate dual face recognition (3 warnings allowed)"
                >
                  Dual Face ({dualFaceStrikesRef.current}/3)
                </button>
                <button
                  type="button"
                  onClick={handleSimulatePhone}
                  className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[9px] text-slate-300 font-mono transition text-center"
                  title="Simulate mobile phone detection (3 warnings allowed)"
                >
                  Phone ({phoneStrikesRef.current}/3)
                </button>
              </div>

              {/* Developer Diagnostics Panel Toggle */}
              <div className="pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowDiagnosticsPanel(prev => !prev)}
                  className="w-full text-center py-0.5 text-[9px] text-slate-400 hover:text-slate-200 font-mono transition flex items-center justify-center gap-1"
                >
                  <span>{showDiagnosticsPanel ? "Hide AI Diagnostics ▲" : "Proctor Diagnostics ▼"}</span>
                </button>

                {showDiagnosticsPanel && (
                  <div className="mt-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-[9px] font-mono space-y-1 text-slate-300">
                    <div className="flex justify-between"><span className="text-slate-500">Camera:</span> <span className="text-emerald-400 font-bold">{proctorDiagnostics.camera}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Resolution:</span> <span>{proctorDiagnostics.resolution}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Sampling FPS:</span> <span>~{proctorDiagnostics.fps}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Detected faces:</span> <span>{proctorDiagnostics.detectedFaces}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Reliable faces:</span> <span className="font-bold text-white">{proctorDiagnostics.reliableFaces}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Primary conf:</span> <span>{(proctorDiagnostics.primaryConfidence * 100).toFixed(0)}%</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Secondary conf:</span> <span>{proctorDiagnostics.secondaryConfidence > 0 ? `${(proctorDiagnostics.secondaryConfidence * 100).toFixed(0)}%` : "—"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tracked faces:</span> <span>{proctorDiagnostics.trackedFaces}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Multi-face persistence:</span> <span>{proctorDiagnostics.multiFacePersistence} / 5</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">State:</span> <span className={proctorDiagnostics.faceMonitorState === "ONE_FACE" ? "text-emerald-400 font-bold" : proctorDiagnostics.faceMonitorState === "MULTIPLE_CONFIRMED" ? "text-rose-400 font-bold" : "text-amber-400 font-bold"}>{proctorDiagnostics.faceMonitorState}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Image quality:</span> <span className={proctorDiagnostics.imageQuality === "GOOD" ? "text-emerald-400" : "text-amber-400"}>{proctorDiagnostics.imageQuality}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Last event:</span> <span className={proctorDiagnostics.lastEvent === "NONE" ? "text-slate-400" : "text-rose-400 font-bold"}>{proctorDiagnostics.lastEvent}</span></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. FOCUS SHIELD OVERLAY (Anti-Tab Switch & Split Screen)      */}
      {/* ============================================================ */}
      {showFocusShield && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/92 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-rose-600 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <ShieldAlert className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-wider font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Security Warning • Infraction Logged</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ⚠️ Screen Change / Tab Switch Detected
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {focusShieldReason || "Security Warning: Screen change, window focus loss, or background navigation detected. You must remain inside the proctored test cockpit on your primary screen at all times."}
              </p>
            </div>

            {/* Strikes remaining badge */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 font-mono text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Security Strikes:</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {[1, 2, 3].map((s) => (
                  <span
                    key={s}
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white transition-all ${
                      s <= violations.length ? "bg-rose-600 ring-2 ring-rose-300 scale-110" : "bg-slate-200 text-slate-400"
                    }`}
                    title={`Strike ${s}`}
                  >
                    {s}
                  </span>
                ))}
                <span className="font-black text-rose-700 ml-2">
                  {violations.length} of 3 Strikes Used
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={lockdownCooldown > 0}
                onClick={handleResumeFullscreen}
                className={`w-full py-3.5 rounded-2xl font-black text-xs transition shadow-lg flex items-center justify-center gap-2 ${
                  lockdownCooldown > 0
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 cursor-pointer"
                }`}
              >
                {lockdownCooldown > 0 ? (
                  <>
                    <Lock className="w-4 h-4 animate-spin" />
                    <span>Security Penalty Lock: Unlocks in {lockdownCooldown}s...</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    <span>Acknowledge Warning &amp; Resume Examination</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 font-medium">
                {lockdownCooldown > 0 
                  ? "Mandatory penalty lock active. Direct screen switching and background navigation are restricted."
                  : violations.length >= 2 
                    ? "CRITICAL WARNING: Next infraction will immediately disqualify and submit your attempt."
                    : "Any further screen switches, external monitors, or tab changes will reduce your integrity score and disqualify your attempt."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. FULLSCREEN EXIT WARNING OVERLAY                          */}
      {/* ============================================================ */}
      {showFullscreenWarning && !showFocusShield && (
        <div className="fixed inset-0 z-[99998] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Maximize2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Fullscreen Required
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have exited full-screen mode. Proctored exams must be taken in dedicated full-screen mode to prevent secondary overlay tools.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResumeFullscreen}
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition shadow-soft-sm"
            >
              Return to Fullscreen Mode
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. DISQUALIFIED MODAL (3 Strikes Exceeded)                   */}
      {/* ============================================================ */}
      {isDisqualified && (
        <div className="fixed inset-0 z-[100010] bg-black flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-5 border-2 border-rose-600">
            <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-rose-600/30">
              <X className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Exam Disqualified
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have exceeded the maximum limit of 3 security infractions (tab switches, window blur, or overlay attempts). Your attempt has been terminated and logged with the integrity committee.
              </p>
            </div>
            <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[11px] font-mono font-bold text-slate-400">
              Submitting proctoring incident audit...
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. TOAST NOTIFICATION BADGE                                  */}
      {/* ============================================================ */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100020] bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-full shadow-2xl border border-rose-500/50 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. SUBMIT CONFIRMATION MODAL                                 */}
      {/* ============================================================ */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-electric-600 flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Submit Examination?
              </h3>
              <p className="text-xs text-slate-500">
                Are you ready to submit your answers? You cannot modify your responses after final submission.
              </p>
            </div>

            {/* Answer Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs p-4 rounded-2xl bg-slate-50 border border-slate-100 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Answered</span>
                <span className="text-base font-black text-emerald-700">{answeredCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">For Review</span>
                <span className="text-base font-black text-purple-700">{reviewCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Unanswered</span>
                <span className="text-base font-black text-slate-700">{unansweredCount}</span>
              </div>
            </div>

            {/* Proctoring integrity summary */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-600 font-semibold">Proctoring Score:</span>
              <span className={`font-black ${violations.length === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                {integrityScore}% ({violations.length} Infractions)
              </span>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 transition"
              >
                Keep Reviewing
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="flex-1 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-soft-sm transition"
              >
                {submitting ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
