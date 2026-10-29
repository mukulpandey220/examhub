import { PricingPlan } from "@/types";

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "plan-free",
    name: "Free Assessment Tier",
    tier: "free",
    pricePaise: 0,
    priceRupees: 0,
    durationDays: 365,
    durationLabel: "Forever Access",
    description: "Ideal for exploring domains and taking baseline diagnostic assessments.",
    features: [
      "Access to full 72-domain academic catalog",
      "Free diagnostic sample examinations",
      "Basic score and pass/fail summary",
      "Public campus deadline radar tracking",
      "Access on mobile, tablet, and desktop",
    ],
    isPopular: false,
    isActive: true,
  },
  {
    id: "plan-seven-day",
    name: "7-Day Sprint Pass",
    tier: "seven_day",
    pricePaise: 2900, // ₹29
    priceRupees: 29,
    originalPriceRupees: 99,
    durationDays: 7,
    durationLabel: "7 Days Active Access",
    description: "Designed for immediate exam preparation, placement rounds, and sprint revisions.",
    features: [
      "Full access to 72 domains and 3,600+ questions",
      "Unlimited timed mock examinations",
      "Comprehensive step-by-step explanations",
      "Interactive coding and practical assessments",
      "Topic-wise strength & weakness analytics",
      "Save and review past attempt history",
    ],
    isPopular: false,
    isActive: true,
  },
  {
    id: "plan-semester",
    name: "Full Semester Pass",
    tier: "semester",
    pricePaise: 4900, // ₹49
    priceRupees: 49,
    originalPriceRupees: 199,
    durationDays: 180,
    durationLabel: "180 Days Active Access",
    description: "Complete semester-long coverage for midterms, finals, and campus placement drives.",
    features: [
      "Full access to all 72 domains for 180 days",
      "Unlimited full-length timed & practice exams",
      "Deep server-side performance analytics & trends",
      "All coding challenges with test case evaluation",
      "Bookmark questions & custom revision sets",
      "Priority customer and academic support",
      "Campus Deadline Radar personalized notifications",
    ],
    isPopular: false,
    isActive: true,
  },
  {
    id: "plan-backlog-addon",
    name: "National Assessment Pass (NTCRA)",
    tier: "backlog_add_on",
    pricePaise: 9900, // ₹99
    priceRupees: 99,
    originalPriceRupees: 299,
    durationDays: 90,
    durationLabel: "90 Days Active Access",
    description: "All-inclusive ₹99 national benchmark pass covering 3-section proctored exam, diagnostic gap report, and all-India ranking.",
    features: [
      "₹99 All-inclusive Pan-India competitive examination",
      "60-75 Min Cloud Proctored National Benchmark Exam",
      "Section A: Analytical Aptitude (25%)",
      "Section B: Domain Technical Core (50%)",
      "Section C: Workplace Readiness & Professional Ethics (25%)",
      "Personalized Career Diagnostic Report with 6-month roadmap",
      "All-India Percentile & Verifiable National Rank",
      "Official Authenticated Certificate of Participation",
      "Exclusive Rewards for Top Rankers (100% Training Waiver, Hampers, Mentorship)",
      "Targeted remedial question banks & previous university patterns",
    ],
    isPopular: true,
    isActive: true,
  },
];

export function getPlanById(id: string): PricingPlan | undefined {
  return PRICING_PLANS.find(p => p.id === id);
}

export function getPlanByTier(tier: string): PricingPlan | undefined {
  return PRICING_PLANS.find(p => p.tier === tier);
}
