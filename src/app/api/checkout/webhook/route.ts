import { NextRequest, NextResponse } from "next/server";
import { PAYMENT_CONFIG } from "@/config/payment";
import {
  grantVerifiedPayment,
  linkIdMatchesOfficial,
  razorpayCredentialsConfigured,
  resolveExpectedPaymentLinkId,
  verifyWebhookSignature,
  webhookSecretConfigured,
  type ConfirmedRazorpayPayment,
} from "@/lib/payments/razorpay-link";

export const dynamic = "force-dynamic";

async function fetchPayment(paymentId: string) {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.description || `Razorpay payment lookup failed (${response.status})`);
  }
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!webhookSecretConfigured()) {
      return NextResponse.json({
        error: "Webhook secret is not configured. Payment was not recorded.",
      }, { status: 503 });
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (payload.event !== "payment_link.paid") {
      return NextResponse.json({ status: "ignored", reason: `Unhandled event: ${payload.event || "unknown"}` });
    }

    const link = payload.payload?.payment_link?.entity;
    const payment = payload.payload?.payment?.entity;
    if (!link?.id || !payment?.id) {
      return NextResponse.json({ error: "Webhook payload is missing the payment link or payment." }, { status: 400 });
    }

    const expectedLinkId = await resolveExpectedPaymentLinkId();
    if (!expectedLinkId || !linkIdMatchesOfficial(String(link.id), link.short_url ? String(link.short_url) : undefined, expectedLinkId)) {
      return NextResponse.json({
        error: "Webhook payment link does not match https://rzp.io/rzp/CkGK3Dv.",
      }, { status: 400 });
    }

    const amountPaise = Number(payment.amount);
    const currency = String(payment.currency || "");
    const paymentStatus = String(payment.status || "").toLowerCase();
    if (amountPaise !== PAYMENT_CONFIG.amountPaise || currency !== PAYMENT_CONFIG.currency) {
      return NextResponse.json({
        error: "Webhook payment amount or currency did not match the expected ₹99 INR charge.",
      }, { status: 400 });
    }
    if (paymentStatus !== "captured" && paymentStatus !== "authorized") {
      return NextResponse.json({
        status: "pending",
        paid: false,
        message: "Payment is not captured yet. Access was not granted.",
      }, { status: 409 });
    }

    if (!razorpayCredentialsConfigured()) {
      return NextResponse.json({
        error: "Razorpay API keys are not configured, so the webhook payment could not be re-checked. Access was not granted.",
      }, { status: 503 });
    }

    let remote: any;
    try {
      remote = await fetchPayment(String(payment.id));
    } catch (err: any) {
      return NextResponse.json({
        error: err.message || "Could not re-check the payment with Razorpay. Access was not granted.",
      }, { status: 502 });
    }

    if (
      remote.id !== payment.id ||
      Number(remote.amount) !== PAYMENT_CONFIG.amountPaise ||
      String(remote.currency) !== PAYMENT_CONFIG.currency ||
      !["captured", "authorized"].includes(String(remote.status || "").toLowerCase())
    ) {
      return NextResponse.json({
        error: "Razorpay API did not confirm this webhook payment. Access was not granted.",
      }, { status: 400 });
    }

    const confirmed: ConfirmedRazorpayPayment = {
      paymentId: String(payment.id),
      paymentLinkId: String(link.id),
      referenceId: String(link.reference_id || ""),
      amountPaise: PAYMENT_CONFIG.amountPaise,
      currency: PAYMENT_CONFIG.currency,
      status: String(remote.status).toLowerCase(),
      email: remote.email ? String(remote.email).toLowerCase() : (payment.email ? String(payment.email).toLowerCase() : undefined),
    };

    const granted = grantVerifiedPayment(confirmed);
    if (granted.body.unmatched) {
      return NextResponse.json({
        status: "unmatched",
        paid: false,
        paymentId: confirmed.paymentId,
        message: granted.body.error,
      }, { status: 200 });
    }
    return NextResponse.json({
      status: granted.httpStatus === 200 ? "success" : "rejected",
      ...granted.body,
    }, { status: granted.httpStatus === 200 ? 200 : granted.httpStatus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Webhook processing failed" }, { status: 500 });
  }
}
