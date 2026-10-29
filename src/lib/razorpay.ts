import { OFFICIAL_RAZORPAY_PAYMENT_URL } from "@/config/payment";

/**
 * Opens the existing Razorpay payment page after the server records a pending checkout.
 * Tokens and exam access are granted only when /payment/callback verifies the payment.
 */

export interface RazorpayPaymentOptions {
  amountRupees?: number;
  tokenCount?: number;
  examId?: string;
  examTitle?: string;
  planId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  description?: string;
  onSuccess?: (result: {
    tokenBalance: number;
    tokensAdded: number;
    paymentRef: string;
    transaction?: any;
    examUnlocked?: boolean;
    message?: string;
  }) => void;
  onError?: (errorMessage: string) => void;
  onDismiss?: () => void;
}

export function loadRazorpayScript(): Promise<boolean> {
  return Promise.resolve(false);
}

export async function executeAutomatedRazorpayPayment(options: RazorpayPaymentOptions) {
  const {
    examId,
    planId,
    userId = "user-student-ramkumar",
    userName,
    userEmail = "ramkumar.malothu@nyeras.com",
    userPhone,
    onSuccess,
    onError,
  } = options;

  try {
    const orderRes = await fetch("/api/checkout/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examId,
        planId,
        userId,
        userEmail,
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(orderData.error || "Failed to initialize payment order.");
    }

    if (orderData.isFree) {
      if (onSuccess) {
        onSuccess({
          tokenBalance: 0,
          tokensAdded: 0,
          paymentRef: orderData.orderId,
          examUnlocked: true,
          message: "This exam does not require payment.",
        });
      }
      return orderData;
    }

    const url = new URL(OFFICIAL_RAZORPAY_PAYMENT_URL);
    if (userEmail) url.searchParams.set("email", userEmail);
    if (userName) url.searchParams.set("name", userName);
    if (userPhone) url.searchParams.set("phone", userPhone.replace(/[^\d+]/g, ""));
    window.location.assign(url.toString());
    return orderData;
  } catch (err: any) {
    if (onError) onError(err.message || "Failed to open the Razorpay payment page.");
    throw err;
  }
}

export async function verifyAndCreditPayment(params: {
  orderId?: string;
  paymentId: string;
  signature?: string;
  examId?: string;
  tokenCount?: number;
  amountRupees?: number;
  planId?: string;
  userId?: string;
  onSuccess?: (result: any) => void;
  onError?: (msg: string) => void;
}) {
  const message = "Payment can only be confirmed from the Razorpay return page. Access has not been granted.";
  if (params.onError) params.onError(message);
  throw new Error(message);
}
