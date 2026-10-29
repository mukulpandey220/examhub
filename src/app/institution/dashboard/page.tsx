"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  BarChart3, 
  Trophy, 
  Users, 
  Award, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  TrendingUp, 
  GraduationCap, 
  FileSpreadsheet, 
  FileText,
  ShieldCheck,
  ExternalLink
} from "lucide-react";

export default function InstitutionalDashboardPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"diagnostics" | "shortlist" | "naac">("diagnostics");
  const [searchQuery, setSearchQuery] = useState("");
  const [dossierDownloaded, setDossierDownloaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/institution/lead");
        const data = await res.json();
        setDiagnostics(data.diagnostics);
      } catch (err) {
        console.error("Failed to load institutional diagnostics", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const candidates = [
    { id: "cand-01", name: "Ramkumar Malothu", email: "ramkumar.malothu@nyeras.com", branch: "Computer Science", domain: "DSA & System Design", score: 48.5, percentile: 99.2, status: "Placement Ready", topRanker: true },
    { id: "cand-02", name: "Priya Nair", email: "priya.nair@iitb.ac.in", branch: "Computer Science", domain: "Generative AI & LLM", score: 48.0, percentile: 98.8, status: "Placement Ready", topRanker: true },
    { id: "cand-03", name: "Arjun Sharma", email: "student@campusradar.edu.in", branch: "Information Technology", domain: ".NET & C#", score: 46.75, percentile: 96.5, status: "Placement Ready", topRanker: true },
    { id: "cand-04", name: "Vikram Varma", email: "vikram.v@nitk.edu.in", branch: "ECE", domain: "VLSI Design", score: 45.0, percentile: 94.0, status: "Placement Ready", topRanker: false },
    { id: "cand-05", name: "Sneha Reddy", email: "sneha.reddy@iiit.ac.in", branch: "Computer Science", domain: "Cloud & DevOps", score: 44.5, percentile: 92.8, status: "Placement Ready", topRanker: false },
    { id: "cand-06", name: "Ananya Iyer", email: "ananya.iyer@annauniv.edu", branch: "Management / MBA", domain: "Finance & Banking", score: 43.5, percentile: 90.5, status: "Placement Ready", topRanker: false },
    { id: "cand-07", name: "Kunal Deshmukh", email: "kunal.d@vtu.ac.in", branch: "Mechanical", domain: "Machine Design", score: 41.5, percentile: 87.0, status: "Eligible for Bridge Course", topRanker: false },
  ];

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownloadDossier = () => {
    setDossierDownloaded(true);
    setTimeout(() => setDossierDownloaded(false), 4000);
  };

  return (
    <div className="flex-1 bg-slate-50 py-10 sm:py-14 subtle-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Link href="/institution" className="hover:text-electric-500 transition">
            Institutional Portal
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-900">College Management &amp; Analytics Console</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-electric-600 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-electric-500" />
              <span>Nyeras Nxtmove • Academic Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              College Cohort Diagnostics &amp; Compliance Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Official institutional dashboard for Principals, Deans, HODs, and Training &amp; Placement Officers (TPOs) to track student domain readiness, branch heatmaps, and accreditation dossiers.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleDownloadDossier}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs shadow-soft-sm transition flex items-center space-x-2"
            >
              <Download className="w-4 h-4 text-electric-500" />
              <span>{dossierDownloaded ? "Dossier Exported!" : "Export NAAC / NBA Dossier"}</span>
            </button>
            <Link
              href="/institution#partner-form"
              className="px-4 py-2.5 rounded-xl bg-electric-500 hover:bg-electric-600 text-white font-bold text-xs shadow-electric transition"
            >
              Schedule New Cohort
            </Link>
          </div>
        </div>

        {/* Institutional Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Assessed Students</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">1,130</div>
            <div className="text-xs text-emerald-600 font-medium">92.4% Cohort Completion</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">College Avg Score</div>
            <div className="text-2xl sm:text-3xl font-black text-electric-600 font-mono">74.2%</div>
            <div className="text-xs text-slate-500 font-medium">vs 63.8% National Benchmark</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Placement Shortlist</div>
            <div className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">348</div>
            <div className="text-xs text-purple-600 font-medium">Pre-Vetted Recruiter Ready</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Accreditation Dossier</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">Verified</div>
            <div className="text-xs text-emerald-700 font-medium">NAAC Criterion 5 Compliant</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 space-x-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`pb-3 px-2 transition border-b-2 ${
              activeTab === "diagnostics"
                ? "border-electric-500 text-electric-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Departmental Cohort Diagnostics &amp; Peer Matrix
          </button>
          <button
            onClick={() => setActiveTab("shortlist")}
            className={`pb-3 px-2 transition border-b-2 ${
              activeTab === "shortlist"
                ? "border-electric-500 text-electric-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Placement Shortlist Candidates ({candidates.length})
          </button>
          <button
            onClick={() => setActiveTab("naac")}
            className={`pb-3 px-2 transition border-b-2 ${
              activeTab === "naac"
                ? "border-electric-500 text-electric-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            NAAC, NBA &amp; Institutional Honors
          </button>
        </div>

        {/* TAB 1: Departmental Cohort Diagnostics & Peer Matrix */}
        {activeTab === "diagnostics" && (
          <div className="space-y-8">
            
            {/* Branch Heatmap Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Branch-Wise Cohort Diagnostics</h3>
                  <p className="text-xs text-slate-500">Department score distributions and identified curriculum deficit topics.</p>
                </div>
                <span className="text-xs font-bold text-electric-600 bg-electric-50 px-3 py-1 rounded-full border border-electric-100">
                  6 Departments Benchmarked
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                    <tr>
                      <th className="p-4">Department / Branch</th>
                      <th className="p-4">Cohort Size</th>
                      <th className="p-4">Avg Score</th>
                      <th className="p-4">National Percentile</th>
                      <th className="p-4">Identified Skill Deficit Area</th>
                      <th className="p-4">Readiness Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(diagnostics?.branchHeatmap || []).map((row: any) => (
                      <tr key={row.branch} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">{row.branch}</td>
                        <td className="p-4 font-mono text-slate-600">{row.cohortSize} students</td>
                        <td className="p-4 font-mono font-bold text-electric-600">{row.avgScore}%</td>
                        <td className="p-4 font-mono">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                            {row.nationalPercentile}th Percentile
                          </span>
                        </td>
                        <td className="p-4 text-slate-600">{row.skillDeficit}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            row.readiness === "High"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {row.readiness} Readiness
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Peer Comparison Matrix */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">National Comparison Matrix</h3>
                  <p className="text-xs text-slate-500">Benchmark against regional peer engineering and management campuses.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                    <tr>
                      <th className="p-4">Institution Name</th>
                      <th className="p-4">National Rank</th>
                      <th className="p-4">Overall Percentile</th>
                      <th className="p-4">Analytical Aptitude (25%)</th>
                      <th className="p-4">Technical Core (50%)</th>
                      <th className="p-4">Workplace Readiness (25%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(diagnostics?.peerComparisonMatrix || []).map((peer: any, idx: number) => (
                      <tr key={peer.collegeName} className={idx === 0 ? "bg-electric-50/40" : ""}>
                        <td className="p-4 font-bold text-slate-900 flex items-center space-x-2">
                          {idx === 0 && <span className="w-2 h-2 rounded-full bg-electric-500"></span>}
                          <span>{peer.collegeName}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-800">#{peer.rank}</td>
                        <td className="p-4 font-mono font-bold text-electric-600">{peer.percentile}th</td>
                        <td className="p-4 font-mono text-slate-600">{peer.avgAptitude}%</td>
                        <td className="p-4 font-mono text-slate-600">{peer.avgTechnical}%</td>
                        <td className="p-4 font-mono text-slate-600">{peer.avgWorkplace}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Placement Shortlist Ready */}
        {activeTab === "shortlist" && (
          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by candidate, branch, or domain..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-500"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
                <span>Showing {filteredCandidates.length} high-potential pre-vetted candidates</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                    <tr>
                      <th className="p-4">Candidate Name</th>
                      <th className="p-4">Branch</th>
                      <th className="p-4">Assessed Domain</th>
                      <th className="p-4">Marks Obtained</th>
                      <th className="p-4">All-India Percentile</th>
                      <th className="p-4">Status &amp; Recognition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.map((cand) => (
                      <tr key={cand.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{cand.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{cand.email}</div>
                        </td>
                        <td className="p-4 text-slate-600">{cand.branch}</td>
                        <td className="p-4 font-medium text-slate-800">{cand.domain}</td>
                        <td className="p-4 font-mono font-bold text-slate-900">{cand.score} / 50</td>
                        <td className="p-4 font-mono font-extrabold text-electric-600">
                          {cand.percentile}th Percentile
                        </td>
                        <td className="p-4">
                          {cand.topRanker ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center space-x-1 w-max">
                              <Trophy className="w-3 h-3 text-amber-600" />
                              <span>Top Ranker • Full Scholarship</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center space-x-1 w-max">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{cand.status}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: NAAC, NBA & Institutional Honors */}
        {activeTab === "naac" && (
          <div className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Criterion 5 Card */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-soft-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                    Criterion 5: Student Progression
                  </span>
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  National Competitive Examination Qualification
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Documented proof of students participating and qualifying in competitive national benchmark examinations. Provides quantitative audit trails required by NAAC Peer Teams.
                </p>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Participating Students:</span>
                    <span className="font-bold text-slate-800">1,130 Students</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Qualifying Percentage:</span>
                    <span className="font-bold text-emerald-600">86.4% Qualified</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Audit Status:</span>
                    <span className="font-bold text-emerald-600">Verified by Nyeras</span>
                  </div>
                </div>
              </div>

              {/* Criteria 1 & 2 Card */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-soft-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-electric-100 text-electric-800 text-xs font-bold font-mono">
                    Criteria 1 &amp; 2: Teaching &amp; Evaluation
                  </span>
                  <BarChart3 className="w-5 h-5 text-electric-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Third-Party Learning Outcome Measurement
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Independent diagnostic capability assessments measuring actual domain mastery against university syllabus and identified curriculum deficit areas.
                </p>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Domain Accuracy:</span>
                    <span className="font-bold text-slate-800">92.8% Assessment Fidelity</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Curriculum Gap Reports:</span>
                    <span className="font-bold text-electric-600">6 Department Dossiers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cost to Institution:</span>
                    <span className="font-bold text-emerald-600">₹0 (Zero Cost)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Honors & College Awards Box */}
            <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-electric-950 text-white space-y-6">
              <div className="max-w-2xl space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>NATIONAL HONORS &amp; CITATIONS</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  National Academic Excellence Citation &amp; Trophy
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Colleges producing top percentile rankers in the Nyeras Nxtmove National Assessment receive the official framed trophy &amp; certificate awarded to the Principal, alongside the Distinguished Career Mentorship Award conferred on the Faculty SPOC / TPO.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="font-bold text-white block">Official Framed Trophy</span>
                  <span className="text-[11px] text-slate-400">Awarded to College Principal</span>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="font-bold text-white block">Mentorship Award</span>
                  <span className="text-[11px] text-slate-400">Conferred on Faculty SPOC/TPO</span>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="font-bold text-white block">Pan-India Press Release</span>
                  <span className="text-[11px] text-slate-400">Featured in National Rankings</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
