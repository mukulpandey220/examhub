import crypto from "crypto";
import { db } from "@/lib/db";
import { OFFICIAL_RAZORPAY_PAYMENT_URL, PAYMENT_CONFIG } from "@/config/payment";
import { PaymentIntent } from "@/types";

export const PAYMENT_INTENT_COOKIE = "eh_pay_intent";
export const EXPECTED_AMOUNT_PAISE = PAYMENT_CONFIG.amountPaise;
export const EXPECTED_CURRENCY = PAYMENT_CONFIG.currency;

const PLACEHOLDER_MARKERS = ["your-", "example", "placeholder", "changeme"];

export function isUsableSecret(value: string | undefined | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 8) return false;
  const lowered = trimmed.toLowerCase();
  return !PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker));
}

export function razorpayCredentialsConfigured(): boolean {
  return isUsableSecret(process.env.RAZORPAY_KEY_ID) && isUsableSecret(process.env.RAZORPAY_KEY_SECRET);
}

export function webhookSecretConfigured(): boolean {
  return isUsableSecret(process.env.RAZORPAY_WEBHOOK_SECRET);
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function paymentLinkSignature(secret: string, parts: {
  paymentLinkId: string;
  referenceId: string;
  status: string;
  paymentId: string;
}): string {
  const payload = [
    parts.paymentLinkId,
    parts.referenceId,
    parts.status,
    parts.paymentId,
  ].join("|");
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyPaymentLinkSignature(parts: {
  paymentLinkId: string;
  referenceId: string;
  status: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!isUsableSecret(secret) || !parts.signature) return false;
  const expected = paymentLinkSignature(secret, parts);
  return safeEqual(expected, parts.signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  if (!isUsableSecret(secret) || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

export function linkIdMatchesOfficial(paymentLinkId: string | undefined, shortUrl: string | undefined, expectedId?: string | null): boolean {
  if (!paymentLinkId) return false;
  const configured = expectedId || process.env.RAZORPAY_PAYMENT_LINK_ID?.trim();
  const normalized = (shortUrl || "").replace(/\/$/, "");
  const shortUrlOk = !normalized
    || normalized === OFFICIAL_RAZORPAY_PAYMENT_URL
    || normalized.endsWith("/CkGK3Dv")
    || (configured ? normalized === `https://pages.razorpay.com/${configured}/view` : false);
  if (!shortUrlOk) return false;
  if (configured) return paymentLinkId === configured;
  return normalized === OFFICIAL_RAZORPAY_PAYMENT_URL || normalized.endsWith("/CkGK3Dv");
}

type RazorpayFetch = (url: string, init?: RequestInit) => Promise<Response>;

async function razorpayGet(path: string, fetchImpl: RazorpayFetch = fetch): Promise<any> {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetchImpl(`https://api.razorpay.com/v1${path}`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const description = data?.error?.description || `Razorpay request failed (${response.status})`;
    throw new Error(description);
  }
  return data;
}

let cachedOfficialLinkId: string | null = null;

export function clearResolvedPaymentLinkCache() {
  cachedOfficialLinkId = null;
}

export async function resolveExpectedPaymentLinkId(fetchImpl: RazorpayFetch = fetch): Promise<string | null> {
  const configured = process.env.RAZORPAY_PAYMENT_LINK_ID?.trim();
  if (configured) return configured;
  if (cachedOfficialLinkId) return cachedOfficialLinkId;

  const response = await fetchImpl(OFFICIAL_RAZORPAY_PAYMENT_URL, { redirect: "follow", cache: "no-store" });
  const html = await response.text();
  const match = html.match(/"payment_link_id":"(plink_[A-Za-z0-9]+|pl_[A-Za-z0-9]+)"/);
  if (!match) return null;
  cachedOfficialLinkId = match[1];
  return cachedOfficialLinkId;
}

export interface ConfirmedRazorpayPayment {
  paymentId: string;
  paymentLinkId: string;
  referenceId: string;
  amountPaise: number;
  currency: string;
  status: string;
  email?: string;
}

export async function confirmPaymentLinkWithApi(input: {
  paymentId: string;
  paymentLinkId: string;
  referenceId: string;
  linkStatus: string;
  signature: string;
}, fetchImpl: RazorpayFetch = fetch): Promise<{ ok: true; payment: ConfirmedRazorpayPayment } | { ok: false; httpStatus: number; error: string; outcome: "failed" | "pending" | "mismatch" | "unauthorized" }> {
  const linkStatus = (input.linkStatus || "").toLowerCase();
  if (linkStatus === "cancelled" || linkStatus === "failed" || linkStatus === "expired") {
    return { ok: false, httpStatus: 400, outcome: "failed", error: "Payment was cancelled or failed. Access has not been granted." };
  }
  if (linkStatus !== "paid") {
    return { ok: false, httpStatus: 409, outcome: "pending", error: "Payment is not completed yet. Access has not been granted." };
  }
  if (!razorpayCredentialsConfigured()) {
    return {
      ok: false,
      httpStatus: 503,
      outcome: "unauthorized",
      error: "Razorpay Key ID and Key Secret are not configured. Payment cannot be verified, so access has not been granted.",
    };
  }
  if (!verifyPaymentLinkSignature({
    paymentLinkId: input.paymentLinkId,
    referenceId: input.referenceId || "",
    status: input.linkStatus,
    paymentId: input.paymentId,
    signature: input.signature,
  })) {
    return { ok: false, httpStatus: 400, outcome: "unauthorized", error: "Invalid Razorpay payment link signature." };
  }

  const expectedLinkId = await resolveExpectedPaymentLinkId(fetchImpl);
  if (!expectedLinkId || input.paymentLinkId !== expectedLinkId) {
    return {
      ok: false,
      httpStatus: 400,
      outcome: "mismatch",
      error: "The payment link does not match the configured Razorpay page.",
    };
  }

  let payment: any;
  let link: any;
  try {
    [payment, link] = await Promise.all([
      razorpayGet(`/payments/${encodeURIComponent(input.paymentId)}`, fetchImpl),
      razorpayGet(`/payment_links/${encodeURIComponent(expectedLinkId)}`, fetchImpl),
    ]);
  } catch (err: any) {
    return {
      ok: false,
      httpStatus: 502,
      outcome: "pending",
      error: err?.message || "Razorpay could not confirm this payment. Access has not been granted.",
    };
  }

  const shortUrl = String(link?.short_url || "").replace(/\/$/, "");
  if (link?.id !== expectedLinkId || (shortUrl && shortUrl !== OFFICIAL_RAZORPAY_PAYMENT_URL && !shortUrl.endsWith("/CkGK3Dv"))) {
    return { ok: false, httpStatus: 400, outcome: "mismatch", error: "Razorpay returned a different payment page." };
  }

  const payments = Array.isArray(link?.payments) ? link.payments : [];
  if (payments.length > 0) {
    const listed = payments.some((item: any) => (item?.payment_id || item?.id) === input.paymentId);
    if (!listed) {
      return { ok: false, httpStatus: 400, outcome: "mismatch", error: "This payment is not attached to the Razorpay payment page." };
    }
  }

  const amountPaise = Number(payment?.amount);
  const currency = String(payment?.currency || "");
  const paymentStatus = String(payment?.status || "").toLowerCase();
  if (currency !== EXPECTED_CURRENCY || amountPaise !== EXPECTED_AMOUNT_PAISE) {
    return {
      ok: false,
      httpStatus: 400,
      outcome: "mismatch",
      error: `Payment amount or currency did not match ₹${PAYMENT_CONFIG.amountRupees} INR.`,
    };
  }
  if (paymentStatus !== "captured" && paymentStatus !== "authorized") {
    return { ok: false, httpStatus: 409, outcome: "pending", error: "Razorpay has not captured this payment yet." };
  }
  if (payment?.id && payment.id !== input.paymentId) {
    return { ok: false, httpStatus: 400, outcome: "mismatch", error: "Razorpay returned a different payment." };
  }

  return {
    ok: true,
    payment: {
      paymentId: input.paymentId,
      paymentLinkId: expectedLinkId,
      referenceId: input.referenceId || "",
      amountPaise,
      currency,
      status: paymentStatus,
      email: payment?.email ? String(payment.email).toLowerCase() : undefined,
    },
  };
}

function resolveIntent(intentId: string | undefined, email: string | undefined): PaymentIntent | undefined {
  if (intentId) {
    const byId = db.getPaymentIntent(intentId);
    if (byId) return byId;
  }
  if (email) return db.findLatestPendingIntentByEmail(email);
  return undefined;
}

export function grantVerifiedPayment(payment: ConfirmedRazorpayPayment, intentId?: string): {
  httpStatus: number;
  body: Record<string, unknown>;
} {
  const existing = db.findCreditByPaymentRef(payment.paymentId);
  const intent = resolveIntent(intentId, payment.email);

  if (existing) {
    const sameOrder = intent && (existing.orderId === intent.id || existing.userId === intent.userId);
    if (sameOrder) {
      if (intent && intent.status !== "paid") {
        db.updatePaymentIntent(intent.id, {
          status: "paid",
          paymentId: payment.paymentId,
          paymentLinkId: payment.paymentLinkId,
          referenceId: payment.referenceId,
          paidAt: intent.paidAt || new Date().toISOString(),
        });
      }
      const profile = db.getProfile(existing.userId);
      return {
        httpStatus: 200,
        body: {
          success: true,
          verified: true,
          paid: true,
          alreadyProcessed: true,
          orderId: existing.orderId || intent?.id,
          paymentRef: payment.paymentId,
          tokenBalance: profile?.tokens ?? 0,
          tokensAdded: existing.amount,
          nextUrl: "/dashboard",
          message: "This payment was already verified. Your access is unchanged.",
        },
      };
    }
    return {
      httpStatus: 409,
      body: {
        success: false,
        verified: false,
        paid: false,
        error: "This payment is already linked to another order. Access was not granted again.",
      },
    };
  }

  if (!intent || intent.status === "cancelled" || intent.status === "failed" || intent.status === "mismatch") {
    return {
      httpStatus: 409,
      body: {
        success: false,
        verified: true,
        paid: false,
        unmatched: true,
        paymentRef: payment.paymentId,
        error: "Razorpay confirmed the payment, but it could not be matched to a checkout started in this browser. Access has not been granted. Start checkout again from the payment page on this device, or contact support with the payment ID.",
      },
    };
  }

  if (intent.status === "paid" && intent.paymentId && intent.paymentId !== payment.paymentId) {
    return {
      httpStatus: 409,
      body: {
        success: false,
        verified: false,
        paid: false,
        error: "This checkout was already completed with a different payment.",
      },
    };
  }

  if (intent.amountPaise !== payment.amountPaise || intent.currency !== payment.currency) {
    db.updatePaymentIntent(intent.id, { status: "mismatch", paymentId: payment.paymentId, failureReason: "amount_or_currency" });
    return {
      httpStatus: 400,
      body: {
        success: false,
        verified: false,
        paid: false,
        error: "The paid amount does not match this checkout. Access has not been granted.",
      },
    };
  }

  const tokensToCredit = PAYMENT_CONFIG.amountRupees;
  const credit = db.addTokens({
    userId: intent.userId,
    tokens: tokensToCredit,
    rupees: tokensToCredit,
    paymentRef: payment.paymentId,
    orderId: intent.id,
    examId: intent.examId,
    description: `Razorpay payment page verified (${OFFICIAL_RAZORPAY_PAYMENT_URL}): credited ${tokensToCredit} tokens`,
  });

  db.grantEntitlement({
    userId: intent.userId,
    tier: "semester",
    durationDays: 180,
    orderId: intent.id,
    paymentRef: payment.paymentId,
  });

  db.updatePaymentIntent(intent.id, {
    status: "paid",
    paymentId: payment.paymentId,
    paymentLinkId: payment.paymentLinkId,
    referenceId: payment.referenceId,
    paidAt: new Date().toISOString(),
  });

  return {
    httpStatus: 200,
    body: {
      success: true,
      verified: true,
      paid: true,
      alreadyProcessed: false,
      orderId: intent.id,
      paymentRef: payment.paymentId,
      tokenBalance: credit.newBalance,
      tokensAdded: tokensToCredit,
      examUnlocked: Boolean(intent.examId),
      examId: intent.examId || null,
      transaction: credit.transaction,
      nextUrl: "/dashboard",
      message: `Payment verified. Credited ${tokensToCredit} tokens.`,
    },
  };
}

export function markIntentFromBrowser(intentId: string | undefined, status: "failed" | "cancelled" | "pending" | "mismatch", reason: string) {
  if (!intentId) return;
  const intent = db.getPaymentIntent(intentId);
  if (!intent || intent.status === "paid") return;
  db.updatePaymentIntent(intentId, { status, failureReason: reason });
}
