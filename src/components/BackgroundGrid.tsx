"use client";

import React from "react";

/**
 * Atmospheric Background Grid:
 * - Soft, deeply blurred ambient grid across the entire background.
 * - Gentle sapphire aura backlights.
 * - Cursor spotlight / moving highlight color completely removed.
 */
export function BackgroundGrid() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Top-right ambient radial glow (sapphire into midnight navy) */}
      <div
        className="absolute top-0 right-0 w-[950px] h-[560px] pointer-events-none opacity-70 dark:opacity-85 transition-opacity"
        style={{
          background: "var(--ambient-radial, radial-gradient(ellipse at 88% 0%, rgba(37, 99, 235, 0.15), transparent 65%))",
        }}
      />

      {/* Mid-left brand sapphire navy aura (blends with midnight blue) */}
      <div
        className="absolute top-[16%] left-[2%] w-[600px] h-[600px] pointer-events-none rounded-full opacity-0 dark:opacity-60 transition-opacity"
        style={{
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.10) 0%, rgba(30, 64, 175, 0.04) 45%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Center-right globe backlight aura */}
      <div
        className="absolute top-[8%] right-[5%] w-[680px] h-[680px] pointer-events-none rounded-full opacity-0 dark:opacity-70 transition-opacity"
        style={{
          background: "radial-gradient(circle, rgba(40, 100, 245, 0.12) 0%, rgba(20, 50, 160, 0.05) 50%, transparent 75%)",
          filter: "blur(50px)",
        }}
      />

      {/* Atmospheric Soft Blurred Grid */}
      <div className="absolute -inset-8 bg-grid-blurred pointer-events-none transition-opacity duration-500" />

      {/* Micro film grain texture for rich tactile depth */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.025] dark:opacity-[0.04] pointer-events-none mix-blend-overlay"
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
