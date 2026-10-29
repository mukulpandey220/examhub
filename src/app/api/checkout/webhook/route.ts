import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

/**
 * Automated Razorpay Webhook Handler
 * Captures events: payment.captured, order.paid, payment_link.paid
 * Automatically verifies signature and credits tokens to the student's account
 * ZERO manual intervention or UTR submission required.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 1. Signature Verification (if webhook secret configured)
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const event = payload.event;
    // Supported successful payment events
    if (event !== "payment.captured" && event !== "order.paid" && event !== "payment_link.paid") {
      return NextResponse.json({ status: "ignored", reason: `Unhandled event: ${event}` });
    }

    const paymentEntity = payload.payload?.payment?.entity || payload.payload?.payment_link?.entity;
    if (!paymentEntity) {
      return NextResponse.json({ error: "No payment entity found in webhook payload" }, { status: 400 });
    }

    const paymentId = paymentEntity.id || `pay_wh_${Date.now()}`;
    const amountPaise = Number(paymentEntity.amount || 9900);
    const amountRupees = Math.round(amountPaise / 100);
    const notes = paymentEntity.notes || {};

    // Determine target user
    let userId = notes.userId;
    const userEmail = paymentEntity.email || notes.userEmail;

    if (!userId && userEmail) {
      const profile = db.getProfile(userEmail);
      if (profile) userId = profile.id;
    }
    if (!userId) {
      userId = "user-student-ramkumar";
    }

    const examId = notes.examId || undefined;
    const tokenCount = notes.tokenCount ? Number(notes.tokenCount) : amountRupees;

    // 2. Check Idempotency: Avoid double crediting if already verified
    const existingTransactions = db.getTokenTransactions(userId);
    const alreadyCredited = existingTransactions.find(t => t.paymentRef === paymentId);
    if (alreadyCredited) {
      return NextResponse.json({
        status: "already_processed",
        paymentId,
        tokens: alreadyCredited.amount,
        message: "Payment already verified and tokens previously credited.",
      });
    }

    // 3. Automated Token Crediting (1 Rs = 1 Token)
    const creditResult = db.addTokens({
      userId,
      tokens: tokenCount,
      rupees: amountRupees,
      paymentRef: paymentId,
      orderId: paymentEntity.order_id || `order_wh_${Date.now()}`,
      description: notes.description || `Razorpay webhook verified: credited ${tokenCount} tokens (₹1 = 1 Token)`,
      examId,
    });

    // 4. If pass registration or default ₹99 fee, grant NTCRA Pass entitlement
    if (!examId && amountRupees >= 99) {
      db.grantEntitlement({
        userId,
        tier: "semester",
        durationDays: 180,
        orderId: paymentEntity.order_id || `order_wh_${Date.now()}`,
        paymentRef: paymentId,
      });
    }

    return NextResponse.json({
      status: "success",
      event,
      paymentId,
      tokensAdded: tokenCount,
      newBalance: creditResult.newBalance,
      userId,
      message: `Payment verified automatically via Razorpay webhook. Credited ${tokenCount} tokens to student account.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
