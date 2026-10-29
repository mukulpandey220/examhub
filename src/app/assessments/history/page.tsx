import React from "react";
import Link from "next/link";
import { ArrowLeft, Award, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";

export default function ExamHistoryPage() {
  const userId = "user-student-demo";
  const attempts = db.getUserAttempts(userId);

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

        <h1 className="page-title">Exam history</h1>

        {attempts.length === 0 ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Award className="mx-auto h-10 w-10 text-slate-300" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">No attempts yet</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Your scores and solutions will appear here after your first exam.
              </p>
            </div>
            <Link href="/assessments/domains" className="btn btn-primary btn-sm">
              Browse domains
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Exam</th>
                    <th className="px-5 py-3.5">Domain</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5">Time</th>
                    <th className="px-5 py-3.5">Result</th>
                    <th className="px-5 py-3.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attempts.map(att => {
                    const isPassed = att.passed;
                    const mins = Math.floor(att.timeSpentSeconds / 60);

                    return (
                      <tr key={att.id} className="transition-colors hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {new Date(att.startedAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-900">{att.examTitle}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">{att.domainSlug}</td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                          {att.score !== undefined ? `${att.score} / ${att.maxScore}` : "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">{mins} min</td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {att.status === "in_progress" ? (
                            <span className="badge badge-amber">In progress</span>
                          ) : isPassed ? (
                            <span className="badge badge-green">Passed · {att.percentage}%</span>
                          ) : (
                            <span className="badge badge-red">Failed · {att.percentage}%</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          {att.status === "in_progress" ? (
                            <Link
                              href={`/assessments/exams/${att.examId}/attempt`}
                              className="group inline-flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-700"
                            >
                              Resume
                              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </Link>
                          ) : (
                            <Link
                              href={`/assessments/results/${att.id}`}
                              className="group inline-flex items-center gap-1 font-semibold text-electric-600 hover:text-electric-700"
                            >
                              Review
                              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
