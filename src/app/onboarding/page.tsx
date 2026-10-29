"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  BookOpen, 
  Clock, 
  Gauge, 
  GraduationCap 
} from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { DOMAINS } from "@/data/domains";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("cse_it");
  const [selectedDomain, setSelectedDomain] = useState("dsa-system-design");
  const [selectedTopic, setSelectedTopic] = useState("Dynamic Programming");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"basic" | "intermediate" | "advanced" | "professional">("intermediate");
  const [preferredMode, setPreferredMode] = useState<"timed" | "practice">("timed");
  const [saving, setSaving] = useState(false);

  // Domains for current category
  const categoryDomains = DOMAINS.filter(d => d.categoryCode === selectedCategory);
  const currentDomainObj = DOMAINS.find(d => d.slug === selectedDomain) || categoryDomains[0];

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user-student-demo",
          action: "update_profile",
          updates: {
            category: selectedCategory,
            domainSlug: selectedDomain,
            selectedDifficulty,
            preferredMode,
            onboarded: true,
          },
        }),
      });
      router.push("/dashboard");
    } catch (err) {
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  const stepTitles = ["Your stream", "Your topic", "Your preferences"];

  const choice = (active: boolean) =>
    `rounded-xl border text-left ${
      active
        ? "border-electric-500 bg-electric-50 text-electric-700 ring-2 ring-electric-500/20"
        : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
    }`;

  return (
    <div className="hero-glow flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="anim-rise w-full max-w-2xl space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg sm:p-10">

        {/* Progress */}
        <div className="space-y-3 border-b border-slate-100 pb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">{stepTitles[step - 1]}</span>
            <span className="text-slate-500">
              Step {step} of 3
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-electric-500 transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="animate-fade-up space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Choose your stream</h2>
              <p className="mt-1 text-sm text-slate-500">Pick your branch and primary domain.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Stream</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.code);
                      const first = DOMAINS.find(d => d.categoryCode === cat.code);
                      if (first) setSelectedDomain(first.slug);
                    }}
                    className={`p-3 text-sm font-medium ${choice(selectedCategory === cat.code)}`}
                  >
                    <div>{cat.shortName}</div>
                    <div className="text-xs font-normal text-slate-400">
                      {cat.domainCount} {cat.domainCount === 1 ? "domain" : "domains"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Primary domain</label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="input"
              >
                {categoryDomains.map(d => (
                  <option key={d.slug} value={d.slug}>
                    {d.name} ({d.categoryName})
                  </option>
                ))}
              </select>
              <p className="text-sm text-slate-500">{currentDomainObj?.description}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setStep(2)} className="btn btn-primary group">
                Continue
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="animate-fade-up space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Pick a priority topic</h2>
              <p className="mt-1 text-sm text-slate-500">
                We'll focus your diagnostics on {currentDomainObj?.name}.
              </p>
            </div>

            <div className="space-y-3">
              {currentDomainObj?.subjects.map(subj => (
                <div key={subj.slug} className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">{subj.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {subj.topics.map((top, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedTopic(top)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                          selectedTopic === top
                            ? "bg-electric-500 text-white shadow-electric"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-electric-300 hover:bg-slate-50"
                        }`}
                      >
                        {top}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn btn-ghost">
                ← Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn btn-primary group">
                Continue
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="animate-fade-up space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Difficulty &amp; mode</h2>
              <p className="mt-1 text-sm text-slate-500">You can change these any time from your dashboard.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Starting difficulty</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["basic", "intermediate", "advanced", "professional"] as const).map(diff => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`p-3 text-center text-sm font-medium capitalize ${choice(selectedDifficulty === diff)}`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Default exam mode</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPreferredMode("timed")}
                  className={`p-4 ${choice(preferredMode === "timed")}`}
                >
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Timed exam
                  </div>
                  <p className="text-sm font-normal text-slate-500">Countdown clock and negative marking.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPreferredMode("practice")}
                  className={`p-4 ${choice(preferredMode === "practice")}`}
                >
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                    <BookOpen className="h-4 w-4 text-electric-500" />
                    Practice
                  </div>
                  <p className="text-sm font-normal text-slate-500">Instant explanations and no penalty.</p>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setStep(2)} className="btn btn-ghost">
                ← Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSavePreferences}
                className="btn btn-primary px-6"
              >
                {saving ? "Saving…" : "Finish & open dashboard"}
                {!saving && <CheckCircle2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
