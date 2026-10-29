import React from "react";
import { LegalLayout } from "@/components/LegalLayout";

export default function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      meta="Clear, transparent customer billing terms"
      sections={[
        {
          heading: "1. Digital Entitlement Access",
          body: (
            <p>
              Due to immediate digital activation of premium examination questions, test runners, and diagnostic solutions upon purchase, passes are generally non-refundable once significant examination attempts have been undertaken.
            </p>
          ),
        },
        {
          heading: "2. Technical Malfunctions & Double Debits",
          body: (
            <p>
              In the event of duplicate billing, server connection failure preventing examination completion, or verified technical discrepancies, candidates are entitled to a full 100% refund of the debited transaction amount. Requests must be raised within 7 calendar days with the transaction reference ID.
            </p>
          ),
        },
        {
          heading: "3. Refund Processing Timelines",
          body: (
            <p>
              Approved refunds are credited directly back to the original source instrument (UPI / Debit Card / Net Banking) within 5–7 banking business days according to RBI banking standards.
            </p>
          ),
        },
      ]}
    />
  );
}
