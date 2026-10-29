import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Search, ArrowRight } from "lucide-react";

export default function CertificateSearchPage({
  searchParams,
}: {
  searchParams?: { q?: string; id?: string; certificateId?: string };
}) {
  const query = searchParams?.q || searchParams?.id || searchParams?.certificateId;

  if (query && query.trim()) {
    redirect(`/verify/${encodeURIComponent(query.trim())}`);
  }

  const sampleIds = [
    { id: "NYE-2026-NXT-94821", label: ".NET Core & Cloud Architecture National Benchmark", type: "Nyeras Nxtmove" },
    { id: "NYE-2026-NXT-78120", label: "Full Stack Cloud & Distributed Systems Benchmark", type: "Nyeras Nxtmove" },
    { id: "NTCRA-2026-REG-9481", label: "National Talent & Career Readiness Assessment", type: "NTCRA" },
  ];

  return (
    <div className="hero-glow flex-1 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <div className="space-y-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Verify a certificate</h1>
          <p className="mx-auto max-w-md text-sm text-slate-500">
            Enter a certificate ID to check the score, percentile and rank it was issued for.
          </p>
        </div>

        {/* Search */}
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-lg sm:p-8">
          <form action="/verify" method="GET" className="space-y-3">
            <label htmlFor="certificateId" className="block text-sm font-medium text-slate-700">
              Certificate ID
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="certificateId"
                  name="q"
                  placeholder="e.g. NYE-2026-NXT-94821"
                  required
                  className="input py-3 pl-10"
                />
              </div>
              <button type="submit" className="btn btn-primary group py-3">
                Verify
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </form>

          <div className="space-y-3 border-t border-slate-100 pt-5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sample IDs
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {sampleIds.map((item) => (
                <Link
                  key={item.id}
                  href={`/verify/${item.id}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 hover:border-electric-300 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-800 group-hover:text-electric-600">
                      {item.id}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{item.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-electric-500" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
