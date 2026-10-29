# Nyeras Nxtmove — Architecture Audit, Technical Debt Review & Migration Strategy

**Date:** October 2026  
**Platform:** Nyeras Nxtmove — National Student Talent Benchmarking & Assessment Platform  
**Target Scale:** 5,000–10,000 concurrent participants during 60–75 minute proctored assessment windows  
**Initial Operating Budget:** < ₹10,000/month (India Region)

---

## 1. Current Stack and Architecture

| Component | Current Implementation | Status |
| :--- | :--- | :--- |
| **Framework** | Next.js 14.2.24 (App Router) with React 18.3.1 & TypeScript 5.6.3 | Operational |
| **Styling** | Tailwind CSS 3.4.14 with customized Nyeras electric blue palette & typography | Operational |
| **Data Storage** | File-backed JSON database engine (`src/lib/db.ts` reading/writing to `.data/*.json`) | Functional in dev; unscalable for production |
| **Database Schema** | Supabase PostgreSQL schema (`supabase/migrations/20261025_init.sql`) | Inactive / schema template only |
| **Question Bank** | 72 Technical Domains across 7 Categories; 3,600+ approved questions | High quality; operational |
| **Assessment Engine** | Tripartite structure (Section A Aptitude 25%, Section B Domain 50%, Section C Workplace 25%) with autosave & server-side scoring | Operational |
| **Proctoring** | Fullscreen API lockdown, Tab-Switch Prevention, Keyboard Lock API, Audio Alarm, 5s Cooldown Penalty Shield | Operational on client; requires server-authoritative event pipeline |
| **Testing** | Vitest 2.1.4 (26 unit/integration tests passing across platform, proctoring, and fullscreen) | Passing |

---

## 2. Existing Functionality Worth Preserving

1. **Academic Taxonomy & Question Bank**:
   - 72 curated domains spanning CSE/IT, ECE/EEE, Mechanical, Chemical, Civil, Management, and Pharma/Biotech.
   - 3,600+ vetted questions with explanations, formulas, option IDs, and difficulty tiers (Basic, Intermediate, Advanced, Professional).
2. **Tripartite Blueprint & Examination Timing**:
   - Section A: Analytical Aptitude (25%)
   - Section B: Domain Technical Core (50%)
   - Section C: Workplace Readiness (25%)
   - Server-enforced duration (60–75 min), passing marks, negative marking, and score calculation algorithms.
3. **Proctoring & Anti-Cheating Controls**:
   - Universal cross-device fullscreen polyfill (`src/lib/fullscreen.ts`).
   - Chromium Keyboard Lock API integration (`navigator.keyboard.lock(["Tab", "Escape"])`).
   - Browser shortcut interception (`Ctrl+Tab`, `Alt+Tab`, `Cmd+Tab`, `Cmd+1-9`, `Cmd+T/N/W/Q`).
   - Mouse boundary trap (`e.clientY <= 2` heading towards browser tabs).
   - 5-second mandatory cooldown penalty shield freezing examination on unauthorized navigation.
4. **Diagnostic Reports & Certificate Engine**:
   - Section-wise breakdown, topic mastery, difficulty breakdown, national percentile computation, and dynamic SVG certificate issuance with verification IDs.
5. **Brand Identity & UI Design Tokens**:
   - Clean, academic aesthetic: Cool-white backgrounds, deep slate/navy typography, restrained royal-blue (`#0012FF` / `electric-500`) accents, clear hierarchy, and zero clutter.

---

## 3. Technical Debt and Security Risks

1. **JSON File Storage Bottleneck**:
   - `src/lib/db.ts` reads and writes synchronous JSON files in `.data/`. Under 5,000–10,000 concurrent requests, file locking collisions, race conditions, and disk I/O saturation will cause catastrophic request timeouts.
2. **Authentication Security Flaws**:
   - Plaintext passwords in `.data/profiles.json` without cryptographic hashing (bcrypt/argon2).
   - Client-side storage of user profiles in `localStorage.setItem("campus_radar_user")` without secure HTTP-only session cookies or JWT tokens.
   - Missing server-side authorization middleware on sensitive administrative endpoints.
3. **Client-Reported Proctoring State**:
   - Proctoring violations are partially logged from the browser. Malicious candidates could suppress or forge violation payloads unless validated server-side against an append-only event log with nonce/policy tracking.
4. **Simulated Code Execution Runner**:
   - Code execution currently evaluates string patterns in `/api/assessments/execute-code`. Production requires isolated sandbox runner integration (Judge0/Docker worker) or explicit queued status to prevent malicious remote code execution.
5. **Missing Multi-Tenant Isolation**:
   - Institution Coordinators currently lack strict scoping to only view their assigned college/cohort data.

---

## 4. Required Changes and Migration Decisions

### Architecture Strategy: Modular Monolith with Unified Next.js API / Express Engine
To preserve all 26 passing tests, 72 domain schemas, 3,600+ questions, and active UI flows without destructive churn:
1. **Database Migration to MongoDB Atlas / Mongoose**:
   - Implement Mongoose models with strict schema validation, compound indexes for high-throughput lookups (`userId`, `examId`, `attemptId`), and bounded connection pools (`maxPoolSize: 50`).
   - Implement dual-storage adapter pattern: Mongoose models serve as primary storage; JSON engine serves as zero-config dev fallback when MongoDB URI is absent.
2. **4-Tier Role-Based Access Control (RBAC)**:
   - Introduce roles: `student`, `institution_coordinator`, `exam_admin`, `super_admin`.
   - Implement bcrypt password hashing, JWT token generation, HTTP-only cookie support, and authorization middleware.
3. **Server-Authoritative Proctoring Subsystem (Section 24)**:
   - Implement `ProctoringSession`, `ProctoringEvent`, and `ProctoringReview` MongoDB schemas.
   - Create `/api/v1/proctoring/*` endpoints for session initiation, event streaming, strike escalation, and admin incident reviews.
   - Client-side face-presence/head-pose monitoring and ambient audio anomaly detection with configurable thresholds.
4. **Dedicated Coding & Project Submission Modules**:
   - Coding challenges with starter code, hidden test cases, execution timeouts, and submission history.
   - Project submissions supporting teams, repository links, demo URLs, file metadata, and rubric-based judging scorecards.
5. **Real-time Leaderboard & Notifications**:
   - Socket.IO server with authenticated room partitioning (`exam:{examId}`, `user:{userId}`).
6. **Career Diagnostic Reports & Public Verification**:
   - Standalone public verification route: `/verify/[certificateId]` verifying credential authenticity against MongoDB records.
7. **Payment Gateway (Razorpay)**:
   - Server-side order creation (`₹99` student fee, `₹0` institutional cost), HMAC SHA256 signature verification, and idempotent webhook processing.

---

## 5. Proposed Final Directory Structure

```
exam-hub/
├── .data/                               # Dev fallback seed datasets
├── docs/                                # Architecture & operational runbooks
│   ├── AUDIT_AND_ARCHITECTURE.md
│   ├── INFRASTRUCTURE_COSTS.md
│   └── LOAD_TESTING_K6.md
├── src/
│   ├── __tests__/                       # Comprehensive test suites
│   │   ├── fullscreen.test.ts
│   │   ├── platform.test.ts
│   │   ├── proctoring.test.ts
│   │   └── rbac.test.ts
│   ├── app/                             # Next.js App Router (Frontend + API)
│   │   ├── admin/                       # Super & Exam Admin Dashboard
│   │   ├── api/
│   │   │   └── v1/                      # Versioned REST API endpoints
│   │   │       ├── auth/                # Login, Signup, Session, Password Reset
│   │   │       ├── exams/               # Exam lifecycle, questions, scoring
│   │   │       ├── attempts/            # Durable autosave & final submission
│   │   │       ├── coding/              # Coding challenges & execution runner
│   │   │       ├── projects/            # Project submissions & judging
│   │   │       ├── proctoring/          # Sessions, events, reviews, violations
│   │   │       ├── institutions/        # Cohort analytics & TPO reports
│   │   │       ├── certificates/        # Issuance & public verification
│   │   │       └── payments/            # Razorpay orders, verify, webhooks
│   │   ├── assessments/                 # Exam discovery, rules & attempt cockpit
│   │   ├── coding/                      # Standalone coding challenge interface
│   │   ├── projects/                    # Team project submission portal
│   │   ├── coordinator/                 # Institution / TPO Dashboard
│   │   ├── dashboard/                   # Student Career Cockpit & Roadmap
│   │   ├── leaderboard/                 # Real-time national rankings
│   │   ├── verify/[certificateId]/      # Public Certificate Verification
│   │   └── page.tsx                     # Refined Nyeras Nxtmove Public Landing
│   ├── components/                      # Design system UI tokens & components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── ProctoringShield.tsx
│   │   ├── CodeEditor.tsx
│   │   └── CertificateModal.tsx
│   ├── data/                            # 72 Domains & 3,600 Question seed catalog
│   ├── lib/
│   │   ├── db.ts                        # Active database engine (Mongoose + JSON fallback)
│   │   ├── mongoose.ts                  # MongoDB connection pool & configuration
│   │   ├── auth.ts                      # JWT, bcrypt hashing & RBAC middleware
│   │   ├── proctoring-engine.ts         # Server-authoritative violation processor
│   │   ├── socket.ts                    # Socket.IO live leaderboard & notifications
│   │   └── razorpay.ts                  # Payment verification utilities
│   ├── models/                          # Mongoose Schemas & TypeScript Interfaces
│   │   ├── User.ts
│   │   ├── Institution.ts
│   │   ├── Examination.ts
│   │   ├── Question.ts
│   │   ├── Attempt.ts
│   │   ├── CodingSubmission.ts
│   │   ├── ProjectSubmission.ts
│   │   ├── ProctoringSession.ts
│   │   ├── ProctoringEvent.ts
│   │   ├── Certificate.ts
│   │   └── Payment.ts
│   └── types/                           # Shared domain TypeScript contracts
└── vitest.config.ts                     # Test runner configuration
```

---

## 6. Phased Implementation Plan

- [x] **Phase 1: Repository Audit & Architecture Plan**: Document existing assets, debt, and migration strategy.
- [ ] **Phase 2: Data Models & MongoDB Connection Pool**: Implement Mongoose models with validation & compound indexes.
- [ ] **Phase 3: Authentication & 4-Tier RBAC**: JWT, bcrypt, role middleware (`student`, `coordinator`, `admin`, `super_admin`), and audit log.
- [ ] **Phase 4: Examination Engine & Resilient Autosave**: Debounced durable autosave, atomic updates, and server-side timer enforcement.
- [ ] **Phase 5: AI-Assisted Proctoring Subsystem (Section 24)**: Audio monitoring, face presence/head pose detector, server-authoritative event processing, and admin review dashboard.
- [ ] **Phase 6: Coding Challenges & Project Submissions**: Dedicated coding runner interface and team project submissions with judging rubrics.
- [ ] **Phase 7: Institutional Coordinator Dashboard & Public Certificate Verification**: College cohort analytics, department benchmarks, and public `/verify/[certificateId]` portal.
- [ ] **Phase 8: Payment Gateway & Webhook Reconciliation**: Razorpay server-side integration (₹99 student / ₹0 college).
- [ ] **Phase 9: Scalability & Load Testing**: k6 load test scripts for 1,000 / 5,000 / 10,000 concurrent participants.
- [ ] **Phase 10: Infrastructure Budget & Production Hardening**: Detailed monthly cost breakdown (< ₹10,000/mo) and operational runbook.
