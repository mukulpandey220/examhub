# Campus Deadline Radar + Campus Assessment Hub
## Complete EdTech Examination Platform | Production-Oriented Build

> **Tagline:** "Practice. Assess. Improve."
> **Independent Academic Platform:** Designed for Indian engineering and management college students to master subject-specific skills, attempt timed examinations, solve coding challenges, and track university deadlines.

---

## 1. Product Overview & Architecture

**Campus Deadline Radar** combines real-time academic cutoff and examination date tracking with **Campus Assessment Hub** — a comprehensive 72-domain examination engine featuring over **3,600 approved questions** evaluated strictly on the server.

### Key Pillars:
1. **72 Curated Academic & Professional Domains:** Covering all 7 core categories:
   - **CSE / IT (32 domains):** .NET, AI, Agentic AI, AWS, Azure, Blockchain, CCNA 200-301, Cyber Security, Data Engineering, Docker, DSA & System Design, Full Stack, Generative AI & LLM, Java, Python, Selenium, ServiceNow, Web3, etc.
   - **ECE / EEE (8 domains):** Electrical CAD, Embedded Systems, IoT, Hybrid & Electric Vehicles, Industrial Robotics, Robotics, VLSI, Drone Engineering.
   - **Mechanical (5 domains):** AutoCAD, CATIA, Car Design, Machine Design, IC Engine Design.
   - **Chemical (2 domains):** Aspen Plus, Aspen HYSYS.
   - **Civil (1 domain):** Construction Planning.
   - **Management (17 domains):** ACCA F4 Business, Business Analytics, Digital Marketing, Finance, Investment Banking, Microsoft Excel, Placement Prep, Power BI, Salesforce, SAP, SAP MM, Supply Chain Management, Stock Marketing, etc.
   - **Medical & Biological Sciences (7 domains):** Bioinformatics, Biostatistics, Clinical SAS, Genetic Engineering, Microbiology, Molecular Biology, NANO SCIENCE & TECHNOLOGY.
2. **Minimum 3,600 Approved Questions:** Exactly 50 approved questions per domain with the required distribution:
   - **10 Basic Questions** (Recall, foundational syntax, core principles)
   - **15 Intermediate Questions** (Standard mechanisms, calculations, code snippets)
   - **15 Advanced Questions** (Architectural tradeoffs, edge cases, error diagnostics)
   - **10 Professional Questions** (Enterprise incidents, compliance standards, case studies)
3. **Proctored Live Examination Engine:**
   - Server-enforced countdown timer with auto-expiry submission.
   - Question palette with status indicators (Answered, Unanswered, Marked for Review).
   - Disconnection recovery and continuous background autosave.
   - Single-choice, multi-select, numerical inputs, and coding test evaluations.
   - Immutable server-side scoring with negative marking penalties (e.g. -0.25 marks).
4. **Campus Deadline Radar:**
   - Verified cutoffs for semester examination registrations, supplementary/backlog fee dates, revaluation windows, and national exams (VTU, Anna Univ, JNTU, AKTU, GATE, NPTEL).
5. **Subscription & Monetization Tier:**
   - **Free Plan:** Diagnostic samples and deadline tracking.
   - **₹29 7-Day Sprint Pass:** Immediate placement preparation and full domain access.
   - **₹49 Semester Pass:** 180 days of unlimited mock exams and coding tests.
   - **₹99 Backlog & Revaluation Add-on:** Remedial question banks and priority alerts.
   - Server-side order verification with integer paise storage.

---

## 2. Technology Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom design system tokens)
- **Icons:** Lucide React
- **Validation:** Zod
- **Testing:** Vitest
- **Database:** Supabase PostgreSQL + Local persistent fallback for instant local run without external dependencies
- **Code Execution:** Isolated sandbox test case runner (with Judge0 integration support)
- **Payments:** Razorpay API abstraction with test mode reconciliation

---

## 3. Directory Structure

```
├── .data/                               # Local persistent storage engine (JSON/SQLite fallback)
├── scripts/
│   └── generate-questions.ts            # 3,600 questions dataset builder across 72 domains
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Page 1: Home Page
│   │   ├── layout.tsx                   # Global responsive layout & metadata
│   │   ├── assessments/
│   │   │   ├── domains/
│   │   │   │   ├── page.tsx             # Page 2: Domain Explorer (72 domains)
│   │   │   │   └── [slug]/page.tsx      # Page 3: Domain Details
│   │   │   ├── subjects/[slug]/page.tsx # Page 4: Subject Details
│   │   │   ├── exams/
│   │   │   │   ├── [examId]/page.tsx    # Page 9: Exam Instructions
│   │   │   │   └── [examId]/attempt/    # Page 10: Live Examination Engine
│   │   │   ├── results/[attemptId]/     # Page 11: Results & Explanations
│   │   │   ├── history/page.tsx         # Page 12: Exam History
│   │   │   └── analytics/page.tsx       # Page 13: Performance Analytics
│   │   ├── signup/page.tsx              # Page 5: Signup
│   │   ├── login/page.tsx               # Page 6: Login
│   │   ├── onboarding/page.tsx          # Page 7: Student Onboarding
│   │   ├── dashboard/
│   │   │   ├── page.tsx                 # Page 8: Student Dashboard
│   │   │   └── billing/page.tsx         # Page 17: Billing & History
│   │   ├── pricing/page.tsx             # Page 14: Pricing Plans
│   │   ├── checkout/[planId]/page.tsx   # Page 15: Checkout & Price Validation
│   │   ├── billing/payment-result/      # Page 16: Payment Result
│   │   ├── deadlines/page.tsx           # Campus Deadline Radar
│   │   ├── admin/
│   │   │   ├── page.tsx                 # Page 22: Admin Dashboard
│   │   │   └── assessment/
│   │   │       ├── questions/page.tsx   # Page 18: Question Management & CSV Import
│   │   │       ├── exams/page.tsx       # Page 19: Exam Blueprints
│   │   │       ├── coverage/page.tsx    # Page 20: 72-Domain Completeness Audit
│   │   │       └── generate/page.tsx    # Page 21: Content Draft Generator
│   │   ├── privacy/page.tsx             # Page 23: Privacy Policy
│   │   ├── terms/page.tsx               # Page 23: Terms of Service
│   │   ├── refund-policy/page.tsx       # Page 23: Refund Policy
│   │   ├── contact/page.tsx             # Page 23: Contact & Support
│   │   └── api/                         # Backend Server Routes
│   │       ├── assessments/exams/       # Start, Autosave, Submit routes
│   │       ├── assessments/execute-code # Code execution test evaluator
│   │       ├── checkout/                # Create order & verify payment
│   │       ├── admin/                   # Questions, coverage, draft generator
│   │       ├── deadlines/               # Campus Deadline Radar API
│   │       └── auth/                    # Profile updates & bookmarks
│   ├── data/
│   │   ├── categories.ts                # 7 Academic Streams
│   │   ├── domains.ts                   # 72 Domains metadata
│   │   ├── exams.ts                     # Initial published examinations
│   │   ├── pricing.ts                   # ₹0, ₹29, ₹49, ₹99 pricing plans
│   │   ├── deadlines.ts                 # Verified academic deadlines
│   │   └── questions.json               # 3,600 verified approved questions
│   ├── lib/
│   │   ├── db.ts                        # Unified database layer & server scoring engine
│   │   └── supabase.ts                  # Supabase client wrapper
│   └── types/                           # TypeScript interfaces
├── supabase/
│   └── migrations/20261025_init.sql     # PostgreSQL schemas & Row Level Security policies
└── vitest.config.ts                     # Automated test configuration
```

---

## 4. Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node v25)
- npm 9+

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite to verify 72 domains and 3,600 questions
npm run test

# 3. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

---

## 5. Automated Test Verification

The platform includes comprehensive automated tests in `src/__tests__/platform.test.ts` verifying:
- **Test 1:** All 72 domains exist with unique slugs and valid categories.
- **Test 2:** Exact domain counts per academic category (32 CSE, 8 ECE, 5 Mech, 2 Chem, 1 Civil, 17 Mgmt, 7 Bio).
- **Test 3:** Question bank completeness (at least 3,600 approved questions, exactly 50 per domain with 10 Basic, 15 Intermediate, 15 Advanced, 10 Professional).
- **Test 4:** Unique question IDs, non-empty explanations, and verified answer keys.
- **Test 5:** Server-side scoring engine with negative marking penalties.
- **Test 6:** Examination attempt limits.
- **Test 7:** Pricing plans and integer paise conversion.
- **Test 8:** Campus Deadline Radar academic cutoffs.
- **Test 9:** Bulk CSV import with duplicate detection.

Run tests anytime with:
```bash
npm run test
```

---

## 6. Environment Variables (`.env.example`)

To connect to external production services:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for administrative functions
- `RAZORPAY_KEY_ID`: Razorpay public key ID
- `RAZORPAY_KEY_SECRET`: Razorpay secret for signature verification
- `JUDGE0_API_KEY`: Isolated code execution service API key

When external credentials are not set, the platform operates seamlessly in verified local mode.
