"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Edit, 
  Eye, 
  Copy, 
  BookOpen,
  Layers,
  ShieldCheck,
  FileText
} from "lucide-react";
import { DOMAINS } from "@/data/domains";
import { Question, DifficultyLevel, QuestionType } from "@/types";

export default function QuestionManagementPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [csvText, setCsvText] = useState("");
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  // Fetch Questions
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (domainFilter) params.append("domain", domainFilter);
      if (difficultyFilter) params.append("difficulty", difficultyFilter);
      if (statusFilter) params.append("status", statusFilter);
      params.append("limit", "50");

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [domainFilter, difficultyFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleUpdateStatus = async (questionId: string, status: "approved" | "rejected" | "draft") => {
    try {
      const res = await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: questionId, reviewStatus: status }),
      });
      if (res.ok) {
        setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, reviewStatus: status } : q));
        if (previewQuestion && previewQuestion.id === questionId) {
          setPreviewQuestion({ ...previewQuestion, reviewStatus: status });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportSubmit = async () => {
    if (!csvText.trim()) return;
    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: csvText,
      });

      const data = await res.json();
      setImportResult(data);
      if (data.success) {
        fetchQuestions();
      }
    } catch (err: any) {
      setImportResult({ error: err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation & Header */}
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
              Question Bank Management &amp; Review Desk
            </h1>
            <p className="text-xs text-slate-500">
              Audit, approve, edit, and bulk-import questions across all 72 technical &amp; management domains.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setImportModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 transition shadow-soft-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Bulk CSV Import</span>
            </button>
            <Link
              href="/admin/assessment/generate"
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center space-x-2 transition shadow-soft-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Drafts</span>
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-soft-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by question text, topic, or question ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Search
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Domain Filter */}
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              <option value="">All 72 Domains</option>
              {DOMAINS.map(d => (
                <option key={d.slug} value={d.slug}>
                  {d.name} ({d.categoryName})
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              <option value="">All Difficulty Tiers</option>
              <option value="basic">Basic Tier</option>
              <option value="intermediate">Intermediate Tier</option>
              <option value="advanced">Advanced Tier</option>
              <option value="professional">Professional Tier</option>
            </select>

            {/* Review Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              <option value="">All Review Statuses</option>
              <option value="approved">Approved (Live)</option>
              <option value="draft">Drafts (Pending Review)</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Showing {questions.length} of {total} database records</span>
          <span>Target Minimum: 3,600 Approved Questions</span>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-3 px-4">QID</th>
                  <th className="py-3 px-4">Domain / Topic</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Marks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {q.id}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{q.topic}</div>
                      <div className="text-[11px] text-slate-500 truncate">{q.domainSlug}</div>
                    </td>
                    <td className="py-3 px-4 font-mono capitalize whitespace-nowrap">
                      {q.type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="capitalize font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        q.reviewStatus === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : q.reviewStatus === "draft"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {q.reviewStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      +{q.marks} / -{q.negativeMarks}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setPreviewQuestion(q)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Preview Full Question"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {q.reviewStatus !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(q.id, "approved")}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold"
                            title="Approve Question"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {q.reviewStatus !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(q.id, "rejected")}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold"
                            title="Reject Question"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Question Preview Modal */}
        {previewQuestion && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-soft-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-mono text-xs text-slate-500 font-bold">
                  Preview: {previewQuestion.id} ({previewQuestion.domainSlug})
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  previewQuestion.reviewStatus === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {previewQuestion.reviewStatus.toUpperCase()}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Question Prompt</label>
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                    {previewQuestion.questionText}
                  </p>
                </div>

                {previewQuestion.options && previewQuestion.options.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Options &amp; Answer Key</label>
                    <div className="space-y-1.5">
                      {previewQuestion.options.map(opt => {
                        const isCorrect = Array.isArray(previewQuestion.correctAnswer)
                          ? previewQuestion.correctAnswer.includes(opt.id)
                          : previewQuestion.correctAnswer === opt.id;
                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                              isCorrect ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold" : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                          >
                            <span>{opt.text}</span>
                            {isCorrect && <span className="text-[10px] text-emerald-700 uppercase font-mono">CORRECT KEY</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Step-by-Step Explanation</label>
                  <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                    {previewQuestion.explanation}
                  </p>
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-2">
                  <span>Reference: {previewQuestion.sourceOrReference}</span>
                  <span>Marks: +{previewQuestion.marks} / -{previewQuestion.negativeMarks}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setPreviewQuestion(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Close Preview
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(previewQuestion.id, "approved")}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(previewQuestion.id, "rejected")}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk CSV Import Modal */}
        {importModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl w-full shadow-soft-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">Bulk CSV Question Bank Import</h3>
                <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Paste comma-separated question lines with column format:
                  <code className="block bg-slate-100 p-2 rounded mt-1 font-mono text-[11px]">
                    id,domainSlug,topic,difficulty,type,questionText,opt1,opt2,opt3,opt4,correctAnswer,explanation,marks
                  </code>
                </p>

                <textarea
                  rows={8}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`id,domainSlug,topic,difficulty,type,questionText,opt1,opt2,opt3,opt4,correctAnswer,explanation,marks
q-csv-custom-01,dotnet,Async Await,intermediate,single_choice,"What keyword is paired with async in C#?","await","yield","defer","promise",opt-1,"Async methods require await expressions to yield execution.",2`}
                  className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-brand-500/20"
                />

                {importResult && (
                  <div className={`p-3 rounded-xl text-xs font-mono ${
                    importResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}>
                    {importResult.success
                      ? `Import Completed: ${importResult.imported} questions imported, ${importResult.duplicates} duplicates detected.`
                      : `Import Error: ${importResult.error}`}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importing || !csvText.trim()}
                  onClick={handleImportSubmit}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-soft-sm"
                >
                  {importing ? "Validating & Importing..." : "Validate & Import"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
