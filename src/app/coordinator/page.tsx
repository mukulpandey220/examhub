"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Award, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  GraduationCap, 
  Calendar,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Cpu
} from "lucide-react";

interface StudentCohortRecord {
  id: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  examTitle: string;
  score: number;
  maxScore: number;
  percentile: number;
  status: "completed" | "in_progress" | "scheduled";
  certificateId?: string;
}

const MOCK_COHORT_STUDENTS: StudentCohortRecord[] = [
  {
    id: "stud-01",
    name: "Ramkumar Malothu",
    email: "ramkumar.malothu@nyeras.com",
    department: "Computer Science & Engineering",
    semester: 7,
    examTitle: ".NET Core & Cloud Architecture National Benchmark",
    score: 48,
    maxScore: 50,
    percentile: 99.4,
    status: "completed",
    certificateId: "NYE-2026-NXT-94821",
  },
  {
    id: "stud-02",
    name: "Pooja Hegde",
    email: "pooja.hegde@bmsce.ac.in",
    department: "Information Science & Engineering",
    semester: 7,
    examTitle: "DSA & System Design Advanced Benchmark",
    score: 46,
    maxScore: 50,
    percentile: 98.1,
    status: "completed",
    certificateId: "NYE-2026-NXT-88124",
  },
  {
    id: "stud-03",
    name: "Karthik Verma",
    email: "karthik.v@bmsce.ac.in",
    department: "Electronics & Communication",
    semester: 7,
    examTitle: "VLSI Design & Digital Electronics Benchmark",
    score: 43,
    maxScore: 50,
    percentile: 95.8,
    status: "completed",
    certificateId: "NYE-2026-NXT-77210",
  },
  {
    id: "stud-04",
    name: "Ananya Deshmukh",
    email: "ananya.d@bmsce.ac.in",
    department: "Computer Science & Engineering",
    semester: 7,
    examTitle: "Full-Stack Web Architecture & APIs Benchmark",
    score: 41,
    maxScore: 50,
    percentile: 93.4,
    status: "completed",
    certificateId: "NYE-2026-NXT-66109",
  },
  {
    id: "stud-05",
    name: "Siddharth Rao",
    email: "siddharth.rao@bmsce.ac.in",
    department: "Mechanical Engineering",
    semester: 7,
    examTitle: "Machine Design & FEA Benchmark",
    score: 39,
    maxScore: 50,
    percentile: 88.9,
    status: "completed",
    certificateId: "NYE-2026-NXT-55091",
  },
];

export default function CoordinatorDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");

  const filteredStudents = MOCK_COHORT_STUDENTS.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "all" || s.department.toLowerCase().includes(selectedDept.toLowerCase());
    return matchesSearch && matchesDept;
  });

  const handleExportCSV = () => {
    const headers = ["Student ID", "Name", "Email", "Department", "Semester", "Exam Title", "Score", "Max Score", "Percentile", "Status", "Certificate ID"];
    const rows = filteredStudents.map(s => [
      s.id,
      `"${s.name}"`,
      s.email,
      `"${s.department}"`,
      s.semester,
      `"${s.examTitle}"`,
      s.score,
      s.maxScore,
      s.percentile,
      s.status,
      s.certificateId || "N/A"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bmsce_nxtmove_benchmarking_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 subtle-grid">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Coordinator Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200 font-mono">
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              <span>INSTITUTION COORDINATOR PORTAL • ZERO COST MODEL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              B.M.S. College of Engineering, Bengaluru
            </h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span>Affiliation: Visvesvaraya Technological University (VTU)</span>
              <span>•</span>
              <span>SPOC: Dr. K. R. Suresh (Dean / TPO)</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-soft-sm transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export TPO Assessment CSV</span>
            </button>
          </div>
        </div>

        {/* 4 High-Level Impact Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 font-mono uppercase">Enrolled Cohort</span>
              <Users className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">650</div>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Student Capacity Verified</span>
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 font-mono uppercase">Completion Rate</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-700 font-mono">89.5%</div>
            <p className="text-[11px] text-slate-500">582 of 650 written under lockdown</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 font-mono uppercase">National Benchmark</span>
              <BarChart3 className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-3xl font-black text-brand-600 font-mono">+7.4%</div>
            <p className="text-[11px] text-emerald-600 font-semibold">Above Pan-India Engineering Average</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 font-mono uppercase">Top 5% Rankers</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-600 font-mono">38</div>
            <p className="text-[11px] text-amber-700 font-semibold">Eligible for 100% Full Scholarships</p>
          </div>
        </div>

        {/* Tripartite Section Performance Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">Section A (25%)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-700 text-[11px] font-bold font-mono">Avg: 81.2%</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Analytical Aptitude</h4>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-brand-600 h-2.5 rounded-full" style={{ width: "81.2%" }} />
            </div>
            <p className="text-[11px] text-slate-500">Strong mathematical and logical reasoning proficiency across all branches.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border-2 border-brand-500 shadow-soft-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-brand-600 uppercase">Section B (50%)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[11px] font-bold font-mono">Avg: 77.8%</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Domain Technical Core</h4>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-brand-600 h-2.5 rounded-full" style={{ width: "77.8%" }} />
            </div>
            <p className="text-[11px] text-slate-500">Core discipline mastery in DSA, Cloud Architecture, VLSI, and Systems.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">Section C (25%)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold font-mono">Avg: 84.6%</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Workplace Readiness</h4>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: "84.6%" }} />
            </div>
            <p className="text-[11px] text-slate-500">High corporate situational readiness and workplace compliance awareness.</p>
          </div>
        </div>

        {/* Student Cohort Roster & Diagnostic Registry */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft-sm overflow-hidden space-y-4 p-6 sm:p-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Verified Student Assessment Roster
              </h3>
              <p className="text-xs text-slate-500">
                Official scores, national percentiles, and verified credential certificates.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="all">All Departments</option>
                <option value="computer science">Computer Science</option>
                <option value="information science">Information Science</option>
                <option value="electronics">Electronics</option>
                <option value="mechanical">Mechanical</option>
              </select>
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-mono">
                  <th className="py-3 px-4 font-bold">Candidate</th>
                  <th className="py-3 px-4 font-bold">Department</th>
                  <th className="py-3 px-4 font-bold">Benchmark Exam</th>
                  <th className="py-3 px-4 font-bold text-center">Score</th>
                  <th className="py-3 px-4 font-bold text-center">Percentile</th>
                  <th className="py-3 px-4 font-bold text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="font-bold">{student.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{student.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{student.department}</div>
                      <div className="text-[10px] text-slate-400">Semester {student.semester}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium max-w-xs truncate">
                      {student.examTitle}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                      {student.score} / {student.maxScore}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black font-mono bg-brand-50 text-brand-700 border border-brand-200">
                        {student.percentile}%ile
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {student.certificateId ? (
                        <Link
                          href={`/verify/${student.certificateId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800 transition"
                        >
                          <span>{student.certificateId}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Pending</span>
                      )}
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
