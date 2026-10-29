import { NextRequest, NextResponse } from "next/server";
import {
  PAYMENT_INTENT_COOKIE,
  confirmPaymentLinkWithApi,
  grantVerifiedPayment,
  markIntentFromBrowser,
} from "@/lib/payments/razorpay-link";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const paymentId = String(body.razorpay_payment_id || "").trim();
    const paymentLinkId = String(body.razorpay_payment_link_id || "").trim();
    const referenceId = String(body.razorpay_payment_link_reference_id || "");
    const linkStatus = String(body.razorpay_payment_link_status || body.status || "").trim();
    const signature = String(body.razorpay_signature || "").trim();
    const intentId = req.cookies.get(PAYMENT_INTENT_COOKIE)?.value;

    const normalizedStatus = linkStatus.toLowerCase();
    if (normalizedStatus === "cancelled" || normalizedStatus === "failed" || normalizedStatus === "expired") {
      markIntentFromBrowser(intentId, normalizedStatus === "expired" ? "failed" : "cancelled", normalizedStatus);
      return NextResponse.json({
        success: false,
        verified: false,
        paid: false,
        error: "Payment was cancelled or failed. Access has not been granted.",
      }, { status: 400 });
    }

    if (!paymentId || !paymentLinkId || !signature) {
      return NextResponse.json({
        success: false,
        verified: false,
        paid: false,
        error: "Razorpay did not return a payment link signature. Access has not been granted.",
      }, { status: 400 });
    }

    const confirmed = await confirmPaymentLinkWithApi({
      paymentId,
      paymentLinkId,
      referenceId,
      linkStatus,
      signature,
    });

    if (!confirmed.ok) {
      if (intentId && confirmed.outcome !== "pending") {
        markIntentFromBrowser(
          intentId,
          confirmed.outcome === "mismatch" ? "mismatch" : "failed",
          confirmed.error
        );
      }
      return NextResponse.json({
        success: false,
        verified: false,
        paid: false,
        error: confirmed.error,
      }, { status: confirmed.httpStatus });
    }

    const granted = grantVerifiedPayment(confirmed.payment, intentId);
    return NextResponse.json(granted.body, { status: granted.httpStatus });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      verified: false,
      paid: false,
      error: err.message || "Payment verification failed. Access has not been granted.",
    }, { status: 500 });
  }
}
