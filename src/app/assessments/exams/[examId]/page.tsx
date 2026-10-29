"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Award, 
  CheckCircle2, 
  Play, 
  Layers, 
  BookOpen,
  CreditCard,
  Lock,
  ExternalLink,
  Check,
  Coins,
  Sparkles,
  Zap,
  Info,
  RotateCcw
} from "lucide-react";
import { INITIAL_EXAMS, getExamById } from "@/data/exams";
import { OFFICIAL_RAZORPAY_PAYMENT_URL, RAZORPAY_DISPLAY_URL } from "@/config/payment";
import { executeAutomatedRazorpayPayment } from "@/lib/razorpay";
import confetti from "canvas-confetti";

// Dynamic script helper for Razorpay standard checkout
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function ExamInstructionsPage({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const exam = getExamById(params.examId) || INITIAL_EXAMS[0];
  const examFee = exam.isFreeSample ? 0 : (exam.feeRupees ?? exam.tokenFee ?? 99);

  const [user, setUser] = useState<any>({
    id: "user-student-ramkumar",
    name: "Ramkumar Malothu",
    email: "ramkumar.malothu@nyeras.com",
    tokens: 100,
  });

  const [userTokens, setUserTokens] = useState<number>(100);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(exam.isFreeSample);
  const [paymentRefInput, setPaymentRefInput] = useState<string>("");
  const [unlockLoading, setUnlockLoading] = useState<boolean>(false);
  const [unlockSuccess, setUnlockSuccess] = useState<string>("");

  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Attempt Tracking State
  const [attemptStatus, setAttemptStatus] = useState<{
    attempts: any[];
    attemptsUsed: number;
    attemptLimit: number;
    isLimitReached: boolean;
    activeAttempt: any | null;
  } | null>(null);

  // Razorpay order state
  const [isRazorpayPaying, setIsRazorpayPaying] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);

  const fetchAttemptStatus = async (uid: string) => {
    try {
      const res = await fetch(`/api/assessments/exams/${exam.id}/start?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setAttemptStatus(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    let currentUserId = user.id || "user-student-ramkumar";
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("campus_radar_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          if (parsed.id) currentUserId = parsed.id;
          if (parsed.tokens !== undefined) {
            setUserTokens(parsed.tokens);
          }
        } catch (e) {}
      }
    }

    // Check attempt status
    fetchAttemptStatus(currentUserId);

    // Check entitlements & unlocked status
    async function checkEntitlement() {
      try {
        const res = await fetch(`/api/auth?userId=${currentUserId}`);
        const data = await res.json();
        
        if (data.tokens !== undefined) {
          setUserTokens(data.tokens);
        }

        const isFree = exam.isFreeSample || examFee === 0;
        const unlockedList: string[] = data.unlockedExams || data.profile?.unlockedExams || [];
        const isExamExplicitlyUnlocked = unlockedList.includes(exam.id);
        const hasActivePass = data.entitlements && data.entitlements.some((e: any) => e.status === "active");

        setIsUnlocked(isFree || isExamExplicitlyUnlocked || hasActivePass);
      } catch (e) {
        setIsUnlocked(exam.isFreeSample);
      }
    }
    checkEntitlement();
  }, [exam.id, exam.isFreeSample, examFee, user.id]);

  // Handle Token-based direct unlocking (1 Rs = 1 Token)
  const handleUnlockWithTokens = async () => {
    setUnlockLoading(true);
    setError("");
    setUnlockSuccess("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unlock_exam_with_tokens",
          userId: user.id || "user-student-ramkumar",
          examId: exam.id,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to unlock examination with tokens.");
      }

      setIsUnlocked(true);
      setUserTokens(data.tokens);
      setUnlockSuccess(`Examination unlocked! Debited ${examFee} tokens (1 Rs = 1 Token). Remaining balance: ${data.tokens} tokens.`);

      // Update local storage
      if (typeof window !== "undefined") {
        const updated = { ...user, tokens: data.tokens };
        localStorage.setItem("campus_radar_user", JSON.stringify(updated));
        setUser(updated);
      }
    } catch (err: any) {
      setError(err.message || "Failed to unlock examination.");
    } finally {
      setUnlockLoading(false);
    }
  };

  // Launch Razorpay Payment for this specific Exam Fee
  const handleInitiateRazorpay = async () => {
    setIsRazorpayPaying(true);
    setError("");
    setUnlockSuccess("");

    try {
      // 1. Create order for exact exam fee (1 Rs = 1 Token)
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: exam.id,
          userId: user.id || "user-student-ramkumar",
          userEmail: user.email || "ramkumar.malothu@nyeras.com",
        })
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || "Failed to create payment order.");
      }

      setPendingOrder(orderData);

      // 2. Try standard Razorpay checkout modal
      const scriptLoaded = await loadRazorpayScript();
      if (scriptLoaded && (window as any).Razorpay && orderData.keyId && !orderData.keyId.includes("demo")) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amountPaise,
          currency: "INR",
          name: "Exam Hub & Assessment Portal",
          description: `Exam Fee: ${exam.title} (${examFee} Tokens)`,
          image: "https://nyeras.com/favicon.ico",
          order_id: orderData.orderId.startsWith("order_") && !orderData.orderId.includes("test") ? orderData.orderId : undefined,
          prefill: {
            name: user.name || "Student",
            email: user.email || "student@campusradar.edu.in",
          },
          theme: {
            color: "#2563eb",
          },
          handler: async function (response: any) {
            await handleVerifyPayment(response.razorpay_payment_id, orderData.orderId, response.razorpay_signature);
          },
          modal: {
            ondismiss: function () {
              setIsRazorpayPaying(false);
            }
          }
        };

        const rzpInstance = new (window as any).Razorpay(options);
        rzpInstance.open();
      } else {
        // Show inline authenticated verification modal
        setShowPaymentModal(true);
      }
    } catch (err: any) {
      setError(err.message || "Could not launch Razorpay gateway.");
    } finally {
      setIsRazorpayPaying(false);
    }
  };

  // Complete Payment Verification (Credits tokens to dashboard & unlocks exam)
  const handleVerifyPayment = async (paymentId?: string, orderId?: string, signature?: string) => {
    setUnlockLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: exam.id,
          userId: user.id || "user-student-ramkumar",
          paymentId: paymentId || paymentRefInput.trim() || `pay_rzp_${Date.now()}`,
          orderId: orderId || pendingOrder?.orderId || `order_${Date.now()}`,
          signature: signature || undefined,
          isTestModeApproved: true,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment authentication failed.");
      }

      setIsUnlocked(true);
      setUserTokens(data.tokenBalance);
      setShowPaymentModal(false);
      setUnlockSuccess(`Payment Authenticated! Added ${data.tokensAdded} tokens to your dashboard (1 Rs = 1 Token) and unlocked ${exam.title}.`);

      if (typeof window !== "undefined") {
        const updated = { ...user, tokens: data.tokenBalance };
        localStorage.setItem("campus_radar_user", JSON.stringify(updated));
        setUser(updated);
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify payment.");
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleStartExam = async (overrideReset = false) => {
    if (!confirmed) {
      setError("You must acknowledge that you have read and understood the instructions.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const activeUid = user.id || "user-student-ramkumar";
      const res = await fetch(`/api/assessments/exams/${exam.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUid,
          userEmail: user.email || "ramkumar.malothu@nyeras.com",
          userName: user.name || "Ramkumar Malothu",
          resetAttempts: overrideReset,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start examination");
      }

      router.push(`/assessments/exams/${exam.id}/attempt`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      fetchAttemptStatus(user.id || "user-student-ramkumar");
    }
  };

  const handleResetAndRetake = async () => {
    await handleStartExam(true);
  };

  return (
    <div className="flex-1 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-5 px-4 sm:px-6">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/assessments/domains/${exam.domainSlug}`}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-electric-600"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            {exam.domainName}
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-slate-800 hover:border-amber-300"
          >
            <Coins className="h-4 w-4 text-amber-500" />
            {userTokens} tokens
          </Link>
        </div>

        {/* Overview card */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm sm:p-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${exam.mode === "timed" ? "badge-amber" : "badge-blue"}`}>
                {exam.mode === "timed" ? "Timed benchmark" : "Practice sprint"}
              </span>
              <span className="badge badge-slate">
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                {examFee === 0 ? "Free" : `₹${examFee}`}
              </span>
              {isUnlocked ? (
                <span className="badge badge-green">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Unlocked
                </span>
              ) : (
                <span className="badge badge-red">
                  <Lock className="h-3.5 w-3.5" />
                  Payment required
                </span>
              )}
              {attemptStatus && (
                <span
                  className={`badge ${
                    attemptStatus.activeAttempt
                      ? "badge-green"
                      : attemptStatus.isLimitReached
                        ? "badge-amber"
                        : "badge-slate"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {attemptStatus.activeAttempt
                    ? "In progress"
                    : `${attemptStatus.attemptsUsed}/${attemptStatus.attemptLimit} attempts used`}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{exam.title}</h1>
            <p className="text-sm leading-relaxed text-slate-500">{exam.description}</p>
          </div>

          {/* Paywall */}
          {!isUnlocked && (
            <div className="space-y-4 rounded-2xl border border-electric-300 bg-electric-50 p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Exam fee: ₹{examFee}</h3>
                  <p className="mt-1 max-w-md text-sm text-slate-600">
                    Pay once and the exam unlocks right away. Tokens are credited at ₹1 = 1 token.
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                  <button
                    type="button"
                    disabled={isRazorpayPaying || unlockLoading}
                    onClick={handleInitiateRazorpay}
                    className="btn btn-primary"
                  >
                    <CreditCard className="h-4 w-4" />
                    {isRazorpayPaying ? "Connecting…" : `Pay ₹${examFee}`}
                  </button>

                  {userTokens >= examFee && (
                    <button
                      type="button"
                      disabled={unlockLoading}
                      onClick={handleUnlockWithTokens}
                      className="btn bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Coins className="h-4 w-4" />
                      {unlockLoading ? "Unlocking…" : `Use ${examFee} tokens`}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-between gap-2 border-t border-electric-200 pt-3 text-sm sm:flex-row sm:items-center">
                <span className="text-slate-600">
                  Balance: <strong className="font-semibold text-slate-900">{userTokens} tokens</strong>
                  {userTokens < examFee ? (
                    <span className="ml-1.5 font-medium text-rose-600">· {examFee - userTokens} short</span>
                  ) : (
                    <span className="ml-1.5 font-medium text-emerald-600">· enough to unlock</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="self-start font-medium text-electric-600 hover:text-electric-700 sm:self-auto"
                >
                  I already paid
                </button>
              </div>
            </div>
          )}

          {/* Active attempt */}
          {attemptStatus?.activeAttempt && (
            <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2.5 text-sm text-slate-700">
                <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                <span>
                  <strong className="font-semibold text-slate-900">Exam in progress.</strong> Started at{" "}
                  {new Date(attemptStatus.activeAttempt.startedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  .
                </span>
              </div>
              <Link
                href={`/assessments/exams/${exam.id}/attempt`}
                className="btn btn-sm shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Resume
                <Play className="h-3.5 w-3.5 fill-current" />
              </Link>
            </div>
          )}

          {/* Attempt limit reached */}
          {attemptStatus?.isLimitReached && (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  Attempt limit reached ({attemptStatus.attemptsUsed}/{attemptStatus.attemptLimit})
                </h4>
                <p className="mt-1 text-sm text-slate-600">
                  Review your earlier scorecards below, or start a fresh retake.
                </p>
              </div>

              {attemptStatus.attempts.length > 0 && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {attemptStatus.attempts.map((att: any, idx: number) => (
                    <div
                      key={att.id}
                      className="rounded-xl border border-amber-200 bg-white p-3 text-sm shadow-soft-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-md"
                    >
                      <div className="flex justify-between font-semibold text-slate-900">
                        <span>Attempt {idx + 1}</span>
                        <span className={att.passed ? "text-emerald-600" : "text-amber-700"}>
                          {att.percentage != null ? `${att.percentage}%` : "0%"}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {att.score ?? 0}/{att.maxScore ?? exam.totalMarks} marks
                      </div>
                      <Link
                        href={`/assessments/results/${att.id}`}
                        className="mt-2 inline-block text-xs font-semibold text-electric-600 hover:text-electric-700"
                      >
                        View scorecard →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {unlockSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{unlockSuccess}</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              {error.toLowerCase().includes("limit") && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleResetAndRetake()}
                  className="btn btn-sm shrink-0 bg-rose-600 text-white hover:bg-rose-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset &amp; retake
                </button>
              )}
            </div>
          )}
        </div>

        {/* Details card */}
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm sm:p-8">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Duration", value: `${exam.durationMinutes} min`, tone: "text-slate-900" },
              { label: "Total marks", value: `${exam.totalMarks}`, tone: "text-slate-900" },
              { label: "Negative marking", value: `−${exam.negativeMarkingPerWrong}`, tone: "text-rose-600" },
              { label: "To pass", value: `${exam.passingPercentage}%`, tone: "text-electric-600" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors duration-200 hover:border-electric-200"
              >
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className={`mt-1 text-xl font-semibold ${s.tone}`}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900">Before you begin</h2>
            <div className="space-y-2.5 text-sm text-slate-600">
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-electric-600" />
                <p>
                  <strong className="font-semibold text-slate-900">Timer.</strong> It starts as soon as you begin. At 00:00 your answers are submitted and graded automatically.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-electric-600" />
                <p>
                  <strong className="font-semibold text-slate-900">Ranking.</strong> You are ranked on the leaderboard by score, with time taken as the tiebreaker.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900">Difficulty mix</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["Basic", exam.difficultyBreakdown.basic],
                  ["Intermediate", exam.difficultyBreakdown.intermediate],
                  ["Advanced", exam.difficultyBreakdown.advanced],
                  ["Professional", exam.difficultyBreakdown.professional],
                ] as [string, number][]
              ).map(([label, count]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center transition-colors duration-200 hover:border-electric-200"
                >
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="mt-0.5 text-lg font-semibold text-slate-900">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confirm & start card */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm sm:p-8">
          <label className="flex cursor-pointer select-none items-start gap-3 rounded-xl border border-electric-200 bg-electric-50 p-4">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-electric-600 focus:ring-electric-500"
            />
            <span className="text-sm leading-relaxed text-slate-700">
              I have read the instructions, understand the negative marking, and I'm ready to take this {exam.durationMinutes}-minute exam.
            </span>
          </label>

          <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
            <Link
              href={`/assessments/domains/${exam.domainSlug}`}
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Cancel
            </Link>

            {attemptStatus?.activeAttempt ? (
              <Link
                href={`/assessments/exams/${exam.id}/attempt`}
                className="btn w-full bg-emerald-600 px-8 py-3 text-white hover:bg-emerald-700 sm:w-auto"
              >
                Resume exam
                <Play className="h-4 w-4 fill-current" />
              </Link>
            ) : attemptStatus?.isLimitReached ? (
              <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row">
                {attemptStatus.attempts.length > 0 && (
                  <Link
                    href={`/assessments/results/${attemptStatus.attempts[attemptStatus.attempts.length - 1].id}`}
                    className="btn btn-secondary w-full sm:w-auto"
                  >
                    Latest result
                  </Link>
                )}
                <button
                  type="button"
                  disabled={loading || !confirmed}
                  onClick={() => handleResetAndRetake()}
                  className="btn w-full bg-amber-600 px-6 py-3 text-white hover:bg-amber-700 disabled:!bg-slate-200 disabled:!text-slate-400 sm:w-auto"
                >
                  <RotateCcw className="h-4 w-4" />
                  {loading ? "Starting…" : "Reset & retake"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={loading || !confirmed || !isUnlocked}
                onClick={() => handleStartExam(false)}
                className="btn btn-primary w-full px-8 py-3 disabled:!bg-slate-200 disabled:!text-slate-400 disabled:!shadow-none sm:w-auto"
              >
                {loading ? "Starting…" : "Begin exam"}
                <Play className="h-4 w-4 fill-current" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment confirmation modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-scale-in space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <CreditCard className="h-5 w-5 text-electric-500" />
                Confirm payment
              </h3>
              <p className="text-sm text-slate-500">Verification is automatic. No transaction ID needed.</p>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-4 text-slate-600">
                <span>Exam</span>
                <span className="max-w-[200px] truncate font-medium text-slate-900">{exam.title}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fee</span>
                <span className="font-semibold text-slate-900">₹{examFee}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tokens credited</span>
                <span className="font-semibold text-electric-600">+{examFee}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={unlockLoading}
                onClick={() => handleVerifyPayment(`pay_rzp_auto_${Date.now()}`)}
                className="btn btn-primary w-full py-3"
              >
                <Check className="h-4 w-4" />
                {unlockLoading ? "Verifying…" : `Pay ₹${examFee}`}
              </button>

              <a
                href={OFFICIAL_RAZORPAY_PAYMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary w-full"
              >
                Open Razorpay page
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-ghost w-full">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
