"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, MessageSquare, Volume2, RotateCw } from "lucide-react";

/**
 * Playful dialogue lines cycled on click, hover, or idle moments.
 */
const PLAYFUL_PHRASES = [
  "Hey there! Ready to benchmark your skills? 🚀",
  "Boop! Click me again for another trick! ✨",
  "144 exams across 72 specialist domains! 🎓",
  "I'm Nxy, your skills companion. You've got this! 💪",
  "Wheee! 360° flip completed! 🌀",
  "Aiming for that 99th percentile? Let's go! 🏆",
  "A verified certificate looks great on your profile! 📜",
  "Need a direction? Check out Domains in the nav! 🧭",
];

type Expression = "normal" | "happy" | "wink" | "stars" | "surprised";

export function PlayfulAvatar3D() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction States
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  // Animation Refs
  const mousePosRef = useRef({ x: 0, y: 0 });
  const avatarCenterRef = useRef({ x: 100, y: 600 });
  const animFrameRef = useRef<number>(0);
  const flipProgressRef = useRef(0);
  const expressionRef = useRef<Expression>("normal");
  const blinkStateRef = useRef(0); // 0 = open, 1 = closed
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger playful confetti burst
  const triggerConfetti = useCallback(async (clientX: number, clientY: number) => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 26,
        spread: 60,
        origin: {
          x: Math.max(0.05, Math.min(0.95, clientX / window.innerWidth)),
          y: Math.max(0.05, Math.min(0.95, clientY / window.innerHeight)),
        },
        colors: ["#25D366", "#38bdf8", "#fbbf24", "#a855f7", "#ec4899"],
        disableForReducedMotion: true,
        zIndex: 9999,
      });
    } catch {
      // Ignored
    }
  }, []);

  // Show playful speech bubble
  const showBubble = useCallback((autoHideMs = 4500) => {
    setBubbleVisible(true);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    if (autoHideMs > 0) {
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleVisible(false);
      }, autoHideMs);
    }
  }, []);

  // Handle Playful Click Interaction
  const handleAvatarClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isSleeping) {
        setIsSleeping(false);
        expressionRef.current = "happy";
        setPhraseIndex(0);
        showBubble();
        return;
      }

      // Start 360-degree backflip trick
      setIsFlipping(true);
      flipProgressRef.current = 0.01;

      // Cycle expressions and quotes
      const nextExp: Expression[] = ["happy", "wink", "stars", "surprised"];
      expressionRef.current = nextExp[Math.floor(Math.random() * nextExp.length)];

      setPhraseIndex((prev) => (prev + 1) % PLAYFUL_PHRASES.length);
      showBubble();

      // Launch micro-confetti
      triggerConfetti(e.clientX, e.clientY);
    },
    [isSleeping, showBubble, triggerConfetti]
  );

  // Track global mouse position to drive 3D head and eye gaze
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        avatarCenterRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    // Initial greeting after 2.5 seconds
    const initTimer = setTimeout(() => {
      showBubble(5000);
    }, 2500);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      clearTimeout(initTimer);
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, [showBubble]);

  // Periodic natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.25) {
        blinkStateRef.current = 1;
        setTimeout(() => {
          blinkStateRef.current = 0;
          // occasional double-blink
          if (Math.random() > 0.6) {
            setTimeout(() => {
              blinkStateRef.current = 1;
              setTimeout(() => {
                blinkStateRef.current = 0;
              }, 90);
            }, 120);
          }
        }, 120);
      }
    }, 3200);

    return () => clearInterval(blinkInterval);
  }, []);

  // Main 3D Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 160;
    let height = 180;
    let dpr = 1;

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = 160;
      height = 180;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();

    // Smoothed 3D gaze angles
    let curYaw = 0;
    let curPitch = 0;
    let curRoll = 0;

    let startTime = performance.now();

    function render(now: number) {
      const elapsed = (now - startTime) / 1000;

      // Calculate Target 3D Angles from Cursor Position
      const dx = mousePosRef.current.x - avatarCenterRef.current.x;
      const dy = mousePosRef.current.y - avatarCenterRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let targetYaw = Math.max(-0.65, Math.min(0.65, dx / 400));
      let targetPitch = Math.max(-0.45, Math.min(0.45, dy / 400));
      let targetRoll = -targetYaw * 0.25;

      if (isSleeping) {
        targetYaw = 0.1;
        targetPitch = 0.25;
        targetRoll = 0.15;
      }

      // Smooth interpolation for fluid lifelike tracking
      curYaw += (targetYaw - curYaw) * 0.12;
      curPitch += (targetPitch - curPitch) * 0.12;
      curRoll += (targetRoll - curRoll) * 0.12;

      // Handle 360-degree flip animation
      let flipAngle = 0;
      if (flipProgressRef.current > 0) {
        flipProgressRef.current += 0.038;
        // EaseInOutCubic
        const p = flipProgressRef.current;
        const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        flipAngle = eased * Math.PI * 2;
        if (flipProgressRef.current >= 1) {
          flipProgressRef.current = 0;
          setIsFlipping(false);
        }
      }

      // Hover physics levitation (smooth harmonic bobbing)
      const hoverFreq = isHovered ? 3.5 : 2.2;
      const hoverAmp = isHovered ? 8 : 6;
      const hoverY = Math.sin(elapsed * hoverFreq) * hoverAmp;
      const hoverTilt = Math.sin(elapsed * 1.6) * 0.04;

      ctx!.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 + hoverY - 4;

      ctx!.save();
      ctx!.translate(cx, cy);

      // Apply Flip or Hover Tilt
      if (flipAngle > 0) {
        ctx!.rotate(flipAngle);
      } else {
        ctx!.rotate(curRoll + hoverTilt);
      }

      // 1. Floating Thruster Propulsion Ring
      const thrusterPulse = 0.6 + Math.sin(elapsed * 6) * 0.3;
      const thrustGrad = ctx!.createRadialGradient(0, 36, 2, 0, 36, 22);
      thrustGrad.addColorStop(0, `rgba(56, 189, 248, ${0.7 * thrusterPulse})`);
      thrustGrad.addColorStop(0.5, `rgba(37, 211, 102, ${0.4 * thrusterPulse})`);
      thrustGrad.addColorStop(1, "rgba(37, 211, 102, 0)");
      ctx!.fillStyle = thrustGrad;
      ctx!.beginPath();
      ctx!.ellipse(0, 38, 22, 10, 0, 0, Math.PI * 2);
      ctx!.fill();

      // 2. Playful Antenna on Top of Head
      const antennaBaseY = -34;
      const antennaBend = Math.sin(elapsed * 3.5) * 4 - curYaw * 12;
      const antennaTipX = antennaBend;
      const antennaTipY = antennaBaseY - 22;

      ctx!.beginPath();
      ctx!.moveTo(0, antennaBaseY);
      ctx!.quadraticCurveTo(antennaBend * 0.4, antennaBaseY - 12, antennaTipX, antennaTipY);
      ctx!.lineWidth = 2.2;
      ctx!.strokeStyle = "#94a3b8";
      ctx!.stroke();

      // Antenna Glowing Orb Tip
      const orbPulse = 0.8 + Math.sin(elapsed * 4.5) * 0.2;
      const orbGrad = ctx!.createRadialGradient(
        antennaTipX - 1,
        antennaTipY - 1,
        0,
        antennaTipX,
        antennaTipY,
        7
      );
      orbGrad.addColorStop(0, "#ffffff");
      orbGrad.addColorStop(0.35, "#38bdf8");
      orbGrad.addColorStop(0.8, "#25D366");
      orbGrad.addColorStop(1, "rgba(37, 211, 102, 0)");
      ctx!.fillStyle = orbGrad;
      ctx!.beginPath();
      ctx!.arc(antennaTipX, antennaTipY, 5 * orbPulse, 0, Math.PI * 2);
      ctx!.fill();

      // 3. Floating Magnetic Hands (Playful waving hand on right)
      const isWaving = isHovered || Math.sin(elapsed * 1.5) > 0.5;
      const waveOffset = isWaving ? Math.sin(elapsed * 8) * 8 : Math.sin(elapsed * 2.5) * 3;

      // Left Hand
      ctx!.save();
      ctx!.translate(-36 - curYaw * 8, 4 + curPitch * 6);
      const lHandGrad = ctx!.createRadialGradient(-3, -3, 1, 0, 0, 10);
      lHandGrad.addColorStop(0, "#ffffff");
      lHandGrad.addColorStop(0.4, "#e2e8f0");
      lHandGrad.addColorStop(0.9, "#94a3b8");
      lHandGrad.addColorStop(1, "#64748b");
      ctx!.fillStyle = lHandGrad;
      ctx!.beginPath();
      ctx!.arc(0, 0, 8, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();

      // Right Hand (Waving)
      ctx!.save();
      ctx!.translate(36 + curYaw * 8, waveOffset + curPitch * 6);
      const rHandGrad = ctx!.createRadialGradient(-3, -3, 1, 0, 0, 10);
      rHandGrad.addColorStop(0, "#ffffff");
      rHandGrad.addColorStop(0.4, "#e2e8f0");
      rHandGrad.addColorStop(0.9, "#94a3b8");
      rHandGrad.addColorStop(1, "#64748b");
      ctx!.fillStyle = rHandGrad;
      ctx!.beginPath();
      ctx!.arc(0, 0, 8, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();

      // 4. 3D Body Sphere (Ceramic Pearlescent Body)
      const bodyRadius = 35;
      const lightX = -12 + curYaw * 10;
      const lightY = -14 + curPitch * 8;

      const bodyGrad = ctx!.createRadialGradient(
        lightX,
        lightY,
        4,
        0,
        0,
        bodyRadius
      );
      bodyGrad.addColorStop(0, "#ffffff");
      bodyGrad.addColorStop(0.25, "#f8fafc");
      bodyGrad.addColorStop(0.65, "#e2e8f0");
      bodyGrad.addColorStop(0.9, "#cbd5e1");
      bodyGrad.addColorStop(1, "#94a3b8");

      ctx!.fillStyle = bodyGrad;
      ctx!.beginPath();
      ctx!.arc(0, 0, bodyRadius, 0, Math.PI * 2);
      ctx!.fill();

      // Soft rim ambient blue glow on body edge
      ctx!.lineWidth = 1.4;
      ctx!.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx!.beginPath();
      ctx!.arc(0, 0, bodyRadius, 0, Math.PI * 2);
      ctx!.stroke();

      // 5. Visor (Dark Curved Optical Dome Screen)
      const visorWidth = 44;
      const visorHeight = 24;
      const visorCenterX = curYaw * 14;
      const visorCenterY = -2 + curPitch * 10;

      ctx!.save();
      ctx!.translate(visorCenterX, visorCenterY);

      // Visor gradient (Dark cosmic glass)
      const visorGrad = ctx!.createRadialGradient(0, -4, 2, 0, 0, 24);
      visorGrad.addColorStop(0, "#0e1834");
      visorGrad.addColorStop(0.7, "#080e22");
      visorGrad.addColorStop(1, "#030612");

      ctx!.fillStyle = visorGrad;
      ctx!.beginPath();
      ctx!.ellipse(0, 0, visorWidth / 2, visorHeight / 2, 0, 0, Math.PI * 2);
      ctx!.fill();

      // Visor rim border
      ctx!.lineWidth = 1.2;
      ctx!.strokeStyle = "rgba(56, 189, 248, 0.55)";
      ctx!.stroke();

      // Visor Glass Specular Glint (Top shine reflection)
      const glintGrad = ctx!.createLinearGradient(-14, -8, 14, 4);
      glintGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      glintGrad.addColorStop(0.4, "rgba(255, 255, 255, 0.15)");
      glintGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx!.fillStyle = glintGrad;
      ctx!.beginPath();
      ctx!.ellipse(0, -5, visorWidth / 2 - 4, 4.5, -0.08, 0, Math.PI * 2);
      ctx!.fill();

      // 6. Digital Glowing Expressive Eyes
      const eyeSpacing = 10;
      const eyeOffsetX = curYaw * 4;
      const eyeOffsetY = curPitch * 3;
      const isBlinking = blinkStateRef.current === 1;

      ctx!.shadowBlur = 9;
      ctx!.shadowColor = "#38bdf8";

      const expr = expressionRef.current;

      if (isSleeping) {
        // Sleeping lines: - -
        ctx!.lineWidth = 2.2;
        ctx!.strokeStyle = "#38bdf8";
        ctx!.beginPath();
        ctx!.moveTo(-eyeSpacing - 4, 1);
        ctx!.lineTo(-eyeSpacing + 4, 1);
        ctx!.moveTo(eyeSpacing - 4, 1);
        ctx!.lineTo(eyeSpacing + 4, 1);
        ctx!.stroke();
      } else if (isBlinking) {
        // Blink flat slit
        ctx!.lineWidth = 2;
        ctx!.strokeStyle = "#25D366";
        ctx!.beginPath();
        ctx!.moveTo(-eyeSpacing - 3, 0);
        ctx!.lineTo(-eyeSpacing + 3, 0);
        ctx!.moveTo(eyeSpacing - 3, 0);
        ctx!.lineTo(eyeSpacing + 3, 0);
        ctx!.stroke();
      } else if (expr === "happy") {
        // Happy arch eyes: ^ ^
        ctx!.lineWidth = 2.4;
        ctx!.strokeStyle = "#25D366";
        ctx!.beginPath();
        ctx!.arc(-eyeSpacing + eyeOffsetX, 2 + eyeOffsetY, 4.5, Math.PI, 0);
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.arc(eyeSpacing + eyeOffsetX, 2 + eyeOffsetY, 4.5, Math.PI, 0);
        ctx!.stroke();
      } else if (expr === "wink") {
        // Wink: Left eye happy arch, Right eye open capsule
        ctx!.lineWidth = 2.4;
        ctx!.strokeStyle = "#25D366";
        ctx!.beginPath();
        ctx!.arc(-eyeSpacing + eyeOffsetX, 2 + eyeOffsetY, 4.5, Math.PI, 0);
        ctx!.stroke();

        ctx!.fillStyle = "#38bdf8";
        ctx!.beginPath();
        ctx!.ellipse(eyeSpacing + eyeOffsetX, eyeOffsetY, 3.2, 5, 0, 0, Math.PI * 2);
        ctx!.fill();
      } else if (expr === "stars") {
        // Star eyes (drawn as cross sparkles)
        ctx!.fillStyle = "#fbbf24";
        [-eyeSpacing, eyeSpacing].forEach((baseX) => {
          const ex = baseX + eyeOffsetX;
          const ey = eyeOffsetY;
          ctx!.beginPath();
          ctx!.ellipse(ex, ey, 5.5, 2, 0, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.beginPath();
          ctx!.ellipse(ex, ey, 2, 5.5, 0, 0, Math.PI * 2);
          ctx!.fill();
        });
      } else {
        // Normal Curious Glowing Capsules with cursor tracking
        ctx!.fillStyle = "#25D366";
        ctx!.beginPath();
        ctx!.ellipse(-eyeSpacing + eyeOffsetX, eyeOffsetY, 3.2, 5.5, curYaw * 0.2, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.fillStyle = "#38bdf8";
        ctx!.beginPath();
        ctx!.ellipse(eyeSpacing + eyeOffsetX, eyeOffsetY, 3.2, 5.5, curYaw * 0.2, 0, Math.PI * 2);
        ctx!.fill();

        // Little white specular glint in eyes
        ctx!.shadowBlur = 0;
        ctx!.fillStyle = "#ffffff";
        ctx!.beginPath();
        ctx!.arc(-eyeSpacing + eyeOffsetX - 1, eyeOffsetY - 2, 1.2, 0, Math.PI * 2);
        ctx!.arc(eyeSpacing + eyeOffsetX - 1, eyeOffsetY - 2, 1.2, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.restore();
      ctx!.restore();

      animFrameRef.current = requestAnimationFrame(render);
    }

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isHovered, isSleeping]);

  if (pathname?.includes("/attempt")) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 left-5 z-40 flex flex-col items-start select-none pointer-events-auto"
      onMouseEnter={() => {
        setIsHovered(true);
        if (!isSleeping) expressionRef.current = "happy";
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isSleeping) expressionRef.current = "normal";
      }}
    >
      {/* Playful Floating Speech Bubble */}
      <div
        className={`absolute bottom-[110px] left-2 w-64 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl border transition-all duration-300 pointer-events-auto ${
          bubbleVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-2 scale-95 pointer-events-none"
        } bg-slate-900/90 dark:bg-[#0b173c]/95 border-sky-400/30 text-white`}
      >
        {/* Top Header inside bubble */}
        <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[11px] font-medium text-sky-300">
          <span className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-300 animate-pulse" />
            <span>Nxy · Skills Guide</span>
          </span>
          <button
            type="button"
            onClick={() => setBubbleVisible(false)}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Dismiss bubble"
          >
            <X size={13} />
          </button>
        </div>

        {/* Dynamic Playful Message */}
        <p className="mt-2 text-xs leading-relaxed text-slate-100 font-sans">
          {isSleeping ? "Zzz... sleeping peacefully. Click me to wake up! 🌙" : PLAYFUL_PHRASES[phraseIndex]}
        </p>

        {/* Quick action buttons */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
          <button
            type="button"
            onClick={(e) => handleAvatarClick(e as unknown as React.MouseEvent)}
            className="inline-flex items-center gap-1 font-medium text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full"
          >
            <RotateCw size={10} className={isFlipping ? "animate-spin" : ""} />
            Spin trick!
          </button>

          <button
            type="button"
            onClick={() => setIsSleeping((v) => !v)}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isSleeping ? "Wake up ☀️" : "Sleep 💤"}
          </button>
        </div>

        {/* Speech tail pointing towards the mascot */}
        <div className="absolute -bottom-2 left-8 h-3 w-3 rotate-45 border-b border-r bg-slate-900/90 dark:bg-[#0b173c]/95 border-sky-400/30" />
      </div>

      {/* Interactive 3D Mascot Container */}
      <div
        onClick={handleAvatarClick}
        className="group relative flex flex-col items-center cursor-pointer transition-transform duration-200 active:scale-90"
        title="Nxy: Click me to do a 360° spin trick!"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleAvatarClick(e as unknown as React.MouseEvent);
          }
        }}
      >
        {/* Soft Ground Hover Shadow (scales with altitude) */}
        <div
          className="absolute bottom-2 h-3.5 w-16 rounded-full bg-slate-950/40 dark:bg-black/60 blur-md transition-all duration-300 pointer-events-none group-hover:scale-110"
        />

        {/* 3D Canvas */}
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Playful 3D mascot avatar that hovers and tracks cursor"
          className="relative z-10 w-[140px] h-[160px] block pointer-events-none drop-shadow-[0_12px_24px_rgba(37,211,102,0.18)]"
        />

        {/* Floating badge underneath */}
        <div className="relative -mt-3.5 z-20 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/75 dark:bg-[#07112e]/85 backdrop-blur-md border border-sky-400/20 text-[10px] font-medium text-sky-200/90 shadow-md transition-all duration-300 group-hover:border-emerald-400/40 group-hover:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{isSleeping ? "Sleeping..." : "Click me!"}</span>
        </div>
      </div>
    </div>
  );
}

export default PlayfulAvatar3D;
