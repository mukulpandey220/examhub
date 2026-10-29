import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

/**
 * Shared layout for the policy pages: a title block followed by one card per
 * section. Wording lives in each page; this only handles presentation.
 */
export function LegalLayout({
  title,
  meta,
  sections,
}: {
  title: string;
  meta: string;
  sections: LegalSection[];
}) {
  return (
    <div className="flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="space-y-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-electric-600"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Home
          </Link>
          <h1 className="page-title">{title}</h1>
          <p className="text-sm text-slate-500">{meta}</p>
        </div>

        <div className="space-y-4">
          {sections.map((s) => (
            <section
              key={s.heading}
              className="space-y-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm transition-colors duration-200 hover:border-electric-200"
            >
              <h2 className="text-base font-semibold text-slate-900">{s.heading}</h2>
              <div className="text-sm leading-relaxed text-slate-600">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
