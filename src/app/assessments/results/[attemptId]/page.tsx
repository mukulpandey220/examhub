import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Trophy,
  ShieldCheck,
} from "lucide-react";
import { db } from "@/lib/db";
import { Question } from "@/types";
import { ExitFullscreenOnMount } from "@/components/ExitFullscreenOnMount";

export default function ExamResultsPage({ params }: { params: { attemptId: string } }) {
  const attempt = db.getAttemptById(params.attemptId);
  if (!attempt) {
    notFound();
  }

  const exam = db.getExamById(attempt.examId);
  const examQuestions = (exam?.questionIds || [])
    .map(id => db.getQuestionById(id))
    .filter(Boolean) as Question[];

  const passed = attempt.passed ?? false;
  const score = attempt.score ?? 0;
  const maxScore = attempt.maxScore ?? (exam?.totalMarks || 50);
  const percentage = attempt.percentage ?? 0;
  const correctCount = attempt.correctCount ?? 0;
  const incorrectCount = attempt.incorrectCount ?? 0;
  const unansweredCount = attempt.unansweredCount ?? 0;

  // Format time taken
  const timeMinutes = Math.floor(attempt.timeSpentSeconds / 60);
  const timeSeconds = attempt.timeSpentSeconds % 60;

  const allIndiaPercentile = attempt.allIndiaPercentile ?? Math.min(99.9, Math.max(15, Math.round((percentage * 0.98 + (correctCount > 10 ? 3 : 0)) * 10) / 10));
  const nationalRank = attempt.nationalRank ?? Math.max(1, Math.round((100 - allIndiaPercentile) * 124.5) + 1);
  const isTopRanker = attempt.isTopRanker ?? (allIndiaPercentile >= 95);
  const certificateId = attempt.certificateId ?? `NXTMOVE-2026-${attempt.id.replace('att-', '').slice(0, 6).toUpperCase()}-VERIFY`;

  const sectionScores = attempt.sectionScores || {
    section_a: { name: "Section A: Analytical Aptitude", percentage: Math.min(100, Math.round(percentage * 0.95)), score: Math.round(score * 0.25 * 10) / 10, maxScore: Math.round(maxScore * 0.25) },
    section_b: { name: "Section B: Domain Technical Core", percentage: Math.min(100, Math.round(percentage * 1.02)), score: Math.round(score * 0.5 * 10) / 10, maxScore: Math.round(maxScore * 0.5) },
    section_c: { name: "Section C: Workplace Readiness", percentage: Math.min(100, Math.round(percentage * 0.98)), score: Math.round(score * 0.25 * 10) / 10, maxScore: Math.round(maxScore * 0.25) },
  };

  const proctoring = attempt.proctoring || {
    integrityScore: 100,
    totalViolations: 0,
    tabSwitchViolations: 0,
    fullscreenViolations: 0,
    blurViolations: 0,
    copyPasteViolations: 0,
    devtoolsViolations: 0,
    isDisqualified: false,
    cameraActive: true,
    microphoneActive: true,
    violations: [],
  };

  const summaryStats = [
    { label: "Correct", value: correctCount, tone: "text-emerald-600" },
    { label: "Incorrect", value: incorrectCount, tone: "text-rose-600" },
    { label: "Unanswered", value: unansweredCount, tone: "text-slate-600" },
    { label: "Time taken", value: `${timeMinutes}m ${timeSeconds}s`, tone: "text-slate-900" },
  ];

  const integrityStats = [
    { label: "Tab switches", value: proctoring.tabSwitchViolations, bad: proctoring.tabSwitchViolations > 0 },
    { label: "Focus losses", value: proctoring.blurViolations, bad: proctoring.blurViolations > 0 },
    { label: "Fullscreen exits", value: proctoring.fullscreenViolations, bad: proctoring.fullscreenViolations > 0 },
    {
      label: "Clipboard / DevTools",
      value: (proctoring.copyPasteViolations || 0) + (proctoring.devtoolsViolations || 0),
      bad: (proctoring.copyPasteViolations || 0) + (proctoring.devtoolsViolations || 0) > 0,
    },
  ];

  const roadmap = [
    {
      months: "Months 1–2",
      title: "Fix the fundamentals",
      text: "Close algorithmic and architectural gaps. Practise high-frequency placement and university patterns.",
    },
    {
      months: "Months 3–4",
      title: "Build real projects",
      text: "Ship end-to-end applications, containerise them, and cover edge cases with tests.",
    },
    {
      months: "Months 5–6",
      title: "Placement readiness",
      text: "Timed mock interviews, workplace-ethics practice and resume shortlisting.",
    },
  ];

  return (
    <div className="flex-1 py-8 sm:py-10">
      <ExitFullscreenOnMount />
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-electric-600"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Dashboard
          </Link>
          <span className="truncate text-xs text-slate-400">Ref: {attempt.id}</span>
        </div>

        {/* Score summary */}
        <div
          className={`rounded-3xl border p-6 shadow-soft-md sm:p-8 ${
            passed
              ? "border-emerald-200 bg-gradient-to-b from-emerald-50 via-white to-white"
              : "border-rose-200 bg-gradient-to-b from-rose-50 via-white to-white"
          }`}
        >
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <span className={`badge ${passed ? "badge-green" : "badge-red"}`}>
                {passed ? "Passed" : "Needs revision · 50% required"}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{attempt.examTitle}</h1>
              <p className="text-sm text-slate-500">
                Submitted {new Date(attempt.submittedAt || attempt.startedAt).toLocaleString()}
              </p>
            </div>

            <div className="min-w-[200px] shrink-0 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-soft-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total score</div>
              <div className={`mt-1 text-5xl font-bold tracking-tight ${passed ? "text-emerald-600" : "text-rose-600"}`}>
                {score} <span className="text-lg font-normal text-slate-400">/ {maxScore}</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-700">{percentage}%</div>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-slate-200/60 pt-6 sm:grid-cols-4">
            {summaryStats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-slate-100 bg-white p-3.5 text-center shadow-soft-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md"
              >
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className={`mt-0.5 text-xl font-semibold ${s.tone}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Integrity report */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${
                  proctoring.isDisqualified ? "bg-rose-600" : "bg-electric-500"
                }`}
              >
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">Integrity report</h2>
                  <span
                    className={`badge ${
                      proctoring.isDisqualified
                        ? "badge-red"
                        : proctoring.totalViolations === 0
                        ? "badge-green"
                        : "badge-amber"
                    }`}
                  >
                    {proctoring.isDisqualified ? "Disqualified" : proctoring.totalViolations === 0 ? "Clean" : "Flagged"}
                  </span>
                </div>
                <p className="text-sm text-slate-500">Focus, fullscreen and clipboard activity during the exam.</p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="block text-xs text-slate-400">Integrity score</span>
              <span className={`text-2xl font-bold ${proctoring.isDisqualified ? "text-rose-600" : "text-emerald-600"}`}>
                {proctoring.integrityScore}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {integrityStats.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className={`mt-0.5 text-lg font-semibold ${s.bad ? "text-rose-600" : "text-emerald-600"}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {proctoring.violations && proctoring.violations.length > 0 && (
            <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <span className="block text-xs font-semibold uppercase tracking-wider text-rose-700">
                Incident log ({proctoring.violations.length})
              </span>
              <div className="space-y-1.5">
                {proctoring.violations.map((v: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-lg border border-rose-100 bg-white px-3 py-2 text-xs text-slate-700"
                  >
                    <span>{v.details}</span>
                    <span className="shrink-0 font-semibold text-rose-600">{new Date(v.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ranking & sections */}
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-electric-600">
                <Trophy className="h-4 w-4 text-amber-500" />
                National standing
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Ranking &amp; sections</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-electric-200 bg-electric-50 px-4 py-2 text-center">
                <span className="block text-xs text-slate-500">Percentile</span>
                <span className="text-xl font-bold text-electric-600">{allIndiaPercentile}th</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center">
                <span className="block text-xs text-slate-500">Rank</span>
                <span className="text-xl font-bold text-slate-900">#{nationalRank}</span>
              </div>
            </div>
          </div>

          {isTopRanker && (
            <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 md:flex-row md:items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <Trophy className="h-4 w-4 text-amber-600" />
                  Top ranker
                </div>
                <p className="text-sm text-slate-600">
                  You qualify for the training scholarship, gift hamper and 1-on-1 mentorship.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Object.entries(sectionScores).map(([secKey, sec]: [string, any]) => (
              <div
                key={secKey}
                className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors duration-200 hover:border-electric-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{sec.name}</span>
                  <span className="text-sm font-semibold text-electric-600">{sec.percentage}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${sec.percentage >= 70 ? "bg-emerald-500" : sec.percentage >= 50 ? "bg-electric-500" : "bg-amber-500"}`}
                    style={{ width: `${sec.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>
                    {sec.score} / {sec.maxScore} marks
                  </span>
                  <span>{sec.percentage >= 60 ? "Target met" : "Needs review"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm sm:p-8">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-electric-600">
              <Sparkles className="h-4 w-4" />
              Diagnostic report
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Your 6-month roadmap</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {roadmap.map((step) => (
              <div
                key={step.months}
                className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-electric-300 hover:shadow-soft-sm"
              >
                <span className="text-xs font-semibold text-electric-600">{step.months}</span>
                <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Certificate */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-electric-600">
                <ShieldCheck className="h-4 w-4" />
                Certificate
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Certificate of participation</h2>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <div>
                <div className="text-xs text-slate-500">Verification ID</div>
                <div className="text-sm font-semibold tracking-wide text-slate-900">{certificateId}</div>
              </div>
              <Link
                href={`/verify/${encodeURIComponent(certificateId)}`}
                className="btn btn-secondary btn-sm"
              >
                Verify
              </Link>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric-500 text-xs font-semibold text-white">
                  NN
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Nyeras Nxtmove</div>
                  <div className="text-xs text-slate-500">National Talent &amp; Career Readiness Assessment</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 py-3 text-center">
              <span className="text-xs uppercase tracking-widest text-slate-400">This is to certify that</span>
              <div className="text-2xl font-bold text-slate-900">{attempt.userName || "Arjun Sharma"}</div>
              <p className="mx-auto max-w-lg text-sm text-slate-600">
                appeared for the proctored national benchmark in <strong>{attempt.examTitle}</strong> and attained the{" "}
                <strong>{allIndiaPercentile}th percentile</strong>.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
              <span>{new Date(attempt.submittedAt || attempt.startedAt).toLocaleDateString()}</span>
              <span>nxtmove.nyeras.com</span>
            </div>
          </div>
        </div>

        {/* Topic & difficulty */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <BarChart3 className="h-5 w-5 text-electric-500" />
              Topic competency
            </h2>

            <div className="space-y-3.5">
              {Object.entries(attempt.topicBreakdown || {}).map(([topic, stats]) => {
                const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                return (
                  <div key={topic} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-800">{topic}</span>
                      <span className="text-slate-500">
                        {stats.correct}/{stats.total} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Award className="h-5 w-5 text-purple-500" />
              By difficulty
            </h2>

            <div className="space-y-3.5">
              {Object.entries(attempt.difficultyBreakdown || {}).map(([level, stats]) => {
                const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                return (
                  <div key={level} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize text-slate-800">{level}</span>
                      <span className="text-slate-500">
                        {stats.correct}/{stats.total} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Question review */}
        <div className="space-y-5">
          <h2 className="section-title">Question review</h2>

          <div className="space-y-4">
            {examQuestions.map((q, idx) => {
              const userAns = attempt.answers[q.id];
              const isMulti = q.type === "multiple_choice";

              let isCorrect = false;
              if (isMulti) {
                isCorrect = Array.isArray(userAns) && Array.isArray(q.correctAnswer) && [...userAns].sort().join(",") === [...q.correctAnswer].sort().join(",");
              } else if (q.type === "numerical") {
                const uNum = parseFloat(String(userAns).trim());
                const cNum = typeof q.correctAnswer === "number" ? q.correctAnswer : parseFloat(String(q.correctAnswer));
                isCorrect = !isNaN(uNum) && Math.abs(uNum - cNum) <= 0.2;
              } else {
                isCorrect = String(userAns || "").trim() === String(q.correctAnswer).trim();
              }

              const isUnanswered = userAns === undefined || userAns === null || userAns === "" || (Array.isArray(userAns) && userAns.length === 0);

              return (
                <div
                  key={q.id}
                  className={`space-y-4 rounded-2xl border bg-white p-5 shadow-soft-sm sm:p-6 ${
                    isUnanswered
                      ? "border-slate-200"
                      : isCorrect
                      ? "border-emerald-300"
                      : "border-rose-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-slate-900">Q{idx + 1}</span>
                      <span className="text-slate-400">{q.topic}</span>
                      <span className="badge badge-slate capitalize">{q.difficulty}</span>
                    </div>

                    {isUnanswered ? (
                      <span className="badge badge-slate shrink-0">Unanswered</span>
                    ) : isCorrect ? (
                      <span className="badge badge-green shrink-0">
                        <Check className="h-3 w-3" />
                        +{q.marks}
                      </span>
                    ) : (
                      <span className="badge badge-red shrink-0">
                        <X className="h-3 w-3" />
                        −{q.negativeMarks || 0.25}
                      </span>
                    )}
                  </div>

                  <div className="whitespace-pre-line text-sm font-medium leading-relaxed text-slate-900">
                    {q.questionText}
                  </div>

                  {q.options && q.options.length > 0 && (
                    <div className="space-y-2 text-sm">
                      {q.options.map((opt) => {
                        const wasChosen = isMulti
                          ? Array.isArray(userAns) && userAns.includes(opt.id)
                          : userAns === opt.id;
                        const isTheCorrectOne = isMulti
                          ? Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt.id)
                          : q.correctAnswer === opt.id;

                        let style = "border-slate-100 bg-slate-50 text-slate-700";
                        if (isTheCorrectOne) {
                          style = "border-emerald-300 bg-emerald-50 text-slate-900 font-medium";
                        } else if (wasChosen && !isTheCorrectOne) {
                          style = "border-rose-300 bg-rose-50 text-slate-900 line-through";
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`flex items-start justify-between gap-3 rounded-xl border p-3 ${style}`}
                          >
                            <span>{opt.text}</span>
                            {isTheCorrectOne && (
                              <span className="shrink-0 text-xs font-semibold text-emerald-600">Correct</span>
                            )}
                            {wasChosen && !isTheCorrectOne && (
                              <span className="shrink-0 text-xs font-semibold text-rose-600">Your answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <BookOpen className="h-4 w-4 text-electric-500" />
                      Explanation
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">{q.explanation}</p>
                    <div className="pt-1 text-xs text-slate-400">Source: {q.sourceOrReference}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/leaderboard?domain=${attempt.domainSlug}`} className="btn btn-primary group">
              <Award className="h-4 w-4" />
              View leaderboard
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            <Link
              href={`/assessments/exams/${exam?.id}`}
              className="btn bg-slate-900 text-white hover:bg-slate-700"
            >
              <RotateCcw className="h-4 w-4" />
              Retake exam
            </Link>
          </div>

          <Link href="/dashboard" className="text-sm font-semibold text-electric-600 hover:text-electric-700">
            Back to dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
