import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { POST as verifyPaymentHandler } from "@/app/api/checkout/verify-payment/route";
import { POST as createOrderHandler } from "@/app/api/checkout/create-order/route";
import { POST as webhookHandler } from "@/app/api/checkout/webhook/route";
import { NextRequest } from "next/server";

describe("Automated Payment & Token Crediting System (Zero Manual UTR)", () => {
  const testStudentId = "test-auto-student-101";

  beforeEach(() => {
    // Initialize test student profile
    db.updateProfile(testStudentId, {
      tokens: 0,
      unlockedExams: [],
    });
  });

  // TEST 1: Automated Order Creation without requiring manual target
  it("should create an automated Razorpay order defaulting to NTCRA Pass (₹99 / 99 tokens)", async () => {
    const req = new NextRequest("http://localhost:3000/api/checkout/create-order", {
      method: "POST",
      body: JSON.stringify({
        userId: testStudentId,
        userEmail: "test@student.edu",
      }),
    });

    const res = await createOrderHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.amountRupees).toBe(99);
    expect(data.tokenCount).toBe(99);
    expect(data.amountPaise).toBe(9900);
    expect(data.orderId).toBeDefined();
  });

  // TEST 2: Automated Payment Verification & Instant Token Crediting
  it("should automatically verify payment and credit tokens directly to student account with zero manual UTR", async () => {
    const initialTokens = db.getUserTokens(testStudentId);
    expect(initialTokens).toBe(0);

    const paymentId = `pay_auto_verified_${Date.now()}`;
    const orderId = `order_auto_${Date.now()}`;

    const req = new NextRequest("http://localhost:3000/api/checkout/verify-payment", {
      method: "POST",
      body: JSON.stringify({
        orderId,
        paymentId,
        tokenCount: 99,
        amountRupees: 99,
        userId: testStudentId,
        isTestModeApproved: true,
      }),
    });

    const res = await verifyPaymentHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.verified).toBe(true);
    expect(data.tokensAdded).toBe(99);
    expect(data.tokenBalance).toBe(99);

    // Verify database reflection
    expect(db.getUserTokens(testStudentId)).toBe(99);

    const txs = db.getTokenTransactions(testStudentId);
    expect(txs.length).toBeGreaterThanOrEqual(1);
    expect(txs[0].paymentRef).toBe(paymentId);
    expect(txs[0].amount).toBe(99);
    expect(txs[0].type).toBe("credit");
  });

  // TEST 3: Idempotency Protection (Zero Double Crediting)
  it("should prevent duplicate token crediting if the same payment ID is verified again", async () => {
    const paymentId = `pay_idempotent_test_${Date.now()}`;
    const orderId = `order_idemp_${Date.now()}`;

    // First automated verification
    const req1 = new NextRequest("http://localhost:3000/api/checkout/verify-payment", {
      method: "POST",
      body: JSON.stringify({
        orderId,
        paymentId,
        tokenCount: 99,
        amountRupees: 99,
        userId: testStudentId,
        isTestModeApproved: true,
      }),
    });
    const res1 = await verifyPaymentHandler(req1);
    const data1 = await res1.json();
    expect(data1.success).toBe(true);
    expect(data1.tokensAdded).toBe(99);
    expect(db.getUserTokens(testStudentId)).toBe(99);

    // Duplicate call with same payment ID (e.g. page refresh or concurrent webhook)
    const req2 = new NextRequest("http://localhost:3000/api/checkout/verify-payment", {
      method: "POST",
      body: JSON.stringify({
        orderId,
        paymentId,
        tokenCount: 99,
        amountRupees: 99,
        userId: testStudentId,
        isTestModeApproved: true,
      }),
    });
    const res2 = await verifyPaymentHandler(req2);
    const data2 = await res2.json();
    expect(data2.success).toBe(true);
    expect(data2.alreadyProcessed).toBe(true);
    expect(data2.tokenBalance).toBe(99); // Balance stays 99, no duplicate +99 added!
    expect(db.getUserTokens(testStudentId)).toBe(99);
  });

  // TEST 4: Automated Razorpay Webhook Token Crediting
  it("should process Razorpay payment.captured webhook and credit tokens automatically", async () => {
    const webhookPaymentId = `pay_wh_live_${Date.now()}`;

    const webhookPayload = {
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: webhookPaymentId,
            amount: 9900, // ₹99
            currency: "INR",
            status: "captured",
            order_id: `order_rzp_${Date.now()}`,
            notes: {
              userId: testStudentId,
              tokenCount: "99",
            },
          },
        },
      },
    };

    const req = new NextRequest("http://localhost:3000/api/checkout/webhook", {
      method: "POST",
      body: JSON.stringify(webhookPayload),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const res = await webhookHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("success");
    expect(data.tokensAdded).toBe(99);
    expect(data.newBalance).toBe(99);

    // Verify student account tokens in DB
    expect(db.getUserTokens(testStudentId)).toBe(99);
  });

  // TEST 5: Automated Exam Payment and Unlock with Strict Parity
  it("should automatically credit tokens and unlock exam on payment", async () => {
    const examPaymentId = `pay_exam_unlock_${Date.now()}`;
    const targetExamId = "exam-dsa-system-design-mock-01";

    const req = new NextRequest("http://localhost:3000/api/checkout/verify-payment", {
      method: "POST",
      body: JSON.stringify({
        examId: targetExamId,
        userId: testStudentId,
        paymentId: examPaymentId,
        isTestModeApproved: true,
      }),
    });

    const res = await verifyPaymentHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.examUnlocked).toBe(true);
    expect(data.tokensAdded).toBe(99); // 1 Rs = 1 Token parity

    // Verify exam is unlocked for student
    const isUnlocked = db.isExamUnlockedForUser(testStudentId, targetExamId);
    expect(isUnlocked).toBe(true);
  });
});
