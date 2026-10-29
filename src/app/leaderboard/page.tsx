"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Search, ArrowRight } from "lucide-react";
import { DOMAINS } from "@/data/domains";

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?domain=${selectedDomain}`);
        const data = await res.json();
        if (data.rankings) {
          setRankings(data.rankings);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchRankings();
  }, [selectedDomain]);

  const filteredRankings = rankings.filter(entry => {
    const q = searchQuery.toLowerCase();
    return (
      entry.userName.toLowerCase().includes(q) ||
      (entry.university && entry.university.toLowerCase().includes(q)) ||
      entry.domainName.toLowerCase().includes(q)
    );
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const isYou = (entry: any) => entry.userEmail === "ramkumar.malothu@nyeras.com";

  return (
    <div className="flex-1 py-10 sm:py-14">
      <div className="page-container space-y-8">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="page-title">Leaderboard</h1>
          <Link href="/dashboard" className="btn btn-primary group shrink-0">
            Take an exam
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Filters */}
        <div className="glass flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, university or domain"
              aria-label="Search rankings"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            aria-label="Filter by domain"
            className="input md:w-72"
          >
            <option value="all">All domains</option>
            {DOMAINS.map(d => (
              <option key={d.slug} value={d.slug}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Podium */}
        {filteredRankings.length >= 3 && selectedDomain !== "all" && (
          <div className="grid grid-cols-1 items-end gap-5 md:grid-cols-3">
            {[1, 0, 2].map((idx, col) => {
              const entry = filteredRankings[idx];
              const first = idx === 0;
              return (
                <div
                  key={idx}
                  className={`card-hover p-5 ${first ? "order-1 md:order-2 !p-6 ring-1 ring-electric-500/40" : col === 0 ? "order-2 md:order-1" : "order-3"}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`flex items-center justify-center rounded-full text-sm font-semibold ${
                        first ? "btn-primary h-9 w-9" : "tile h-8 w-8 !rounded-full"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs text-slate-500">{formatTime(entry.timeSpentSeconds)}</span>
                  </div>
                  <div className={`font-semibold text-slate-900 ${first ? "text-base" : "text-sm"}`}>{entry.userName}</div>
                  <div className="text-xs text-slate-500">{entry.university}</div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3 text-sm">
                    <span className="text-slate-500">Score</span>
                    <span className={`num font-semibold ${first ? "text-lg text-electric-600" : "text-slate-900"}`}>
                      {entry.score} / {entry.maxScore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rankings table */}
        <div className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-16 px-4 py-3.5 text-center">Rank</th>
                  <th className="px-4 py-3.5">Candidate</th>
                  <th className="px-4 py-3.5">Exam</th>
                  <th className="px-4 py-3.5 text-center">Right / Wrong</th>
                  <th className="px-4 py-3.5 text-center">Time</th>
                  <th className="px-4 py-3.5 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading…
                    </td>
                  </tr>
                ) : filteredRankings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No results.
                    </td>
                  </tr>
                ) : (
                  filteredRankings.map((entry) => {
                    const isTop1 = entry.rank === 1;
                    const isTop3 = entry.rank <= 3;

                    return (
                      <tr
                        key={`${entry.id || entry.userId}-${entry.rank}`}
                        className={`transition-colors hover:bg-electric-500/[0.06] ${
                          isYou(entry) ? "bg-electric-500/[0.08]" : ""
                        }`}
                      >
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center justify-center rounded-lg text-xs font-semibold ${
                            isTop1
                              ? "btn-primary h-7 w-7"
                              : isTop3
                              ? "tile h-7 w-7 !rounded-lg"
                              : "text-slate-500"
                          }`}>
                            {entry.rank}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 font-semibold text-slate-900">
                            <span>{entry.userName}</span>
                            {isYou(entry) && <span className="badge badge-blue !py-0">You</span>}
                          </div>
                          <div className="text-xs text-slate-500">{entry.university}</div>
                        </td>

                        <td className="max-w-xs px-4 py-3.5">
                          <div className="line-clamp-1 font-medium text-slate-800">{entry.examTitle}</div>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="font-semibold text-emerald-600">{entry.correctCount}</span>
                          <span className="mx-1 text-slate-300">/</span>
                          <span className="font-semibold text-rose-600">{entry.incorrectCount}</span>
                        </td>

                        <td className="px-4 py-3.5 text-center text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatTime(entry.timeSpentSeconds)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="num font-semibold text-slate-900">
                            {entry.score} <span className="text-xs font-normal text-slate-400">/ {entry.maxScore}</span>
                          </div>
                          <div className="text-xs font-semibold text-electric-600">{entry.percentage}%</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Negative marking applies. Ties are broken by completion time.
        </p>
      </div>
    </div>
  );
}
