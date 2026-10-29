"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Layers,
  Play,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { INITIAL_EXAMS } from "@/data/exams";
import { CATEGORY_ICON_MAP } from "@/lib/category-icons";
import { useProgressiveList } from "@/lib/use-progressive-list";

/** The "(NTCRA)" suffix repeats on every benchmark title; the detail page keeps the full name. */
const cardTitle = (title: string) => title.replace(/\s*\(NTCRA\)\s*$/i, "");

function ExamsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "timed" | "practice">("all");
  const [pricingFilter, setPricingFilter] = useState<"all" | "free" | "paid">("all");

  const filteredExams = useMemo(() => {
    return INITIAL_EXAMS.filter((exam) => {
      const matchesCategory =
        selectedCategory === "all" || exam.categoryCode === selectedCategory;

      const matchesSearch =
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMode =
        modeFilter === "all" || exam.mode === modeFilter;

      const fee = exam.feeRupees ?? exam.tokenFee ?? 99;
      const isFree = exam.isFreeSample || fee === 0;
      const matchesPricing =
        pricingFilter === "all" ||
        (pricingFilter === "free" && isFree) ||
        (pricingFilter === "paid" && !isFree);

      return matchesCategory && matchesSearch && matchesMode && matchesPricing;
    });
  }, [selectedCategory, searchQuery, modeFilter, pricingFilter]);

  // Render the catalogue in slices: 144 cards at once is ~5,000 DOM nodes and makes opening this page slow.
  const { limit, hasMore, sentinel, showMore } = useProgressiveList(
    filteredExams.length,
    `${selectedCategory}|${searchQuery}|${modeFilter}|${pricingFilter}`,
  );

  const activeCategoryObj = useMemo(() => {
    return CATEGORIES.find((c) => c.code === selectedCategory);
  }, [selectedCategory]);

  const resetFilters = () => {
    setSearchQuery("");
    setModeFilter("all");
    setPricingFilter("all");
    setSelectedCategory("all");
  };

  const hasFilters = searchQuery || modeFilter !== "all" || pricingFilter !== "all" || selectedCategory !== "all";

  const chip = (active: boolean) => `chip ${active ? "btn-primary" : "btn-secondary"}`;

  return (
    <div className="flex-1 py-10 sm:py-14">
      <div className="page-container space-y-8">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="page-title">Exams</h1>
          <Link href="/payment" className="btn btn-primary group shrink-0">
            Unlock all · ₹99
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Filters */}
        <div className="glass space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search exams"
                aria-label="Search exams"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>

            <div className="seg">
              {([
                ["all", "All"],
                ["timed", "Benchmark"],
                ["practice", "Practice"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  data-active={modeFilter === value}
                  onClick={() => setModeFilter(value)}
                  className="seg-item"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="seg">
              {([
                ["all", "Any price"],
                ["free", "Free"],
                ["paid", "Paid"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  data-active={pricingFilter === value}
                  onClick={() => setPricingFilter(value)}
                  className="seg-item"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Streams */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSelectedCategory("all")} className={chip(selectedCategory === "all")}>
              <Layers className="h-4 w-4" />
              All
              <span className="text-xs opacity-70">{INITIAL_EXAMS.length}</span>
            </button>
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICON_MAP[cat.code] || Layers;
              return (
                <button
                  key={cat.code}
                  type="button"
                  onClick={() => setSelectedCategory(cat.code)}
                  className={chip(selectedCategory === cat.code)}
                >
                  <Icon className="h-4 w-4" />
                  {cat.shortName}
                  <span className="text-xs opacity-70">{cat.examCount || cat.domainCount * 2}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Result bar */}
        <div className="flex items-center justify-between px-1 text-sm text-slate-500">
          <span>
            <strong className="font-semibold text-slate-900">{filteredExams.length}</strong>{" "}
            {filteredExams.length === 1 ? "exam" : "exams"}
          </span>
          <div className="flex items-center gap-4">
            {activeCategoryObj && (
              <Link
                href={`/assessments/domains?category=${activeCategoryObj.code}`}
                className="inline-flex items-center gap-1 font-medium text-electric-600 hover:text-electric-700"
              >
                {activeCategoryObj.domainCount} {activeCategoryObj.domainCount === 1 ? "domain" : "domains"}
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
            {hasFilters && (
              <button type="button" onClick={resetFilters} className="font-medium text-electric-600 hover:text-electric-700">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Exam grid */}
        {filteredExams.length === 0 ? (
          <div className="glass space-y-4 border-dashed p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="text-base font-semibold text-slate-900">No exams match</h3>
            <button type="button" onClick={resetFilters} className="btn btn-primary btn-sm">
              Show all exams
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredExams.slice(0, limit).map((exam) => {
              const fee = exam.feeRupees ?? exam.tokenFee ?? 99;
              const isFree = exam.isFreeSample || fee === 0;
              const Icon = CATEGORY_ICON_MAP[exam.categoryCode] || Layers;
              const isPractice = exam.mode === "practice";

              return (
                <article key={exam.id} className="glass-flat defer-paint flex flex-col p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <span className="tile h-7 w-7 !rounded-lg">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {exam.categoryName.split(" ")[0]}
                    </span>
                    <span className={`badge ${isFree ? "badge-green" : "badge-amber"}`}>
                      {isFree ? "Free" : `₹${fee}`}
                    </span>
                  </div>

                  <h3 className="mt-5 min-h-[3.1rem] font-display text-lg font-semibold leading-snug tracking-tight text-slate-900">
                    {cardTitle(exam.title)}
                  </h3>

                  <div className="mt-3 flex min-h-[1.5rem] flex-wrap items-center gap-1.5">
                    {exam.isProctored && (
                      <span className="badge bg-clay-50 text-clay-700">
                        <ShieldCheck className="h-3 w-3" />
                        Proctored
                      </span>
                    )}
                    {isPractice && (
                      <span className="badge badge-slate">
                        <Lightbulb className="h-3 w-3" />
                        Practice
                      </span>
                    )}
                    {exam.negativeMarkingPerWrong > 0 && (
                      <span className="badge bg-rose-50 text-rose-700">−{exam.negativeMarkingPerWrong} per wrong</span>
                    )}
                  </div>

                  <dl className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-200/70 py-4 text-center">
                    {[
                      [exam.durationMinutes, "min"],
                      [exam.questionCount, "questions"],
                      [exam.totalMarks, "marks"],
                    ].map(([value, label]) => (
                      <div key={label}>
                        <dd className="num text-xl font-semibold text-slate-900">{value}</dd>
                        <dt className="mt-0.5 text-xs text-slate-500">{label}</dt>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-auto flex items-center gap-2 pt-5">
                    <Link href={`/assessments/exams/${exam.id}`} prefetch={false} className="btn btn-primary flex-1">
                      <Play className="h-4 w-4 fill-current" />
                      {isFree ? "Start free" : "Write exam"}
                    </Link>
                    <Link
                      href={`/assessments/domains/${exam.domainSlug}`}
                      prefetch={false}
                      className="btn btn-secondary"
                      title="View domain syllabus"
                    >
                      Syllabus
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div ref={sentinel} className="flex justify-center pt-2">
            <button type="button" onClick={showMore} className="btn btn-secondary">
              Show more <span className="text-slate-500">· {filteredExams.length - limit} left</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExamsDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-20 text-sm text-slate-500">
          Loading…
        </div>
      }
    >
      <ExamsContent />
    </Suspense>
  );
}
