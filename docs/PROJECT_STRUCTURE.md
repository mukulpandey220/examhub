# Nyeras Nxtmove — Project Structure

Verified against the code on disk on **29 October 2026** (Next.js 14.2.35). This describes what exists *today*.
For the target architecture and migration plan see [`AUDIT_AND_ARCHITECTURE.md`](./AUDIT_AND_ARCHITECTURE.md);
for hosting cost estimates see [`INFRASTRUCTURE_COSTS.md`](./INFRASTRUCTURE_COSTS.md).

---

## 1. At a glance

| | |
|---|---|
| **What it is** | A national skills-assessment platform: 72 domains in 7 streams, 144 exams, a proctored 3-section benchmark exam, certificates, a campus deadline radar, and a college (institution) portal. |
| **Framework** | Next.js 14 (App Router), React 18, TypeScript 5 (`strict`) |
| **Styling** | Tailwind CSS 3.4 driven by CSS-variable design tokens; light + dark themes |
| **Data** | File-backed JSON store in `.data/` through one class, `src/lib/db.ts` (see §5) |
| **Payments** | Razorpay abstraction with a built-in test mode (`src/lib/razorpay.ts`, `src/config/payment.ts`) |
| **Tests** | Vitest — 8 files, 60 tests (`src/__tests__/`) |
| **Size** | ~23,000 lines of TypeScript/TSX; 38 pages, 24 API route files |
| **Path alias** | `@/*` → `src/*` |

---

## 2. Repository layout

```
exam/
├── src/                        Application source (see §3–§6)
│   ├── app/                    Routes: pages, layouts, API handlers, global CSS
│   ├── components/             Shared React components
│   ├── lib/                    Server/domain logic and helpers
│   ├── data/                   Seed data (domains, exams, pricing, deadlines, 3,600 questions)
│   ├── models/                 Mongoose schemas — present but not wired in (see §9)
│   ├── config/                 Payment configuration
│   ├── types/                  Shared TypeScript types (index.ts)
│   └── __tests__/              Vitest suites
├── public/                     Static files: favicon, robots.txt, images/ (3 photos + provenance README)
├── scripts/
│   ├── generate-questions.ts   Rebuilds src/data/questions.json (3,600 questions, 50 per domain)
│   └── load-test-k6.js         k6 load test (1k → 10k simulated candidates); target set by TARGET_URL
├── supabase/migrations/        20261025_init.sql — Postgres schema for the planned migration
├── docs/                       This file, the architecture audit, infrastructure costs
├── .data/                      RUNTIME data store (9 JSON files). Generated; never commit (see §9)
├── .next/                      `next dev` output
├── .next-production/           `next build` output used for production verification (see §8)
├── .env.example                Environment variable template (names only)
├── .env.local                  Local secrets — never commit
├── next.config.mjs             Next config; `distDir` is overridable with NEXT_DIST_DIR
├── tailwind.config.ts          Design tokens → Tailwind (light/dark colour scales, fonts, shadows)
├── postcss.config.mjs          tailwindcss + autoprefixer
├── tsconfig.json               strict; `@/*` alias; includes .next and .next-production types
├── vitest.config.ts            node environment, `@` alias
└── package.json                scripts: dev, build, start, lint, test, test:watch
```

---

## 3. Application routes (`src/app/`)

Rendering column: **S** = server component, **C** = client component (`"use client"`).
After `next build`, pages without dynamic segments are prerendered (static); the rest render per request.

### 3.1 Public / marketing

| Route | File | R | Purpose |
|---|---|---|---|
| `/` | `page.tsx` | S | Home: hero, benefits, assessment structure, stream directory, plans, deadlines, FAQ. Scroll animation via `ScrollReveal` / `CountUp`. |
| `/pricing` | `pricing/page.tsx` | S | Plans and comparison table (from `data/pricing.ts`) |
| `/institution` | `institution/page.tsx` | C | Pitch for colleges + partnership lead form → `POST /api/institution/lead` |
| `/contact` | `contact/page.tsx` | C | Contact form (UI only — it does not send anything yet) |
| `/privacy` `/terms` `/refund-policy` | `*/page.tsx` | S | Legal pages using `components/LegalLayout.tsx` |
| `/verify`, `/verify/[certificateId]` | `verify/…` | S | Public certificate verification (uses `lib/certificates.ts`) |
| `/leaderboard` | `leaderboard/page.tsx` | C | Rankings, fetched from `/api/leaderboard` |
| `/deadlines` | `deadlines/page.tsx` | C | Campus deadline radar, fetched from `/api/deadlines` |

### 3.2 Account and student area

| Route | File | R | Purpose |
|---|---|---|---|
| `/login`, `/signup` | `login/`, `signup/` | C | Auth forms → `/api/auth` |
| `/onboarding` | `onboarding/page.tsx` | C | Post-signup stream / priority-topic selection |
| `/dashboard` | `dashboard/page.tsx` | C | Student home: wallet (tokens), plan, my exams, browse, token ledger |
| `/dashboard/billing` | `dashboard/billing/page.tsx` | C | Plan and billing details |
| `/payment`, `/payment/callback`, `/billing/payment-result` | `payment/`, `billing/` | C / C / S | ₹99 national pass checkout, gateway callback, result page |
| `/pay` | `pay/page.tsx` | S | Redirects to `/payment` |
| `/checkout/[planId]` | `checkout/[planId]/page.tsx` | C | Checkout for a specific plan |

### 3.3 Assessments

| Route | File | R | Purpose |
|---|---|---|---|
| `/assessments/exams` | `assessments/exams/page.tsx` | C | Exam catalogue (144 exams) with search and filters; rendered 24 at a time (`lib/use-progressive-list.ts`) |
| `/assessments/exams/[examId]` | `…/[examId]/page.tsx` | C | Instructions + difficulty mix; "Begin exam" |
| `/assessments/exams/[examId]/attempt` | `…/attempt/page.tsx` | C | **Live proctored exam** (≈2,300 lines): timer, palette, autosave, fullscreen/tab-switch/face monitoring. Hides the navbar and footer. |
| `/assessments/results/[attemptId]` | `…/results/…` | S | Score, section breakdown, question review. 404 for unknown attempt ids. |
| `/assessments/domains`, `/assessments/domains/[slug]` | `…/domains/…` | C / S | Domain explorer and domain detail |
| `/assessments/subjects/[slug]` | `…/subjects/…` | S | Subject detail and mode selection |
| `/assessments/history`, `/assessments/analytics` | `…/history/`, `…/analytics/` | S | Attempt history and topic analytics (see §9 — these read a hard-coded demo user) |

### 3.4 Admin and institution consoles

| Route | Purpose |
|---|---|
| `/admin` | Admin console: question bank, published exams, registered students, payment gateway, shortcuts |
| `/admin/assessment/questions` | Question CRUD, search, bulk CSV import |
| `/admin/assessment/exams` | Exam blueprint creation |
| `/admin/assessment/coverage` | Question-bank completeness audit (50 approved questions per domain) |
| `/admin/assessment/generate` | Question generation (AI when `AI_MODEL_API_KEY` is set, templates otherwise) |
| `/admin/proctor/train` | Proctor-AI evaluation and retraining pipeline |
| `/institution/dashboard` | College analytics demo (assessed students, average score, certificates) |
| `/coordinator` | Campus coordinator metrics dashboard |

### 3.5 Other app-level files

| File | Purpose |
|---|---|
| `layout.tsx` | Root layout: fonts, theme-init script (applies saved `dark` class before paint), skip link, `NavigationProgress`, `Navbar`, `PageMain`, `Footer`, `FloatingFullscreenButton` |
| `loading.tsx` | Skeleton shown while any route is loading. A loading boundary is also what lets Next prefetch dynamic routes. |
| `assessments/exams/[examId]/attempt/loading.tsx` | Renders nothing, so the live exam never flashes the generic skeleton |
| `globals.css` | Tailwind layers, design tokens, component classes, home-page sections, motion |
| `manifest.ts` | PWA manifest (still carries the older "Exam Hub" name and `#0066FF` theme colour) |

### 3.6 API (`src/app/api/`) — 24 route files

| Endpoint | Methods | Purpose |
|---|---|---|
| `auth` | GET, POST | Current profile; login and profile update (`action` field) |
| `deadlines` | GET, POST | List / add campus deadlines |
| `leaderboard` | GET | Rankings, optional `?domain=` |
| `institution/lead` | GET, POST | Partnership leads |
| `checkout/create-order` · `checkout/verify-payment` · `checkout/webhook` | POST | Razorpay order → verification → webhook; token crediting |
| `payment/webhook` | POST | One-line alias that re-exports `checkout/webhook` |
| `assessments/exams/[examId]/start` | GET, POST, DELETE | Attempt status; start/resume an attempt; reset attempts |
| `assessments/exams/[examId]/autosave` | POST | Periodic answer + proctoring telemetry save |
| `assessments/exams/[examId]/submit` | POST | Final submission; server-side scoring with negative marking |
| `assessments/execute-code` | POST | Coding-question runner (Judge0 when configured, deterministic mock otherwise) |
| `admin/coverage` | GET | Per-domain question coverage |
| `admin/questions` · `admin/questions/import` | GET, POST, PATCH · POST | Question bank CRUD and bulk import |
| `admin/generate` | POST | Question generation |
| `admin/proctor/metrics` · `admin/proctor/train` | GET, POST | Proctor evaluation metrics and training |
| `v1/certificates` | GET | Certificate lookup (`?id=`) |
| `v1/coding` · `v1/projects` | GET, POST | Coding problems / submissions; project submissions |
| `v1/proctoring/sessions` · `…/events` · `…/reviews` | GET, POST · POST · GET, POST | Proctoring session lifecycle, event ingestion, admin review |

---

## 4. Source modules

### 4.1 `src/components/`

| File | Role |
|---|---|
| `Navbar.tsx` | Sticky header, primary nav, theme + fullscreen controls, account menu; hidden on `/attempt` |
| `Footer.tsx` | Footer with CTA, link columns and the large hover-animated wordmark; hidden on `/attempt` |
| `PageMain.tsx` | `<main id="main-content">` wrapper; tags the live exam with `data-exam` |
| `ThemeToggle.tsx` | Light/dark switch (writes `localStorage.theme`, toggles `html.dark`) |
| `FullscreenButton.tsx`, `FloatingFullscreenButton.tsx`, `ExitFullscreenOnMount.tsx` | Fullscreen controls built on `lib/fullscreen.ts` |
| `LegalLayout.tsx` | Shared shell for privacy / terms / refund pages |
| `NavigationProgress.tsx` | Top progress bar that starts on the click of any internal link and completes when the route changes |
| `ScrollReveal.tsx` | Home-page scroll behaviour: fades in `[data-reveal]` elements, scroll-progress bar, hero parallax. Honours `prefers-reduced-motion`. |
| `CountUp.tsx` | Number that counts up when first scrolled into view |
| `PointerGlow.tsx`, `Typewriter.tsx` | **Unused** — not imported anywhere (leftovers from earlier designs) |

### 4.2 `src/lib/`

| File | Role |
|---|---|
| `db.ts` | **The data layer** — `DatabaseEngine` singleton (`export const db`), ~1,400 lines. Questions, exams, attempts, scoring, entitlements, tokens, profiles, deadlines, institution leads, leaderboard, coverage. |
| `auth.ts` | Password hashing (bcryptjs) and JWT helpers (jsonwebtoken) |
| `razorpay.ts` | Order creation / verification abstraction with test mode |
| `certificates.ts` | Certificate lookup and public verification data |
| `proctoring-engine.ts` | Proctoring policy, strikes, integrity score, session lifecycle |
| `face-monitor-state-machine.ts`, `proctoring-vision.ts` | Multi-face detection state machine and vision helpers |
| `proctor-training.ts` | Triage → dataset → retrain → validate → deploy pipeline for the proctor model |
| `fullscreen.ts` | Cross-browser fullscreen manager with fallback |
| `category-icons.ts` | Stream code → icon map shared by home, exams, domains, dashboard |
| `use-progressive-list.ts` | `useProgressiveList` hook: renders a long list in slices of 24, loading more on scroll or via a "Show more" button; resets when filters change |
| `mongoose.ts`, `supabase.ts` | Database clients for the planned migration — **unused** today |

### 4.3 `src/data/`, `src/config/`, `src/types/`

| Path | Contents |
|---|---|
| `data/categories.ts` | The 7 streams |
| `data/domains.ts` | The 72 domains with subjects and topics (~1,300 lines) |
| `data/exams.ts` | `INITIAL_EXAMS` — 144 exams (a benchmark and a practice sprint per domain). **Imported by client pages, so it must never import `questions.json`** — it derives ids as `q-<domain>-001…` (guarded by `exam-seed-ids.test.ts`) |
| `data/pricing.ts` | 4 pricing plans |
| `data/deadlines.ts` | Seed campus deadlines |
| `data/questions.json` | 3,600 approved questions (~4.8 MB), produced by `scripts/generate-questions.ts` |
| `config/payment.ts` | `PAYMENT_CONFIG`: official Razorpay URL, token rate (1 INR = 1 token), support email and phone |
| `types/index.ts` | All shared interfaces (`Question`, `Examination`, `ExamAttempt`, `ProctoringSession`, `UserProfile`, …) |

### 4.4 `src/models/` (Mongoose schemas)

`Attempt`, `Certificate`, `CodingSubmission`, `Institution`, `Proctoring` (session/event/review), `ProjectSubmission`, `User`.
Defined for the planned MongoDB/Postgres migration; **no route or page imports them yet.**

---

## 5. Data flow and persistence

```
 Browser (client pages)                Server
 ─────────────────────                 ──────────────────────────────────────────
  pages / components  ── fetch ──▶  src/app/api/**/route.ts
                                          │
 Server components ───────────────────────┤  (read the store directly)
                                          ▼
                                   src/lib/db.ts  ──▶  .data/*.json   (read at start-up,
                                          ▲                            rewritten on every change)
                                          │ seeds from, when a file is missing
                                   src/data/*  (categories, domains, exams, pricing, deadlines, questions.json)
```

`.data/` holds nine files: `questions`, `exams`, `attempts`, `entitlements`, `token_transactions`,
`profiles`, `bookmarks`, `deadlines`, `institutional_leads`. If one is missing, `db.ts` creates it from `src/data/`.

**Lifecycle of an exam attempt**

1. `/assessments/exams` → pick an exam → `/assessments/exams/[examId]` (instructions).
2. `POST …/start` — checks unlock/tokens, attempt limit and single-login rule; returns or resumes the attempt (`409` if another session is active).
3. `/attempt` runs the exam: timer, palette, fullscreen and tab-switch guards, face monitoring; `POST …/autosave` saves answers and telemetry.
4. `POST …/submit` — scored on the server with negative marking; integrity score applied.
5. `/assessments/results/[attemptId]` shows the graded result; certificates verify at `/verify/[id]`.

---

## 6. Styling, theming and motion

* **Tokens** live in two places that must stay in step: CSS variables in `src/app/globals.css` (`:root` and `.dark`: background, foreground, border, surface, accent, shadows) and the colour scales in `tailwind.config.ts`.
* **Dark mode** is the `dark` class on `<html>`, set before first paint by the inline script in `layout.tsx` from `localStorage.theme`. Light is the default. Dark uses a true-black page (`#000`), near-black panels and white text; the brand indigo is lightened for text, fills and borders so it stays legible on black.
* **Tailwind colours are themed centrally.** Existing utilities such as `bg-electric-500`, `text-slate-500`, `border-slate-200` resolve to CSS variables that flip in dark mode, so pages rarely need `dark:` variants. Every hue family is folded into the brand palette; only green and red keep their own hues (success / error).
* **Component classes** in `globals.css`: `.btn` (+ `-primary`, `-secondary`, `-ghost`, `-light`, `-sm`), `.card` / `.glass` / `.glass-flat`, `.input`, `.chip`, `.seg` / `.seg-item`, `.tile`, `.meter`, `.badge-*`, `.page-container`. The home page has its own section classes (`.home-hero`, `.marketing-section`, `.number-band`, …).
* **Motion:** `[data-reveal]` + `ScrollReveal` for scroll-in; keyframes for hero entrance, progress fill and dot pulse. A global `prefers-reduced-motion` rule shortens all animation and transitions.
* **Navigation speed:** client bundles must stay small. `data/exams.ts` (and anything else imported by a `"use client"` page) must not pull in `questions.json` or `lib/db.ts` — that once shipped a 4 MB, answer-key-bearing script to the browser and made the Exams page take ~3 s to open on a mid-range device. `next.config.mjs` also keeps compiled pages alive in `next dev` (`onDemandEntries`) so revisits don't recompile.
* **Fonts:** loaded in `layout.tsx` through `next/font/google` and exposed as `--font-sans` / `--font-mono`.

---

## 7. Configuration and environment

Names only — copy `.env.example` to `.env.local` and fill in values. All are optional locally: without them the app runs in a safe test mode.

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Absolute URL of the app |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase (planned migration; unused by current code) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_PAYMENT_URL` | Razorpay (test mode when omitted) |
| `JUDGE0_API_URL`, `JUDGE0_API_KEY` | Code-execution service (mock runner when omitted) |
| `AI_MODEL_API_KEY` | AI question generation (templates / CSV import when omitted) |
| `NEXT_DIST_DIR` | Build output folder (default `.next`) — lets a production build run beside `next dev` |

---

## 8. Commands

Run from the `exam/` folder.

| Task | Command |
|---|---|
| Develop | `npm run dev` → http://localhost:3000 |
| Unit tests | `npm test` (`npm run test:watch` while developing) |
| Type check | `npx tsc --noEmit` |
| Production build beside a running dev server | `NEXT_DIST_DIR=.next-production npm run build` |
| Serve that build | `NEXT_DIST_DIR=.next-production npx next start -p 3100` |
| Rebuild the question bank | `npx tsx scripts/generate-questions.ts` (overwrites `src/data/questions.json`) |
| Load test | `k6 run scripts/load-test-k6.js` (set `TARGET_URL`; default http://localhost:3000) |

`npm run lint` is declared, but ESLint is not installed or configured, and `next build` skips linting.

---

## 9. Testing

`src/__tests__/` (Vitest, node environment):

| File | Tests | Covers |
|---|---|---|
| `platform.test.ts` | 15 | 72 domains / 3,600 questions, scoring with negative marking, attempt limits, pricing, deadlines, NTCRA 3-section structure, institutions, tokens |
| `face-monitor.test.ts` | 12 | Multi-face state machine and false-positive handling |
| `proctoring.test.ts` | 8 | Strikes, integrity score, attempt lifecycle, tab-switch rules, single login |
| `rbac.test.ts` | 6 | Password hashing, JWT, proctoring sessions, review audit |
| `automated-payment.test.ts` | 5 | Order creation, verification, duplicate protection, webhook, unlock |
| `proctor-training.test.ts` | 5 | Training pipeline steps |
| `fullscreen.test.ts` | 5 | Fullscreen manager (SSR-safe, fallback, listeners) |
| `exam-seed-ids.test.ts` | 4 | Exam question ids match the real question bank (guards the client-bundle shortcut in `data/exams.ts`); read-only, never touches `.data/` |

There are no component, end-to-end or API-route tests yet.

---

## 10. Things to know (open items found while documenting)

These are facts about the current code, listed so nobody trips over them.

**Data and tests**
* **The unit tests write into the real `.data/` store** (test users, graded attempts, token transactions, imported questions). Each run adds records — the home-page question count rises, and test rows appear on the leaderboard. The suite should use a temporary data directory.
* `.data/` and `.env.local` sit in the project folder and there is **no `.gitignore`** at this level; both should be ignored before the project is put under version control.

**Security (found by anonymous `GET` probes on 29 Oct 2026; `POST` routes were deliberately not probed so as not to change data)**
* `GET /api/auth` returns the demo profile to an anonymous caller, including a non-hashed `password` field. The login page also pre-fills the demo credentials.
* `GET /api/admin/questions` returns the whole question bank including `correctAnswer`. `admin/coverage`, `admin/proctor/metrics` and `admin/proctor/train` also answered anonymously.
* `GET /api/institution/lead` returns college contacts (names, emails, phone numbers) without authentication.
* Among the probed `v1/proctoring/*` routes only `reviews` answered `401`; `sessions` answered anonymously.

**Behaviour**
* `/assessments/history` and `/assessments/analytics` read a **hard-coded** `user-student-demo` and are prerendered at build time, so in production they are frozen at build-time data (cache header `s-maxage=31536000`). They need the signed-in user and `export const dynamic = "force-dynamic"`.
* The built-in 404 page paints a black background when the visitor's OS prefers dark, while the site's own CSS sets dark text — nearly invisible on the default light theme. A custom `app/not-found.tsx` would fix it.
* `/pay` is a prerendered redirect; in production it answers `307` without a `Location` header (dev sends one).
* `.data/` writes happen in-process, so the data layer is single-instance only (no multi-process or serverless deployment until it moves to a real database).
* `/contact` does not send the message anywhere.

**Code hygiene**
* `lib/mongoose.ts`, `lib/supabase.ts`, `src/models/*`, `supabase/migrations/` are prepared for a migration but unused.
* `components/PointerGlow.tsx` and `components/Typewriter.tsx` are unused.
* `manifest.ts` and the `<title>`/description in `layout.tsx` still say "Exam Hub", and the manifest theme colour is the old blue.
* `README.md` §3 (directory tree) predates the redesign; this file is the current reference.
* `npm test` writes into the real `.data/` store. To run the suite without touching it, start it from another working directory (the store lives under the current directory): `cd <empty temp dir> && node <project>/node_modules/vitest/vitest.mjs run --root <project> --config <project>/vitest.config.ts` (use the same drive-letter case in all three paths on Windows).
