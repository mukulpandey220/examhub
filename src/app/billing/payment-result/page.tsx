import React from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  RotateCcw
} from "lucide-react";
import { db } from "@/lib/db";
import { PAYMENT_CONFIG } from "@/config/payment";

export const dynamic = "force-dynamic";

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
  const order = searchParams.orderId ? db.getPaymentIntent(searchParams.orderId) : undefined;
  const isSuccess = order?.status === "paid";
  const isPending = order?.status === "pending";
  const orderId = order?.id || "No verified order";
  const paymentRef = isSuccess ? (order?.paymentId || "Verified") : "Not verified";
  const amount = isSuccess ? String(PAYMENT_CONFIG.amountRupees) : "—";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft-lg animate-scale-in">

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
            {isSuccess ? "Payment verified" : isPending ? "Payment pending" : "Payment not confirmed"}
          </h1>
          <p className="text-sm text-slate-500">
            {isSuccess
              ? "Razorpay confirmed this payment. Your access is active."
              : isPending
              ? "This checkout is still waiting for Razorpay. Access has not been granted."
              : "This page does not grant access unless the server has a verified payment for the order."}
          </p>
        </div>

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
            <span className="text-slate-500">Amount</span>
            <span className="font-semibold text-slate-900">{amount === "—" ? amount : `₹${amount}`}</span>
          </div>
          {isSuccess && (
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-2.5">
              <span className="text-slate-500">Access</span>
              <span className="font-semibold text-emerald-600">Active</span>
            </div>
          )}
        </div>

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
              <Link href="/payment" className="btn btn-primary w-full sm:w-auto">
                <RotateCcw className="h-4 w-4" />
                Back to payment
              </Link>
              <Link href="/contact" className="btn btn-secondary w-full sm:w-auto">
                Contact support
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Status is read from the server, not from the page address.</span>
        </div>
      </div>
    </div>
  );
}
