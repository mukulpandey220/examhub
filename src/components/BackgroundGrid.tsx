"use client";

import React, { useEffect } from "react";

/**
 * Interactive Background Grid:
 * - Layer 1: Soft, blurred grid active across the entire background.
 * - Layer 2: Razor-sharp grid revealed dynamically under the cursor via radial mask.
 * - Layer 3: Interactive ambient cursor spotlight.
 */
export function BackgroundGrid() {
  useEffect(() => {
    let frame = 0;
    let lastX = -999;
    let lastY = -999;

    const updatePosition = () => {
      frame = 0;
      document.documentElement.style.setProperty("--cursor-x", `${lastX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${lastY}px`);
    };

    const onPointerMove = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!frame) {
        frame = requestAnimationFrame(updatePosition);
      }
    };

    // Update on pointermove and touch
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Top-right ambient radial glow (sapphire into midnight navy) */}
      <div
        className="absolute top-0 right-0 w-[950px] h-[560px] pointer-events-none opacity-80 dark:opacity-95 transition-opacity"
        style={{
          background: "var(--ambient-radial, radial-gradient(ellipse at 88% 0%, rgba(37, 211, 102, 0.18), transparent 65%))",
        }}
      />

      {/* Mid-left brand emerald aura (blends the green brand elements with navy) */}
      <div
        className="absolute top-[16%] left-[2%] w-[600px] h-[600px] pointer-events-none rounded-full opacity-0 dark:opacity-75 transition-opacity"
        style={{
          background: "radial-gradient(circle, rgba(37, 211, 102, 0.08) 0%, rgba(16, 120, 60, 0.03) 45%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Center-right globe backlight aura */}
      <div
        className="absolute top-[8%] right-[5%] w-[680px] h-[680px] pointer-events-none rounded-full opacity-0 dark:opacity-85 transition-opacity"
        style={{
          background: "radial-gradient(circle, rgba(40, 100, 245, 0.16) 0%, rgba(20, 50, 160, 0.06) 50%, transparent 75%)",
          filter: "blur(50px)",
        }}
      />

      {/* Layer 1: Blurred Grid (Atmospheric & softened base grid) */}
      <div className="absolute -inset-6 bg-grid-blurred pointer-events-none transition-opacity duration-500" />

      {/* Layer 2: Sharp Grid (Revealed sharply under cursor movement) */}
      <div className="absolute inset-0 bg-grid-sharp pointer-events-none" />

      {/* Layer 3: Radiant cursor spotlight */}
      <div className="absolute inset-0 bg-grid-spotlight pointer-events-none" />

      {/* Layer 4: Micro film grain texture for rich tactile depth */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.045] pointer-events-none mix-blend-overlay"
        aria-hidden="true"
      >
        <filter id="gridNoiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#gridNoiseFilter)" />
      </svg>
    </div>
  );
}

