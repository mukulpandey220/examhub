import { afterEach, beforeEach, describe, expect, it } from "vitest";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { OFFICIAL_RAZORPAY_PAYMENT_URL } from "@/config/payment";
import { PAYMENT_INTENT_COOKIE, paymentLinkSignature } from "@/lib/payments/razorpay-link";
import { POST as verifyPaymentHandler } from "@/app/api/checkout/verify-payment/route";
import { POST as createOrderHandler } from "@/app/api/checkout/create-order/route";
import { POST as webhookHandler } from "@/app/api/checkout/webhook/route";
import { GET as paymentStatusHandler } from "@/app/api/checkout/payment-status/route";
import { POST as authHandler } from "@/app/api/auth/route";
import { POST as startExamHandler } from "@/app/api/assessments/exams/[examId]/start/route";

const SECRET = "test_secret_value";
const WEBHOOK_SECRET = "whsec_test_value";
const LINK_ID = "plink_CkGK3Dv";
const STUDENT = "test-auto-student-101";
const EMAIL = "payer@student.edu";

const originalEnv = {
  key: process.env.RAZORPAY_KEY_ID,
  secret: process.env.RAZORPAY_KEY_SECRET,
  webhook: process.env.RAZORPAY_WEBHOOK_SECRET,
  link: process.env.RAZORPAY_PAYMENT_LINK_ID,
};
const originalFetch = global.fetch;

function signLink(paymentId: string, status = "paid", paymentLinkId = LINK_ID, referenceId = "ref_ntcra") {
  return paymentLinkSignature(SECRET, {
    paymentLinkId,
    referenceId,
    status,
    paymentId,
  });
}

function mockRazorpay(payment: Record<string, unknown>, link: Record<string, unknown>) {
  global.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/payments/")) {
      return new Response(JSON.stringify(payment), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.includes("/payment_links/")) {
      return new Response(JSON.stringify(link), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: { description: `unexpected ${url}` } }), { status: 404 });
  }) as typeof fetch;
}

function paidFixtures(paymentId: string) {
  return {
    payment: {
      id: paymentId,
      amount: 9900,
      currency: "INR",
      status: "captured",
      email: EMAIL,
    },
    link: {
      id: LINK_ID,
      short_url: OFFICIAL_RAZORPAY_PAYMENT_URL,
      amount: 9900,
      currency: "INR",
      status: "paid",
      payments: [{ payment_id: paymentId, amount: 9900, status: "captured" }],
    },
  };
}

async function startCheckout() {
  const req = new NextRequest("http://localhost:3000/api/checkout/create-order", {
    method: "POST",
    body: JSON.stringify({ userId: STUDENT, userEmail: EMAIL }),
  });
  const res = await createOrderHandler(req);
  const data = await res.json();
  return { res, data };
}

function verifyRequest(orderId: string, body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/checkout/verify-payment", {
    method: "POST",
    headers: { cookie: `${PAYMENT_INTENT_COOKIE}=${orderId}` },
    body: JSON.stringify(body),
  });
}

describe("Razorpay payment link verification", () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_examhub";
    process.env.RAZORPAY_KEY_SECRET = SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.RAZORPAY_PAYMENT_LINK_ID = LINK_ID;
    db.updateProfile(STUDENT, { tokens: 0, unlockedExams: [], email: EMAIL, name: "Test Student" });
  });

  afterEach(() => {
    process.env.RAZORPAY_KEY_ID = originalEnv.key;
    process.env.RAZORPAY_KEY_SECRET = originalEnv.secret;
    process.env.RAZORPAY_WEBHOOK_SECRET = originalEnv.webhook;
    process.env.RAZORPAY_PAYMENT_LINK_ID = originalEnv.link;
    global.fetch = originalFetch;
  });

  it("creates a pending checkout for the existing Razorpay page and does not grant access", async () => {
    const { res, data } = await startCheckout();
    expect(res.status).toBe(200);
    expect(data.portalUrl).toBe(OFFICIAL_RAZORPAY_PAYMENT_URL);
    expect(data.amountPaise).toBe(9900);
    expect(data.amountRupees).toBe(99);
    expect(data.status).toBe("pending");
    expect(res.cookies.get(PAYMENT_INTENT_COOKIE)?.value).toBe(data.orderId);
    expect(db.getPaymentIntent(data.orderId)?.status).toBe("pending");
    expect(db.getUserTokens(STUDENT)).toBe(0);
  });

  it("rejects a payment that is not signed by Razorpay", async () => {
    const { data } = await startCheckout();
    const res = await verifyPaymentHandler(verifyRequest(data.orderId, {
      razorpay_payment_id: "pay_fake",
      razorpay_payment_link_id: LINK_ID,
      razorpay_payment_link_reference_id: "ref_ntcra",
      razorpay_payment_link_status: "paid",
      razorpay_signature: "not-a-real-signature",
      isTestModeApproved: true,
      tokenCount: 99,
      userId: STUDENT,
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.paid).toBe(false);
    expect(db.getUserTokens(STUDENT)).toBe(0);
  });

  it("rejects a signed callback for a different payment link", async () => {
    const { data } = await startCheckout();
    const paymentId = `pay_other_link_${Date.now()}`;
    const res = await verifyPaymentHandler(verifyRequest(data.orderId, {
      razorpay_payment_id: paymentId,
      razorpay_payment_link_id: "plink_someone_else",
      razorpay_payment_link_reference_id: "ref_ntcra",
      razorpay_payment_link_status: "paid",
      razorpay_signature: signLink(paymentId, "paid", "plink_someone_else"),
    }));
    expect(res.status).toBe(400);
    expect(db.getUserTokens(STUDENT)).toBe(0);
  });

  it("does not grant access for a cancelled or pending payment", async () => {
    const { data } = await startCheckout();
    const cancelled = await verifyPaymentHandler(verifyRequest(data.orderId, {
      razorpay_payment_link_status: "cancelled",
    }));
    expect(cancelled.status).toBe(400);
    expect(db.getPaymentIntent(data.orderId)?.status).toBe("cancelled");

    const { data: pendingOrder } = await startCheckout();
    const pending = await verifyPaymentHandler(verifyRequest(pendingOrder.orderId, {
      razorpay_payment_id: "pay_pending",
      razorpay_payment_link_id: LINK_ID,
      razorpay_payment_link_reference_id: "ref_ntcra",
      razorpay_payment_link_status: "created",
      razorpay_signature: signLink("pay_pending", "created"),
    }));
    expect(pending.status).toBe(409);
    expect(db.getUserTokens(STUDENT)).toBe(0);
  });

  it("rejects a signed payment whose captured amount does not match ₹99", async () => {
    const { data } = await startCheckout();
    const paymentId = `pay_wrong_amount_${Date.now()}`;
    const fixtures = paidFixtures(paymentId);
    fixtures.payment.amount = 2900;
    mockRazorpay(fixtures.payment, fixtures.link);
    const res = await verifyPaymentHandler(verifyRequest(data.orderId, {
      razorpay_payment_id: paymentId,
      razorpay_payment_link_id: LINK_ID,
      razorpay_payment_link_reference_id: "ref_ntcra",
      razorpay_payment_link_status: "paid",
      razorpay_signature: signLink(paymentId),
    }));
    expect(res.status).toBe(400);
    expect(db.getUserTokens(STUDENT)).toBe(0);
    expect(db.getPaymentIntent(data.orderId)?.status).not.toBe("paid");
  });

  it("verifies a captured ₹99 payment, grants access once, and stays idempotent on refresh", async () => {
    const { data } = await startCheckout();
    const paymentId = `pay_ok_${Date.now()}`;
    const fixtures = paidFixtures(paymentId);
    mockRazorpay(fixtures.payment, fixtures.link);
    const payload = {
      razorpay_payment_id: paymentId,
      razorpay_payment_link_id: LINK_ID,
      razorpay_payment_link_reference_id: "ref_ntcra",
      razorpay_payment_link_status: "paid",
      razorpay_signature: signLink(paymentId),
    };

    const first = await verifyPaymentHandler(verifyRequest(data.orderId, payload));
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.paid).toBe(true);
    expect(firstBody.tokensAdded).toBe(99);
    expect(firstBody.nextUrl).toBe("/dashboard");
    expect(db.getUserTokens(STUDENT)).toBe(99);
    expect(db.getPaymentIntent(data.orderId)?.status).toBe("paid");
    expect(db.getEntitlements(STUDENT).length).toBeGreaterThan(0);

    const second = await verifyPaymentHandler(verifyRequest(data.orderId, payload));
    expect(second.status).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.alreadyProcessed).toBe(true);
    expect(db.getUserTokens(STUDENT)).toBe(99);

    const status = await paymentStatusHandler(new NextRequest("http://localhost:3000/api/checkout/payment-status", {
      headers: { cookie: `${PAYMENT_INTENT_COOKIE}=${data.orderId}` },
    }));
    const statusBody = await status.json();
    expect(statusBody.paid).toBe(true);
  });

  it("does not show a paid status for a direct visit without a verified order", async () => {
    const status = await paymentStatusHandler(new NextRequest("http://localhost:3000/api/checkout/payment-status"));
    const body = await status.json();
    expect(body.paid).toBe(false);

    const missing = db.getPaymentIntent("ord_forged_success");
    expect(missing).toBeUndefined();
  });

  it("blocks a paid exam when the student has no verified payment", async () => {
    const blockedUser = `pay-gate-${Date.now()}`;
    db.updateProfile(blockedUser, { tokens: 0, unlockedExams: [], email: "blocked@student.edu" });
    const res = await startExamHandler(
      new NextRequest("http://localhost:3000/api/assessments/exams/exam-dsa-system-design-mock-01/start", {
        method: "POST",
        body: JSON.stringify({ userId: blockedUser }),
      }),
      { params: { examId: "exam-dsa-system-design-mock-01" } }
    );
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.requiresPayment).toBe(true);
  });

  it("rejects client attempts to confirm a payment without Razorpay", async () => {
    const res = await authHandler(new NextRequest("http://localhost:3000/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "confirm_payment", userId: STUDENT, paymentRef: "pay_typed" }),
    }));
    expect(res.status).toBe(403);
    expect(db.getUserTokens(STUDENT)).toBe(0);
  });

  it("credits a signed payment_link.paid webhook once and ignores repeats", async () => {
    const { data } = await startCheckout();
    const paymentId = `pay_wh_${Date.now()}`;
    const fixtures = paidFixtures(paymentId);
    mockRazorpay(fixtures.payment, fixtures.link);
    const payload = {
      event: "payment_link.paid",
      payload: {
        payment_link: {
          entity: {
            id: LINK_ID,
            short_url: OFFICIAL_RAZORPAY_PAYMENT_URL,
            amount: 9900,
            currency: "INR",
            status: "paid",
            reference_id: "ref_ntcra",
          },
        },
        payment: {
          entity: {
            id: paymentId,
            amount: 9900,
            currency: "INR",
            status: "captured",
            email: EMAIL,
          },
        },
      },
    };
    const raw = JSON.stringify(payload);
    const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
    const send = () => webhookHandler(new NextRequest("http://localhost:3000/api/checkout/webhook", {
      method: "POST",
      body: raw,
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": signature,
      },
    }));

    const first = await send();
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.paid).toBe(true);
    expect(db.getUserTokens(STUDENT)).toBe(99);
    expect(db.getPaymentIntent(data.orderId)?.status).toBe("paid");

    const second = await send();
    expect(second.status).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.alreadyProcessed).toBe(true);
    expect(db.getUserTokens(STUDENT)).toBe(99);
  });

  it("rejects a webhook with a bad signature, a missing secret, or an unrelated event", async () => {
    const { data } = await startCheckout();
    const raw = JSON.stringify({
      event: "payment_link.paid",
      payload: {
        payment_link: { entity: { id: LINK_ID, short_url: OFFICIAL_RAZORPAY_PAYMENT_URL } },
        payment: { entity: { id: "pay_bad_sig", amount: 9900, currency: "INR", status: "captured", email: EMAIL } },
      },
    });
    const bad = await webhookHandler(new NextRequest("http://localhost:3000/api/checkout/webhook", {
      method: "POST",
      body: raw,
      headers: { "x-razorpay-signature": "deadbeef" },
    }));
    expect(bad.status).toBe(400);

    const capturedRaw = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_cap", amount: 9900 } } } });
    const capturedSig = crypto.createHmac("sha256", WEBHOOK_SECRET).update(capturedRaw).digest("hex");
    const ignored = await webhookHandler(new NextRequest("http://localhost:3000/api/checkout/webhook", {
      method: "POST",
      body: capturedRaw,
      headers: { "x-razorpay-signature": capturedSig },
    }));
    expect(ignored.status).toBe(200);
    const ignoredBody = await ignored.json();
    expect(ignoredBody.status).toBe("ignored");

    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    const unconfigured = await webhookHandler(new NextRequest("http://localhost:3000/api/checkout/webhook", {
      method: "POST",
      body: raw,
      headers: { "x-razorpay-signature": "anything" },
    }));
    expect(unconfigured.status).toBe(503);
    expect(db.getUserTokens(STUDENT)).toBe(0);
    expect(db.getPaymentIntent(data.orderId)?.status).toBe("pending");
  });

  it("does not grant access when an otherwise valid payment cannot be matched to a checkout", async () => {
    const paymentId = `pay_unmatched_${Date.now()}`;
    const fixtures = paidFixtures(paymentId);
    fixtures.payment.email = "stranger@example.com";
    mockRazorpay(fixtures.payment, fixtures.link);
    const payload = {
      event: "payment_link.paid",
      payload: {
        payment_link: { entity: { id: LINK_ID, short_url: OFFICIAL_RAZORPAY_PAYMENT_URL, reference_id: "ref_ntcra" } },
        payment: { entity: { id: paymentId, amount: 9900, currency: "INR", status: "captured", email: "stranger@example.com" } },
      },
    };
    const raw = JSON.stringify(payload);
    const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
    const res = await webhookHandler(new NextRequest("http://localhost:3000/api/checkout/webhook", {
      method: "POST",
      body: raw,
      headers: { "x-razorpay-signature": signature },
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("unmatched");
    expect(body.paid).toBe(false);
    expect(db.findCreditByPaymentRef(paymentId)).toBeUndefined();
  });
});
