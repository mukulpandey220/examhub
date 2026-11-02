import React from "react";
import Link from "next/link";
import { Minus, ShieldCheck, Zap, Sparkles, Lock, ArrowRight } from "lucide-react";
import { PricingCards } from "@/components/PricingCards";

const COMPARISON: { feature: string; values: string[] }[] = [
  { feature: "Domain catalog", values: ["Full", "Full", "Full", "Full"] },
  { feature: "Sample diagnostic tests", values: ["Included", "Unlimited", "Unlimited", "Unlimited"] },
  { feature: "Full timed benchmark exams", values: ["—", "7 days", "180 days", "90 days"] },
  { feature: "Coding practice", values: ["Samples only", "Full", "Full", "Full"] },
  { feature: "Deadline alerts", values: ["Public view", "Verified", "Priority", "Revaluation focus"] },
];

export default function PricingPage() {
  return (
    <div className="flex-1">
      <section className="public-page-hero">
        <span className="section-kicker">Simple, flexible access</span>
        <h1>A plan for your next move.</h1>
        <p>Start exploring for free, prepare for your next exam, or benchmark your skills on a national stage.</p>
      </section>

      <div className="page-container">
        {/* 4 Interactive Pricing Cards with Effects */}
        <PricingCards />

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-slate-200/70 dark:border-white/10 my-10 text-center">
          <div className="flex flex-col items-center gap-1.5 p-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-white">Proctored & Verifiable</span>
            <span className="text-[11px] text-slate-500">Industry-recognized benchmark credentials</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3">
            <Zap className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-white">Instant Activation</span>
            <span className="text-[11px] text-slate-500">Start practicing within 30 seconds</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3">
            <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-white">256-Bit Encrypted</span>
            <span className="text-[11px] text-slate-500">Secure UPI & Card payments</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-white">Transparent Pricing</span>
            <span className="text-[11px] text-slate-500">Zero hidden fees or recurring traps</span>
          </div>
        </div>

        {/* Comparison */}
        <div className="pricing-comparison">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Detailed Breakdown</span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">Compare Plan Capabilities</h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-[#0c140e]/70 backdrop-blur-md shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 dark:border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Compare</th>
                  <th className="px-4 py-4 text-center">Free</th>
                  <th className="px-4 py-4 text-center">7-day · ₹29</th>
                  <th className="px-4 py-4 text-center">Semester · ₹49</th>
                  <th className="px-4 py-4 text-center text-emerald-600 dark:text-emerald-400">National · ₹99</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="transition-colors hover:bg-emerald-500/[0.04]">
                    <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">{row.feature}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-4 py-3.5 text-center">
                        {v === "—" ? (
                          <Minus className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-600" />
                        ) : (
                          <span className={i === 3 ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"}>{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="pb-16 text-center text-sm text-slate-500">
          <Link href="/refund-policy" className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
            Refund policy
          </Link>
          <span className="mx-2 text-slate-300 dark:text-slate-700">·</span>
          <Link href="/terms" className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
            Terms & Conditions
          </Link>
        </p>
      </div>
    </div>
  );
}
