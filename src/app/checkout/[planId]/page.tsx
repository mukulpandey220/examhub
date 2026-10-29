"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  HelpCircle,
  Clock
} from "lucide-react";
import { getPlanById } from "@/data/pricing";
import { RAZORPAY_DISPLAY_URL } from "@/config/payment";
import { executeAutomatedRazorpayPayment } from "@/lib/razorpay";

export default function CheckoutPage({ params }: { params: { planId: string } }) {
  const router = useRouter();
  const plan = getPlanById(params.planId);

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");

  if (!plan) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="space-y-3 text-center">
          <p className="font-semibold text-slate-800">Plan not found.</p>
          <Link href="/pricing" className="text-sm font-semibold text-electric-600 hover:text-electric-700">
            Back to pricing
          </Link>
        </div>
      </div>
    );
  }

  // Tax calculations
  const baseAmount = plan.priceRupees;
  const gstAmount = Math.round(baseAmount * 0.18 * 100) / 100; // 18% GST
  const totalPayable = (baseAmount + gstAmount).toFixed(2);

  const handlePay = async () => {
    setProcessing(true);
    setError("");

    if (plan.priceRupees === 0) {
      router.push("/dashboard");
      return;
    }

    try {
      await executeAutomatedRazorpayPayment({
        planId: plan.id,
        userId: "user-student-demo",
        userName: "Arjun Sharma",
        userEmail: "student@campusradar.edu.in",
        description: `${plan.name} (${plan.durationLabel})`,
        onError: (errMsg) => {
          setError(errMsg || "Could not open the Razorpay payment page.");
          setProcessing(false);
        },
      });
    } catch (err: any) {
      setError(err.message || "Could not open the Razorpay payment page.");
      setProcessing(false);
    }
  };

  const methods: { id: "upi" | "card" | "netbanking"; label: string }[] = [
    { id: "upi", label: "UPI / QR" },
    { id: "card", label: "Card" },
    { id: "netbanking", label: "Net banking" },
  ];

  return (
    <div className="flex-1 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">

        <Link
          href="/pricing"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-electric-600"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Pricing
        </Link>

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-5">

          {/* Order summary */}
          <div className="space-y-4 md:col-span-2">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm">
              <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">Order summary</h2>

              <div>
                <div className="text-sm font-semibold text-slate-900">{plan.name}</div>
                <div className="text-sm text-slate-500">{plan.durationLabel}</div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Plan fee</span>
                  <span className="font-medium text-slate-900">₹{baseAmount}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%)</span>
                  <span>₹{gstAmount}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span className="text-electric-600">₹{totalPayable}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-soft-sm">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-electric-500" />
                Secure checkout
              </div>
              <p className="text-slate-500">Your plan activates as soon as the payment is verified.</p>
              <Link href="/refund-policy" className="inline-block font-medium text-electric-600 hover:text-electric-700">
                7-day refund terms →
              </Link>
            </div>
          </div>

          {/* Payment */}
          <div className="md:col-span-3">
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-md sm:p-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Checkout</h1>
                <p className="mt-1 text-sm text-slate-500">Choose how you'd like to pay for your {plan.durationLabel}.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Payment method</label>
                <div className="grid grid-cols-3 gap-3">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`rounded-xl border p-3.5 text-center text-sm font-medium ${
                        paymentMethod === m.id
                          ? "border-electric-500 bg-electric-50 text-electric-700 ring-2 ring-electric-500/20"
                          : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={loading || processing}
                  onClick={handlePay}
                  className="btn btn-primary w-full py-3.5 text-base"
                >
                  <Lock className="h-4 w-4" />
                  {processing ? "Opening Razorpay…" : "Pay on Razorpay · ₹99"}
                </button>
                <p className="text-center text-xs text-slate-500">
                  Opens {RAZORPAY_DISPLAY_URL}. The plan is activated only after the server verifies the ₹99 payment.
                </p>

                <button
                  type="button"
                  disabled={loading || processing}
                  onClick={handlePay}
                  className="btn btn-secondary w-full"
                >
                  <CreditCard className="h-4 w-4" />
                  Pay on the Razorpay page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
