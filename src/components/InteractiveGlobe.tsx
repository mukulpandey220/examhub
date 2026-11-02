"use client";

import React, { useEffect, useRef, useState } from "react";
import { Globe, Move, Sparkles, ShieldCheck, Zap } from "lucide-react";

interface CityNode {
  name: string;
  lat: number;
  lon: number;
  isHQ?: boolean;
}

interface Arc {
  from: string;
  to: string;
  speed: number;
  offset: number;
  altitude: number;
  color: string;
}

// Key education, tech, and assessment hub locations
const CITIES: CityNode[] = [
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946, isHQ: true },
  { name: "New Delhi", lat: 28.6139, lon: 77.209, isHQ: true },
  { name: "Mumbai", lat: 19.076, lon: 72.8777 },
  { name: "Hyderabad", lat: 17.385, lon: 78.4867 },
  { name: "Chennai", lat: 13.0827, lon: 80.2707 },
  { name: "Pune", lat: 18.5204, lon: 73.8567 },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { name: "Singapore", lat: 1.3521, lon: 103.8198 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { name: "Dubai", lat: 25.2048, lon: 55.2708 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "San Francisco", lat: 37.7749, lon: -122.4194 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 },
  { name: "Frankfurt", lat: 50.1109, lon: 8.6821 },
];

const ARCS: Arc[] = [
  { from: "New Delhi", to: "Bengaluru", speed: 0.007, offset: 0.0, altitude: 0.28, color: "#25D366" },
  { from: "Bengaluru", to: "Mumbai", speed: 0.009, offset: 0.2, altitude: 0.22, color: "#10b981" },
  { from: "Mumbai", to: "Hyderabad", speed: 0.008, offset: 0.4, altitude: 0.20, color: "#25D366" },
  { from: "Hyderabad", to: "Chennai", speed: 0.010, offset: 0.6, altitude: 0.18, color: "#34d399" },
  { from: "Bengaluru", to: "Singapore", speed: 0.006, offset: 0.1, altitude: 0.35, color: "#06b6d4" },
  { from: "Singapore", to: "Tokyo", speed: 0.005, offset: 0.3, altitude: 0.38, color: "#38bdf8" },
  { from: "New Delhi", to: "Dubai", speed: 0.006, offset: 0.5, altitude: 0.32, color: "#10b981" },
  { from: "Dubai", to: "London", speed: 0.005, offset: 0.7, altitude: 0.40, color: "#25D366" },
  { from: "London", to: "San Francisco", speed: 0.004, offset: 0.2, altitude: 0.45, color: "#06b6d4" },
  { from: "San Francisco", to: "Tokyo", speed: 0.0035, offset: 0.8, altitude: 0.48, color: "#38bdf8" },
  { from: "Bengaluru", to: "Sydney", speed: 0.004, offset: 0.5, altitude: 0.42, color: "#25D366" },
  { from: "Kolkata", to: "Singapore", speed: 0.007, offset: 0.4, altitude: 0.30, color: "#10b981" },
  { from: "Mumbai", to: "London", speed: 0.0045, offset: 0.9, altitude: 0.44, color: "#34d399" },
];

/**
 * Generate sampled continent points for an authentic dot-matrix globe.
 */
function generateLandPoints(): [number, number][] {
  const points: [number, number][] = [];

  const landRegions = [
    // India & South Asia (dense for local focus)
    { minLat: 8, maxLat: 34, minLon: 69, maxLon: 89, step: 2.2 },
    // East Asia & China
    { minLat: 22, maxLat: 48, minLon: 95, maxLon: 125, step: 3.5 },
    // Japan & Korea
    { minLat: 32, maxLat: 44, minLon: 126, maxLon: 142, step: 2.8 },
    // Southeast Asia & Indonesia
    { minLat: -8, maxLat: 18, minLon: 96, maxLon: 130, step: 3.8 },
    // Middle East
    { minLat: 14, maxLat: 36, minLon: 36, maxLon: 62, step: 3.6 },
    // Europe & UK
    { minLat: 37, maxLat: 62, minLon: -9, maxLon: 36, step: 3.0 },
    // Scandinavia
    { minLat: 56, maxLat: 68, minLon: 5, maxLon: 28, step: 3.2 },
    // North Africa
    { minLat: 15, maxLat: 35, minLon: -14, maxLon: 38, step: 4.0 },
    // Sub-Saharan Africa
    { minLat: -34, maxLat: 14, minLon: 10, maxLon: 48, step: 4.2 },
    // North America (US & Canada)
    { minLat: 28, maxLat: 58, minLon: -124, maxLon: -72, step: 3.8 },
    // Central America
    { minLat: 10, maxLat: 26, minLon: -102, maxLon: -82, step: 3.2 },
    // South America
    { minLat: -52, maxLat: 10, minLon: -76, maxLon: -38, step: 4.0 },
    // Australia
    { minLat: -38, maxLat: -14, minLon: 114, maxLon: 152, step: 3.5 },
    // New Zealand
    { minLat: -46, maxLat: -35, minLon: 168, maxLon: 178, step: 2.5 },
  ];

  for (const reg of landRegions) {
    for (let lat = reg.minLat; lat <= reg.maxLat; lat += reg.step) {
      for (let lon = reg.minLon; lon <= reg.maxLon; lon += reg.step) {
        // Add subtle organic jitter so dots form natural texture
        const jLat = lat + (Math.sin(lat * 12.3 + lon * 7.1) * 0.4);
        const jLon = lon + (Math.cos(lat * 8.7 + lon * 11.9) * 0.4);
        points.push([jLat, jLon]);
      }
    }
  }

  return points;
}

export function InteractiveGlobe({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Drag interaction state
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startRotX: 0.35,
    startRotY: -1.2, // initially rotated towards India/Asia
    rotX: 0.32,
    rotY: -1.3,
    velX: 0,
    velY: 0,
    lastMoveTime: 0,
  });

  // Track theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const landPoints = generateLandPoints();
    let animationFrameId = 0;
    let time = 0;

    // Helper: convert (lat, lon, radius) to 3D coords
    const toCartesian = (lat: number, lon: number, radius: number): [number, number, number] => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return [x, y, z];
    };

    // Helper: rotate 3D point by (rotX, rotY)
    const rotate3D = (x: number, y: number, z: number, rotX: number, rotY: number): [number, number, number] => {
      // Rotate around X (pitch)
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;

      // Rotate around Y (yaw)
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x2 = x * cosY + z1 * sinY;
      const z2 = -x * sinY + z1 * cosY;

      return [x2, y1, z2];
    };

    // Render loop
    const render = () => {
      time += 0.016;

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.40;

      // Physics: handle auto-rotation and momentum inertia
      const drag = dragRef.current;
      if (!drag.isDragging) {
        // Momentum decay
        drag.rotY += drag.velX;
        drag.rotX += drag.velY;
        drag.velX *= 0.92;
        drag.velY *= 0.92;

        // Auto rotation when idle
        const timeSinceMove = Date.now() - drag.lastMoveTime;
        if (timeSinceMove > 1000) {
          drag.rotY += 0.0022; // smooth steady spin
        }
      }

      // Clamp pitch so the globe doesn't invert
      drag.rotX = Math.max(-0.75, Math.min(0.75, drag.rotX));

      const rotX = drag.rotX;
      const rotY = drag.rotY;

      // 1. Atmosphere Halo Gradient
      const haloGrad = ctx.createRadialGradient(cx, cy, radius * 0.88, cx, cy, radius * 1.35);
      if (isDarkTheme) {
        haloGrad.addColorStop(0, "rgba(37, 211, 102, 0.22)");
        haloGrad.addColorStop(0.5, "rgba(37, 211, 102, 0.06)");
        haloGrad.addColorStop(1, "transparent");
      } else {
        haloGrad.addColorStop(0, "rgba(37, 211, 102, 0.16)");
        haloGrad.addColorStop(0.5, "rgba(16, 185, 129, 0.04)");
        haloGrad.addColorStop(1, "transparent");
      }
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 2. Globe Sphere Shading
      const sphereGrad = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.35,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      if (isDarkTheme) {
        sphereGrad.addColorStop(0, "rgba(12, 28, 18, 0.90)");
        sphereGrad.addColorStop(0.7, "rgba(6, 16, 10, 0.95)");
        sphereGrad.addColorStop(1, "rgba(4, 10, 6, 0.98)");
      } else {
        sphereGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        sphereGrad.addColorStop(0.65, "rgba(240, 250, 244, 0.92)");
        sphereGrad.addColorStop(1, "rgba(215, 245, 226, 0.90)");
      }
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Globe edge rim outline
      ctx.strokeStyle = isDarkTheme ? "rgba(37, 211, 102, 0.40)" : "rgba(37, 211, 102, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Render Land Matrix Points
      for (let i = 0; i < landPoints.length; i++) {
        const [lat, lon] = landPoints[i];
        const [x3, y3, z3] = toCartesian(lat, lon, radius);
        const [rx, ry, rz] = rotate3D(x3, y3, z3, rotX, rotY);

        const screenX = cx + rx;
        const screenY = cy + ry;

        if (rz > 0) {
          // Front hemisphere: bright & sharp
          const normZ = rz / radius;
          const dotSize = 1.1 + normZ * 1.1;
          const alpha = 0.35 + normZ * 0.65;

          ctx.fillStyle = isDarkTheme
            ? `rgba(52, 211, 153, ${alpha})`
            : `rgba(18, 138, 62, ${alpha * 0.85})`;

          ctx.beginPath();
          ctx.arc(screenX, screenY, dotSize, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Back hemisphere: faint translucent holographic dots
          const backAlpha = isDarkTheme ? 0.08 : 0.06;
          ctx.fillStyle = `rgba(37, 211, 102, ${backAlpha})`;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Pre-calculate city 3D positions
      const cityCoords = new Map<string, { rx: number; ry: number; rz: number; screenX: number; screenY: number }>();
      for (const city of CITIES) {
        const [x3, y3, z3] = toCartesian(city.lat, city.lon, radius);
        const [rx, ry, rz] = rotate3D(x3, y3, z3, rotX, rotY);
        cityCoords.set(city.name, {
          rx,
          ry,
          rz,
          screenX: cx + rx,
          screenY: cy + ry,
        });
      }

      // 4. Render Curved 3D Arcs & Traveling Photons
      for (const arc of ARCS) {
        const p1 = cityCoords.get(arc.from);
        const p2 = cityCoords.get(arc.to);
        if (!p1 || !p2) continue;

        const city1 = CITIES.find((c) => c.name === arc.from)!;
        const city2 = CITIES.find((c) => c.name === arc.to)!;

        // Draw multi-segment 3D curve
        const segments = 36;
        const curvePoints: { x: number; y: number; z: number }[] = [];

        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          // Interpolate lat/lon
          const lat = city1.lat + (city2.lat - city1.lat) * t;
          let dLon = city2.lon - city1.lon;
          if (dLon > 180) dLon -= 360;
          if (dLon < -180) dLon += 360;
          const lon = city1.lon + dLon * t;

          // Parabolic height altitude curve
          const altFactor = Math.sin(t * Math.PI);
          const currentR = radius * (1 + arc.altitude * altFactor);

          const [x3, y3, z3] = toCartesian(lat, lon, currentR);
          const [rx, ry, rz] = rotate3D(x3, y3, z3, rotX, rotY);

          curvePoints.push({ x: cx + rx, y: cy + ry, z: rz });
        }

        // Draw the static arc trajectory
        ctx.beginPath();
        let anyVisible = false;
        for (let s = 0; s < curvePoints.length; s++) {
          const pt = curvePoints[s];
          if (pt.z > -radius * 0.25) {
            anyVisible = true;
          }
          if (s === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }

        if (anyVisible) {
          const arcAlpha = isDarkTheme ? 0.35 : 0.28;
          ctx.strokeStyle = arc.color;
          ctx.globalAlpha = arcAlpha;
          ctx.lineWidth = 1.3;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Draw traveling photon pulse
        const pulseProgress = (time * arc.speed * 60 + arc.offset) % 1;
        const pulseIdx = Math.floor(pulseProgress * (curvePoints.length - 1));
        const pulsePt = curvePoints[pulseIdx];

        if (pulsePt && pulsePt.z > -radius * 0.15) {
          const pulseNorm = Math.max(0.2, (pulsePt.z + radius) / (radius * 2));

          // Outer pulse glow
          ctx.fillStyle = arc.color;
          ctx.shadowColor = arc.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(pulsePt.x, pulsePt.y, 3.2 * pulseNorm, 0, Math.PI * 2);
          ctx.fill();

          // Inner bright core
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(pulsePt.x, pulsePt.y, 1.6 * pulseNorm, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0; // reset
        }
      }

      // 5. Render City Nodes & Pulsing Radar Rings
      for (const city of CITIES) {
        const coord = cityCoords.get(city.name);
        if (!coord) continue;

        if (coord.rz > 0) {
          const normZ = coord.rz / radius;

          // Pulsing concentric ripple ring
          const ringProgress = (time * 1.5 + (city.lat * 0.1)) % 1;
          const ringRadius = 3 + ringProgress * 14;
          const ringAlpha = (1 - ringProgress) * 0.65 * normZ;

          ctx.strokeStyle = city.isHQ ? "#25D366" : "#06b6d4";
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = ringAlpha;
          ctx.beginPath();
          ctx.arc(coord.screenX, coord.screenY, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          // Solid city core
          ctx.fillStyle = city.isHQ ? "#25D366" : "#38bdf8";
          ctx.beginPath();
          ctx.arc(coord.screenX, coord.screenY, city.isHQ ? 3.8 : 2.8, 0, Math.PI * 2);
          ctx.fill();

          // Center white shine
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(coord.screenX, coord.screenY, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // City Label for HQ or major nodes when facing forward
          if (normZ > 0.55 && (city.isHQ || city.name === "London" || city.name === "San Francisco" || city.name === "Singapore")) {
            ctx.font = "600 10.5px var(--font-sans), sans-serif";
            ctx.fillStyle = isDarkTheme ? "#f1f5f9" : "#0f172a";
            ctx.shadowColor = isDarkTheme ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)";
            ctx.shadowBlur = 4;
            ctx.fillText(city.name, coord.screenX + 8, coord.screenY + 3.5);
            ctx.shadowBlur = 0;
          }
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkTheme]);

  // Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    drag.isDragging = true;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.startRotX = drag.rotX;
    drag.startRotY = drag.rotY;
    drag.velX = 0;
    drag.velY = 0;
    drag.lastMoveTime = Date.now();
    setIsInteracting(true);
    setHasInteracted(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag.isDragging) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    const newRotY = drag.startRotY + dx * 0.0055;
    const newRotX = drag.startRotX + dy * 0.0055;

    // Track instant velocity for inertia
    drag.velX = (newRotY - drag.rotY) * 0.35;
    drag.velY = (newRotX - drag.rotX) * 0.35;

    drag.rotY = newRotY;
    drag.rotX = newRotX;
    drag.lastMoveTime = Date.now();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current.isDragging = false;
    dragRef.current.lastMoveTime = Date.now();
    setIsInteracting(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`relative flex items-center justify-center w-full aspect-square max-w-[540px] mx-auto select-none ${className}`}>
      {/* 3D Canvas Sphere */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full h-full block cursor-grab ${isInteracting ? "cursor-grabbing" : ""}`}
        style={{ touchAction: "none" }}
      />

      {/* Floating Badge 1: Top-Left Network Status */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/85 dark:bg-[#0c1610]/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-lg shadow-emerald-900/10 pointer-events-none transition-transform duration-300 hover:scale-105">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Global Skills Radar
          </span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            72 Academic Domains
          </span>
        </div>
      </div>

      {/* Floating Badge 2: Bottom-Right Pan-India Benchmark */}
      <div className="absolute bottom-4 right-2 sm:bottom-6 sm:right-4 z-20 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/85 dark:bg-[#0c1610]/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-lg shadow-emerald-900/10 pointer-events-none transition-transform duration-300 hover:scale-105">
        <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pan-India & Global
          </span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            144 Proctored Exams
          </span>
        </div>
      </div>

      {/* Interactive Drag Hint Pill (fades after first drag) */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 dark:bg-white/90 text-white dark:text-slate-900 text-[11px] font-medium backdrop-blur-md transition-opacity duration-700 pointer-events-none shadow-md ${
          hasInteracted ? "opacity-0" : "opacity-90 animate-pulse"
        }`}
      >
        <Move className="w-3.5 h-3.5" />
        <span>Drag to rotate globe</span>
      </div>
    </div>
  );
}
