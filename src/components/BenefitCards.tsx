"use client";

import React, { useState } from "react";
import { BarChart3, TrendingUp, Award, Target, ArrowUpRight, Check, ShieldCheck } from "lucide-react";

interface BenefitCardData {
  number: string;
  title: string;
  text: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  iconColor: string;
  iconBg: string;
  badgeBg: string;
  borderColor: string;
  glowColor: string;
  microVisual: {
    type: "bars" | "percentile" | "certificate" | "roadmap";
  };
}

const BENEFIT_ITEMS: BenefitCardData[] = [
  {
    number: "01",
    title: "Understand your strengths",
    text: "A section-wise diagnostic report turns your results into a clear picture of what comes next.",
    badge: "Diagnostic Report",
    icon: BarChart3,
    accentColor: "#10b981",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    borderColor: "hover:border-emerald-500/50 hover:shadow-emerald-500/15",
    glowColor: "rgba(16, 185, 129, 0.16)",
    microVisual: { type: "bars" },
  },
  {
    number: "02",
    title: "See where you stand",
    text: "An all-India percentile puts your performance in context alongside national peers.",
    badge: "National Percentile",
    icon: TrendingUp,
    accentColor: "#0284c7",
    iconColor: "text-sky-500 dark:text-sky-400",
    iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
    badgeBg: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
    borderColor: "hover:border-sky-500/50 hover:shadow-sky-500/15",
    glowColor: "rgba(2, 132, 199, 0.16)",
    microVisual: { type: "percentile" },
  },
  {
    number: "03",
    title: "Make your skills visible",
    text: "A verifiable certificate with a public ID gives you a credential you can share.",
    badge: "Verified Credential",
    icon: Award,
    accentColor: "#eab308",
    iconColor: "text-amber-500 dark:text-amber-400",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    borderColor: "hover:border-amber-500/50 hover:shadow-amber-500/15",
    glowColor: "rgba(234, 179, 8, 0.16)",
    microVisual: { type: "certificate" },
  },
  {
    number: "04",
    title: "Build your next step",
    text: "Use your personalised six-month roadmap to focus on the skills that need attention.",
    badge: "6-Month Roadmap",
    icon: Target,
    accentColor: "#8b5cf6",
    iconColor: "text-violet-500 dark:text-violet-400",
    iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
    badgeBg: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
    borderColor: "hover:border-violet-500/50 hover:shadow-violet-500/15",
    glowColor: "rgba(139, 92, 246, 0.16)",
    microVisual: { type: "roadmap" },
  },
];

export function BenefitCards() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch w-full">
      {BENEFIT_ITEMS.map((item, idx) => {
        const Icon = item.icon;
        const isHovered = hoveredIndex === idx;

        return (
          <div
            key={item.title}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="group relative flex flex-col justify-between rounded-3xl transition-all duration-300 ease-out hover:-translate-y-2.5"
          >
            {/* Outer Soft Ambient Glow Container */}
            <div
              className={`relative flex flex-col justify-between h-full w-full rounded-3xl p-6 sm:p-7 backdrop-blur-xl border transition-all duration-300 bg-white/80 dark:bg-[#0c183a]/80 border-slate-200/80 dark:border-white/10 shadow-lg ${item.borderColor}`}
            >
              {/* Dynamic Mouse Spotlight Sheen */}
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(320px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${item.glowColor}, transparent 70%)`,
                }}
              />

              {/* Shimmer light sweep on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </div>

              {/* Content Header */}
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-5">
                  {/* Floating Icon with Animated Halo */}
                  <div className={`p-3 rounded-2xl ${item.iconBg} ${item.iconColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${item.badgeBg}`}>
                    {item.number}
                  </span>
                </div>

                <span className={`inline-block text-[11px] font-bold tracking-wider uppercase mb-2 ${item.iconColor}`}>
                  {item.badge}
                </span>

                <h3 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </h3>

                <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.text}
                </p>
              </div>

              {/* Micro-visual interactive preview widget at the bottom */}
              <div className="relative z-10 mt-6 pt-5 border-t border-slate-200/70 dark:border-white/10">
                {item.microVisual.type === "bars" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Quantitative Aptitude</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">92%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/70 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out group-hover:w-[92%] w-[75%]" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Technical Core</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">88%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/70 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out group-hover:w-[88%] w-[68%]" />
                    </div>
                  </div>
                )}

                {item.microVisual.type === "percentile" && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/20 text-sky-700 dark:text-sky-300">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">All-India Rank</span>
                      <span className="text-sm font-black">Top 2.4%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Percentile</span>
                      <span className="text-sm font-black block">97.6%</span>
                    </div>
                  </div>
                )}

                {item.microVisual.type === "certificate" && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                    <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Public Verified ID</span>
                      <span className="text-xs font-mono font-semibold truncate">CR-2026-CERT-9042</span>
                    </div>
                  </div>
                )}

                {item.microVisual.type === "roadmap" && (
                  <div className="flex items-center justify-between text-[11px] text-violet-700 dark:text-violet-300 font-medium">
                    <span className="px-2 py-1 rounded-md bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/20">M1-2: Core</span>
                    <span className="text-slate-400">&rarr;</span>
                    <span className="px-2 py-1 rounded-md bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/20">M3-4: Adv</span>
                    <span className="text-slate-400">&rarr;</span>
                    <span className="px-2 py-1 rounded-md bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/20">M5-6: Ready</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

