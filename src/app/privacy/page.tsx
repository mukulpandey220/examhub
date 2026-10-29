import React from "react";
import { LegalLayout } from "@/components/LegalLayout";

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      meta="Effective Date: October 2026 • Campus Deadline Radar & Campus Assessment Hub"
      sections={[
        {
          heading: "1. Information We Collect",
          body: (
            <p>
              Campus Deadline Radar collects candidate registration details, including name, institutional email address, degree program, academic stream, and semester of study. During examinations, we store candidate answers, response timestamps, and server-side evaluation logs.
            </p>
          ),
        },
        {
          heading: "2. Examination Integrity & Protection of Answer Keys",
          body: (
            <p>
              To maintain assessment validity, official question answer keys are encrypted on the server and are never exposed to browser memory during active timed examinations. We do not sell, rent, or lease candidate response data to third-party advertisers.
            </p>
          ),
        },
        {
          heading: "3. Payment & Transaction Data",
          body: (
            <p>
              Payments are processed via authorized payment gateways (e.g., Razorpay) adhering to PCI-DSS compliance standards. Campus Deadline Radar does not store raw credit card numbers or banking passwords on internal servers.
            </p>
          ),
        },
        {
          heading: "4. Data Deletion & Contact",
          body: (
            <p>
              Students may request deletion of their account history or export of performance records by writing to{" "}
              <a href="mailto:privacy@campusradar.edu.in" className="font-semibold text-electric-600 underline hover:text-electric-700">
                privacy@campusradar.edu.in
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
