"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  Coins, 
  ArrowRight, 
  Sparkles,
  Zap
} from "lucide-react";
import confetti from "canvas-confetti";

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokensAdded, setTokensAdded] = useState<number>(0);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [step, setStep] = useState<string>("Reading the Razorpay return…");

  useEffect(() => {
    async function autoVerify() {
      const paymentStatus = (searchParams.get("razorpay_payment_link_status") || searchParams.get("status") || "").toLowerCase();
      const paymentId = searchParams.get("razorpay_payment_id") || "";
      const paymentLinkId = searchParams.get("razorpay_payment_link_id") || "";
      const referenceId = searchParams.get("razorpay_payment_link_reference_id") || "";
      const signature = searchParams.get("razorpay_signature") || "";

      if (paymentStatus === "cancelled" || paymentStatus === "failed" || paymentStatus === "expired") {
        await fetch("/api/checkout/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ razorpay_payment_link_status: paymentStatus }),
        }).catch(() => undefined);
        setError("Payment was cancelled or failed. Access has not been granted.");
        setLoading(false);
        return;
      }

      if (!paymentId || !paymentLinkId || !signature) {
        setError("Razorpay did not return a verifiable payment. Access has not been granted.");
        setLoading(false);
        return;
      }

      setStep("Checking the payment with Razorpay…");

      try {
        const res = await fetch("/api/checkout/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: paymentId,
            razorpay_payment_link_id: paymentLinkId,
            razorpay_payment_link_reference_id: referenceId,
            razorpay_payment_link_status: paymentStatus,
            razorpay_signature: signature,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.paid) {
          throw new Error(data.error || "Payment could not be verified. Access has not been granted.");
        }

        setTokensAdded(data.tokensAdded || 0);
        setNewBalance(data.tokenBalance || 0);
        setSuccess(true);
        setLoading(false);

        if (typeof window !== "undefined" && typeof data.tokenBalance === "number") {
          try {
            const stored = localStorage.getItem("campus_radar_user");
            if (stored) {
              const u = JSON.parse(stored);
              u.tokens = data.tokenBalance;
              localStorage.setItem("campus_radar_user", JSON.stringify(u));
            }
          } catch (e) {}
        }

        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}

        setTimeout(() => {
          router.push(data.nextUrl || "/dashboard");
        }, 2500);
      } catch (err: any) {
        setError(err.message || "Failed to verify payment. Access has not been granted.");
        setLoading(false);
      }
    }

    autoVerify();
  }, [searchParams, router]);

  return (
    <div className="flex flex-1 items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft-lg animate-scale-in">

        {loading && (
          <div className="space-y-5 py-6">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full border-4 border-electric-500/20" />
              <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-electric-500 border-t-transparent">
                <Loader2 className="h-8 w-8 text-electric-500" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900">Verifying your payment</h2>
              <p className="animate-pulse text-sm text-electric-600">{step}</p>
            </div>

            <p className="text-sm text-slate-500">This only takes a moment. Your tokens are added automatically.</p>
          </div>
        )}

        {success && (
          <div className="space-y-6 py-2">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-200 bg-emerald-50 text-emerald-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <span className="badge badge-green">
                <Sparkles className="h-3.5 w-3.5" />
                Payment verified
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">You're all set</h1>
              <p className="text-sm text-slate-500">Your tokens have been added to your account.</p>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-electric-200 bg-electric-50 p-4">
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-100 text-electric-600">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Credited</div>
                  <div className="text-base font-semibold text-slate-900">+{tokensAdded} tokens</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">New balance</div>
                <div className="text-base font-semibold text-emerald-600">{newBalance} tokens</div>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <Link href="/dashboard" className="btn btn-primary group w-full py-3">
                Go to dashboard
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <p className="text-xs text-slate-400">Redirecting automatically…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-5 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 text-rose-500">
              <AlertCircle className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900">We couldn't verify the payment</h2>
              <p className="text-sm text-rose-600">{error}</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link href="/payment" className="btn btn-primary">
                Try payment again
              </Link>
              <Link href="/payment" className="btn btn-secondary">
                Check payment status
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Verified securely with Razorpay</span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="space-y-3 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-electric-500" />
            <p className="text-sm text-slate-500">Loading…</p>
          </div>
        </div>
      }
    >
      <PaymentCallbackContent />
    </React.Suspense>
  );
}
