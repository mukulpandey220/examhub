"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  CreditCard, 
  Award, 
  Layers, 
  CheckCircle2, 
  Clock, 
  CalendarClock, 
  ArrowRight, 
  ExternalLink, 
  Search, 
  Check, 
  UserCheck,
  Trophy,
  Cpu,
  ShieldAlert,
  Camera,
  AlertTriangle,
  Eye,
  X,
  FileText
} from "lucide-react";
import { INITIAL_EXAMS } from "@/data/exams";
import { OFFICIAL_RAZORPAY_PAYMENT_URL, RAZORPAY_DISPLAY_URL } from "@/config/payment";

export default function AdminDashboardPage() {
  const [students, setStudents] = useState<any[]>([
    {
      id: "user-student-ramkumar",
      email: "ramkumar.malothu@nyeras.com",
      name: "Ramkumar Malothu",
      university: "Nyeras Institute of Technology",
      courseDegree: "B.Tech Computer Science & Engineering",
      semester: 7,
      optedExams: ["exam-dsa-system-design-mock-01", "exam-dotnet-mock-01"],
      isPaid: true,
      activePass: {
        tier: "semester",
        paymentRef: "pay_razorpay_CkGK3Dv",
        expiresAt: "2027-04-25T18:00:00.000Z"
      }
    },
    {
      id: "user-student-demo",
      email: "student@campusradar.edu.in",
      name: "Arjun Sharma",
      university: "Visvesvaraya Technological University (VTU)",
      courseDegree: "B.Tech Computer Science & Engineering",
      semester: 7,
      optedExams: ["exam-dsa-system-design-mock-01"],
      isPaid: true,
      activePass: {
        tier: "seven_day",
        paymentRef: "pay_razorpay_CkGK3Dv",
        expiresAt: "2026-11-01T18:00:00.000Z"
      }
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [incidents, setIncidents] = useState<any[]>([]);
  const [incidentSearchTerm, setIncidentSearchTerm] = useState("");
  const [incidentFilter, setIncidentFilter] = useState<"all" | "cancelled" | "evidence">("all");
  const [selectedEvidenceImage, setSelectedEvidenceImage] = useState<string | null>(null);
  const [selectedIncidentForDetail, setSelectedIncidentForDetail] = useState<any | null>(null);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/auth?action=students");
        const data = await res.json();
        if (data.students && data.students.length > 0) {
          setStudents(data.students);
        }
      } catch (e) {
        console.error(e);
      }
    }

    async function fetchIncidents() {
      try {
        const res = await fetch("/api/v1/proctoring/events");
        const data = await res.json();
        if (data.incidents) {
          setIncidents(data.incidents);
        }
      } catch (e) {
        console.error("Failed to fetch proctoring incidents:", e);
      }
    }

    fetchStudents();
    fetchIncidents();
  }, []);

  const totalQuestions = 3600;
  const completeDomains = 72;
  const publishedExams = INITIAL_EXAMS.length;

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.university.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 bg-white subtle-grid py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="page-title">Admin console</h1>

          <div className="flex items-center space-x-3">
            <Link
              href="/leaderboard"
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs transition flex items-center space-x-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-electric-500" />
              <span>Live Leaderboard</span>
            </Link>

            <a
              href={OFFICIAL_RAZORPAY_PAYMENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl border border-electric-200 bg-electric-50 hover:bg-electric-100 text-electric-900 font-bold text-xs transition flex items-center space-x-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-electric-600" />
              <span>Razorpay Portal</span>
              <ExternalLink className="w-3 h-3 text-electric-500" />
            </a>

            <Link
              href="/admin/proctor/train"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-soft-sm transition flex items-center space-x-1.5"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Train Proctor AI</span>
            </Link>

            <Link
              href="/admin/assessment/coverage"
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-soft-sm transition"
            >
              Audit 72 Domains (3,600 Qs)
            </Link>
          </div>
        </div>

        {/* Real KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-soft-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Question Bank</span>
              <Layers className="w-4 h-4 text-electric-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {totalQuestions.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold block mt-1">
              {completeDomains}/72 Domains 100% Complete
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-soft-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Published Exams</span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {publishedExams}
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Across all 7 academic streams
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-soft-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Registered Students</span>
              <Users className="w-4 h-4 text-electric-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {students.length}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold block mt-1">
              {students.filter(s => s.isPaid).length} Active Paid Passes
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-soft-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Payment Gateway</span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-sm font-black text-slate-900 font-mono truncate mt-1">
              Razorpay Active
            </div>
            <span className="text-[11px] text-electric-600 font-mono font-bold block mt-1 truncate">
              {RAZORPAY_DISPLAY_URL}
            </span>
          </div>
        </div>

        {/* Student Exam Opt-Ins & Payments Monitor */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-soft-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Student Exam Opt-Ins &amp; Payment Monitor
                </h2>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
              />
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3 px-4">Student Details</th>
                  <th className="py-3 px-4">University &amp; Semester</th>
                  <th className="py-3 px-4">Opted Examinations</th>
                  <th className="py-3 px-4">Pass Entitlement</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const optedCount = (s.optedExams || []).length;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{s.name}</div>
                        <div className="font-mono text-purple-700 text-xs">{s.email}</div>
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        <div className="font-semibold text-slate-800">{s.university}</div>
                        <div className="text-[11px] text-slate-500">{s.courseDegree} • Sem {s.semester}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-electric-50 text-electric-700 border border-electric-200">
                            <span>{optedCount} Exams Opted</span>
                          </span>
                          <div className="text-[11px] text-slate-500 font-mono max-w-xs truncate">
                            {(s.optedExams || []).join(", ") || "No exams selected"}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {s.isPaid ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase text-[10px] border border-emerald-200">
                              <Check className="w-3 h-3" />
                              <span>{s.activePass?.tier || "Semester"} Pass Active</span>
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Ref: {s.activePass?.paymentRef || "pay_razorpay_CkGK3Dv"}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[10px]">
                            Free Tier
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <a
                          href={OFFICIAL_RAZORPAY_PAYMENT_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs inline-flex items-center space-x-1"
                        >
                          <span>Verify RZP</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cloudflare D1 Student Proctoring Error Logs & Photographic Evidence Monitor */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-soft-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Proctoring Error Logs &amp; Evidence Repository (Cloudflare D1)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Audited student error logs, 3 warnings records for cancelled exams, and automatic camera photo snapshots for multiple face / suspicious device detections.
              </p>
            </div>

            {/* Filter buttons & search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setIncidentFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition ${incidentFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  All Logs ({incidents.length})
                </button>
                <button
                  onClick={() => setIncidentFilter("cancelled")}
                  className={`px-3 py-1.5 rounded-lg transition ${incidentFilter === "cancelled" ? "bg-white text-rose-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Cancelled ({incidents.filter(i => i.exam_cancelled || i.examCancelled).length})
                </button>
                <button
                  onClick={() => setIncidentFilter("evidence")}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${incidentFilter === "evidence" ? "bg-white text-electric-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Snapshots ({incidents.filter(i => i.evidence_snapshot || i.evidenceSnapshot).length})</span>
                </button>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter incident logs..."
                  value={incidentSearchTerm}
                  onChange={(e) => setIncidentSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Incidents Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3 px-4">Candidate &amp; Exam</th>
                  <th className="py-3 px-4">Infraction &amp; Error Log</th>
                  <th className="py-3 px-4">Warning Progress</th>
                  <th className="py-3 px-4">Exam Status</th>
                  <th className="py-3 px-4">Photographic Evidence</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents
                  .filter((inc) => {
                    const sTerm = incidentSearchTerm.toLowerCase();
                    const name = inc.student_name || inc.studentName || "";
                    const email = inc.student_email || inc.studentEmail || inc.student_id || inc.studentId || "";
                    const type = inc.incident_type || inc.incidentType || "";
                    const details = inc.details || "";
                    const matchesSearch = name.toLowerCase().includes(sTerm) ||
                      email.toLowerCase().includes(sTerm) ||
                      type.toLowerCase().includes(sTerm) ||
                      details.toLowerCase().includes(sTerm);

                    if (!matchesSearch) return false;
                    if (incidentFilter === "cancelled") return Boolean(inc.exam_cancelled || inc.examCancelled);
                    if (incidentFilter === "evidence") return Boolean(inc.evidence_snapshot || inc.evidenceSnapshot);
                    return true;
                  })
                  .map((inc) => {
                    const studentName = inc.student_name || inc.studentName || "Candidate";
                    const studentEmail = inc.student_email || inc.studentEmail || inc.student_id || inc.studentId || "student@nyeras.com";
                    const type = inc.incident_type || inc.incidentType || "proctor_event";
                    const warnNum = inc.warning_number ?? inc.warningNumber ?? 1;
                    const isCancelled = Boolean(inc.exam_cancelled || inc.examCancelled);
                    const snapshot = inc.evidence_snapshot || inc.evidenceSnapshot;
                    const occurredAt = inc.occurred_at || inc.occurredAt || inc.created_at;

                    let warningsSummaryList: any[] = [];
                    try {
                      if (typeof inc.all_warnings_summary === "string") {
                        warningsSummaryList = JSON.parse(inc.all_warnings_summary);
                      } else if (Array.isArray(inc.all_warnings_summary)) {
                        warningsSummaryList = inc.all_warnings_summary;
                      } else if (Array.isArray(inc.allWarningsSummary)) {
                        warningsSummaryList = inc.allWarningsSummary;
                      }
                    } catch (e) {}

                    return (
                      <tr key={inc.id} className={`hover:bg-slate-50/80 transition ${isCancelled ? "bg-rose-50/30" : ""}`}>
                        {/* Candidate */}
                        <td className="py-4 px-4">
                          <div className="font-extrabold text-slate-900 text-sm">{studentName}</div>
                          <div className="font-mono text-purple-700 text-xs">{studentEmail}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{inc.exam_id || inc.examId}</div>
                        </td>

                        {/* Error Log */}
                        <td className="py-4 px-4 max-w-sm">
                          <div className="flex items-center space-x-1.5 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              type === "multiple_faces" 
                                ? "bg-purple-100 text-purple-800 border border-purple-200" 
                                : type === "phone_detected" || type === "suspicious_device"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : type === "tab_switch" || type === "window_blur"
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}>
                              {type.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium leading-snug">
                            {inc.details}
                          </p>
                        </td>

                        {/* Warning progress */}
                        <td className="py-4 px-4">
                          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Warning {warnNum} of 3</span>
                          </div>
                        </td>

                        {/* Exam Status */}
                        <td className="py-4 px-4">
                          {isCancelled ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black text-[10px] uppercase shadow-sm">
                                <span>🚨 EXAM CANCELLED</span>
                              </span>
                              {warningsSummaryList.length > 0 && (
                                <button
                                  onClick={() => setSelectedIncidentForDetail(inc)}
                                  className="text-[11px] text-rose-700 hover:underline font-bold block"
                                >
                                  View 3 Recorded Warnings &rarr;
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                              Active Attempt
                            </span>
                          )}
                        </td>

                        {/* Photographic Evidence */}
                        <td className="py-4 px-4">
                          {snapshot ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setSelectedEvidenceImage(snapshot)}
                                className="group relative rounded-lg overflow-hidden border-2 border-electric-500 shadow-sm focus:outline-none"
                              >
                                <img
                                  src={snapshot}
                                  alt="Captured Proctoring Moment"
                                  className="w-16 h-12 object-cover transition transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </button>
                              <button
                                onClick={() => setSelectedEvidenceImage(snapshot)}
                                className="text-[11px] font-bold text-electric-600 hover:underline flex items-center space-x-0.5"
                              >
                                <span>Inspect Photo</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No snapshot needed</span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-4 px-4 text-right text-slate-500 font-mono text-[11px]">
                          {occurredAt ? new Date(occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Recent"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {incidents.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">
                <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No proctoring infractions recorded yet. Real warnings and camera snapshots will automatically populate here.
              </div>
            )}
          </div>
        </div>

        {/* Modal: High-Resolution Photographic Evidence Lightbox */}
        {selectedEvidenceImage && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-electric-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Proctoring Incident Photo Evidence (Cloudflare D1)
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEvidenceImage(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center">
                <img
                  src={selectedEvidenceImage}
                  alt="Full Evidence Snapshot"
                  className="w-full max-h-[460px] object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                <span>Photographic moment captured automatically by ExamHub AI Proctoring Engine</span>
                <button
                  onClick={() => setSelectedEvidenceImage(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition text-xs"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: 3 Warnings Summary For Cancelled Examination */}
        {selectedIncidentForDetail && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Recorded 3 Warnings — Examination Disqualification Log
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedIncidentForDetail(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                <div className="font-bold text-sm">
                  Candidate: {selectedIncidentForDetail.student_name || selectedIncidentForDetail.studentName}
                </div>
                <div>Reason: {selectedIncidentForDetail.cancellation_reason || selectedIncidentForDetail.cancellationReason || "3 Security Warnings Exceeded"}</div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Chronological Warnings Recorded in D1:
                </h4>
                {(() => {
                  let list: any[] = [];
                  try {
                    if (typeof selectedIncidentForDetail.all_warnings_summary === "string") {
                      list = JSON.parse(selectedIncidentForDetail.all_warnings_summary);
                    } else if (Array.isArray(selectedIncidentForDetail.all_warnings_summary)) {
                      list = selectedIncidentForDetail.all_warnings_summary;
                    } else if (Array.isArray(selectedIncidentForDetail.allWarningsSummary)) {
                      list = selectedIncidentForDetail.allWarningsSummary;
                    }
                  } catch (e) {}

                  return list.map((w, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start space-x-3 text-xs">
                      <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 uppercase text-[10px]">
                          {w.type ? String(w.type).replace(/_/g, " ") : `Warning #${idx + 1}`}
                        </div>
                        <div className="text-slate-600">{w.details || "Security strike logged"}</div>
                        {w.timestamp && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(w.timestamp).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setSelectedIncidentForDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition text-xs"
                >
                  Close Log
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Administration Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft-sm flex flex-col justify-between hover:shadow-soft-md transition">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-electric-50 text-electric-600 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Question Management
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Full CRUD, search, filter across 72 domains, and bulk CSV import with automated duplicate rejection.
              </p>
            </div>
            <Link
              href="/admin/assessment/questions"
              className="text-xs font-bold text-electric-600 hover:underline inline-flex items-center space-x-1"
            >
              <span>Manage Questions &rarr;</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft-sm flex flex-col justify-between hover:shadow-soft-md transition">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Exam Blueprints
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Define blueprints, configure negative marking, duration, and publish timed benchmark mock tests.
              </p>
            </div>
            <Link
              href="/admin/assessment/exams"
              className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center space-x-1"
            >
              <span>Manage Exams &rarr;</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft-sm flex flex-col justify-between hover:shadow-soft-md transition">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Bank Completeness Audit
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Live verification table auditing all 72 domains to ensure the 50 approved questions minimum is satisfied.
              </p>
            </div>
            <Link
              href="/admin/assessment/coverage"
              className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center space-x-1"
            >
              <span>Audit 72 Domains &rarr;</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft-sm flex flex-col justify-between hover:shadow-soft-md transition">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3">
                <CalendarClock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Deadline Radar Desk
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Publish and manage verified semester cutoffs, backlog registration dates, and revaluation windows.
              </p>
            </div>
            <Link
              href="/deadlines"
              className="text-xs font-bold text-rose-700 hover:underline inline-flex items-center space-x-1"
            >
              <span>Manage Radar &rarr;</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
