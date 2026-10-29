"use client";

import { useEffect } from "react";

/**
 * Feeds the cursor position to glass panels so they can render a soft
 * spotlight under the pointer (see `.glass` in globals.css). One delegated
 * listener for the whole page; it only writes two CSS variables on the panel
 * under the cursor and does nothing on touch devices or when the visitor
 * prefers reduced motion.
 */
export function PointerGlow() {
  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduced) return;

    let frame = 0;
    let lastEvent: PointerEvent | null = null;

    const apply = () => {
      frame = 0;
      const e = lastEvent;
      if (!e || !(e.target instanceof Element)) return;
      const panel = e.target.closest<HTMLElement>(".glass, .glass-flat, .card, .card-hover");
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      panel.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };

    const onMove = (e: PointerEvent) => {
      lastEvent = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
