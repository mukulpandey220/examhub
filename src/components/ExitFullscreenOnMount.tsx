"use client";

import { useEffect } from "react";
import { exitFullscreen, isFullscreenActive } from "@/lib/fullscreen";

export function ExitFullscreenOnMount() {
  useEffect(() => {
    // Automatically turn off fullscreen mode when landing on results/post-exam views
    if (isFullscreenActive()) {
      exitFullscreen();
    }
  }, []);

  return null;
}
