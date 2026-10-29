import { NextRequest, NextResponse } from "next/server";
import { getPlanById } from "@/data/pricing";
import { db } from "@/lib/db";
import { getExamById as getInitialExamById } from "@/data/exams";
import { OFFICIAL_RAZORPAY_PAYMENT_URL, PAYMENT_CONFIG } from "@/config/payment";
import { EXPECTED_AMOUNT_PAISE, PAYMENT_INTENT_COOKIE } from "@/lib/payments/razorpay-link";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      examId,
      planId,
      userId = "user-student-ramkumar",
      userEmail = "ramkumar.malothu@nyeras.com",
    } = body;

    let purpose: "ntcra_pass" | "exam" | "plan" | "tokens" = "ntcra_pass";
    let resolvedExamId: string | undefined;
    let resolvedPlanId: string | undefined;

    if (examId) {
      const examData = db.getExamById(examId) || getInitialExamById(examId);
      if (!examData) {
        return NextResponse.json({ error: "Examination not found" }, { status: 404 });
      }
      if (examData.isFreeSample || (examData.feeRupees === 0 && examData.tokenFee === 0)) {
        return NextResponse.json({
          orderId: `order_free_${Date.now()}`,
          amountPaise: 0,
          amountRupees: 0,
          tokenCount: 0,
          currency: "INR",
          examId: examData.id,
          examTitle: examData.title,
          isFree: true,
          mode: "free_access",
          portalUrl: null,
        });
      }
      purpose = "exam";
      resolvedExamId = examData.id;
    } else if (planId) {
      const planData = getPlanById(planId);
      if (!planData) {
        return NextResponse.json({ error: "Invalid pricing plan selected" }, { status: 404 });
      }
      if (planData.tier === "free" || planData.priceRupees === 0) {
        return NextResponse.json({
          orderId: `order_free_${Date.now()}`,
          amountPaise: 0,
          amountRupees: 0,
          tokenCount: 0,
          currency: "INR",
          plan: planData,
          isFree: true,
          mode: "free_access",
          portalUrl: null,
        });
      }
      purpose = "plan";
      resolvedPlanId = planData.id;
    } else if (body.tokenCount || body.amountRupees) {
      purpose = "tokens";
    }

    const intent = db.createPaymentIntent({
      userId: String(userId),
      userEmail: String(userEmail),
      amountPaise: EXPECTED_AMOUNT_PAISE,
      currency: "INR",
      purpose,
      planId: resolvedPlanId,
      examId: resolvedExamId,
    });

    const response = NextResponse.json({
      orderId: intent.id,
      amountPaise: EXPECTED_AMOUNT_PAISE,
      amountRupees: PAYMENT_CONFIG.amountRupees,
      tokenCount: PAYMENT_CONFIG.amountRupees,
      tokenRate: PAYMENT_CONFIG.tokenRate,
      currency: "INR",
      description: `${PAYMENT_CONFIG.title} via ${OFFICIAL_RAZORPAY_PAYMENT_URL}`,
      examId: resolvedExamId,
      planId: resolvedPlanId,
      status: "pending",
      mode: "payment_link",
      portalUrl: OFFICIAL_RAZORPAY_PAYMENT_URL,
    });

    response.cookies.set(PAYMENT_INTENT_COOKIE, intent.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 6,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to start checkout" }, { status: 500 });
  }
}
