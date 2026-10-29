"use client";

import { useEffect } from "react";
import { toggleFullscreen } from "@/lib/fullscreen";

/**
 * Keeps the global F11 shortcut working on every page. The on-screen
 * fullscreen control now lives in the navbar, so nothing floats over the
 * page content any more.
 */
export function FloatingFullscreenButton() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
