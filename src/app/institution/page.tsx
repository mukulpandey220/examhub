"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  FileText,
  LineChart,
  Send,
  Target,
} from "lucide-react";

const SECTIONS = [
  { weight: 25, title: "Analytical Aptitude" },
  { weight: 50, title: "Domain Technical Core" },
  { weight: 25, title: "Workplace Readiness" },
];

const COLLEGE_GETS = [
  { title: "Branch-wise heatmaps", text: "Cohort diagnostics and skill-gap audits.", icon: LineChart },
  { title: "Peer comparison", text: "Benchmark against colleges nationwide.", icon: Target },
  { title: "Accreditation reports", text: "Documentation for NAAC, NBA and NIRF.", icon: FileText },
  { title: "Recognition", text: "A citation for the college and its SPOC.", icon: Award },
];

const FEE_POINTS = ["No cost to the institution", "Proctored, 3-section evaluation", "Personalised diagnostic report"];

export default function InstitutionalPortalPage() {
  const [formData, setFormData] = useState({
    collegeName: "",
    universityAffiliation: "",
    city: "",
    state: "",
    spocName: "",
    spocDesignation: "Dean / TPO",
    spocEmail: "",
    spocPhone: "",
    studentCohortSize: 500,
    preferredExamWindow: "Nov 20 - Nov 30, 2026",
    labFacilityAvailable: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/institution/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit partnership request.");

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  };

  const label = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <div className="flex flex-1 flex-col">

      {/* Hero */}
      <section className="public-page-hero">
        <span className="section-kicker">For colleges & institutions</span>
        <h1 className="anim-rise mx-auto max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
          Benchmark your students on a national stage
        </h1>
        <p>Give every student a clearer next step with national benchmarking and insights for your entire institution.</p>
        <div
          className="anim-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "120ms" }}
        >
          <a href="#partner-form" className="btn btn-primary group w-full px-6 py-3 sm:w-auto">
            Partner with us
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
          <Link href="/institution/dashboard" className="btn btn-secondary w-full px-6 py-3 sm:w-auto">
            <BarChart3 className="h-4 w-4 text-electric-500" />
            Analytics demo
          </Link>
        </div>
      </section>

      {/* Fee + exam structure */}
      <section className="page-container institution-fees">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="fee-summary lg:col-span-3">
            <div className="relative">
              <div className="num text-6xl font-semibold text-slate-900">
                ₹99<span className="text-2xl font-normal text-slate-400"> / student</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {FEE_POINTS.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-electric-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col justify-center divide-y divide-slate-200/70 border-y border-slate-200 lg:col-span-2">
            {SECTIONS.map((s) => (
              <div key={s.title} className="flex items-center gap-4 px-6 py-5">
                <span className="num w-16 text-3xl font-semibold text-electric-600">
                  {s.weight}
                  <span className="text-lg text-slate-400">%</span>
                </span>
                <span className="text-sm font-medium text-slate-800">{s.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* College benefits */}
      <section className="institution-benefits"><div className="page-container space-y-10">
        <h2 className="section-title reveal text-center">What your institution receives</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {COLLEGE_GETS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="benefit-item">
                <span className="tile h-10 w-10">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div></section>

      {/* Partner form */}
      <section id="partner-form" className="partner-section">
        <div className="page-container partner-layout">

          <div className="section-heading"><span className="section-kicker">Let's build what comes next</span><h2>Your students.<br />A national stage.</h2><p>Tell us about your institution and cohort. Our team will help you plan the assessment and get started.</p><ul className="check-list">{FEE_POINTS.map((point) => <li key={point}><CheckCircle2 />{point}</li>)}</ul></div>

          <div className="partner-form">
            {submitted ? (
              <div className="space-y-4 py-8 text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
                <h3 className="font-display text-2xl font-semibold text-slate-900">Request received</h3>
                <p className="mx-auto max-w-md text-sm text-slate-600">
                  Thank you, <strong>{formData.spocName}</strong>. We'll contact you at <strong>{formData.spocEmail}</strong> within 24 hours.
                </p>
                <div className="pt-2">
                  <Link href="/institution/dashboard" className="btn btn-primary group">
                    Open the analytics console
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="inst-college" className={label}>College name *</label>
                    <input
                      id="inst-college"
                      type="text"
                      required
                      value={formData.collegeName}
                      onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                      placeholder="e.g. B.M.S. College of Engineering"
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="inst-affiliation" className={label}>University affiliation</label>
                    <input
                      id="inst-affiliation"
                      type="text"
                      value={formData.universityAffiliation}
                      onChange={(e) => setFormData({ ...formData, universityAffiliation: e.target.value })}
                      placeholder="e.g. VTU / Anna University / AKTU"
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="inst-city" className={label}>City</label>
                    <input
                      id="inst-city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Bengaluru"
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="inst-state" className={label}>State</label>
                    <input
                      id="inst-state"
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g. Karnataka"
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-slate-200/70 pt-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="inst-spoc" className={label}>Faculty SPOC / TPO name *</label>
                    <input
                      id="inst-spoc"
                      type="text"
                      required
                      value={formData.spocName}
                      onChange={(e) => setFormData({ ...formData, spocName: e.target.value })}
                      placeholder="e.g. Dr. K. R. Suresh"
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="inst-designation" className={label}>Designation</label>
                    <select
                      id="inst-designation"
                      value={formData.spocDesignation}
                      onChange={(e) => setFormData({ ...formData, spocDesignation: e.target.value })}
                      className="input"
                    >
                      <option value="Dean / TPO">Dean / Head of Training &amp; Placement</option>
                      <option value="Principal">Principal / Director</option>
                      <option value="HOD">Head of Department (HOD)</option>
                      <option value="Faculty Coordinator">Designated Faculty Coordinator</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="inst-email" className={label}>Official email *</label>
                    <input
                      id="inst-email"
                      type="email"
                      required
                      value={formData.spocEmail}
                      onChange={(e) => setFormData({ ...formData, spocEmail: e.target.value })}
                      placeholder="placement@college.edu.in"
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="inst-phone" className={label}>Mobile / WhatsApp *</label>
                    <input
                      id="inst-phone"
                      type="tel"
                      required
                      value={formData.spocPhone}
                      onChange={(e) => setFormData({ ...formData, spocPhone: e.target.value })}
                      placeholder="+91 98450 12345"
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-slate-200/70 pt-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="inst-cohort" className={label}>Expected cohort size</label>
                    <input
                      id="inst-cohort"
                      type="number"
                      value={formData.studentCohortSize}
                      onChange={(e) => setFormData({ ...formData, studentCohortSize: Number(e.target.value) })}
                      min="50"
                      max="10000"
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="inst-window" className={label}>Preferred exam window</label>
                    <input
                      id="inst-window"
                      type="text"
                      value={formData.preferredExamWindow}
                      onChange={(e) => setFormData({ ...formData, preferredExamWindow: e.target.value })}
                      placeholder="e.g. Nov 20 - Nov 30, 2026"
                      className="input"
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={formData.labFacilityAvailable}
                    onChange={(e) => setFormData({ ...formData, labFacilityAvailable: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-electric-600 focus:ring-electric-500"
                  />
                  <span>Computer labs are available for students without a laptop or broadband.</span>
                </label>

                <button type="submit" disabled={submitting} className="btn btn-primary mt-2 w-full py-3.5">
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting…" : "Request a briefing"}
                </button>

                <p className="text-center text-xs text-slate-500">
                  <a href="mailto:partnerships@nyeras.com" className="font-semibold text-electric-600 hover:text-electric-700">
                    partnerships@nyeras.com
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
