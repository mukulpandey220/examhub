import React from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";

export default function PerformanceAnalyticsPage() {
  const userId = "user-student-demo";
  const attempts = db.getUserAttempts(userId).filter(a => a.status === "graded" || a.status === "expired");

  const totalAttempts = attempts.length;
  const scores = attempts.map(a => a.percentage || 0);
  const avgScore = totalAttempts > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / totalAttempts) : 0;
  const bestScore = totalAttempts > 0 ? Math.max(...scores) : 0;

  // Aggregate topics across attempts
  const topicStats: Record<string, { correct: number; total: number }> = {};
  for (const att of attempts) {
    if (att.topicBreakdown) {
      for (const [topic, st] of Object.entries(att.topicBreakdown)) {
        if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
        topicStats[topic].correct += st.correct;
        topicStats[topic].total += st.total;
      }
    }
  }

  const weakTopics = Object.entries(topicStats)
    .filter(([_, st]) => st.total >= 2 && (st.correct / st.total) < 0.5)
    .map(([topic, st]) => ({ topic, accuracy: Math.round((st.correct / st.total) * 100) }));

  const metrics = [
    { label: "Average score", value: `${avgScore}%`, note: `Across ${totalAttempts} ${totalAttempts === 1 ? "test" : "tests"}`, tone: "text-slate-900" },
    { label: "Personal best", value: `${bestScore}%`, note: "Highest verified score", tone: "text-electric-600" },
    { label: "Tests evaluated", value: `${totalAttempts}`, note: "Server graded", tone: "text-slate-900" },
    { label: "Weak areas", value: `${weakTopics.length}`, note: "Topics under 50%", tone: "text-amber-600" },
  ];

  return (
    <div className="flex-1 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">

        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-electric-600"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Dashboard
        </Link>

        <h1 className="page-title">Performance analytics</h1>

        {totalAttempts === 0 ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">Not enough data yet</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Complete one timed exam to see your trends and weak areas.
              </p>
            </div>
            <Link href="/assessments/domains" className="btn btn-primary btn-sm">
              Take your first exam
            </Link>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-electric-300 hover:shadow-soft-md"
                >
                  <span className="text-sm text-slate-500">{m.label}</span>
                  <div className={`mt-1 text-3xl font-bold tracking-tight ${m.tone}`}>{m.value}</div>
                  <span className="text-xs text-slate-400">{m.note}</span>
                </div>
              ))}
            </div>

            {/* Weak areas */}
            {weakTopics.length > 0 && (
              <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Revise these topics first
                </div>
                <div className="flex flex-wrap gap-2">
                  {weakTopics.map(w => (
                    <span
                      key={w.topic}
                      className="rounded-lg border border-amber-200 bg-white px-3 py-1 text-sm font-medium text-slate-800"
                    >
                      {w.topic} · {w.accuracy}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Topic breakdown */}
            <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm">
              <h2 className="text-base font-semibold text-slate-900">Accuracy by topic</h2>
              <div className="space-y-4">
                {Object.entries(topicStats).map(([topic, st]) => {
                  const pct = Math.round((st.correct / st.total) * 100);
                  return (
                    <div key={topic} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-800">{topic}</span>
                        <span className="text-slate-500">
                          {st.correct}/{st.total} · {pct}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
