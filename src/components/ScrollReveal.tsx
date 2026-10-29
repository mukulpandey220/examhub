"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll behaviour for the home page:
 *  - fades `[data-reveal]` elements in as they enter the viewport (staggered when several arrive together),
 *  - drives the thin scroll-progress bar,
 *  - nudges `[data-parallax]` (the hero photo) a little as the page scrolls.
 *
 * Elements are only hidden ("armed") here, after hydration and only when they sit below the fold, so
 * content never stays invisible if scripting fails and nothing flashes on first paint. Visitors who prefer
 * reduced motion get no hiding, no parallax and no slide-ins; only the progress bar remains.
 */
export function ScrollReveal() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let io: IntersectionObserver | null = null;

    if (!reduced && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          // Entries arrive in DOM order; stagger the ones that appear in the same batch.
          entries
            .filter((entry) => entry.isIntersecting)
            .forEach((entry, i) => {
              const el = entry.target as HTMLElement;
              el.style.setProperty("--i", String(Math.min(i, 6)));
              el.classList.add("is-visible");
              observer.unobserve(el);
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );
      io = observer;

      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        // Already on screen (or scrolled past) when we mount: leave it visible, no flash.
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
        el.setAttribute("data-armed", "");
        observer.observe(el);
      });
    }

    const hero = reduced ? null : document.querySelector<HTMLElement>("[data-parallax]");
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
      if (hero) hero.style.transform = y < 900 ? `translate3d(0, ${(y * 0.06).toFixed(1)}px, 0)` : "";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      if (hero) hero.style.transform = "";
    };
  }, []);

  return <div ref={bar} className="scroll-progress" aria-hidden="true" />;
}
