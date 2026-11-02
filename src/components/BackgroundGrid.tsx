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
      {/* Top-right ambient radial glow */}
      <div
        className="absolute top-0 right-0 w-[900px] h-[520px] pointer-events-none opacity-80 dark:opacity-90 transition-opacity"
        style={{
          background: "var(--ambient-radial, radial-gradient(ellipse at 88% 0%, rgba(37, 211, 102, 0.18), transparent 65%))",
        }}
      />

      {/* Layer 1: Blurred Grid (Atmospheric & softened base grid) */}
      <div className="absolute -inset-6 bg-grid-blurred pointer-events-none transition-opacity duration-500" />

      {/* Layer 2: Sharp Grid (Revealed sharply under cursor movement) */}
      <div className="absolute inset-0 bg-grid-sharp pointer-events-none" />

      {/* Layer 3: Radiant cursor spotlight */}
      <div className="absolute inset-0 bg-grid-spotlight pointer-events-none" />
    </div>
  );
}

