"use client";

import React from "react";
import { Maximize, Minimize } from "lucide-react";
import { useFullscreen } from "@/lib/fullscreen";

interface FullscreenButtonProps {
  variant?: "navbar" | "mobile" | "floating" | "cockpit";
  className?: string;
  showLabel?: boolean;
}

export function FullscreenButton({
  variant = "navbar",
  className = "",
  showLabel = false,
}: FullscreenButtonProps) {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFullscreen();
  };

  if (variant === "floating") {
    return (
      <aside
        aria-label="Floating Fullscreen Mode Controls"
        className="fixed bottom-6 right-6 z-40 group flex items-center"
      >
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none absolute right-full mr-3 whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900/90 backdrop-blur rounded-lg shadow-md border border-slate-700/50">
          {isFullscreen ? "Exit Full Screen (Esc / F11)" : "Go Full Screen (All Devices / F11)"}
        </span>
        <button
          type="button"
          onClick={handleToggle}
          className={`p-3 rounded-2xl shadow-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center border ${
            isFullscreen
              ? "bg-slate-900 text-amber-400 border-amber-500/30 hover:bg-slate-800 shadow-slate-900/40"
              : "bg-electric-500 text-white border-electric-400 hover:bg-electric-600 shadow-electric hover:shadow-electric-lg hover:-translate-y-0.5"
          } ${className}`}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          title={isFullscreen ? "Exit Full Screen" : "Go Full Screen"}
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5 animate-in zoom-in-75 duration-200" />
          ) : (
            <Maximize className="w-5 h-5 animate-in zoom-in-75 duration-200" />
          )}
        </button>
      </aside>
    );
  }

  if (variant === "cockpit") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5 border transition-all ${
          isFullscreen
            ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/50"
            : "bg-amber-950/60 text-amber-400 border-amber-500/50 hover:bg-amber-900/60 animate-pulse"
        } ${className}`}
        aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        title={isFullscreen ? "Fullscreen Active (Click to Exit)" : "Re-enter Fullscreen Mode"}
      >
        {isFullscreen ? (
          <>
            <Minimize className="w-3.5 h-3.5" />
            <span>Full Screen</span>
          </>
        ) : (
          <>
            <Maximize className="w-3.5 h-3.5" />
            <span>Go Fullscreen</span>
          </>
        )}
      </button>
    );
  }

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
          isFullscreen
            ? "bg-slate-900 text-amber-400 border-slate-700 hover:bg-slate-800"
            : "bg-electric-50 text-electric-700 border-electric-200 hover:bg-electric-100"
        } ${className}`}
        aria-label={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
      >
        <div className="flex items-center space-x-2">
          {isFullscreen ? (
            <Minimize className="w-4 h-4 text-amber-400" />
          ) : (
            <Maximize className="w-4 h-4 text-electric-600" />
          )}
          <span>{isFullscreen ? "Exit Full Screen" : "Full Screen Mode"}</span>
        </div>
        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-800 text-slate-600">
          {isFullscreen ? "Active" : "All Devices"}
        </span>
      </button>
    );
  }

  // Default "navbar" variant
  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`p-2 rounded-xl text-slate-600 hover:text-electric-600 hover:bg-electric-50/80 border border-transparent hover:border-electric-200 transition-all flex items-center space-x-1.5 ${
        isFullscreen ? "text-electric-600 bg-electric-50/50 border-electric-200" : ""
      } ${className}`}
      aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      title={isFullscreen ? "Exit Full Screen (Esc / F11)" : "Enter Full Screen (All Devices)"}
    >
      {isFullscreen ? (
        <Minimize className="w-4 h-4 transition-transform active:scale-90" />
      ) : (
        <Maximize className="w-4 h-4 transition-transform active:scale-90" />
      )}
      {showLabel && (
        <span className="text-xs font-semibold">
          {isFullscreen ? "Exit Full" : "Full Screen"}
        </span>
      )}
    </button>
  );
}
