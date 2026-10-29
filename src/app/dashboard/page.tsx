"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  Play, 
  CalendarClock, 
  CreditCard, 
  BookOpen, 
  Award, 
  ArrowRight, 
  Layers, 
  ChevronRight,
  ShieldCheck, 
  ExternalLink,
  PlusCircle,
  Search,
  Check,
  Trophy,
  Lock,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Receipt,
  Plus,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { DOMAINS } from "@/data/domains";
import { INITIAL_EXAMS } from "@/data/exams";
import { CATEGORIES } from "@/data/categories";
import { categoryIcon } from "@/lib/category-icons";
import { TokenTransaction } from "@/types";
import { executeAutomatedRazorpayPayment } from "@/lib/razorpay";

export default function StudentDashboardPage() {
  const [user, setUser] = useState<any>({
    id: "user-student-ramkumar",
    name: "Ramkumar Malothu",
    email: "ramkumar.malothu@nyeras.com",
    university: "Nyeras Institute of Technology",
    courseDegree: "B.Tech Computer Science & Engineering",
    branch: "Computer Science",
    semester: 7,
    domainSlug: "dsa-system-design",
    selectedDifficulty: "intermediate",
    preferredMode: "timed",
    onboarded: true,
    optedExams: ["exam-dsa-system-design-mock-01", "exam-dotnet-mock-01"],
    tokens: 100,
    unlockedExams: ["exam-dsa-system-design-mock-01", "exam-dotnet-mock-01"]
  });

  const [userTokens, setUserTokens] = useState<number>(100);
  const [unlockedExamIds, setUnlockedExamIds] = useState<string[]>([
    "exam-dsa-system-design-mock-01", 
    "exam-dotnet-mock-01"
  ]);
  const [tokenTransactions, setTokenTransactions] = useState<TokenTransaction[]>([]);

  const [entitlements, setEntitlements] = useState<any[]>([
    {
      id: "ent-ramkumar-01",
      userId: "user-student-ramkumar",
      tier: "semester",
      startsAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
      paymentRef: "pay_razorpay_CkGK3Dv",
      status: "active",
    }
  ]);

  const [optedExamIds, setOptedExamIds] = useState<string[]>([
    "exam-dsa-system-design-mock-01", 
    "exam-dotnet-mock-01"
  ]);

  const [activeTab, setActiveTab] = useState<"opted" | "browse" | "ledger">("opted");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isOpting, setIsOpting] = useState<string | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState<string>("");
  const [paymentMessage, setPaymentMessage] = useState<string>("");
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);

  // Top Up Modal State
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [selectedTopUpTokens, setSelectedTopUpTokens] = useState<number>(99);
  const [customTokenInput, setCustomTokenInput] = useState<string>("");
  const [topUpLoading, setTopUpLoading] = useState<boolean>(false);
  const [topUpMessage, setTopUpMessage] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("campus_radar_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          if (parsed.tokens !== undefined) setUserTokens(parsed.tokens);
          if (parsed.optedExams) setOptedExamIds(parsed.optedExams);
          if (parsed.unlockedExams) setUnlockedExamIds(parsed.unlockedExams);
        } catch (e) {}
      }
    }

    async function loadData() {
      try {
        const res = await fetch(`/api/auth?userId=${user.id || "user-student-ramkumar"}`);
        const data = await res.json();
        if (data.profile) {
          setUser(data.profile);
          if (data.profile.optedExams) {
            setOptedExamIds(data.profile.optedExams);
          }
        }
        if (data.tokens !== undefined) {
          setUserTokens(data.tokens);
        }
        if (data.unlockedExams) {
          setUnlockedExamIds(data.unlockedExams);
        }
        if (data.tokenTransactions) {
          setTokenTransactions(data.tokenTransactions);
        }
        if (data.entitlements) {
          setEntitlements(data.entitlements);
        }
      } catch (err) {}
    }
    loadData();
  }, [user.id]);

  const handleToggleOptIn = async (examId: string) => {
    setIsOpting(examId);
    const isCurrentlyOpted = optedExamIds.includes(examId);
    const action = isCurrentlyOpted ? "opt_out_exam" : "opt_in_exam";

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          userId: user.id || "user-student-ramkumar",
          examId
        })
      });
      const data = await res.json();
      if (data.optedExams) {
        setOptedExamIds(data.optedExams);
        const updatedUser = { ...user, optedExams: data.optedExams };
        setUser(updatedUser);
        if (typeof window !== "undefined") {
          localStorage.setItem("campus_radar_user", JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOpting(null);
    }
  };

  const handleAutoSyncPayment = async () => {
    setPaymentLoading(true);
    setPaymentMessage("");

    try {
      // 1. Fetch latest state from server
      const res = await fetch(`/api/auth?userId=${user.id || "user-student-ramkumar"}`);
      const data = await res.json();
      if (data.tokens !== undefined) setUserTokens(data.tokens);
      if (data.unlockedExams) setUnlockedExamIds(data.unlockedExams);
      if (data.tokenTransactions) setTokenTransactions(data.tokenTransactions);
      if (data.entitlements) setEntitlements(data.entitlements);

      const statusRes = await fetch("/api/checkout/payment-status");
      const statusData = await statusRes.json();
      if (statusData.paid) {
        const refresh = await fetch(`/api/auth?userId=${user.id || "user-student-ramkumar"}`);
        const refreshed = await refresh.json();
        if (refreshed.tokens !== undefined) setUserTokens(refreshed.tokens);
        if (refreshed.unlockedExams) setUnlockedExamIds(refreshed.unlockedExams);
        if (refreshed.tokenTransactions) setTokenTransactions(refreshed.tokenTransactions);
        if (refreshed.entitlements) setEntitlements(refreshed.entitlements);
        setPaymentMessage(statusData.message || "Payment verified.");
      } else {
        setPaymentMessage(statusData.message || "No verified payment yet. Access has not been granted.");
      }
    } catch (err: any) {
      setPaymentMessage("Failed to sync status. Please check your connection.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleQuickPayNtcra = () => {
    setPaymentLoading(true);
    setPaymentMessage("");

    executeAutomatedRazorpayPayment({
      amountRupees: 99,
      tokenCount: 99,
      userId: user.id || "user-student-ramkumar",
      userName: user.name || "Ramkumar Malothu",
      userEmail: user.email || "ramkumar.malothu@nyeras.com",
      description: "NTCRA Pass: Full Access + 99 Tokens (₹1 = 1 Token)",
      onSuccess: (result) => {
        setPaymentLoading(false);
        setUserTokens(result.tokenBalance);
        if (result.transaction) {
          setTokenTransactions(prev => [result.transaction, ...prev]);
        }
        setPaymentMessage(result.message || "No payment was required.");
      },
      onError: (err) => {
        setPaymentLoading(false);
        setPaymentMessage(err || "Payment could not be processed.");
      },
      onDismiss: () => {
        setPaymentLoading(false);
      }
    });
  };

  // Launch Razorpay Checkout for Buying Tokens (1 Rs = 1 Token)
  const handlePurchaseTokens = async () => {
    setTopUpLoading(true);
    setTopUpMessage("Opening the ₹99 Razorpay page. Tokens are added only after payment is verified.");

    try {
      await executeAutomatedRazorpayPayment({
        userId: user.id || "user-student-ramkumar",
        userName: user.name || "Ramkumar Malothu",
        userEmail: user.email || "ramkumar.malothu@nyeras.com",
        description: "NTCRA Pass: Full Access + 99 Tokens (₹1 = 1 Token)",
        onError: (err) => {
          setTopUpLoading(false);
          setTopUpMessage(err || "Could not open the Razorpay payment page.");
        },
      });
    } catch (err: any) {
      setTopUpMessage(err.message || "Could not open the Razorpay payment page.");
      setTopUpLoading(false);
    }
  };

  const activeEntitlement = entitlements[0];

  const filteredExams = INITIAL_EXAMS.filter(exam => {
    const matchesCategory = selectedCategory === "all" || exam.categoryCode === selectedCategory;
    const matchesQuery = 
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const optedExamsList = INITIAL_EXAMS.filter(exam => optedExamIds.includes(exam.id));

  const firstName = String(user.name || "Student").split(" ")[0];
  const planLabel = activeEntitlement
    ? `${String(activeEntitlement.tier).replace("_", " ")} pass`
    : "Free plan";

  const tabs: { id: "opted" | "browse" | "ledger"; label: string }[] = [
    { id: "opted", label: `My exams (${optedExamIds.length})` },
    { id: "browse", label: "Browse all" },
    { id: "ledger", label: "Token ledger" },
  ];

  return (
    <div className="flex-1 py-8 sm:py-10">
      <div className="page-container space-y-6">

        {/* Account summary: identity, primary actions, then balance / plan / exam count */}
        <section className="card p-5 sm:p-7" aria-label="Account summary">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-electric-500 text-xl font-semibold text-white">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  Welcome back, {firstName}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
                  <GraduationCap className="h-4 w-4 text-slate-400" />
                  <span>{user.university || "Nyeras Institute of Technology"}</span>
                  <span className="sm:before:mr-2 sm:before:text-slate-300 sm:before:content-['·']">
                    Semester {user.semester || 7}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
              <button
                type="button"
                disabled={paymentLoading}
                onClick={handleQuickPayNtcra}
                className="btn btn-primary"
              >
                <Lock className="h-4 w-4" />
                {paymentLoading ? "Processing…" : "Quick pay ₹99"}
              </button>
              <Link href="/leaderboard" className="btn btn-secondary">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Link>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 divide-y divide-slate-200 border-t border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="py-4 sm:pr-6">
              <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Coins className="h-4 w-4" />
                Tokens
              </dt>
              <dd className="mt-2 flex items-center justify-between gap-3">
                <span className="num text-2xl font-semibold text-slate-900">{userTokens}</span>
                <button type="button" onClick={() => setShowTopUpModal(true)} className="btn btn-secondary btn-sm">
                  <Plus className="h-3.5 w-3.5" />
                  Top up
                </button>
              </dd>
            </div>

            <div className="py-4 sm:px-6">
              <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <CreditCard className="h-4 w-4" />
                Plan
              </dt>
              <dd className="mt-2 flex items-center justify-between gap-3">
                <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5">
                  <span className="text-base font-semibold capitalize text-slate-900">{planLabel}</span>
                  {activeEntitlement && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  disabled={paymentLoading}
                  onClick={handleAutoSyncPayment}
                  title="Sync payment status"
                  aria-label="Sync payment status"
                  className="btn btn-secondary btn-sm shrink-0"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${paymentLoading ? "animate-spin" : ""}`} />
                  Sync
                </button>
              </dd>
            </div>

            <div className="py-4 sm:pl-6">
              <dt className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <BookOpen className="h-4 w-4" />
                My exams
              </dt>
              <dd className="mt-2 flex items-center justify-between gap-3">
                <span className="num text-2xl font-semibold text-slate-900">{optedExamIds.length}</span>
                <button type="button" onClick={() => setActiveTab("browse")} className="btn btn-secondary btn-sm">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add
                </button>
              </dd>
            </div>
          </dl>

          {paymentMessage && (
            <div
              role="status"
              className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700"
            >
              {paymentMessage}
            </div>
          )}
        </section>

        {/* Exams */}
        <div className="space-y-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Your exams</h2>

            <div className="seg self-start">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-active={activeTab === tab.id}
                  aria-pressed={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="seg-item"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: MY EXAMS */}
          {activeTab === "opted" && (
            <div>
              {optedExamsList.length === 0 ? (
                <div className="space-y-4 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">No exams yet</h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                      Browse the 72 domains and add the exams you want to take.
                    </p>
                  </div>
                  <button type="button" onClick={() => setActiveTab("browse")} className="btn btn-primary btn-sm">
                    Browse exams
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {optedExamsList.map((exam) => {
                    const fee = exam.feeRupees ?? exam.tokenFee ?? 99;
                    const isFree = exam.isFreeSample || fee === 0;
                    const isUnlocked = unlockedExamIds.includes(exam.id) || isFree;
                    const Icon = categoryIcon(exam.categoryCode);
                    const hasPenalty = exam.negativeMarkingPerWrong > 0;
                    const figures: [React.ReactNode, string, boolean?][] = [
                      [exam.durationMinutes, "min"],
                      [exam.questionCount, "questions"],
                      [exam.totalMarks, "marks"],
                      ...(hasPenalty ? [[`−${exam.negativeMarkingPerWrong}`, "per wrong", true] as [React.ReactNode, string, boolean]] : []),
                    ];

                    return (
                      <article key={exam.id} className="glass-flat flex flex-col p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <span className="tile h-7 w-7 !rounded-lg">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            {exam.categoryName.split(" ")[0]}
                          </span>

                          {isUnlocked ? (
                            <span className="badge badge-green">
                              <CheckCircle2 className="h-3 w-3" />
                              {isFree ? "Free" : "Unlocked"}
                            </span>
                          ) : (
                            <span className="badge badge-slate">
                              <Lock className="h-3 w-3" />
                              Locked
                            </span>
                          )}
                        </div>

                        <h3 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-slate-900">
                          {exam.title.replace(/\s*\(NTCRA\)\s*$/i, "")}
                        </h3>

                        <dl
                          className={`mt-4 grid gap-2 border-y border-slate-200 py-4 text-center ${
                            hasPenalty ? "grid-cols-4" : "grid-cols-3"
                          }`}
                        >
                          {figures.map(([value, label, negative]) => (
                            <div key={label}>
                              <dd className={`num text-xl font-semibold ${negative ? "text-rose-600" : "text-slate-900"}`}>
                                {value}
                              </dd>
                              <dt className="mt-0.5 text-xs text-slate-500">{label}</dt>
                            </div>
                          ))}
                        </dl>

                        <div className="mt-auto flex items-center gap-2 pt-5">
                          <Link href={`/assessments/exams/${exam.id}`} className="btn btn-primary flex-1">
                            <Play className="h-4 w-4 fill-current" />
                            {isUnlocked ? "Start exam" : `Unlock · ₹${fee}`}
                          </Link>
                          <button
                            type="button"
                            disabled={isOpting === exam.id}
                            onClick={() => handleToggleOptIn(exam.id)}
                            className="btn btn-secondary"
                          >
                            {isOpting === exam.id ? "Updating…" : "Remove"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BROWSE */}
          {activeTab === "browse" && (
            <div className="space-y-5">
              <div className="glass space-y-4 p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search exams"
                      aria-label="Search exams"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                  <span className="shrink-0 text-sm text-slate-500">{filteredExams.length} exams</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`chip ${selectedCategory === "all" ? "btn-primary" : "btn-secondary"}`}
                  >
                    All
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.code}
                      type="button"
                      onClick={() => setSelectedCategory(cat.code)}
                      className={`chip ${selectedCategory === cat.code ? "btn-primary" : "btn-secondary"}`}
                    >
                      {cat.shortName}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end border-t border-slate-200/70 pt-3">
                  <Link
                    href={selectedCategory === "all" ? "/assessments/exams" : `/assessments/exams?category=${selectedCategory}`}
                    className="group inline-flex items-center gap-1 text-sm font-semibold text-electric-600 hover:text-electric-700"
                  >
                    Open full catalog
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredExams.slice(0, 30).map((exam) => {
                  const isOpted = optedExamIds.includes(exam.id);
                  const fee = exam.feeRupees ?? exam.tokenFee ?? 99;

                  return (
                    <div
                      key={exam.id}
                      className={`glass-flat flex flex-col justify-between gap-4 p-5 ${
                        isOpted ? "ring-1 ring-electric-500/50" : ""
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="badge badge-slate max-w-[70%] truncate">{exam.domainName}</span>
                          <span className="badge badge-amber">{fee === 0 ? "Free" : `₹${fee}`}</span>
                        </div>
                        <h3 className="font-display text-base font-semibold leading-snug tracking-tight text-slate-900">
                          {exam.title.replace(/\s*\(NTCRA\)\s*$/i, "")}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{exam.durationMinutes} min</span>
                          <span>{exam.questionCount} questions</span>
                          <span>{exam.totalMarks} marks</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 border-t border-slate-200/70 pt-4">
                        {isOpted ? (
                          <>
                            <Link href={`/assessments/exams/${exam.id}`} className="btn btn-primary btn-sm flex-1">
                              Attempt exam
                            </Link>
                            <button
                              type="button"
                              disabled={isOpting === exam.id}
                              onClick={() => handleToggleOptIn(exam.id)}
                              className="btn btn-secondary btn-sm"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={isOpting === exam.id}
                            onClick={() => handleToggleOptIn(exam.id)}
                            className="btn btn-secondary btn-sm w-full hover:!border-electric-400 hover:!text-electric-600"
                          >
                            <PlusCircle className="h-4 w-4" />
                            {isOpting === exam.id ? "Saving…" : "Add to my exams"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: TOKEN LEDGER */}
          {activeTab === "ledger" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm sm:p-6">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Token ledger</h3>
                  <p className="text-sm text-slate-500">Credits from payments and debits for exam unlocks.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(true)}
                  className="btn btn-primary btn-sm self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  Top up
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {tokenTransactions.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400">No transactions yet.</div>
                ) : (
                  tokenTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between gap-4 py-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`rounded-xl p-2 ${
                            tx.type === "credit" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {tx.type === "credit" ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-900">{tx.description}</div>
                          <div className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div
                          className={`text-sm font-semibold ${
                            tx.type === "credit" ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {tx.type === "credit" ? `+${tx.amount}` : `−${tx.amount}`}
                        </div>
                        <div className="text-xs text-slate-500">₹{tx.rupees}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top-up modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md animate-scale-in space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Coins className="h-5 w-5 text-amber-500" />
                Top up tokens
              </h3>
              <p className="text-sm text-slate-500">₹1 = 1 token. Tokens work for any exam.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Choose an amount</label>
              <div className="grid grid-cols-4 gap-2">
                {[50, 99, 150, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedTopUpTokens(amt);
                      setCustomTokenInput("");
                    }}
                    className={`rounded-xl border py-2.5 text-sm font-semibold ${
                      selectedTopUpTokens === amt && !customTokenInput
                        ? "border-electric-500 bg-electric-500 text-white shadow-electric"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-electric-300 hover:bg-white"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Or enter a custom amount</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  placeholder="e.g. 199"
                  value={customTokenInput}
                  onChange={(e) => setCustomTokenInput(e.target.value)}
                  className="input"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  = ₹{customTokenInput || selectedTopUpTokens}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Tokens after verified payment</span>
                <span className="font-semibold text-electric-600">+99</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Razorpay page</span>
                <span className="font-semibold text-slate-900">₹99</span>
              </div>
            </div>

            {topUpMessage && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                {topUpMessage}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={topUpLoading}
                onClick={handlePurchaseTokens}
                className="btn btn-primary w-full py-3"
              >
                <CreditCard className="h-4 w-4" />
                {topUpLoading ? "Opening Razorpay…" : "Pay on Razorpay · ₹99"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTopUpModal(false);
                  setTopUpMessage("");
                }}
                className="btn btn-ghost w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
