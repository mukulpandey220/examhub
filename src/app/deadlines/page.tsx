"use client";

import React, { useState, useEffect } from "react";
import { Search, CheckCircle2, ExternalLink } from "lucide-react";
import { CampusDeadline } from "@/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "exam", label: "Exams" },
  { id: "revaluation", label: "Revaluation" },
  { id: "backlog", label: "Backlog fees" },
];

export default function DeadlinesRadarPage() {
  const [deadlines, setDeadlines] = useState<CampusDeadline[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeadlines() {
      try {
        const res = await fetch("/api/deadlines");
        const data = await res.json();
        setDeadlines(data.deadlines || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDeadlines();
  }, []);

  const filtered = deadlines.filter(dl => {
    const matchesCat = categoryFilter === "all" || dl.category === categoryFilter;
    const matchesSearch =
      dl.title.toLowerCase().includes(search.toLowerCase()) ||
      dl.universityOrBoard.toLowerCase().includes(search.toLowerCase()) ||
      dl.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 py-10 sm:py-14">
      <div className="page-container space-y-8">

        {/* Header */}
        <h1 className="page-title">Deadlines</h1>

        {/* Filters */}
        <div className="glass flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search university or keyword"
              aria-label="Search deadlines"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="seg">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                data-active={categoryFilter === f.id}
                onClick={() => setCategoryFilter(f.id)}
                className="seg-item"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {!loading && filtered.length === 0 && (
            <div className="glass border-dashed p-12 text-center text-sm text-slate-500">
              No deadlines found.
            </div>
          )}

          {filtered.map(dl => {
            const dueDateObj = new Date(dl.dueDate);
            const today = new Date();
            const diffTime = dueDateObj.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const [, month, day] = dl.dueDate.split("-");

            return (
              <div
                key={dl.id}
                className="glass-flat flex flex-col gap-5 p-5 md:flex-row md:items-center"
              >
                {/* Date tile */}
                <div className="tile hidden w-16 shrink-0 flex-col py-2 text-center md:flex">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-electric-700">
                    {MONTHS[(parseInt(month, 10) || 1) - 1]}
                  </div>
                  <div className="num text-2xl font-semibold leading-tight text-slate-900">{day}</div>
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`badge capitalize ${
                        dl.importance === "critical"
                          ? "badge-red"
                          : dl.importance === "high"
                            ? "badge-amber"
                            : "badge-blue"
                      }`}
                    >
                      {dl.importance}
                    </span>
                    <span className="badge badge-slate capitalize">{dl.category}</span>
                  </div>

                  <h3 className="font-display text-base font-semibold text-slate-900">{dl.title}</h3>
                  <p className="text-sm text-slate-500">{dl.description}</p>
                  <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    {dl.isVerified && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-label="Verified" />
                    )}
                    {dl.universityOrBoard}
                  </p>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-200/70 pt-4 md:flex-col md:items-end md:border-t-0 md:pt-0">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900 md:hidden">{dl.dueDate}</div>
                    <div className={`text-sm font-semibold ${diffDays <= 7 ? "text-rose-600" : "text-electric-600"}`}>
                      {diffDays > 0 ? `${diffDays} days left` : "Due today"}
                    </div>
                  </div>

                  {dl.actionUrl && (
                    <a
                      href={dl.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      Official portal
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
