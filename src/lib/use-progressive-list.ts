import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Renders a long list in slices instead of all at once: `initial` items first, then `step` more each
 * time the returned `sentinel` element (placed after the list) scrolls near the viewport, or when
 * `showMore` is called (e.g. from a "Show more" button, which also keeps this usable without a pointer).
 * The visible count starts over whenever `resetKey` changes (filters, search), with no stale render.
 *
 * Rendering the 144-exam catalogue in one go took ~1 s on a mid-range device (5,000 DOM nodes and ~290
 * links); 24 cards render in a fraction of that and the rest appear as they are needed.
 */
export function useProgressiveList(total: number, resetKey: string, initial = 24, step = 24) {
  const [state, setState] = useState({ key: resetKey, limit: initial });

  // Reset when the filters change. Done during render (React re-renders immediately, before painting) so a
  // stale, larger slice is never shown, and so returning to an *earlier* key (e.g. All -> Mechanical -> All)
  // starts over too instead of resurrecting the old count.
  if (state.key !== resetKey) setState({ key: resetKey, limit: initial });

  const limit = Math.min(state.key === resetKey ? state.limit : initial, total);
  const hasMore = limit < total;
  const sentinel = useRef<HTMLDivElement | null>(null);

  const showMore = useCallback(() => {
    setState((s) => ({ key: resetKey, limit: Math.min((s.key === resetKey ? s.limit : initial) + step, total) }));
  }, [resetKey, initial, step, total]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) showMore();
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, limit, showMore]);

  return { limit, hasMore, sentinel, showMore };
}
