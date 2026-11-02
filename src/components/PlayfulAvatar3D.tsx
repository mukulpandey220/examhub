"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sparkles, X, MessageSquare, Volume2, RotateCw, Hand, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Playful dialogue lines cycled on click, hover, or idle moments.
 */
const PLAYFUL_PHRASES = [
  "Hi there! 👋 Welcome to Nxtmove!",
  "Hey! Clicking around? Ready to benchmark your skills? 🚀",
  "144 exams across 72 specialist domains! 🎓",
  "I'm right here leaning by your side! Let's conquer the rankings! 💪",
  "Click anywhere on the website and I'll wave back! 👋",
  "Aiming for that 99th percentile? You've got this! 🏆",
  "Check out the toggle bar above to explore domains! 🧭",
  "A verified skills certificate looks great on your CV! 📜",
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
  const [isWaving, setIsWaving] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [waveParticles, setWaveParticles] = useState<{ id: number; emoji: string; left: number }[]>([]);

  // Animation Refs
  const mousePosRef = useRef({ x: 0, y: 0 });
  const avatarCenterRef = useRef({ x: 120, y: 650 });
  const animFrameRef = useRef<number>(0);
  const flipProgressRef = useRef(0);
  const isFlippingRef = useRef(false);
  const expressionRef = useRef<Expression>("happy");
  const blinkStateRef = useRef(0);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const waveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const particleIdRef = useRef(0);

  // Trigger playful confetti burst (using navy, sapphire, sky, gold, and white)
  const triggerConfetti = useCallback(async (clientX?: number, clientY?: number) => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      const x = typeof clientX === "number" && typeof window !== "undefined"
        ? Math.max(0.05, Math.min(0.95, clientX / window.innerWidth))
        : 0.15;
      const y = typeof clientY === "number" && typeof window !== "undefined"
        ? Math.max(0.05, Math.min(0.95, clientY / window.innerHeight))
        : 0.85;

      confetti({
        particleCount: 28,
        spread: 65,
        origin: { x, y },
        colors: ["#1e40af", "#2563eb", "#38bdf8", "#fbbf24", "#ffffff"],
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

  // Trigger Wave Animation: avatar waves energetically and displays cheerful particles
  const triggerWave = useCallback((showSpeech = true) => {
    setIsWaving(true);
    expressionRef.current = "happy";

    if (showSpeech) {
      setPhraseIndex((prev) => (prev + 1) % PLAYFUL_PHRASES.length);
      showBubble(4000);
    }

    // Spawn floating playful wave emojis
    const emojis = ["👋", "✨", "⭐", "🚀", "🎓"];
    const newItems = [
      { id: ++particleIdRef.current, emoji: emojis[Math.floor(Math.random() * emojis.length)], left: 55 + Math.random() * 20 },
      { id: ++particleIdRef.current, emoji: "👋", left: 65 + Math.random() * 15 },
    ];
    setWaveParticles((prev) => [...prev.slice(-4), ...newItems]);

    if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
    waveTimerRef.current = setTimeout(() => {
      setIsWaving(false);
    }, 2400);
  }, [showBubble]);

  // Handle direct avatar click
  const handleAvatarClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      // Trigger 360 backflip on the companion bot
      isFlippingRef.current = true;
      flipProgressRef.current = 0.01;

      // Trigger wave & confetti
      triggerWave(true);
      triggerConfetti(e.clientX, e.clientY);
    },
    [triggerWave, triggerConfetti]
  );

  // Global Click Listener: Whenever cursor is clicked anywhere on the website, avatar waves "Hi!"
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleGlobalClick = (e: MouseEvent) => {
      // Skip if clicking inside the avatar's control buttons to avoid double-triggers
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-avatar-control='true']")) return;

      triggerWave(true);
    };

    window.addEventListener("pointerdown", handleGlobalClick, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handleGlobalClick);
    };
  }, [triggerWave]);

  // Track cursor position for companion bot head tracking
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPointerMove = (e: PointerEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const updateCenter = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        avatarCenterRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      } else {
        avatarCenterRef.current = { x: 120, y: window.innerHeight - 150 };
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", updateCenter);
    updateCenter();

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", updateCenter);
    };
  }, []);

  // Show a welcome wave when user visits or switches routes
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerWave(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [pathname, triggerWave]);

  // Companion Bot 3D Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.035;
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const w = 90;
      const h = 100;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Idle hover floating physics
      const hoverY = Math.sin(time * 2.2) * 5;
      const tiltX = Math.cos(time * 1.6) * 0.05;

      // Handle 360 spin trick
      let spinRotation = 0;
      if (isFlippingRef.current) {
        flipProgressRef.current += 0.045;
        spinRotation = flipProgressRef.current * Math.PI * 2;
        if (flipProgressRef.current >= 1) {
          isFlippingRef.current = false;
          flipProgressRef.current = 0;
        }
      }

      // Cursor tracking angle
      const dx = mousePosRef.current.x - avatarCenterRef.current.x;
      const dy = mousePosRef.current.y - avatarCenterRef.current.y;
      const trackAngle = Math.atan2(dy, dx);
      const lookDist = Math.min(Math.hypot(dx, dy) / 450, 1);
      const lookX = Math.cos(trackAngle) * lookDist * 5;
      const lookY = Math.sin(trackAngle) * lookDist * 4;

      const cx = 45;
      const cy = 48 + hoverY;
      const radius = 24;

      ctx.translate(cx, cy);
      ctx.rotate(spinRotation + tiltX);

      // Bot Thruster Jet Glow (Navy & Sky Blue)
      const thrusterGlow = ctx.createRadialGradient(0, radius + 4, 1, 0, radius + 12, 16);
      thrusterGlow.addColorStop(0, "rgba(56, 189, 248, 0.9)");
      thrusterGlow.addColorStop(0.5, "rgba(37, 99, 235, 0.45)");
      thrusterGlow.addColorStop(1, "rgba(30, 64, 175, 0)");
      ctx.fillStyle = thrusterGlow;
      ctx.beginPath();
      ctx.arc(0, radius + 6, 14, 0, Math.PI * 2);
      ctx.fill();

      // Bot Body 3D Sphere (Deep Titanium Navy with Sapphire Highlights)
      const orbGrad = ctx.createRadialGradient(-radius * 0.35, -radius * 0.35, 2, 0, 0, radius);
      orbGrad.addColorStop(0, "#ffffff");
      orbGrad.addColorStop(0.18, "#93c5fd");
      orbGrad.addColorStop(0.55, "#2563eb");
      orbGrad.addColorStop(0.85, "#1e3a8a");
      orbGrad.addColorStop(1, "#0a1838");

      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Bot Metallic Equator Ring
      ctx.strokeStyle = "rgba(147, 197, 253, 0.75)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 2, radius + 2, 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Glowing Glass Visor
      ctx.fillStyle = "#030816";
      ctx.beginPath();
      ctx.ellipse(lookX * 0.6, lookY * 0.6, 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Visor Eye Expression (Smiling arcs ^ _ ^ when waving or happy)
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";

      if (isWaving || expressionRef.current === "happy") {
        // Happy arch eyes ^ ^
        ctx.beginPath();
        ctx.arc(lookX * 0.6 - 5, lookY * 0.6, 3, Math.PI, 0, false);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(lookX * 0.6 + 5, lookY * 0.6, 3, Math.PI, 0, false);
        ctx.stroke();
      } else {
        // Normal focused circular eyes
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(lookX * 0.6 - 5, lookY * 0.6, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lookX * 0.6 + 5, lookY * 0.6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Antenna with Glowing Navy Pulse
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -radius);
      ctx.lineTo(0, -radius - 7);
      ctx.stroke();

      ctx.fillStyle = isWaving ? "#38bdf8" : "#2563eb";
      ctx.beginPath();
      ctx.arc(0, -radius - 8, 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isWaving]);

  return (
    <>
      {/* Wave Keyframe Animations & Sparkles */}
      <style jsx global>{`
        @keyframes founderWaveArm {
          0% { transform: rotate(0deg); }
          15% { transform: rotate(28deg); }
          30% { transform: rotate(-14deg); }
          45% { transform: rotate(26deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(20deg); }
          90% { transform: rotate(-6deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes floatSparkleUp {
          0% { opacity: 0; transform: translateY(0) scale(0.6); }
          25% { opacity: 1; transform: translateY(-12px) scale(1.15); }
          100% { opacity: 0; transform: translateY(-44px) scale(0.7); }
        }
        @keyframes pulseHaloGlow {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.75; }
          50% { transform: scale(1.08) rotate(180deg); opacity: 1; }
        }
      `}</style>

      {/* Main Avatar Container in Bottom-Left Corner */}
      <div
        ref={containerRef}
        className="fixed bottom-0 left-0 z-40 select-none pointer-events-none transition-all duration-300"
        style={{
          paddingBottom: "max(10px, env(safe-area-inset-bottom))",
          paddingLeft: "max(10px, env(safe-area-inset-left))",
        }}
        aria-label="Interactive 3D leaning avatar companion"
      >
        {/* Minimized Floating Pill Mode */}
        {isMinimized ? (
          <button
            type="button"
            data-avatar-control="true"
            onClick={() => setIsMinimized(false)}
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 dark:bg-[#071330]/95 backdrop-blur-xl border border-sky-400/40 text-white shadow-xl hover:scale-105 active:scale-95 transition-all text-xs font-semibold group"
            title="Expand 3D Avatar"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
            </span>
            <span className="group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
              <span>👋</span>
              <span>Mentor & Avatar</span>
            </span>
            <ChevronUp size={14} className="text-sky-400" />
          </button>
        ) : (
          <div className="relative flex items-end">
            {/* Playful Floating Speech Bubble */}
            <div
              className={`absolute bottom-[230px] sm:bottom-[260px] left-2 sm:left-4 w-64 sm:w-72 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl border transition-all duration-300 pointer-events-auto ${
                bubbleVisible
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-2 scale-95 pointer-events-none"
              } bg-slate-900/92 dark:bg-[#060e24]/95 border-sky-400/35 text-white`}
            >
              {/* Bubble Header */}
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[11px] font-semibold text-sky-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-300 animate-pulse" />
                  <span>Founder & Skills Mentor</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-avatar-control="true"
                    onClick={() => setIsMinimized(true)}
                    className="text-slate-400 hover:text-white p-0.5 transition-colors"
                    title="Minimize avatar"
                    aria-label="Minimize avatar"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    data-avatar-control="true"
                    onClick={() => setBubbleVisible(false)}
                    className="text-slate-400 hover:text-white p-0.5 transition-colors"
                    title="Dismiss bubble"
                    aria-label="Dismiss bubble"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Dynamic Friendly Message */}
              <p className="mt-2 text-xs leading-relaxed text-slate-100 font-sans">
                {PLAYFUL_PHRASES[phraseIndex]}
              </p>

              {/* Interactive Bubble Action Buttons */}
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                <button
                  type="button"
                  data-avatar-control="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerWave(false);
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-sky-300 hover:text-sky-200 transition-colors bg-sky-500/15 hover:bg-sky-500/25 px-2.5 py-1 rounded-full border border-sky-400/20"
                >
                  <Hand size={11} className={isWaving ? "animate-bounce" : ""} />
                  Wave back!
                </button>

                <span className="text-[10px] text-slate-400">
                  Click anywhere to wave
                </span>
              </div>

              {/* Speech bubble pointer arrow */}
              <div className="absolute -bottom-2 left-10 h-3 w-3 rotate-45 border-b border-r bg-slate-900/92 dark:bg-[#060e24]/95 border-sky-400/35" />
            </div>

            {/* 3D Scene Assembly (Wall + Leaning Person + Waving Arm + Companion Bot) */}
            <div
              className="relative flex items-end group cursor-pointer pointer-events-auto"
              onClick={handleAvatarClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              role="button"
              tabIndex={0}
              aria-label="Avatar: Leaning against wall and waving. Click to interact!"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleAvatarClick(e as unknown as React.MouseEvent);
                }
              }}
            >
              {/* 1. 3D Architectural Frosted Glass Wall Pillar on Left */}
              <div
                className="relative -mr-4 sm:-mr-5 w-10 sm:w-12 h-56 sm:h-64 rounded-r-2xl border-r-2 border-t border-b border-sky-400/40 bg-gradient-to-r from-slate-900/80 via-blue-950/40 to-sky-500/15 backdrop-blur-md shadow-[4px_0_20px_rgba(37,99,235,0.25)] flex flex-col justify-between py-6 px-1.5 z-10"
                style={{
                  transform: "perspective(600px) rotateY(18deg)",
                  transformOrigin: "left center",
                }}
              >
                {/* Neon High-Tech Ticks on Wall */}
                <div className="space-y-3 opacity-60">
                  <div className="h-0.5 w-full bg-sky-400/60 rounded-full" />
                  <div className="h-0.5 w-2/3 bg-sky-400/40 rounded-full" />
                  <div className="h-0.5 w-1/2 bg-sky-400/30 rounded-full" />
                </div>
                <div className="text-[9px] font-mono tracking-widest text-sky-300/70 rotate-90 origin-left translate-x-3">
                  LEAN · WALL
                </div>
                <div className="space-y-3 opacity-60">
                  <div className="h-0.5 w-1/2 bg-sky-400/30 rounded-full" />
                  <div className="h-0.5 w-2/3 bg-sky-400/40 rounded-full" />
                  <div className="h-0.5 w-full bg-sky-400/60 rounded-full" />
                </div>
              </div>

              {/* 2. Circular 3D Holographic Dais under feet */}
              <div
                className="absolute bottom-1 left-2 sm:left-4 w-40 sm:w-48 h-8 rounded-full pointer-events-none z-0"
                style={{
                  background: "radial-gradient(ellipse at 50% 50%, rgba(37, 99, 235, 0.45) 0%, rgba(56, 189, 248, 0.15) 45%, transparent 75%)",
                  boxShadow: "0 0 25px rgba(37, 99, 235, 0.35)",
                }}
              >
                {/* Rotating holographic ring line */}
                <div
                  className="absolute inset-0 rounded-full border border-sky-400/40 opacity-70 animate-[pulseHaloGlow_6s_linear_infinite]"
                />
              </div>

              {/* 3. The Avatar Figure (Standing and Leaning) */}
              <div
                className="relative z-20 flex flex-col items-center transition-all duration-300"
                style={{
                  transform: isHovered
                    ? "rotate(-1.5deg) scale(1.02) translateY(-3px)"
                    : "rotate(-3.2deg) translateY(0)",
                  transformOrigin: "bottom left",
                }}
              >
                {/* Floating Wave Sparkle Particles */}
                {waveParticles.map((p) => (
                  <span
                    key={p.id}
                    className="absolute z-40 text-lg pointer-events-none animate-[floatSparkleUp_1.8s_ease-out_forwards]"
                    style={{
                      left: `${p.left}%`,
                      top: "20%",
                    }}
                  >
                    {p.emoji}
                  </span>
                ))}

                {/* Character Silhouette & Frame */}
                <div className="relative w-36 sm:w-44 h-56 sm:h-64 overflow-hidden rounded-2xl drop-shadow-[0_14px_28px_rgba(30,64,175,0.35)]">
                  {/* Subject Image (Founder with burgundy shirt, dark trousers, beard) */}
                  <Image
                    src="/images/avatar-founder.jpg"
                    alt="Founder & Skills Mentor Avatar leaning against wall"
                    fill
                    sizes="(max-width: 640px) 144px, 176px"
                    className="object-cover object-[48%_18%] filter saturate-105 contrast-105"
                    priority
                  />

                  {/* 3D Cyan & Navy Rim Lighting Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-sky-400/10 pointer-events-none" />

                  {/* Animated Waving Right Arm & Hand Overlay */}
                  {/* When cursor clicks anywhere, this arm waves with enthusiasm! */}
                  <div
                    className="absolute top-[32%] right-[12%] w-16 h-24 pointer-events-none origin-bottom-left transition-all"
                    style={{
                      animation: isWaving ? "founderWaveArm 1.1s ease-in-out infinite" : "none",
                      transformOrigin: "15% 85%",
                    }}
                  >
                    {/* Waving Forearm with Burgundy Rolled Sleeve */}
                    <div className="relative w-full h-full flex flex-col items-center justify-start">
                      {/* Hand with Waving Pose */}
                      <div className="relative z-10 flex flex-col items-center">
                        <span className="text-3xl filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                          👋
                        </span>
                      </div>

                      {/* Rolled-up burgundy sleeve cuff */}
                      <div className="w-5 h-7 rounded-full bg-gradient-to-b from-[#641b2c] to-[#45121e] border border-white/20 shadow-md -mt-1" />
                    </div>
                  </div>
                </div>

                {/* Contact Shadow under feet */}
                <div className="h-2.5 w-28 rounded-full bg-black/60 blur-sm -mt-1.5" />
              </div>

              {/* 4. Floating 3D Companion Bot (Hovering near right shoulder) */}
              <div
                className="relative -ml-6 sm:-ml-8 -mb-4 z-30 flex flex-col items-center"
                title="Companion Bot (Nxy): Tracking cursor and smiling!"
              >
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label="3D metallic orb companion bot"
                  className="w-[85px] h-[95px] block pointer-events-none drop-shadow-[0_8px_16px_rgba(37,99,235,0.4)]"
                />

                {/* Status Pill Badge */}
                <div className="relative -mt-2.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 dark:bg-[#071330]/90 backdrop-blur-md border border-sky-400/30 text-[10px] font-semibold text-sky-200 shadow-md">
                  <span className={`h-1.5 w-1.5 rounded-full ${isWaving ? "bg-amber-400 animate-ping" : "bg-sky-400 animate-pulse"}`} />
                  <span>{isWaving ? "Waving Hi! 👋" : "Click to wave!"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default PlayfulAvatar3D;