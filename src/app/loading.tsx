/**
 * Shown the instant a route starts loading. Besides feeling faster, a loading boundary lets Next
 * prefetch dynamic routes (/assessments/exams/[examId], /results/[attemptId], …) ahead of the click,
 * which is impossible for a dynamic route without one.
 */
export default function Loading() {
  return (
    <div className="page-container flex-1 py-10 sm:py-14" role="status" aria-live="polite">
      <div className="animate-pulse space-y-8" aria-hidden="true">
        <div className="h-10 w-56 rounded-lg bg-slate-200" />
        <div className="h-24 rounded-2xl bg-slate-100" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
