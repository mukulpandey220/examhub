"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Camera,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Mic,
  ShieldCheck,
  Eye,
  Smartphone,
  Sparkles,
} from "lucide-react";
import {
  scanVideoFrame,
  VisionScanResult,
  EnrichedFace,
} from "@/lib/proctoring-vision";
import { playProctorWarningBeep } from "@/lib/proctor-audio";

export interface ProctorWarningBanner {
  id: string;
  eventType: string;
  message: string;
  severity: "low" | "medium" | "high" | "technical";
  timestamp: number;
}

interface ProctoringWebcamMonitorProps {
  stream?: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraActive: boolean;
  onViolation?: (type: string, message: string) => void;
  className?: string;
}

export function ProctoringWebcamMonitor({
  stream,
  videoRef,
  isCameraActive,
  onViolation,
  className = "",
}: ProctoringWebcamMonitorProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [fps, setFps] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [faceCount, setFaceCount] = useState(1);
  const [trackingState, setTrackingState] = useState<"VERIFIED" | "NEAR_EDGE" | "DEVIATED" | "MULTI_FACE" | "NO_FACE">("VERIFIED");
  const [edgeWarningText, setEdgeWarningText] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<ProctorWarningBanner[]>([]);

  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastFpsCalcRef = useRef(Date.now());
  const frameCountRef = useRef(0);
  const lastEdgeAlertTimeRef = useRef(0);

  // Push floating warning banner with audio alert
  const pushWarning = useCallback((banner: {
    eventType: string;
    message: string;
    severity: "low" | "medium" | "high" | "technical";
  }) => {
    const newWarn: ProctorWarningBanner = {
      id: Math.random().toString(36).substring(2, 9),
      eventType: banner.eventType,
      message: banner.message,
      severity: banner.severity,
      timestamp: Date.now(),
    };

    // Synthesize warning tone via Web Audio API
    playProctorWarningBeep(banner.severity);

    setWarnings((prev) => [newWarn, ...prev.slice(0, 3)]);

    setTimeout(() => {
      setWarnings((prev) => prev.filter((w) => w.id !== newWarn.id));
    }, 6000);
  }, []);

  // Sync stream to video element
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.muted = true;
      video.defaultMuted = true;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play().catch(() => {});
    }
  }, [stream, videoRef]);

  /**
   * High-Precision Canvas Edge Rendering Routine
   * Renders the Viewport Edge Guard, Face Bounding Corner Brackets, Facial Wireframe Contours,
   * Gaze Orientation Ray, and Edge Alarms with crisp anti-aliased strokes.
   */
  const renderEdgesClearly = useCallback((
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    scanResult: VisionScanResult
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. RENDER VIEWPORT EDGE GUARD (6% Safe Zone Boundary)
    const { marginX, marginY, safeWidth, safeHeight } = scanResult.viewportSafeZone;
    const isAnyFaceNearEdge = scanResult.rawFaces.some((f) => f.edgeProximity?.isNearEdge);
    const activeEdgeName = scanResult.rawFaces.find((f) => f.edgeProximity?.isNearEdge)?.edgeProximity?.edgeName;

    ctx.save();

    // A. Viewport Safe Zone Boundary (Dashed Guide)
    ctx.strokeStyle = isAnyFaceNearEdge ? "rgba(245, 158, 11, 0.75)" : "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(marginX, marginY, safeWidth, safeHeight);
    ctx.setLineDash([]);

    // B. Viewport 4-Corner Reticles (Crisp L-Brackets at frame edges)
    const cornerArm = 14;
    ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
    ctx.lineWidth = 2;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(marginX, marginY + cornerArm);
    ctx.lineTo(marginX, marginY);
    ctx.lineTo(marginX + cornerArm, marginY);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(marginX + safeWidth - cornerArm, marginY);
    ctx.lineTo(marginX + safeWidth, marginY);
    ctx.lineTo(marginX + safeWidth, marginY + cornerArm);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(marginX, marginY + safeHeight - cornerArm);
    ctx.lineTo(marginX, marginY + safeHeight);
    ctx.lineTo(marginX + cornerArm, marginY + safeHeight);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(marginX + safeWidth - cornerArm, marginY + safeHeight);
    ctx.lineTo(marginX + safeWidth, marginY + safeHeight);
    ctx.lineTo(marginX + safeWidth, marginY + safeHeight - cornerArm);
    ctx.stroke();

    // C. Viewport Edge Alarms: If face is drifting near a border, illuminate that border edge!
    if (activeEdgeName) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(239, 68, 68, 0.95)";
      ctx.shadowColor = "rgba(239, 68, 68, 0.9)";
      ctx.shadowBlur = 10;
      ctx.beginPath();

      if (activeEdgeName === "left" || activeEdgeName === "horizontal_borders") {
        ctx.moveTo(marginX, marginY);
        ctx.lineTo(marginX, marginY + safeHeight);
      }
      if (activeEdgeName === "right" || activeEdgeName === "horizontal_borders") {
        ctx.moveTo(marginX + safeWidth, marginY);
        ctx.lineTo(marginX + safeWidth, marginY + safeHeight);
      }
      if (activeEdgeName === "top") {
        ctx.moveTo(marginX, marginY);
        ctx.lineTo(marginX + safeWidth, marginY);
      }
      if (activeEdgeName === "bottom") {
        ctx.moveTo(marginX, marginY + safeHeight);
        ctx.lineTo(marginX + safeWidth, marginY + safeHeight);
      }
      ctx.stroke();
    }

    ctx.restore();

    // 2. RENDER DETECTED FACES (Bounding Box, Corner Reticles, Wireframe Contours, Gaze Vector)
    if (scanResult.rawFaces.length === 0) {
      // No face guide
      ctx.save();
      ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
      ctx.font = "bold 11px ui-monospace, SFMono-Regular, monospace";
      ctx.textAlign = "center";
      ctx.fillText("⚠️ NO CANDIDATE DETECTED", w / 2, h / 2);
      ctx.restore();
      return;
    }

    scanResult.rawFaces.forEach((face, idx) => {
      const isPrimary = idx === 0;
      const isMultiFaceThreat = scanResult.rawFaces.length > 1 && !isPrimary;
      const isNearEdge = face.edgeProximity?.isNearEdge;
      const isDeviated = face.headPose?.isDeviated;

      // Color scheme
      let edgeColor = "#38bdf8"; // Electric cyan
      let glowColor = "rgba(56, 189, 248, 0.6)";

      if (isMultiFaceThreat) {
        edgeColor = "#ef4444"; // Red for secondary intruder
        glowColor = "rgba(239, 68, 68, 0.8)";
      } else if (isNearEdge) {
        edgeColor = "#f59e0b"; // Amber for edge warning
        glowColor = "rgba(245, 158, 11, 0.75)";
      } else if (isDeviated) {
        edgeColor = "#a855f7"; // Purple for head rotation
        glowColor = "rgba(168, 85, 247, 0.6)";
      }

      const { x, y, width: bw, height: bh } = face.boundingBox;

      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = edgeColor;

      // A. Draw Sharp HUD Corner Brackets around face
      const bracketLen = Math.min(bw, bh) * 0.28;

      // Top-Left bracket
      ctx.beginPath();
      ctx.moveTo(x, y + bracketLen);
      ctx.lineTo(x, y);
      ctx.lineTo(x + bracketLen, y);
      ctx.stroke();

      // Top-Right bracket
      ctx.beginPath();
      ctx.moveTo(x + bw - bracketLen, y);
      ctx.lineTo(x + bw, y);
      ctx.lineTo(x + bw, y + bracketLen);
      ctx.stroke();

      // Bottom-Left bracket
      ctx.beginPath();
      ctx.moveTo(x, y + bh - bracketLen);
      ctx.lineTo(x, y + bh);
      ctx.lineTo(x + bracketLen, y + bh);
      ctx.stroke();

      // Bottom-Right bracket
      ctx.beginPath();
      ctx.moveTo(x + bw - bracketLen, y + bh);
      ctx.lineTo(x + bw, y + bh);
      ctx.lineTo(x + bw, y + bh - bracketLen);
      ctx.stroke();

      // B. Face Center Target Reticle (+)
      const cx = x + bw / 2;
      const cy = y + bh / 2;
      const crossSize = 5;

      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - crossSize, cy);
      ctx.lineTo(cx + crossSize, cy);
      ctx.moveTo(cx, cy - crossSize);
      ctx.lineTo(cx, cy + crossSize);
      ctx.stroke();

      // C. Facial Contour Wireframe Edges (Clearly rendered fiducials)
      if (face.landmarks && face.contourEdges) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = isPrimary ? "rgba(56, 189, 248, 0.38)" : "rgba(239, 68, 68, 0.35)";

        face.contourEdges.forEach(([i1, i2]) => {
          const p1 = face.landmarks![i1];
          const p2 = face.landmarks![i2];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });

        // Landmark points
        ctx.fillStyle = edgeColor;
        face.landmarks.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // D. 3D Head Pose Directional Ray (Orientation Vector)
      if (face.headPose && isPrimary) {
        const rayLen = 28;
        const radYaw = (face.headPose.yaw * Math.PI) / 180;
        const radPitch = (face.headPose.pitch * Math.PI) / 180;

        const tipX = cx + Math.sin(radYaw) * rayLen;
        const tipY = cy - Math.sin(radPitch) * rayLen;

        ctx.lineWidth = 2;
        ctx.strokeStyle = isDeviated ? "#f59e0b" : "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        ctx.fillStyle = isDeviated ? "#f59e0b" : "#38bdf8";
        ctx.beginPath();
        ctx.arc(tipX, tipY, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // E. Identification HUD Label Tag
      ctx.fillStyle = edgeColor;
      ctx.font = "bold 9px ui-monospace, SFMono-Regular, monospace";
      const label = isMultiFaceThreat
        ? "🚨 INTRUDER"
        : isNearEdge
        ? "⚠️ NEAR BORDER"
        : `LOCK #${idx + 1} ${(face.confidence * 100).toFixed(0)}%`;
      ctx.fillText(label, x + 3, Math.max(12, y - 4));

      ctx.restore();
    });
  }, []);

  // Continuous Vision Scan Loop
  useEffect(() => {
    let isRunning = true;

    const loop = async () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const hudCanvas = hudCanvasRef.current;

      if (video && hudCanvas && video.readyState >= 2 && video.videoWidth > 0) {
        // Sync canvas resolution to match video aspect
        if (hudCanvas.width !== video.videoWidth || hudCanvas.height !== video.videoHeight) {
          hudCanvas.width = video.videoWidth || 320;
          hudCanvas.height = video.videoHeight || 240;
        }

        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement("canvas");
          offscreenCanvasRef.current.width = 320;
          offscreenCanvasRef.current.height = 240;
        }

        const t0 = performance.now();
        const scanResult = await scanVideoFrame(video, offscreenCanvasRef.current);
        const latency = Math.round(performance.now() - t0);
        setLatencyMs(latency);

        // Update face counts and statuses
        const faces = scanResult.rawFaces;
        setFaceCount(faces.length);

        if (faces.length === 0) {
          setTrackingState("NO_FACE");
          setEdgeWarningText(null);
        } else if (faces.length > 1) {
          setTrackingState("MULTI_FACE");
          setEdgeWarningText("Multiple faces detected in camera frame!");
          const now = Date.now();
          if (now - lastEdgeAlertTimeRef.current > 4000) {
            lastEdgeAlertTimeRef.current = now;
            pushWarning({
              eventType: "MULTIPLE_FACES_DETECTED",
              message: "Multiple persons detected in exam area. Keep room clear.",
              severity: "high",
            });
            onViolation?.("multiple_faces", "Multiple persons detected in camera frame");
          }
        } else {
          const primary = faces[0];
          if (primary.edgeProximity?.isNearEdge) {
            setTrackingState("NEAR_EDGE");
            const side = primary.edgeProximity.edgeName?.toUpperCase() || "BORDER";
            setEdgeWarningText(`Face is drifting near ${side} edge. Keep centered.`);

            const now = Date.now();
            if (now - lastEdgeAlertTimeRef.current > 5000) {
              lastEdgeAlertTimeRef.current = now;
              pushWarning({
                eventType: "EDGE_PROXIMITY",
                message: `Face near ${side} edge of frame. Please remain centered.`,
                severity: "technical",
              });
            }
          } else if (primary.headPose?.isDeviated) {
            setTrackingState("DEVIATED");
            setEdgeWarningText(`Head turned ${primary.headPose.direction}. Look at screen.`);
          } else {
            setTrackingState("VERIFIED");
            setEdgeWarningText(null);
          }
        }

        // Render the sharp, high-tech edges onto the HUD canvas
        renderEdgesClearly(hudCanvas, video, scanResult);

        // Calculate FPS
        frameCountRef.current++;
        const elapsed = Date.now() - lastFpsCalcRef.current;
        if (elapsed >= 1000) {
          setFps(Math.round((frameCountRef.current * 1000) / elapsed));
          frameCountRef.current = 0;
          lastFpsCalcRef.current = Date.now();
        }
      }

      // Throttle scan to ~18-22 FPS for smooth CPU performance
      animFrameRef.current = window.setTimeout(loop, 50);
    };

    loop();

    return () => {
      isRunning = false;
      if (animFrameRef.current) clearTimeout(animFrameRef.current);
    };
  }, [videoRef, renderEdgesClearly, pushWarning, onViolation]);

  return (
    <aside
      className={`fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2 select-none ${className}`}
      aria-label="AI Proctor Camera Monitor"
    >
      {/* Warning Notification Toast Stack */}
      <div className="w-72 sm:w-80 space-y-2 pointer-events-auto">
        {warnings.map((w) => (
          <div
            key={w.id}
            className={`flex items-start justify-between rounded-xl p-3 shadow-xl backdrop-blur-md transition-all border ${
              w.severity === "high"
                ? "bg-rose-950/95 border-rose-500/50 text-rose-100"
                : w.severity === "technical"
                ? "bg-amber-950/95 border-amber-500/50 text-amber-100"
                : "bg-blue-950/95 border-blue-500/50 text-blue-100"
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                  {w.eventType.replace(/_/g, " ")}
                </p>
                <p className="text-xs font-medium mt-0.5 leading-snug">
                  {w.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWarnings((prev) => prev.filter((item) => item.id !== w.id))}
              className="text-white/60 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Main Floating Camera Card with Clear Edge Overlays */}
      <div className="w-64 sm:w-72 rounded-2xl border border-sky-400/30 bg-slate-950/95 backdrop-blur-xl p-2.5 shadow-2xl transition-all pointer-events-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-1.5 pb-2 mb-1.5 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                trackingState === "VERIFIED" ? "bg-sky-400" : "bg-amber-400"
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                trackingState === "VERIFIED" ? "bg-sky-500" : "bg-amber-500"
              }`} />
            </span>
            <span className="font-bold tracking-tight text-white flex items-center gap-1">
              <span>AI Proctor</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 font-mono border border-sky-400/30">
                EDGE HUD
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-mono">
              {fps > 0 ? `${fps} FPS` : `${latencyMs}ms`}
            </span>
            <button
              type="button"
              onClick={() => setIsMinimized((v) => !v)}
              className="text-slate-400 hover:text-white transition-colors p-0.5"
              title={isMinimized ? "Expand monitor" : "Minimize monitor"}
            >
              {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            </button>
          </div>
        </div>

        {/* Video + Clear Edge HUD Canvas Assembly */}
        {!isMinimized && (
          <div className="space-y-2">
            <div className={`relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-950 transition-all ${
              trackingState === "MULTI_FACE"
                ? "border-2 border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                : trackingState === "NEAR_EDGE"
                ? "border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                : "border border-sky-400/30"
            }`}>
              {/* Raw Camera Video Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Edge-Rendering Canvas Overlay */}
              <canvas
                ref={hudCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
                aria-hidden="true"
              />

              {/* Live Edge Warning Banner Ribbon at Bottom of Viewport */}
              {edgeWarningText && (
                <div className="absolute bottom-1.5 inset-x-1.5 rounded-lg px-2 py-0.5 bg-black/85 backdrop-blur-md border border-amber-500/60 text-[10px] font-semibold text-amber-300 text-center shadow-lg truncate">
                  {edgeWarningText}
                </div>
              )}
            </div>

            {/* Bottom Status Ticker */}
            <div className="flex items-center justify-between text-[10px] font-mono px-1 text-slate-300">
              <span className="flex items-center gap-1 text-sky-300">
                <Mic size={11} className="text-sky-400" />
                Mic: Active
              </span>

              <span className={`px-1.5 py-0.5 rounded font-bold ${
                faceCount === 1
                  ? "bg-sky-500/20 text-sky-300 border border-sky-400/30"
                  : faceCount === 0
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse"
                  : "bg-rose-500/20 text-rose-300 border border-rose-400/40 animate-pulse"
              }`}>
                {faceCount === 1 ? "✓ 1 Face Centered" : faceCount === 0 ? "⚠ No Face" : `🚨 Multi-Face (${faceCount})`}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default ProctoringWebcamMonitor;
