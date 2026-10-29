"use client";

import { useEffect, useRef, useState } from "react";

const format = new Intl.NumberFormat("en-US");

/**
 * Number that counts up from 0 the first time it scrolls into view. The server renders the final value
 * (so it is correct without scripting and for screen readers); the animation only starts after hydration.
 */
export function CountUp({ to, prefix = "", duration = 1500 }: { to: number; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);
  const final = `${prefix}${format.format(to)}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    setValue(0);

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return (
    <>
      <span ref={ref} aria-hidden="true">
        {prefix}
        {format.format(value)}
      </span>
      <span className="sr-only">{final}</span>
    </>
  );
}
