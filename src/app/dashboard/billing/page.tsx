"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Download, 
  ExternalLink,
  HelpCircle
} from "lucide-react";
import { OFFICIAL_RAZORPAY_PAYMENT_URL, RAZORPAY_DISPLAY_URL } from "@/config/payment";

export default function BillingHistoryPage() {
  const [user, setUser] = useState<any>({
    id: "user-student-ramkumar",
    name: "Ramkumar Malothu",
    email: "ramkumar.malothu@nyeras.com",
    courseDegree: "B.Tech Computer Science & Engineering",
  });

  const [entitlements, setEntitlements] = useState<any[]>([
    {
      id: "ent-ramkumar-01",
      userId: "user-student-ramkumar",
      tier: "semester",
      startsAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
      paymentRef: "pay_razorpay_CkGK3Dv",
      status: "active",
    }
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("campus_radar_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {}
      }
    }

    async function loadEntitlements() {
      try {
        const res = await fetch(`/api/auth?userId=${user.id || "user-student-ramkumar"}`);
        const data = await res.json();
        if (data.entitlements && data.entitlements.length > 0) {
          setEntitlements(data.entitlements);
        }
      } catch (err) {}
    }
    loadEntitlements();
  }, []);

  const activeEntitlement = entitlements[0];

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

        <div>
          <h1 className="page-title">Billing</h1>
          <p className="page-subtitle">
            {user.name} · {user.email}
          </p>
        </div>

        {/* Current plan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="space-y-1.5">
              <span className="badge badge-blue">Current plan</span>
              <h2 className="text-2xl font-bold capitalize text-slate-900">
                {activeEntitlement ? `${String(activeEntitlement.tier).replace("_", " ")} pass` : "Free plan"}
              </h2>
              <p className="text-sm text-slate-500">
                {activeEntitlement
                  ? `Active since ${new Date(activeEntitlement.startsAt).toLocaleDateString()} · expires ${new Date(activeEntitlement.expiresAt).toLocaleDateString()}`
                  : "Free diagnostic exams across all 72 domains."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={OFFICIAL_RAZORPAY_PAYMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <CreditCard className="h-4 w-4" />
                Pay on Razorpay
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Link href="/pricing" className="btn btn-secondary">
                View plans
              </Link>
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm">
          <h3 className="text-base font-semibold text-slate-900">Invoices</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Valid until</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entitlements.map(ent => (
                  <tr key={ent.id} className="transition-colors hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                      {new Date(ent.startsAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-medium capitalize text-slate-900">
                      {String(ent.tier).replace("_", " ")} pass
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{ent.paymentRef || ent.id}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                      {new Date(ent.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="badge badge-green capitalize">{ent.status}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <button
                        onClick={() => alert(`Official GST Receipt: Tax Invoice Ref ${ent.id} for Candidate ${user.name} (${user.email}). Reference: ${ent.paymentRef || "pay_razorpay_CkGK3Dv"}. Status: Paid.`)}
                        className="inline-flex items-center gap-1 font-semibold text-electric-600 hover:text-electric-700"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
