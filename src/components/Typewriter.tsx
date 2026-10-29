"use client";

import React, { useEffect, useState } from "react";

interface TypewriterProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseMs?: number;
  className?: string;
}

/**
 * Types each phrase, holds it, deletes it, then moves to the next.
 * Reserves the width/height of the longest phrase so the surrounding layout
 * never jumps, and falls back to static text for reduced-motion users.
 */
export function Typewriter({
  phrases,
  typingSpeed = 70,
  deletingSpeed = 38,
  pauseMs = 1700,
  className = "",
}: TypewriterProps) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion || phrases.length === 0) return;

    const full = phrases[index % phrases.length];
    let delay = deleting ? deletingSpeed : typingSpeed;

    if (!deleting && text === full) delay = pauseMs;
    if (deleting && text === "") delay = 350;

    const timer = setTimeout(() => {
      if (!deleting && text === full) {
        setDeleting(true);
      } else if (deleting && text === "") {
        setDeleting(false);
        setIndex((i) => (i + 1) % phrases.length);
      } else {
        setText(deleting ? full.slice(0, text.length - 1) : full.slice(0, text.length + 1));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, deleting, index, phrases, typingSpeed, deletingSpeed, pauseMs, reduceMotion]);

  if (reduceMotion) {
    return <span className={className}>{phrases[0]}</span>;
  }

  const longest = phrases.reduce((a, b) => (b.length > a.length ? b : a), "");

  return (
    <span className={`relative inline-block ${className}`}>
      {/* Invisible sizer keeps the box stable while the visible text changes */}
      <span aria-hidden="true" className="invisible whitespace-pre">
        {longest}
        <span className="tw-caret" />
      </span>
      <span className="absolute inset-0 whitespace-pre" aria-hidden="true">
        {text}
        <span className="tw-caret" />
      </span>
      <span className="sr-only">{phrases.join(", ")}</span>
    </span>
  );
}
