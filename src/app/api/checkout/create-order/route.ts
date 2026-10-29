import { NextRequest, NextResponse } from "next/server";
import { getPlanById } from "@/data/pricing";
import { db } from "@/lib/db";
import { getExamById as getInitialExamById } from "@/data/exams";
import { OFFICIAL_RAZORPAY_PAYMENT_URL } from "@/config/payment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { 
      examId, 
      tokenCount, 
      amountRupees: customRupees, 
      planId, 
      userId = "user-student-ramkumar", 
      userEmail = "ramkumar.malothu@nyeras.com" 
    } = body;

    let orderId = "";
    let amountRupees = 0;
    let tokenCountCalculated = 0;
    let description = "";
    let examData: any = null;
    let planData: any = null;

    // 1. Exam Fee Mode (Price dynamically regarding the exam fee, 1 Rs = 1 Token)
    if (examId) {
      examData = db.getExamById(examId) || getInitialExamById(examId);
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
        });
      }

      amountRupees = examData.feeRupees ?? examData.tokenFee ?? 99;
      tokenCountCalculated = amountRupees; // Strict 1 Rs = 1 Token parity
      description = `Exam Fee: ${examData.title} (${amountRupees} Tokens @ ₹1/token)`;
      orderId = `order_exam_${examData.id.replace(/[^a-zA-Z0-9_-]/g, '')}_${Date.now()}`;
    }
    // 2. Direct Token Wallet Top-up (1 Rs = 1 Token)
    else if (tokenCount || customRupees) {
      const requested = Number(tokenCount || customRupees);
      if (isNaN(requested) || requested <= 0) {
        return NextResponse.json({ error: "Invalid token or amount value" }, { status: 400 });
      }
      amountRupees = Math.round(requested);
      tokenCountCalculated = amountRupees; // Strict 1 Rs = 1 Token parity
      description = `Dashboard Token Wallet Top Up: ${tokenCountCalculated} Tokens (₹1 = 1 Token)`;
      orderId = `order_token_${tokenCountCalculated}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }
    // 3. Subscription Plan Mode
    else if (planId) {
      planData = getPlanById(planId);
      if (!planData) {
        return NextResponse.json({ error: "Invalid pricing plan selected" }, { status: 404 });
      }

      if (planData.tier === "free") {
        return NextResponse.json({
          orderId: `order_free_${Date.now()}`,
          amountPaise: 0,
          amountRupees: 0,
          tokenCount: 0,
          currency: "INR",
          plan: planData,
          isFree: true,
          mode: "free_access",
        });
      }

      amountRupees = planData.priceRupees;
      tokenCountCalculated = amountRupees;
      description = `${planData.name} (${planData.durationLabel})`;
      orderId = `order_${planData.tier}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    } else {
      // Default to NTCRA National Pass registration (₹99 / 99 tokens)
      amountRupees = 99;
      tokenCountCalculated = 99;
      description = "NTCRA Registration Pass (99 Tokens @ ₹1/token)";
      orderId = `order_ntcra_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }

    // Strict integer paise representation (₹1 = 1 Token = 100 Paise)
    const amountPaise = amountRupees * 100;

    // Check if live Razorpay keys are configured
    const rzpKey = process.env.RAZORPAY_KEY_ID;
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
    const isLiveGateway = !!rzpKey && rzpKey !== "rzp_test_exampleKey123" && !rzpKey.includes("demo") && !!rzpSecret;

    let liveOrderId = orderId;
    if (isLiveGateway) {
      try {
        const authHeader = "Basic " + Buffer.from(`${rzpKey}:${rzpSecret}`).toString("base64");
        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            amount: amountPaise,
            currency: "INR",
            receipt: orderId.substring(0, 40),
            notes: {
              userId,
              examId: examData?.id || "",
              tokenCount: tokenCountCalculated,
            }
          }),
        });

        if (rzpRes.ok) {
          const rzpData = await rzpRes.json();
          if (rzpData.id) {
            liveOrderId = rzpData.id;
          }
        }
      } catch (err) {
        // Fallback to deterministic receipt id
      }
    }

    return NextResponse.json({
      orderId: liveOrderId,
      amountPaise,
      amountRupees,
      tokenCount: tokenCountCalculated,
      tokenRate: "1 INR = 1 Token",
      currency: "INR",
      description,
      examId: examData?.id,
      examTitle: examData?.title,
      planId: planData?.id,
      planName: planData?.name,
      isLiveGateway,
      mode: isLiveGateway ? "live" : "test_mode",
      keyId: rzpKey || "rzp_test_demo_mode",
      portalUrl: OFFICIAL_RAZORPAY_PAYMENT_URL,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
