"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  BookOpen, 
  Clock,
  Send
} from "lucide-react";
import { DOMAINS } from "@/data/domains";
import { Question } from "@/types";

export default function ContentGenerationPage() {
  const [domainSlug, setDomainSlug] = useState("ai-ml");
  const [topic, setTopic] = useState("Model Evaluation Metrics");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [type, setType] = useState("single_choice");
  const [count, setCount] = useState(3);
  const [learningObjectives, setLearningObjectives] = useState("Evaluate sensitivity, specificity, and ROC-AUC curves in imbalanced medical datasets");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const selectedDomainObj = DOMAINS.find(d => d.slug === domainSlug) || DOMAINS[0];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainSlug,
          topic,
          difficulty,
          type,
          count: Number(count),
          learningObjectives,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Admin Console</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Curriculum Content &amp; Draft Generation Desk
          </h1>
          <p className="text-xs text-slate-500">
            Generate schema-validated question drafts. All outputs are stored strictly as Draft / Pending Review and must be vetted before publication.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-soft-sm space-y-6">
          <form onSubmit={handleGenerate} className="space-y-5 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Academic Domain</label>
                <select
                  value={domainSlug}
                  onChange={(e) => {
                    setDomainSlug(e.target.value);
                    const d = DOMAINS.find(item => item.slug === e.target.value);
                    if (d && d.subjects[0]?.topics[0]) {
                      setTopic(d.subjects[0].topics[0]);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {DOMAINS.map(d => (
                    <option key={d.slug} value={d.slug}>
                      {d.name} ({d.categoryName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Syllabus Topic</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Memory Management, RadFrac, Otto Cycle"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Difficulty Tier</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="basic">Basic Tier (Recall &amp; Syntax)</option>
                  <option value="intermediate">Intermediate (Mechanisms)</option>
                  <option value="advanced">Advanced (Architecture &amp; Edge Cases)</option>
                  <option value="professional">Professional (Enterprise Case Studies)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Question Modality</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="single_choice">Single-Answer MCQ</option>
                  <option value="multiple_choice">Multi-Select MCQ</option>
                  <option value="true_false">True / False Statement</option>
                  <option value="numerical">Numerical Problem</option>
                  <option value="coding">Coding Challenge</option>
                  <option value="practical">Practical / Rubric Task</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Draft Count</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value={1}>1 Question Draft</option>
                  <option value={3}>3 Question Drafts</option>
                  <option value={5}>5 Question Drafts</option>
                  <option value={10}>10 Question Drafts</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Learning Objectives / Assessment Goal</label>
              <textarea
                rows={2}
                value={learningObjectives}
                onChange={(e) => setLearningObjectives(e.target.value)}
                placeholder="Specific educational concepts, standard equations, or industrial competency criteria..."
                className="w-full p-3 rounded-xl border border-slate-200"
              />
            </div>

            {/* Safeguard Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <strong className="block font-bold">Academic Safeguard Enforced:</strong>
                Generated items are marked as <code>draft</code> and are excluded from active exams until approved by an administrator in Question Management.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-soft-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "Generating Drafts..." : "Generate Schema-Validated Drafts"}</span>
            </button>
          </form>

          {/* Results Feedback */}
          {result && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{result.generatedCount} Questions Drafted &amp; Stored in Database</span>
                </div>
                <Link href="/admin/assessment/questions" className="text-brand-700 hover:underline">
                  Open Question Review Desk &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                {result.questions?.map((q: Question, idx: number) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between font-mono font-bold text-[11px] text-slate-500">
                      <span>{q.id}</span>
                      <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded">DRAFT</span>
                    </div>
                    <div className="font-medium text-slate-900">{q.questionText}</div>
                    <div className="text-[11px] text-slate-500 italic">Explanation: {q.explanation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
