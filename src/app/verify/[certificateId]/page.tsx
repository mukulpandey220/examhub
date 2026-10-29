import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Building2,
  ArrowLeft,
  Trophy,
  Hash,
  Search,
} from "lucide-react";
import { resolveCertificateRecord } from "@/lib/certificates";

export default function CertificateVerificationPage({
  params,
}: {
  params: { certificateId: string };
}) {
  const rawId = decodeURIComponent(params.certificateId || "");
  const cert = resolveCertificateRecord(rawId);

  return (
    <div className="hero-glow flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">

        <div className="flex items-center justify-between">
          <Link
            href="/verify"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-electric-600"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Search another
          </Link>

          <Link href="/" className="text-sm font-medium text-electric-600 hover:text-electric-700">
            Home
          </Link>
        </div>

        {cert ? (
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg sm:p-10">

            {/* Header */}
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <span className="badge badge-green">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified certificate
                  </span>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    National Benchmark Credential
                  </h1>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="block text-xs text-slate-400">Certificate ID</span>
                <span className="mt-0.5 inline-block rounded-lg border border-electric-200 bg-electric-50 px-3 py-1.5 text-sm font-semibold text-electric-700">
                  {cert.certificateId}
                </span>
              </div>
            </div>

            {/* Candidate & exam */}
            <div className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-xs text-slate-400">Awarded to</span>
                <h3 className="text-xl font-bold tracking-tight text-slate-900">{cert.studentName}</h3>
                <p className="flex items-center gap-1.5 pt-1 text-sm text-slate-600">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  {cert.institutionName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400">Exam</span>
                <h4 className="text-sm font-semibold leading-snug text-slate-900">{cert.examTitle}</h4>
                <p className="pt-0.5 text-sm font-medium text-electric-600">{cert.domainName}</p>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-soft-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md">
                <span className="block text-xs text-slate-400">Score</span>
                <span className="mt-0.5 block text-2xl font-bold text-slate-900">
                  {cert.score} / {cert.maxScore}
                </span>
                <span className="text-xs font-semibold text-emerald-600">{cert.percentage}%</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-soft-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md">
                <span className="block text-xs text-slate-400">Percentile</span>
                <span className="mt-0.5 block text-2xl font-bold text-electric-600">{cert.percentile}</span>
                <span className="text-xs text-slate-400">All-India</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-soft-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md">
                <span className="block text-xs text-slate-400">Rank</span>
                <span className="mt-0.5 block text-2xl font-bold text-amber-600">#{cert.nationalRank}</span>
                <span className="text-xs text-slate-400">National</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-soft-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md">
                <span className="block text-xs text-slate-400">Issued</span>
                <span className="mt-2 block text-sm font-semibold text-slate-900">
                  {new Date(cert.issuedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Medal */}
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-slate-900">
                  {cert.percentage >= 90 ? "Gold medalist" : cert.percentage >= 75 ? "Silver medalist" : "Certified"}
                </span>
                <span className="text-sm text-slate-500">Passed the national benchmark standard</span>
              </div>
            </div>

            {/* Hash */}
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Hash className="h-3.5 w-3.5 text-electric-500" />
                Verification hash
              </div>
              <p className="select-all break-all rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-600">
                {cert.verificationHash}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <Link href="/verify" className="btn btn-secondary">
                <Search className="h-4 w-4 text-slate-400" />
                Look up another
              </Link>
              <Link href="/payment" className="btn btn-primary">
                Take the exam
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <Award className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900">Certificate not found</h2>
              <p className="mx-auto max-w-md text-sm text-slate-500">
                We couldn't find a certificate matching &quot;{rawId}&quot;. Check the ID and try again.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/verify" className="btn btn-primary">
                Search again
              </Link>
              <Link href="/" className="btn btn-secondary">
                Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
