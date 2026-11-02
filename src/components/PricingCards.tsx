"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Check, 
  Sparkles, 
  Zap, 
  GraduationCap, 
  ShieldCheck, 
  ArrowRight, 
  Trophy, 
  Flame,
  Award,
  Layers,
  CheckCircle2,
  Lock,
  Star
} from "lucide-react";
import { PRICING_PLANS } from "@/data/pricing";

interface PricingCardsProps {
  highlightId?: string;
  className?: string;
}

export function PricingCards({ highlightId = "plan-backlog-addon", className = "" }: PricingCardsProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  const getTierMeta = (id: string) => {
    switch (id) {
      case "plan-free":
        return {
          icon: Sparkles,
          iconColor: "text-emerald-600 dark:text-emerald-400",
          iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
          accentColor: "#10b981",
          spotlightColor: "rgba(16, 185, 129, 0.14)",
          discountLabel: "Free Forever",
          discountBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
          badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
          btnClass: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm",
          ctaText: "Start free",
          href: "/checkout/plan-free",
          borderHover: "hover:border-emerald-500/50 hover:shadow-emerald-500/10",
        };
      case "plan-seven-day":
        return {
          icon: Zap,
          iconColor: "text-sky-600 dark:text-sky-400",
          iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
          accentColor: "#0284c7",
          spotlightColor: "rgba(2, 132, 199, 0.16)",
          discountLabel: "Save 70%",
          discountBg: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
          badgeColor: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
          btnClass: "bg-gradient-to-r from-sky-600 to-cyan-600 text-white hover:from-sky-500 hover:to-cyan-500 shadow-md shadow-sky-500/20",
          ctaText: "Get for ₹29",
          href: "/checkout/plan-seven-day",
          borderHover: "hover:border-sky-500/50 hover:shadow-sky-500/15",
        };
      case "plan-semester":
        return {
          icon: GraduationCap,
          iconColor: "text-indigo-600 dark:text-indigo-400",
          iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
          accentColor: "#6366f1",
          spotlightColor: "rgba(99, 102, 241, 0.16)",
          discountLabel: "Save 75%",
          discountBg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
          badgeColor: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
          btnClass: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20",
          ctaText: "Get for ₹49",
          href: "/checkout/plan-semester",
          borderHover: "hover:border-indigo-500/50 hover:shadow-indigo-500/15",
        };
      case "plan-backlog-addon":
      default:
        return {
          icon: ShieldCheck,
          iconColor: "text-emerald-700 dark:text-emerald-400",
          iconBg: "bg-emerald-500/15 dark:bg-emerald-500/25",
          accentColor: "#25D366",
          spotlightColor: "rgba(37, 211, 102, 0.22)",
          discountLabel: "Save 67%",
          discountBg: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
          badgeColor: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
          btnClass: "bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 text-slate-950 font-bold hover:brightness-105 shadow-lg shadow-emerald-500/30 border border-emerald-400/40",
          ctaText: "Get for ₹99",
          href: "/payment",
          borderHover: "hover:border-emerald-500/60 hover:shadow-emerald-500/25",
        };
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 4-Card Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-7 items-stretch pt-6 pb-12">
        {PRICING_PLANS.map((plan) => {
          const meta = getTierMeta(plan.id);
          const IconComponent = meta.icon;
          const isFeatured = plan.isPopular || plan.id === highlightId;
          const isHovered = hoveredCard === plan.id;

          return (
            <div
              key={plan.id}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setHoveredCard(plan.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative flex flex-col justify-between rounded-3xl transition-all duration-300 ease-out ${
                isFeatured
                  ? "xl:-translate-y-2.5 z-20"
                  : "hover:-translate-y-2 z-10"
              }`}
            >
              {/* Outer Glow / Animated Gradient Ring for Featured Card */}
              {isFeatured && (
                <div 
                  className="absolute -inset-[2px] rounded-[26px] bg-gradient-to-b from-emerald-400 via-teal-400 to-emerald-600 opacity-90 blur-[1px] transition-all duration-500 group-hover:opacity-100 group-hover:blur-[2px]"
                  style={{
                    background: "linear-gradient(135deg, #25D366 0%, #10b981 35%, #059669 70%, #34d399 100%)",
                  }}
                />
              )}

              {/* Card Container */}
              <div
                className={`relative flex flex-col justify-between h-full w-full rounded-3xl p-6 sm:p-7 backdrop-blur-xl border transition-all duration-300 ${
                  isFeatured
                    ? "bg-white/95 dark:bg-[#081433]/95 border-emerald-400/50 shadow-xl shadow-emerald-900/10 dark:shadow-emerald-500/10"
                    : `bg-white/80 dark:bg-[#0c183a]/80 border-slate-200/80 dark:border-white/10 shadow-lg ${meta.borderHover}`
                }`}
              >
                {/* Dynamic Mouse Spotlight Sheen */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(360px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${meta.spotlightColor}, transparent 70%)`,
                  }}
                />

                {/* Top Section */}
                <div className="relative z-10">
                  {/* Floating 'Most Popular' Tag */}
                  {isFeatured && (
                    <div className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm shadow-emerald-500/20">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
                      </span>
                      <span className="font-bold tracking-wide uppercase text-[11px]">Most popular</span>
                      <span className="opacity-80 text-[11px]">· Benchmark</span>
                    </div>
                  )}

                  {/* Icon & Access Badge Row */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`p-2.5 rounded-2xl ${meta.iconBg} ${meta.iconColor} transition-transform duration-300 group-hover:scale-110`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${meta.badgeColor}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {plan.durationLabel}
                    </span>
                  </div>

                  {/* Plan Name */}
                  <h3 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {plan.name}
                  </h3>

                  {/* Price Row */}
                  <div className="mt-3 pb-5 border-b border-slate-200/70 dark:border-white/10">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
                        ₹{plan.priceRupees}
                      </span>

                      {plan.originalPriceRupees && (
                        <span className="text-base font-semibold text-slate-400 line-through">
                          ₹{plan.originalPriceRupees}
                        </span>
                      )}

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.discountBg}`}>
                        {meta.discountLabel}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-5 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Included with this tier:
                    </p>

                    <ul className="space-y-2.5 text-[12.5px] text-slate-700 dark:text-slate-300 leading-snug">
                      {plan.features.map((feat, i) => {
                        const isSectionBadge = feat.startsWith("Section ");
                        const isReward = feat.includes("Exclusive Rewards") || feat.includes("Top Rankers");
                        const isProctored = feat.includes("Cloud Proctored") || feat.includes("Benchmark");

                        return (
                          <li key={i} className="flex items-start gap-2.5 group/item">
                            <span className={`mt-0.5 shrink-0 rounded-full p-0.5 ${
                              isFeatured 
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                                : "bg-slate-200/80 dark:bg-white/10 text-emerald-600 dark:text-emerald-400"
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </span>

                            <span className={`transition-colors ${
                              isReward 
                                ? "font-semibold text-amber-700 dark:text-amber-300" 
                                : isProctored
                                ? "font-semibold text-emerald-700 dark:text-emerald-300"
                                : isSectionBadge
                                ? "font-medium text-slate-800 dark:text-slate-200"
                                : ""
                            }`}>
                              {feat}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Bottom CTA Button */}
                <div className="relative z-10 pt-7 mt-6 border-t border-slate-200/70 dark:border-white/10">
                  <Link
                    href={meta.href}
                    className={`group/btn relative overflow-hidden flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${meta.btnClass}`}
                  >
                    {/* Button hover shine reflection sweep */}
                    <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <span>{meta.ctaText}</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                  </Link>

                  <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                    {plan.priceRupees === 0 ? "Instant diagnostic access" : "Instant activation & verification"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
