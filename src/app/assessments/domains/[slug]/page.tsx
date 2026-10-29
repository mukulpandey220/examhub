import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Trophy, ArrowRight } from "lucide-react";
import { getDomainBySlug } from "@/data/domains";
import { getExamsByDomain } from "@/data/exams";
import { db } from "@/lib/db";

const TIERS: [string, number][] = [
  ["Basic", 10],
  ["Intermediate", 15],
  ["Advanced", 15],
  ["Professional", 10],
];

export default function DomainDetailPage({ params }: { params: { slug: string } }) {
  const domain = getDomainBySlug(params.slug);
  if (!domain) {
    notFound();
  }

  const exams = getExamsByDomain(domain.slug);
  const questions = db.getQuestionsByDomain(domain.slug);
  const approvedQs = questions.filter(q => q.reviewStatus === "approved");

  return (
    <div className="flex-1 py-8 sm:py-10">
      <div className="page-container space-y-6">

        <Link
          href="/assessments/domains"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-electric-600"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          All domains
        </Link>

        {/* Hero */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge badge-blue">{domain.categoryName}</span>
                <span className="badge badge-green">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  50 approved questions
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{domain.name}</h1>
              <p className="text-sm leading-relaxed text-slate-500 sm:text-base">{domain.description}</p>

              <Link
                href={`/leaderboard?domain=${domain.slug}`}
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-electric-600 hover:text-electric-700"
              >
                <Trophy className="h-4 w-4" />
                Domain leaderboard
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Question bank */}
            <div className="w-full shrink-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5 md:w-72">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Question bank</div>
              <div className="space-y-2.5 text-sm">
                {TIERS.map(([label, count]) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-slate-600">
                      <span>{label}</span>
                      <span className="font-medium text-slate-900">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-electric-500" style={{ width: `${(count / 15) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-electric-600">
                <span>Total available</span>
                <span>{approvedQs.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="space-y-4">
          <h2 className="section-title">Subjects <span className="text-slate-400">({domain.subjects.length})</span></h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {domain.subjects.map(subject => (
              <div
                key={subject.slug}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-electric-300 hover:shadow-soft-md"
              >
                <h3 className="mb-3 text-base font-semibold text-slate-900">{subject.name}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {subject.topics.map((t, idx) => (
                    <span key={idx} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exams */}
        <div className="space-y-4">
          <h2 className="section-title">Exams</h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {exams.map(exam => (
              <div
                key={exam.id}
                className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm transition-all duration-200 hover:-translate-y-1 hover:border-electric-300 hover:shadow-soft-lg"
              >
                <div className="space-y-3">
                  <span className={`badge ${exam.mode === "timed" ? "badge-amber" : "badge-blue"}`}>
                    {exam.mode === "timed" ? "Timed benchmark" : "Practice sprint"}
                  </span>

                  <h3 className="text-base font-semibold leading-snug text-slate-900">{exam.title}</h3>
                  <p className="line-clamp-2 text-sm text-slate-500">{exam.description}</p>

                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 py-3 text-center">
                    <div>
                      <div className="text-xs text-slate-500">Questions</div>
                      <div className="font-semibold text-slate-900">{exam.questionCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Duration</div>
                      <div className="font-semibold text-slate-900">{exam.durationMinutes} min</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Marks</div>
                      <div className="font-semibold text-slate-900">{exam.totalMarks}</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Negative marking <span className="font-medium text-rose-600">−{exam.negativeMarkingPerWrong}</span> · Pass at{" "}
                    <span className="font-medium text-slate-800">{exam.passingPercentage}%</span>
                  </p>
                </div>

                <Link href={`/assessments/exams/${exam.id}`} className="btn btn-primary group">
                  Open exam
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
