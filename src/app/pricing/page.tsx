import React from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { PRICING_PLANS } from "@/data/pricing";

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
      <section className="public-page-hero"><span className="section-kicker">Simple, flexible access</span><h1>A plan for your next move.</h1><p>Start exploring for free, prepare for your next exam, or benchmark your skills on a national stage.</p></section>
      <div className="page-container">



        {/* Plans */}
        <div className="pricing-columns">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-column ${plan.isPopular ? "is-popular" : ""}`}
            >
              {plan.isPopular && (
                <span className="btn-primary absolute -top-3 left-6 rounded-full px-3 py-0.5 text-xs font-semibold">
                  Most popular
                </span>
              )}

              <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900">{plan.name}</h2>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="num text-4xl font-semibold text-slate-900">₹{plan.priceRupees}</span>
                {plan.originalPriceRupees && (
                  <span className="text-sm text-slate-400 line-through">₹{plan.originalPriceRupees}</span>
                )}
              </div>
              <span className="badge badge-blue mt-3 self-start">{plan.durationLabel}</span>

              <ul className="mt-6 flex-1 space-y-2.5 border-t border-slate-200/70 pt-6 text-[13px] text-slate-600">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric-500" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.id === "plan-backlog-addon" ? "/payment" : `/checkout/${plan.id}`}
                className={`btn mt-7 w-full ${plan.isPopular ? "btn-primary" : "btn-secondary"}`}
              >
                {plan.priceRupees === 0 ? "Start free" : `Get for ₹${plan.priceRupees}`}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div className="pricing-comparison">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Compare</th>
                  <th className="px-4 py-4 text-center">Free</th>
                  <th className="px-4 py-4 text-center">7-day · ₹29</th>
                  <th className="px-4 py-4 text-center">Semester · ₹49</th>
                  <th className="px-4 py-4 text-center">National · ₹99</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="transition-colors hover:bg-electric-500/[0.06]">
                    <td className="px-5 py-3.5 font-medium text-slate-800">{row.feature}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-4 py-3.5 text-center">
                        {v === "—" ? (
                          <Minus className="mx-auto h-4 w-4 text-slate-300" />
                        ) : (
                          <span className="text-slate-600">{v}</span>
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
          <Link href="/refund-policy" className="font-medium text-electric-600 hover:text-electric-700">
            Refund policy
          </Link>
          <span className="mx-2 text-slate-300">·</span>
          <Link href="/terms" className="font-medium text-electric-600 hover:text-electric-700">
            Terms
          </Link>
        </p>
      </div>
    </div>
  );
}
