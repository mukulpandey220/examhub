import React from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  Receipt, 
  ShieldCheck, 
  Layers,
  RotateCcw
} from "lucide-react";
import { getPlanById } from "@/data/pricing";

export default function PaymentResultPage({
  searchParams,
}: {
  searchParams: {
    status?: string;
    orderId?: string;
    planId?: string;
    amount?: string;
    paymentRef?: string;
  };
}) {
  const status = searchParams.status || "success";
  const orderId = searchParams.orderId || `order_${Date.now()}`;
  const planId = searchParams.planId || "plan-seven-day";
  const amount = searchParams.amount || "29";
  const paymentRef = searchParams.paymentRef || `pay_${Date.now()}`;

  const plan = getPlanById(planId);
  const isSuccess = status === "success";
  const isPending = status === "pending";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft-lg animate-scale-in">

        {/* Status icon */}
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${
            isSuccess
              ? "bg-emerald-100 text-emerald-600"
              : isPending
              ? "bg-amber-100 text-amber-600"
              : "bg-rose-100 text-rose-600"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-8 w-8" />
          ) : isPending ? (
            <Clock className="h-8 w-8 animate-pulse" />
          ) : (
            <XCircle className="h-8 w-8" />
          )}
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isSuccess ? "Payment successful" : isPending ? "Payment pending" : "Payment failed"}
          </h1>
          <p className="text-sm text-slate-500">
            {isSuccess
              ? "Your plan is now active."
              : isPending
              ? "Waiting for final confirmation from the payment gateway."
              : "No money was taken. Please try again with another payment method."}
          </p>
        </div>

        {/* Receipt */}
        <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-left text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Order</span>
            <span className="break-all text-right font-medium text-slate-800">{orderId}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Payment ID</span>
            <span className="break-all text-right font-medium text-slate-800">{paymentRef}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Plan</span>
            <span className="font-medium text-electric-600">{plan?.name || "Sprint Pass"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Amount</span>
            <span className="font-semibold text-slate-900">₹{amount}</span>
          </div>
          {isSuccess && (
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-2.5">
              <span className="text-slate-500">Access</span>
              <span className="font-semibold text-emerald-600">Active · all domains</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-3 pt-1 sm:flex-row">
          {isSuccess ? (
            <>
              <Link href="/dashboard" className="btn btn-primary group w-full sm:w-auto">
                Go to dashboard
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link href="/dashboard/billing" className="btn btn-secondary w-full sm:w-auto">
                Billing history
              </Link>
            </>
          ) : (
            <>
              <Link href={`/checkout/${planId}`} className="btn btn-primary w-full sm:w-auto">
                <RotateCcw className="h-4 w-4" />
                Retry checkout
              </Link>
              <Link href="/contact" className="btn btn-secondary w-full sm:w-auto">
                Contact support
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
