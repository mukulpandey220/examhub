import React from "react";
import { LegalLayout } from "@/components/LegalLayout";

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Terms of Service"
      meta="Last Updated: October 2026 • Campus Deadline Radar"
      sections={[
        {
          heading: "1. Nature of Independent Educational Platform",
          body: (
            <p>
              Campus Deadline Radar and Campus Assessment Hub operate as an independent educational tool providing simulated examination preparation, academic benchmarks, and public university deadline aggregation. We do not claim official affiliation with, nor endorsement by, state technical universities, examination boards, or autonomous institutions.
            </p>
          ),
        },
        {
          heading: "2. Examination Rules & Academic Honesty",
          body: (
            <p>
              Users agree to utilize examination features for individual learning and self-assessment. Reverse-engineering question banks, running automated scraping bots, or distributing proprietary solutions without written authorization is strictly prohibited.
            </p>
          ),
        },
        {
          heading: "3. Subscriptions & Access Entitlements",
          body: (
            <p>
              Access passes (e.g., 7-Day Sprint Pass, Full Semester Pass) provide digital access for the explicitly designated calendar duration starting upon server transaction confirmation. Passes do not auto-renew or charge recurring balances without user action.
            </p>
          ),
        },
      ]}
    />
  );
}
