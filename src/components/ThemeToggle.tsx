"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Light / dark switch. The `dark` class on <html> is set before first paint by
 * the inline script in layout.tsx; this button only flips it and remembers the
 * choice. Icons are swapped with CSS so there is no hydration flicker.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const nextDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem("theme", nextDark ? "dark" : "light");
    } catch (e) {
      // storage unavailable (private mode) - theme still applies for this visit
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-electric-500/[0.08] hover:text-slate-900 ${className}`}
    >
      <Sun className="absolute h-[18px] w-[18px] rotate-90 scale-0 opacity-0 transition-all duration-300 dark:rotate-0 dark:scale-100 dark:opacity-100" />
      <Moon className="absolute h-[18px] w-[18px] rotate-0 scale-100 opacity-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 dark:opacity-0" />
    </button>
  );
}
