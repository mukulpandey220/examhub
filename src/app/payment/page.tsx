"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Award,
  Zap,
  HelpCircle,
  FileCheck,
  Smartphone,
  Building,
  GraduationCap,
  AlertCircle,
  Coins,
  RefreshCw,
  Loader2
} from "lucide-react";
import confetti from "canvas-confetti";
import { OFFICIAL_RAZORPAY_PAYMENT_URL, PAYMENT_CONFIG } from "@/config/payment";
import { executeAutomatedRazorpayPayment } from "@/lib/razorpay";

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [copied, setCopied] = useState(false);
  const [candidateEmail, setCandidateEmail] = useState("ramkumar.malothu@nyeras.com");
  const [candidateName, setCandidateName] = useState("Ramkumar Malothu");
  const [candidateId, setCandidateId] = useState("user-student-ramkumar");
  const [candidateTokens, setCandidateTokens] = useState<number>(100);

  const [processing, setProcessing] = useState(false);
  const [autoChecking, setAutoChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Sync candidate details from local storage / auth
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("campus_radar_user");
        if (stored) {
          const u = JSON.parse(stored);
          if (u.id) setCandidateId(u.id);
          if (u.name) setCandidateName(u.name);
          if (u.email) setCandidateEmail(u.email);
          if (u.tokens !== undefined) setCandidateTokens(u.tokens);
        }
      } catch (e) {}
    }

    if (searchParams.get("razorpay_payment_id") || searchParams.get("razorpay_payment_link_status")) {
      router.replace(`/payment/callback?${searchParams.toString()}`);
    }
  }, [searchParams, router]);

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(OFFICIAL_RAZORPAY_PAYMENT_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 100% AUTOMATED IN-APP PAYMENT: No manual UTR entry needed
  const handleAutomatedPayment = () => {
    setProcessing(true);
    setStatusMessage(null);

    executeAutomatedRazorpayPayment({
      amountRupees: 99,
      tokenCount: 99,
      userId: candidateId,
      userName: candidateName,
      userEmail: candidateEmail,
      description: "NTCRA Pass: Full Access + 99 Tokens (₹1 = 1 Token)",
      onSuccess: (result) => {
        setProcessing(false);
        setCandidateTokens(result.tokenBalance);
        setStatusMessage({
          type: "success",
          text: `Payment successful! Automatically credited ${result.tokensAdded} tokens to your dashboard (₹1 = 1 Token).`,
        });

        try {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        } catch (e) {}

        setTimeout(() => {
          router.push("/dashboard?payment=success");
        }, 2000);
      },
      onError: (err) => {
        setProcessing(false);
        setStatusMessage({
          type: "error",
          text: err || "Payment could not be completed.",
        });
      },
      onDismiss: () => {
        setProcessing(false);
      },
    });
  };

  // Automated Status Check: Checks server without asking student for UTR
  const handleAutoCheckStatus = async () => {
    setAutoChecking(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/checkout/payment-status");
      const data = await res.json();

      if (data.paid) {
        if (typeof data.tokenBalance === "number") setCandidateTokens(data.tokenBalance);
        setStatusMessage({
          type: "success",
          text: data.message || "Payment verified. You can continue.",
        });
        setTimeout(() => {
          router.push(data.nextUrl || "/dashboard");
        }, 1200);
      } else {
        setStatusMessage({
          type: "info",
          text: data.message || "No verified payment yet. Access has not been granted.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to check payment status.",
      });
    } finally {
      setAutoChecking(false);
    }
  };

  const included = [
    "Proctored national exam: Aptitude, Domain Core and Workplace Readiness",
    "All 72 domains and 3,600+ questions unlocked",
    "99 tokens added to your wallet (₹1 = 1 token)",
    "Personalised diagnostic report with a 6-month roadmap",
    "Percentile, rank and a verifiable certificate",
  ];

  const faqs = [
    {
      q: "Do I need to enter a UTR or transaction ID?",
      a: "No. Verification and token crediting are automatic once your payment completes.",
    },
    {
      q: "How fast are tokens added?",
      a: "Within seconds of bank confirmation. If you paid in another tab, use “Check payment status”.",
    },
    {
      q: "Are there recurring charges?",
      a: "No. The ₹99 pass is a one-time fee.",
    },
    {
      q: "What is the token rate?",
      a: "₹1 = 1 token. Paying ₹99 credits 99 tokens to your wallet.",
    },
  ];

  return (
    <div className="flex-1 py-8 sm:py-12">
      <div className="page-container space-y-8">

        {/* Header */}
        <h1 className="page-title text-center">National assessment pass</h1>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">

          {/* Checkout */}
          <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-md sm:p-8 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-electric-500 text-white shadow-electric">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Nyeras Nxtmove</h2>
                  <span className="text-sm text-slate-500">Registration fee</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-3xl font-bold text-slate-900">₹99</span>
                <span className="block text-xs text-slate-400 line-through">₹299</span>
              </div>
            </div>

            {statusMessage && (
              <div
                className={`flex animate-fade-in items-start gap-2.5 rounded-xl border p-3.5 text-sm ${
                  statusMessage.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : statusMessage.type === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-electric-200 bg-electric-50 text-electric-700"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : statusMessage.type === "error" ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                )}
                <span className="font-medium">{statusMessage.text}</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                disabled={processing}
                onClick={handleAutomatedPayment}
                className="btn btn-primary w-full py-3.5 text-base"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Pay ₹99
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-500">
                Secure checkout by Razorpay. Instant activation after payment.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pay with
              </span>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-colors duration-200 hover:border-electric-200">
                  <Smartphone className="mx-auto h-5 w-5 text-electric-500" />
                  <div className="text-sm font-medium text-slate-800">UPI</div>
                </div>
                <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-colors duration-200 hover:border-electric-200">
                  <CreditCard className="mx-auto h-5 w-5 text-purple-500" />
                  <div className="text-sm font-medium text-slate-800">Cards</div>
                </div>
                <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3 transition-colors duration-200 hover:border-electric-200">
                  <Building className="mx-auto h-5 w-5 text-emerald-500" />
                  <div className="text-sm font-medium text-slate-800">NetBanking</div>
                </div>
              </div>
            </div>

            <details className="group rounded-xl border border-slate-200 bg-slate-50">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-slate-700">
                Prefer the hosted Razorpay page?
                <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <div className="space-y-3 border-t border-slate-200 p-4">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-sm">
                  <span className="select-all truncate text-electric-600">{OFFICIAL_RAZORPAY_PAYMENT_URL}</span>
                  <button type="button" onClick={handleCopyLink} className="btn btn-secondary btn-sm shrink-0">
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAutomatedPayment}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-electric-600 hover:text-electric-700"
                >
                  Open hosted page
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </details>

            <div className="flex flex-col justify-between gap-1 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm sm:flex-row sm:items-center">
              <span className="text-slate-500">Paying as</span>
              <span className="font-medium text-slate-800">
                {candidateName} <span className="font-normal text-slate-500">· {candidateEmail}</span>
              </span>
            </div>
          </div>

          {/* Side column */}
          <div className="space-y-6 lg:col-span-5">
            <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Your wallet</h3>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-slate-900">{candidateTokens}</span>
                  <span className="text-xs text-slate-500">tokens</span>
                </div>
              </div>

              <p className="text-sm text-slate-500">
                Paid already, or paid in another tab? Refresh to pull in your latest payment.
              </p>

              <button
                type="button"
                disabled={autoChecking}
                onClick={handleAutoCheckStatus}
                className="btn btn-secondary w-full"
              >
                {autoChecking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-electric-500" />
                    Checking…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 text-electric-500" />
                    Check payment status
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm">
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Award className="h-5 w-5 text-amber-500" />
                What's included
              </h3>
              <ul className="space-y-3 text-sm text-slate-600">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-electric-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-soft-sm">
              <div>
                <span className="block font-semibold text-slate-900">Need help with payment?</span>
                <span className="text-slate-500">{PAYMENT_CONFIG.supportEmail}</span>
              </div>
              <Link href="/contact" className="shrink-0 font-semibold text-electric-600 hover:text-electric-700">
                Contact →
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mx-auto w-full max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm sm:p-8">
          <h3 className="text-lg font-semibold text-slate-900">Payment FAQs</h3>
          <div className="divide-y divide-slate-100">
            {faqs.map((f) => (
              <details key={f.q} className="group py-3.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-800">
                  {f.q}
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <p className="mt-2 text-sm text-slate-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="space-y-3 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-electric-500" />
            <p className="text-sm text-slate-500">Loading checkout…</p>
          </div>
        </div>
      }
    >
      <PaymentPageContent />
    </React.Suspense>
  );
}
