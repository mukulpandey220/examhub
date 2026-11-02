"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Compass, RotateCcw } from "lucide-react";

/**
 * Land polygons extracted from the user's exact Nyeras globe specification.
 * Each polygon represents a continental boundary sampled for ray-casting land dot testing.
 */
const LAND: [number, number][][] = [
  [
    [-17, 21], [-10, 30], [-6, 36], [10, 37], [20, 33], [32, 31], [35, 28],
    [43, 12], [51, 12], [48, 5], [40, -3], [40, -15], [35, -25], [27, -34],
    [18, -34], [12, -18], [13, -6], [9, 4], [-8, 4], [-17, 14],
  ],
  [
    [-9, 37], [-9, 43], [-1, 46], [-5, 48], [2, 51], [8, 54], [10, 57],
    [12, 55], [20, 55], [22, 60], [28, 60], [30, 70], [45, 68], [70, 73],
    [100, 78], [140, 72], [170, 70], [180, 66], [160, 60], [155, 52],
    [142, 52], [140, 45], [130, 42], [127, 35], [122, 40], [121, 31],
    [110, 20], [106, 10], [100, 13], [103, 1], [98, 8], [94, 17],
    [88, 22], [80, 15], [77, 8], [73, 18], [67, 25], [57, 25], [56, 27],
    [50, 30], [48, 29], [51, 25], [56, 24], [59, 22], [52, 16], [43, 13],
    [35, 28], [32, 31], [36, 36], [27, 37], [26, 40], [23, 36], [20, 40],
    [16, 38], [12, 44], [8, 44], [3, 43], [-1, 37],
  ],
  [
    [5, 59], [5, 62], [15, 69], [25, 71], [30, 70], [28, 66], [24, 65],
    [18, 62], [18, 59], [12, 56], [8, 58],
  ],
  [
    [-5, 50], [1, 51], [2, 53], [-2, 57], [-5, 58], [-6, 55], [-3, 54],
    [-5, 52],
  ],
  [[-10, 52], [-6, 52], [-6, 55], [-10, 54]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  [[130, 32], [135, 34], [141, 38], [142, 45], [140, 41], [136, 36]],
  [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3]],
  [[95, 5], [104, -2], [106, -6], [100, -1]],
  [
    [114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19],
    [153, -27], [150, -37], [140, -38], [131, -31], [115, -34],
  ],
  [
    [-55, 60], [-45, 60], [-20, 70], [-20, 82], [-60, 82], [-72, 76],
    [-58, 68],
  ],
  [
    [-168, 66], [-140, 70], [-95, 72], [-80, 68], [-62, 58], [-55, 50],
    [-67, 45], [-76, 38], [-81, 31], [-80, 25], [-83, 29], [-90, 30],
    [-97, 26], [-97, 20], [-87, 21], [-88, 15], [-83, 10], [-80, 8],
    [-72, 12], [-60, 10], [-50, 0], [-35, -8], [-40, -22], [-48, -26],
    [-57, -37], [-65, -42], [-68, -55], [-75, -50], [-72, -35], [-70, -18],
    [-80, -3], [-77, 4], [-86, 11], [-95, 16], [-106, 23], [-110, 24],
    [-117, 32], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 60],
  ],
];

const D = Math.PI / 180;
const TOTAL = 32;
const CYCLE = 22;

function inside(poly: [number, number][], x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (
      (a[1] > y) !== (b[1] > y) &&
      x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
    ) {
      c = !c;
    }
  }
  return c;
}

function vec(lat: number, lon: number): [number, number, number] {
  const c = Math.cos(lat * D);
  return [c * Math.cos(lon * D), c * Math.sin(lon * D), Math.sin(lat * D)];
}

// Generate dotted land surface points once at module level
const dots: [number, number, number][] = [];
const step = 1.4;
for (let lat = -58; lat <= 82; lat += step) {
  const ls = step / Math.max(Math.cos(lat * D), 0.15);
  for (let lon = -180; lon < 180; lon += ls) {
    for (let k = 0; k < LAND.length; k++) {
      if (inside(LAND[k], lon, lat)) {
        dots.push(vec(lat, lon));
        break;
      }
    }
  }
}

// Graticule meridians and parallels
const GRAT: [number, number, number][][] = [];
for (let a = -180; a < 180; a += 30) {
  const m: [number, number, number][] = [];
  for (let b = -84; b <= 84; b += 4) m.push(vec(b, a));
  GRAT.push(m);
}
for (let b = -60; b <= 60; b += 30) {
  const p: [number, number, number][] = [];
  for (let a = -180; a <= 180; a += 4) p.push(vec(b, a));
  GRAT.push(p);
}

// City coordinates and domain labels
const CITIES: Record<string, [number, number]> = {
  Nyeras: [12.97, 77.59],
  London: [51.5, -0.1],
  Lagos: [6.5, 3.4],
  Johannesburg: [-26.2, 28],
  Nairobi: [-1.3, 36.8],
  Dubai: [25.2, 55.3],
  Singapore: [1.35, 103.8],
  Beijing: [39.9, 116.4],
};

const DEST = [
  "Dubai",
  "Singapore",
  "Beijing",
  "Nairobi",
  "London",
  "Johannesburg",
  "Lagos",
] as const;

const SK: Record<string, string> = {
  Dubai: "Data Analytics",
  Singapore: "Full Stack",
  Beijing: "Data Science",
  Nairobi: "Cloud & DevOps",
  London: "AI / ML",
  Johannesburg: "UI/UX Design",
  Lagos: "Cybersecurity",
};

const O = vec(CITIES.Nyeras[0], CITIES.Nyeras[1]);

function view(
  w: [number, number, number],
  l0: number,
  phi: number
): [number, number, number] {
  const s = Math.sin(l0 * D);
  const c = Math.cos(l0 * D);
  const X = w[0] * c + w[1] * s;
  const Y = -w[0] * s + w[1] * c;
  const Z = w[2];
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  return [Y, Z * cp - X * sp, X * cp + Z * sp];
}

function clamp(x: number) {
  return Math.max(0, Math.min(1, x));
}

function io(t: number) {
  return 0.5 - 0.5 * Math.cos(Math.PI * clamp(t));
}

function arcPoint(
  a: [number, number, number],
  b: [number, number, number],
  om: number,
  t: number,
  h: number
): [number, number, number] {
  const s = Math.sin(om);
  if (Math.abs(s) < 0.0001) return [a[0], a[1], a[2]];
  const k1 = Math.sin((1 - t) * om) / s;
  const k2 = Math.sin(t * om) / s;
  const r = 1 + h * om * Math.sin(Math.PI * t);
  return [
    (a[0] * k1 + b[0] * k2) * r,
    (a[1] * k1 + b[1] * k2) * r,
    (a[2] * k1 + b[2] * k2) * r,
  ];
}

function renderText(
  ctx: CanvasRenderingContext2D,
  txt: string,
  x: number,
  y: number,
  al: CanvasTextAlign,
  alpha: number,
  size: number,
  weight: number,
  spacing: number,
  color: string
) {
  ctx.font = `${weight} ${size}px Inter, system-ui, -apple-system, sans-serif`;
  ctx.textAlign = al;
  if ("letterSpacing" in ctx) {
    (ctx as any).letterSpacing = `${spacing}px`;
  }
  ctx.fillStyle = color.replace("A", alpha.toFixed(3));
  ctx.shadowColor = "rgba(2,6,30,0.95)";
  ctx.shadowBlur = 8;
  ctx.fillText(txt, x, y);
  ctx.shadowBlur = 0;
  if ("letterSpacing" in ctx) {
    (ctx as any).letterSpacing = "0px";
  }
}

export function InteractiveGlobe() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const numRef = useRef<HTMLSpanElement | null>(null);

  // 3D rotation interactive state refs
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const userYawRef = useRef(0); // in degrees
  const userPitchRef = useRef(0); // in radians
  const velYawRef = useRef(0);
  const velPitchRef = useRef(0);
  const resetTargetRef = useRef<{ yaw: number; pitch: number } | null>(null);

  const [hasUserRotated, setHasUserRotated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleReset = useCallback(() => {
    resetTargetRef.current = { yaw: 0, pitch: 0 };
    setHasUserRotated(false);
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    const numEl = numRef.current;
    if (!cv || !wrap || !numEl) return;

    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let still = false;
    try {
      still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      still = false;
    }

    let W = 0;
    let H = 0;
    let R = 0;
    let cx = 0;
    let cy = 0;
    let dpr = 1;
    const phi0 = 22 * D;

    function resize() {
      if (!cv) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      W = r.width || 360;
      H = r.height || 360;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(W, H) * 0.355;
      cx = W / 2;
      cy = H * 0.5;
    }

    window.addEventListener("resize", resize);
    resize();

    function drawGlobe(l0: number, phi: number) {
      if (!ctx) return;

      // Outer atmospheric radial halo
      const g = ctx.createRadialGradient(cx, cy, R * 0.98, cx, cy, R * 1.45);
      g.addColorStop(0, "rgba(80,130,255,0.30)");
      g.addColorStop(0.4, "rgba(50,90,220,0.10)");
      g.addColorStop(1, "rgba(30,60,180,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.45, 0, Math.PI * 2);
      ctx.fill();

      // Globe sphere body
      const bd = ctx.createRadialGradient(
        cx - R * 0.35,
        cy - R * 0.4,
        R * 0.05,
        cx,
        cy,
        R
      );
      bd.addColorStop(0, "#13306f");
      bd.addColorStop(0.6, "#0a1b4d");
      bd.addColorStop(1, "#071236");
      ctx.fillStyle = bd;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Atmosphere rim glow
      const rim = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R);
      rim.addColorStop(0, "rgba(90,150,255,0)");
      rim.addColorStop(1, "rgba(110,165,255,0.32)");
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Graticule coordinates lines
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(170,200,255,0.07)";
      GRAT.forEach((line) => {
        ctx.beginPath();
        let pen = false;
        line.forEach((w) => {
          const v = view(w, l0, phi);
          if (v[2] <= 0) {
            pen = false;
            return;
          }
          const qx = cx + v[0] * R;
          const qy = cy - v[1] * R;
          if (pen) ctx.lineTo(qx, qy);
          else ctx.moveTo(qx, qy);
          pen = true;
        });
        ctx.stroke();
      });

      // Dotted continents
      for (let i = 0; i < dots.length; i++) {
        const v = view(dots[i], l0, phi);
        if (v[2] <= 0.02) continue;
        const qx = cx + v[0] * R;
        const qy = cy - v[1] * R;
        const al = 0.14 + 0.66 * Math.pow(v[2], 0.75);
        ctx.fillStyle = `rgba(212,228,255,${al.toFixed(2)})`;
        ctx.fillRect(qx - 0.75, qy - 0.75, 1.5, 1.5);
      }

      // Outer illuminated limb edge
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(150,190,255,0.6)";
      ctx.shadowColor = "rgba(90,140,255,0.7)";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function drawArcs(t: number, l0: number, phi: number) {
      if (!ctx) return;
      const scr = (v: [number, number, number]): [number, number] => [
        cx + v[0] * R,
        cy - v[1] * R,
      ];
      const fs = Math.max(10, R * 0.058);

      DEST.forEach((name, i) => {
        const d = vec(CITIES[name][0], CITIES[name][1]);
        const dotProduct = Math.max(
          -1,
          Math.min(1, O[0] * d[0] + O[1] * d[1] + O[2] * d[2])
        );
        const om = Math.acos(dotProduct);
        const st = 2.2 + i * 1.15;
        const dur = 3.8;
        const p = io((t - st) / dur);
        if (p <= 0) return;

        const settle = 1 - 0.4 * io((t - st - dur) / 2.5);
        const n = Math.max(2, Math.floor(80 * p));
        let last: { x: number; y: number; vis: boolean } | null = null;
        let head: [number, number] | null = null;

        ctx.lineCap = "round";
        ctx.lineWidth = 1.25;

        for (let s = 0; s <= n; s++) {
          const u = (p * s) / n;
          const v = view(arcPoint(O, d, om, u, 0.28), l0, phi);
          const vis = v[2] > 0 || v[0] * v[0] + v[1] * v[1] > 1;
          const q = scr(v);
          if (last && vis && last.vis) {
            ctx.strokeStyle = `rgba(244,214,170,${((0.18 + 0.72 * (s / n)) * settle).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(q[0], q[1]);
            ctx.stroke();
          }
          last = { x: q[0], y: q[1], vis };
          if (vis) head = q;
        }

        // Glowing photon head on leading edge
        if (p < 1 && head) {
          const hg = ctx.createRadialGradient(
            head[0],
            head[1],
            0,
            head[0],
            head[1],
            11
          );
          hg.addColorStop(0, "rgba(255,236,200,0.95)");
          hg.addColorStop(0.35, "rgba(244,214,170,0.35)");
          hg.addColorStop(1, "rgba(244,214,170,0)");
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(head[0], head[1], 11, 0, Math.PI * 2);
          ctx.fill();
        }

        // Destination ripples and skill badge once landed
        const ta = t - st - dur;
        if (ta > 0) {
          const dv = view(d, l0, phi);
          const e = scr(dv);
          if (dv[2] > 0) {
            const la = io(ta / 1.6);
            const pr = (ta * 0.22) % 1;
            ctx.strokeStyle = `rgba(244,214,170,${((1 - pr) * 0.35 * la).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(e[0], e[1], 3 + pr * 13, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = `rgba(248,236,212,${la.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(e[0], e[1], 2.6, 0, Math.PI * 2);
            ctx.fill();

            const rt = e[0] > cx + R * 0.12;
            if (name === "Singapore") {
              renderText(
                ctx,
                SK[name].toUpperCase(),
                e[0] + 10,
                e[1] + 4,
                "left",
                la * 0.9,
                fs,
                500,
                1.4,
                "rgba(240,244,255,A)"
              );
            } else if (name === "Lagos") {
              renderText(
                ctx,
                SK[name].toUpperCase(),
                e[0] - 14,
                e[1] + 20,
                "left",
                la * 0.9,
                fs,
                500,
                1.4,
                "rgba(240,244,255,A)"
              );
            } else {
              renderText(
                ctx,
                SK[name].toUpperCase(),
                e[0] - 10,
                e[1] + (rt ? -9 : 4),
                "right",
                la * 0.9,
                fs,
                500,
                1.4,
                "rgba(240,244,255,A)"
              );
            }
          }
        }
      });

      // Bangalore / Nyeras Origin Beacon
      const lo = scr(view(O, l0, phi));
      for (let k = 0; k < 2; k++) {
        const pr = (t * 0.16 + k * 0.5) % 1;
        ctx.strokeStyle = `rgba(244,214,170,${((1 - pr) * 0.45).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(lo[0], lo[1], 5 + pr * 24, 0, Math.PI * 2);
        ctx.stroke();
      }
      const og = ctx.createRadialGradient(lo[0], lo[1], 0, lo[0], lo[1], 14);
      og.addColorStop(0, "rgba(255,236,200,0.9)");
      og.addColorStop(1, "rgba(244,214,170,0)");
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(lo[0], lo[1], 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff6e4";
      ctx.beginPath();
      ctx.arc(lo[0], lo[1], 3.4, 0, Math.PI * 2);
      ctx.fill();

      renderText(
        ctx,
        "NYERAS",
        lo[0] + 14,
        lo[1] + 32,
        "left",
        1,
        fs * 1.05,
        600,
        3,
        "rgba(244,222,180,A)"
      );
    }

    let animId: number;

    function frame(ms: number) {
      const T = ms / 1000;
      const t = still ? 17 : T % CYCLE;

      // Wrap opacity animation from original spec (kept gracefully visible while interacting)
      const m = still ? 1 : io(t / 1.8) * (1 - io((t - 18.2) / 2.8));
      const targetOpacity = isDraggingRef.current ? 1 : Math.max(0.65, m);
      if (wrap) {
        wrap.style.opacity = targetOpacity.toFixed(3);
      }

      // Handle animated reset if requested
      if (resetTargetRef.current) {
        userYawRef.current += (resetTargetRef.current.yaw - userYawRef.current) * 0.1;
        userPitchRef.current +=
          (resetTargetRef.current.pitch - userPitchRef.current) * 0.1;
        if (
          Math.abs(userYawRef.current) < 0.2 &&
          Math.abs(userPitchRef.current) < 0.005
        ) {
          userYawRef.current = 0;
          userPitchRef.current = 0;
          resetTargetRef.current = null;
        }
      } else if (!isDraggingRef.current) {
        // Inertia physics decay
        userYawRef.current += velYawRef.current;
        userPitchRef.current += velPitchRef.current;
        velYawRef.current *= 0.94;
        velPitchRef.current *= 0.94;
        if (Math.abs(velYawRef.current) < 0.002) velYawRef.current = 0;
        if (Math.abs(velPitchRef.current) < 0.0001) velPitchRef.current = 0;
      }

      // Pitch angle clamping (-65deg to +75deg)
      const minPitch = -55 * D - phi0;
      const maxPitch = 65 * D - phi0;
      userPitchRef.current = Math.max(
        minPitch,
        Math.min(maxPitch, userPitchRef.current)
      );

      // Automated rotation + user drag yaw offset
      const baseL0 = still ? 55 : 100 - 72 * (t / CYCLE);
      const l0 = baseL0 + userYawRef.current;
      const phi = phi0 + userPitchRef.current;

      // Clear & redraw
      ctx!.clearRect(0, 0, W, H);
      drawGlobe(l0, phi);
      drawArcs(t, l0, phi);

      // Counter animation
      if (numEl) {
        const countVal = Math.round(TOTAL * io((t - 2.2) / 8));
        numEl.textContent = String(countVal);
      }

      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Pointer event handlers for 3D rotation direct manipulation
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    velYawRef.current = 0;
    velPitchRef.current = 0;
    resetTargetRef.current = null;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };

    // Sensitivity calibrated for tactile, natural finger / cursor tracking
    const degPerPx = 0.42;
    userYawRef.current -= dx * degPerPx;
    userPitchRef.current += dy * 0.006;

    velYawRef.current = -dx * degPerPx;
    velPitchRef.current = dy * 0.006;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      if (!hasUserRotated) setHasUserRotated(true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  return (
    <div
      ref={wrapRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full max-w-[460px] sm:max-w-[490px] xl:max-w-[530px] rounded-3xl overflow-hidden border border-sky-900/40 bg-gradient-to-b from-[#0d1d4d]/90 via-[#071033]/90 to-[#02040f]/95 shadow-2xl p-4 sm:p-6 flex flex-col items-center select-none transition-all duration-500 backdrop-blur-xl"
    >
      {/* Top ambient highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent pointer-events-none" />

      {/* Typography Header */}
      <div className="text-[11px] tracking-[0.5em] -mr-[0.5em] font-medium uppercase text-[#ecd6aa]/85">
        Skills launched
      </div>

      <div className="flex items-baseline gap-3 mt-3">
        <span
          ref={numRef}
          className="num font-light text-6xl sm:text-7xl xl:text-8xl leading-none tabular-nums text-[#f8f1e2] drop-shadow-[0_0_35px_rgba(140,180,255,0.25)]"
          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
        >
          0
        </span>
        <span
          className="unit italic font-normal text-2xl sm:text-3xl text-[#f8f1e2]/80"
          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
        >
          skills
        </span>
      </div>

      {/* Subtle gold separator rule */}
      <div className="w-[72px] h-[1px] mt-4 bg-gradient-to-r from-transparent via-[#ecd6aa]/80 to-transparent" />

      {/* 3D Dotted Canvas with Arcs */}
      <div className="relative w-full aspect-square max-w-[420px] flex items-center justify-center -mt-1 cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Dotted globe with elegant arcs from Nyeras in Bangalore to skill domains around the world"
          className="w-full h-full block touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Floating 3D Rotation Interaction Badge */}
        <div
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#071236]/80 backdrop-blur-md border border-sky-600/30 text-[11px] text-sky-200/80 shadow-lg transition-all duration-300 pointer-events-auto ${
            isHovered || hasUserRotated ? "opacity-100" : "opacity-75"
          }`}
        >
          <Compass size={13} className="text-amber-300 animate-pulse" />
          <span>Drag to rotate in 3D</span>
          {hasUserRotated && (
            <button
              onClick={handleReset}
              className="ml-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 hover:text-white transition-colors bg-amber-400/10 hover:bg-amber-400/20 px-2 py-0.5 rounded-full"
              title="Reset orientation to Bangalore view"
            >
              <RotateCcw size={10} />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export default InteractiveGlobe;
