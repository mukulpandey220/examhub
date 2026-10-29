"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin progress bar along the top of the window. It starts on the very click of an internal link
 * (before the next page has been fetched or compiled) and completes when the route changes, so the
 * app always acknowledges a click straight away. Same-page links, hash jumps, new-tab and modified
 * clicks are ignored. A failsafe finishes the bar if a click never results in a route change.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const failsafe = useRef<number | undefined>(undefined);

  // The bar's own inline opacity is the source of truth for "is a navigation in progress" (not a separate
  // flag), so it can never get out of step with what is on screen, e.g. after a hot reload in development.
  const finish = useCallback(() => {
    const el = bar.current;
    window.clearTimeout(failsafe.current);
    if (!el || el.style.opacity !== "1") return;
    el.style.transition = "transform .2s ease-out, opacity .4s ease .25s";
    el.style.transform = "scaleX(1)";
    el.style.opacity = "0";
  }, []);

  const start = useCallback(() => {
    const el = bar.current;
    if (!el) return;
    window.clearTimeout(failsafe.current);
    el.style.transition = "none";
    el.style.opacity = "1";
    el.style.transform = "scaleX(0.08)";
    void el.offsetWidth; // commit the reset before animating
    el.style.transition = "transform 10s cubic-bezier(.08,.6,.2,1)";
    el.style.transform = "scaleX(0.9)";
    failsafe.current = window.setTimeout(finish, 12000);
  }, [finish]);

  // The route changed: the new page is on screen.
  useEffect(() => {
    finish();
  }, [pathname, finish]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      start();
    };
    // Capture phase: runs before Next's <Link> handler, i.e. at the moment of the click.
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(failsafe.current);
    };
  }, [start]);

  return <div ref={bar} className="nav-progress" aria-hidden="true" />;
}
