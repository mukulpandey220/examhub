import React from "react";
import Link from "next/link";
import { BookOpen, Award, CheckCircle2, ArrowRight } from "lucide-react";
import { DOMAINS } from "@/data/domains";
import { INITIAL_EXAMS } from "@/data/exams";
import { db } from "@/lib/db";

export default function SubjectDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { domain?: string };
}) {
  const subjectSlug = params.slug;
  const domainSlug = searchParams.domain || "";

  // Find the domain containing this subject
  let parentDomain = DOMAINS.find(d => d.slug === domainSlug);
  if (!parentDomain) {
    parentDomain = DOMAINS.find(d => d.subjects.some(s => s.slug === subjectSlug)) || DOMAINS[0];
  }

  const subject = parentDomain.subjects.find(s => s.slug === subjectSlug) || parentDomain.subjects[0];
  const exams = INITIAL_EXAMS.filter(e => e.domainSlug === parentDomain.slug);
  const questions = db.getQuestionsByDomain(parentDomain.slug).filter(q => q.subjectSlug === subject.slug || q.topic);

  const stats = [
    { label: "Passing mark", value: "50%" },
    { label: "Negative marking", value: "−0.25" },
    { label: "Question types", value: "MCQ · Numerical · Code" },
    { label: "Attempts", value: "3 timed · unlimited practice" },
  ];

  return (
    <div className="flex-1 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/assessments/domains" className="hover:text-slate-900">Domains</Link>
          <span className="text-slate-300">/</span>
          <Link href={`/assessments/domains/${parentDomain.slug}`} className="hover:text-slate-900">{parentDomain.name}</Link>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-900">{subject.name}</span>
        </nav>

        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm sm:p-8">
          <span className="badge badge-blue">{parentDomain.name}</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{subject.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
            Core topics and calibrated exam sets for {subject.name}.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 transition-colors duration-200 hover:border-electric-200"
              >
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className="mt-0.5 text-sm font-semibold text-slate-900">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Topics & objectives */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <BookOpen className="h-5 w-5 text-electric-500" />
              Topics covered
            </h2>
            <ul className="space-y-2">
              {subject.topics.map((t, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-800"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Award className="h-5 w-5 text-electric-500" />
              What you'll practise
            </h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <strong className="font-semibold text-slate-900">Recall.</strong> Core definitions under time pressure.
              </li>
              <li className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <strong className="font-semibold text-slate-900">Problem solving.</strong> Multi-step calculations and code to industry standards.
              </li>
              <li className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <strong className="font-semibold text-slate-900">Review.</strong> Step-by-step solutions that expose knowledge gaps.
              </li>
            </ul>
          </div>
        </div>

        {/* Modes */}
        <div className="space-y-4">
          <h2 className="section-title">Choose a mode</h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm transition-all duration-200 hover:-translate-y-1 hover:border-electric-300 hover:shadow-soft-lg">
              <div className="space-y-3">
                <span className="badge badge-amber">Timed exam</span>
                <h3 className="text-lg font-semibold text-slate-900">Full benchmark</h3>
                <p className="text-sm text-slate-500">
                  25 questions, 30-minute countdown, negative marking and performance analytics.
                </p>
                <ul className="space-y-1 text-sm text-slate-500">
                  <li>· 50 marks, pass at 25</li>
                  <li>· Duration validated on the server</li>
                </ul>
              </div>
              <Link
                href={`/assessments/exams/exam-${parentDomain.slug}-mock-01`}
                className="btn bg-slate-900 text-white hover:bg-slate-700"
              >
                Start timed exam
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm transition-all duration-200 hover:-translate-y-1 hover:border-electric-300 hover:shadow-soft-lg">
              <div className="space-y-3">
                <span className="badge badge-blue">Practice</span>
                <h3 className="text-lg font-semibold text-slate-900">Topic sprint</h3>
                <p className="text-sm text-slate-500">
                  15 questions with instant explanations, no negative marking and unlimited attempts.
                </p>
                <ul className="space-y-1 text-sm text-slate-500">
                  <li>· Free sample included</li>
                  <li>· Explanation after every question</li>
                </ul>
              </div>
              <Link
                href={`/assessments/exams/exam-${parentDomain.slug}-practice-01`}
                className="btn btn-primary"
              >
                Start practice · free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
