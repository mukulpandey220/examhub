import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PAYMENT_INTENT_COOKIE } from "@/lib/payments/razorpay-link";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const intentId = req.cookies.get(PAYMENT_INTENT_COOKIE)?.value;
  if (!intentId) {
    return NextResponse.json({
      paid: false,
      status: "none",
      message: "No checkout is in progress in this browser. Access has not been granted.",
    });
  }

  const intent = db.getPaymentIntent(intentId);
  if (!intent) {
    return NextResponse.json({
      paid: false,
      status: "none",
      message: "This checkout could not be found. Access has not been granted.",
    });
  }

  if (intent.status === "paid") {
    const profile = db.getProfile(intent.userId);
    return NextResponse.json({
      paid: true,
      status: "paid",
      orderId: intent.id,
      paymentRef: intent.paymentId,
      tokenBalance: profile?.tokens ?? 0,
      nextUrl: "/dashboard",
      message: "Payment verified. You can continue.",
    });
  }

  const message = intent.status === "pending"
    ? "Payment is still pending. Access has not been granted."
    : "Payment was not confirmed. Access has not been granted.";

  return NextResponse.json({
    paid: false,
    status: intent.status,
    orderId: intent.id,
    message,
  });
}
