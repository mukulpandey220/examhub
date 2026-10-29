"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Plus, 
  Layers, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Edit, 
  Trash2,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { INITIAL_EXAMS } from "@/data/exams";
import { DOMAINS } from "@/data/domains";
import { Examination } from "@/types";

export default function ExamManagementPage() {
  const [exams, setExams] = useState<Examination[]>(INITIAL_EXAMS);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newExam, setNewExam] = useState<Partial<Examination>>({
    title: "",
    domainSlug: "dotnet",
    durationMinutes: 30,
    totalMarks: 50,
    passingPercentage: 50,
    negativeMarkingPerWrong: 0.25,
    attemptLimit: 3,
    mode: "timed",
    format: "mcq",
    requiredTier: "seven_day",
  });
  const [error, setError] = useState("");

  const handleTogglePublish = (examId: string) => {
    setExams(prev => prev.map(e => e.id === examId ? { ...e, isPublished: !e.isPublished } : e));
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.title || !newExam.domainSlug) {
      setError("Please provide a title and select a domain.");
      return;
    }

    const domain = DOMAINS.find(d => d.slug === newExam.domainSlug);
    const created: Examination = {
      id: `exam-${newExam.domainSlug}-${Date.now()}`,
      slug: `${newExam.domainSlug}-custom-${Date.now()}`,
      title: newExam.title,
      domainSlug: newExam.domainSlug,
      domainName: domain?.name || "Technical Domain",
      categoryCode: domain?.categoryCode || "cse_it",
      categoryName: domain?.categoryName || "CSE / IT",
      description: `Custom examination created via admin console for ${domain?.name}.`,
      durationMinutes: Number(newExam.durationMinutes) || 30,
      totalMarks: Number(newExam.totalMarks) || 50,
      passingMarks: Math.round(((Number(newExam.totalMarks) || 50) * (Number(newExam.passingPercentage) || 50)) / 100),
      passingPercentage: Number(newExam.passingPercentage) || 50,
      negativeMarkingPerWrong: Number(newExam.negativeMarkingPerWrong) || 0.25,
      attemptLimit: Number(newExam.attemptLimit) || 3,
      isPublished: true,
      isFreeSample: false,
      requiredTier: newExam.requiredTier as any || "seven_day",
      mode: newExam.mode as any || "timed",
      format: newExam.format as any || "mcq",
      questionCount: 25,
      questionIds: [],
      difficultyBreakdown: { basic: 5, intermediate: 8, advanced: 8, professional: 4 },
      resultReleasePolicy: "immediate",
    };

    setExams([created, ...exams]);
    setCreateModalOpen(false);
    setNewExam({
      title: "",
      domainSlug: "dotnet",
      durationMinutes: 30,
      totalMarks: 50,
      passingPercentage: 50,
      negativeMarkingPerWrong: 0.25,
      attemptLimit: 3,
      mode: "timed",
      format: "mcq",
      requiredTier: "seven_day",
    });
  };

  return (
    <div className="flex-1 bg-slate-50 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/admin"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Console</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Examination Blueprint &amp; Schedule Management
            </h1>
            <p className="text-xs text-slate-500">
              Configure timed benchmarks, question distributions, negative marking policies, and publish status.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center space-x-2 transition shadow-soft-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Examination</span>
          </button>
        </div>

        {/* Exams Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-4 px-6">Examination Title</th>
                  <th className="py-4 px-6">Domain</th>
                  <th className="py-4 px-6">Duration</th>
                  <th className="py-4 px-6">Marks &amp; Negative</th>
                  <th className="py-4 px-6">Tier Required</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{e.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{e.id}</div>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700 whitespace-nowrap">
                      {e.domainName}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600 whitespace-nowrap">
                      {e.durationMinutes} Mins
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600 whitespace-nowrap">
                      {e.totalMarks} Marks (-{e.negativeMarkingPerWrong})
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600 whitespace-nowrap capitalize">
                      {e.requiredTier.replace('_', ' ')}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        e.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                      }`}>
                        {e.isPublished ? "PUBLISHED" : "UNPUBLISHED"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/assessments/exams/${e.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Preview Exam Experience"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(e.id)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                            e.isPublished
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {e.isPublished ? "Unpublish" : "Publish"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Exam Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-xl w-full shadow-soft-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">Create Examination Blueprint</h3>
                <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Examination Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Solutions Architect Professional Benchmark"
                    value={newExam.title}
                    onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Domain</label>
                    <select
                      value={newExam.domainSlug}
                      onChange={(e) => setNewExam({ ...newExam, domainSlug: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      {DOMAINS.map(d => (
                        <option key={d.slug} value={d.slug}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Access Tier</label>
                    <select
                      value={newExam.requiredTier}
                      onChange={(e) => setNewExam({ ...newExam, requiredTier: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="free">Free Sample</option>
                      <option value="seven_day">7-Day Pass</option>
                      <option value="semester">Semester Pass</option>
                      <option value="backlog_add_on">Backlog Add-on</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Duration (Min)</label>
                    <input
                      type="number"
                      value={newExam.durationMinutes}
                      onChange={(e) => setNewExam({ ...newExam, durationMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Total Marks</label>
                    <input
                      type="number"
                      value={newExam.totalMarks}
                      onChange={(e) => setNewExam({ ...newExam, totalMarks: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Negative Marking</label>
                    <input
                      type="number"
                      step="0.25"
                      value={newExam.negativeMarkingPerWrong}
                      onChange={(e) => setNewExam({ ...newExam, negativeMarkingPerWrong: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-soft-sm"
                  >
                    Create &amp; Publish Exam
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
