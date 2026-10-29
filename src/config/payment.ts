/**
 * Central Payment & Gateway Configuration
 * Official Razorpay Payment Page: https://rzp.io/rzp/CkGK3Dv
 * Title: NTCRA REGISTRATION by Nyeras
 * Amount: ₹99 (9900 paise)
 */

export const OFFICIAL_RAZORPAY_PAYMENT_URL =
  process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_URL || "https://rzp.io/rzp/CkGK3Dv";

export const RAZORPAY_DISPLAY_URL = "rzp.io/rzp/CkGK3Dv";

export const PAYMENT_CONFIG = {
  url: OFFICIAL_RAZORPAY_PAYMENT_URL,
  displayUrl: RAZORPAY_DISPLAY_URL,
  title: "NTCRA REGISTRATION",
  merchantName: "Nyeras",
  amountRupees: 99,
  amountPaise: 9900,
  currency: "INR",
  currencySymbol: "₹",
  supportEmail: "support@nyeras.com",
  supportContact: "+91 91801 23915",
  description:
    "EMPOWERING HIGHER EDUCATION INSTITUTIONS TO EVALUATE, BENCHMARK, AND ELEVATE STUDENT DOMAIN COMPETENCE ON A UNIFIED PAN-INDIA COMPETITIVE STAGE.",
  examFeeTokens: 99,
  tokenRate: "1 INR = 1 Token",
};
