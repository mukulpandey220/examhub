import { 
  Question, 
  Domain, 
  Examination, 
  ExamAttempt, 
  PricingPlan, 
  Entitlement, 
  CampusDeadline, 
  UserProfile,
  DifficultyLevel,
  InstitutionalLead,
  ProctoringLog,
  TokenTransaction,
  PaymentIntent
} from "@/types";
import { DOMAINS } from "@/data/domains";
import { INITIAL_EXAMS } from "@/data/exams";
import { PRICING_PLANS } from "@/data/pricing";
import { INITIAL_DEADLINES } from "@/data/deadlines";
import initialQuestions from "@/data/questions.json";

// Safe dynamic fs handling for server vs client bundle
let fs: any = null;
let path: any = null;

if (typeof window === "undefined") {
  try {
    fs = require("fs");
    path = require("path");
  } catch (e) {
    // browser or fallback
  }
}

const DATA_DIR = typeof process !== "undefined" && typeof process.cwd === "function" && path ? path.resolve(process.cwd(), ".data") : ".data";

function ensureDataDir() {
  if (fs && path && !fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {}
  }
}

function readJsonFile<T>(filename: string, fallback: T): T {
  if (!fs || !path) return fallback;
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), "utf-8");
    } catch (e) {}
    return fallback;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  if (!fs || !path) return;
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {}
}

// In-memory singletons backed by files
class DatabaseEngine {
  private questions: Question[] = [];
  private exams: Examination[] = [];
  private attempts: ExamAttempt[] = [];
  private entitlements: Entitlement[] = [];
  private deadlines: CampusDeadline[] = [];
  private profiles: UserProfile[] = [];
  private bookmarks: Record<string, string[]> = {};
  private institutionalLeads: InstitutionalLead[] = [];
  private tokenTransactions: TokenTransaction[] = [];
  private paymentIntents: PaymentIntent[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // 1. Questions
    const savedQuestions = readJsonFile<Question[]>("questions.json", initialQuestions as Question[]);
    this.questions = savedQuestions && savedQuestions.length >= 3600 ? savedQuestions : (initialQuestions as Question[]);
    
    // 2. Exams with feeRupees & tokenFee calibration (1 Rs = 1 Token)
    const savedExams = readJsonFile<Examination[]>("exams.json", INITIAL_EXAMS);
    let examsModified = false;
    this.exams = (savedExams && savedExams.length > 0 ? savedExams : INITIAL_EXAMS).map(ex => {
      if (ex.feeRupees === undefined || ex.tokenFee === undefined) {
        examsModified = true;
        const isFree = ex.isFreeSample || ["dotnet", "ai-ml", "vlsi", "machine-design", "aspen-plus", "construction-planning", "finance", "bioinformatics"].includes(ex.domainSlug) || ex.mode === "practice";
        return {
          ...ex,
          feeRupees: isFree ? 0 : 99,
          tokenFee: isFree ? 0 : 99,
        };
      }
      return ex;
    });
    if (examsModified) {
      this.persist("exams");
    }
    
    // 3. Attempts
    this.attempts = readJsonFile<ExamAttempt[]>("attempts.json", []);

    // 4. Entitlements
    this.entitlements = readJsonFile<Entitlement[]>("entitlements.json", [
      {
        id: "ent-ramkumar-01",
        userId: "user-student-ramkumar",
        tier: "semester",
        startsAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
        paymentRef: "pay_razorpay_CkGK3Dv",
        status: "active",
      },
      {
        id: "ent-demo-01",
        userId: "user-student-demo",
        tier: "seven_day",
        startsAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
        paymentRef: "pay_razorpay_CkGK3Dv",
        status: "active",
      }
    ]);

    // 5. Deadlines
    this.deadlines = readJsonFile<CampusDeadline[]>("deadlines.json", INITIAL_DEADLINES);

    // 6. Profiles with Token Wallet (1 Rs = 1 Token)
    const initialProfilesList: UserProfile[] = [
      {
        id: "user-student-ramkumar",
        email: "ramkumar.malothu@nyeras.com",
        password: "Nyeras@123",
        name: "Ramkumar Malothu",
        role: "student",
        category: "cse_it",
        domainSlug: "dsa-system-design",
        university: "Nyeras Institute of Technology",
        courseDegree: "B.Tech Computer Science & Engineering",
        branch: "Computer Science",
        semester: 7,
        selectedDifficulty: "intermediate",
        preferredMode: "timed",
        onboarded: true,
        optedExams: ["exam-dsa-system-design-mock-01", "exam-dotnet-mock-01"],
        tokens: 100,
        unlockedExams: ["exam-dsa-system-design-mock-01", "exam-dotnet-mock-01"],
        createdAt: new Date().toISOString(),
      },
      {
        id: "user-admin-nyeras",
        email: "admin@nyeras.com",
        password: "Nyeras@123",
        name: "Admin Nyeras",
        role: "admin",
        onboarded: true,
        tokens: 1000,
        createdAt: new Date().toISOString(),
      },
      {
        id: "user-student-demo",
        email: "student@campusradar.edu.in",
        password: "password123",
        name: "Arjun Sharma",
        role: "student",
        category: "cse_it",
        domainSlug: "dsa-system-design",
        university: "Visvesvaraya Technological University (VTU)",
        courseDegree: "B.Tech Computer Science & Engineering",
        branch: "Computer Science",
        semester: 7,
        selectedDifficulty: "intermediate",
        preferredMode: "timed",
        onboarded: true,
        optedExams: ["exam-dsa-system-design-mock-01"],
        tokens: 100,
        unlockedExams: ["exam-dsa-system-design-mock-01"],
        createdAt: new Date().toISOString(),
      },
      {
        id: "user-admin-demo",
        email: "admin@campusradar.edu.in",
        password: "Nyeras@123",
        name: "Dean of Examinations",
        role: "admin",
        onboarded: true,
        tokens: 1000,
        createdAt: new Date().toISOString(),
      }
    ];

    const savedProfiles = readJsonFile<UserProfile[]>("profiles.json", initialProfilesList);
    // Ensure all profiles have tokens & unlockedExams initialized
    this.profiles = (savedProfiles && savedProfiles.length > 0 ? savedProfiles : initialProfilesList).map(p => {
      return {
        ...p,
        tokens: p.tokens !== undefined ? p.tokens : 100,
        unlockedExams: p.unlockedExams || ["exam-dsa-system-design-mock-01"],
      };
    });

    // Ensure default demo users exist
    for (const initP of initialProfilesList) {
      if (!this.profiles.some(p => p.id === initP.id || p.email.toLowerCase() === initP.email.toLowerCase())) {
        this.profiles.push(initP);
      }
    }
    this.persist("profiles");

    // 7. Bookmarks
    this.bookmarks = readJsonFile<Record<string, string[]>>("bookmarks.json", {
      "user-student-ramkumar": ["q-dsa-system-design-001", "q-dsa-system-design-015"],
      "user-student-demo": ["q-dsa-system-design-001", "q-dsa-system-design-015"]
    });

    // 8. Institutional Leads & College Cohorts (Nyeras Nxtmove)
    this.institutionalLeads = readJsonFile<InstitutionalLead[]>("institutional_leads.json", [
      {
        id: "lead-vtu-01",
        collegeName: "B.M.S. College of Engineering",
        universityAffiliation: "Visvesvaraya Technological University (VTU)",
        city: "Bengaluru",
        state: "Karnataka",
        spocName: "Dr. K. R. Suresh",
        spocDesignation: "Dean / TPO",
        spocEmail: "tpo@bmsce.ac.in",
        spocPhone: "+91 98450 12345",
        studentCohortSize: 650,
        preferredExamWindow: "Nov 15 - Nov 22, 2026",
        labFacilityAvailable: true,
        status: "onboarded",
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: "lead-anna-02",
        collegeName: "SSN College of Engineering",
        universityAffiliation: "Anna University Chennai",
        city: "Chennai",
        state: "Tamil Nadu",
        spocName: "Prof. S. Ramanathan",
        spocDesignation: "Principal SPOC",
        spocEmail: "placement@ssn.edu.in",
        spocPhone: "+91 94440 67890",
        studentCohortSize: 480,
        preferredExamWindow: "Nov 20 - Nov 28, 2026",
        labFacilityAvailable: true,
        status: "scheduled",
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      }
    ]);

    // 9. Token Transactions (1 Rs = 1 Token)
    this.tokenTransactions = readJsonFile<TokenTransaction[]>("token_transactions.json", [
      {
        id: "tx-init-ramkumar-01",
        userId: "user-student-ramkumar",
        type: "credit",
        amount: 100,
        rupees: 100,
        description: "Student Dashboard Initial Token Balance (₹1 = 1 Token)",
        paymentRef: "pay_init_100",
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: "tx-init-demo-01",
        userId: "user-student-demo",
        type: "credit",
        amount: 100,
        rupees: 100,
        description: "Student Dashboard Initial Token Balance (₹1 = 1 Token)",
        paymentRef: "pay_init_100",
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      }
    ]);

    this.paymentIntents = readJsonFile<PaymentIntent[]>("payment_intents.json", []);
  }

  private persist(target: "questions" | "exams" | "attempts" | "entitlements" | "deadlines" | "profiles" | "bookmarks" | "institutionalLeads" | "tokenTransactions" | "paymentIntents") {
    switch (target) {
      case "questions":
        writeJsonFile("questions.json", this.questions);
        break;
      case "exams":
        writeJsonFile("exams.json", this.exams);
        break;
      case "attempts":
        writeJsonFile("attempts.json", this.attempts);
        break;
      case "entitlements":
        writeJsonFile("entitlements.json", this.entitlements);
        break;
      case "deadlines":
        writeJsonFile("deadlines.json", this.deadlines);
        break;
      case "profiles":
        writeJsonFile("profiles.json", this.profiles);
        break;
      case "bookmarks":
        writeJsonFile("bookmarks.json", this.bookmarks);
        break;
      case "institutionalLeads":
        writeJsonFile("institutional_leads.json", this.institutionalLeads);
        break;
      case "tokenTransactions":
        writeJsonFile("token_transactions.json", this.tokenTransactions);
        break;
      case "paymentIntents":
        writeJsonFile("payment_intents.json", this.paymentIntents);
        break;
    }
  }

  // --- Questions ---
  public getQuestions(): Question[] {
    return this.questions;
  }

  public getApprovedQuestions(): Question[] {
    return this.questions.filter(q => q.reviewStatus === "approved");
  }

  public getQuestionById(id: string): Question | undefined {
    return this.questions.find(q => q.id === id);
  }

  public getQuestionsByDomain(domainSlug: string): Question[] {
    return this.questions.filter(q => q.domainSlug.toLowerCase() === domainSlug.toLowerCase());
  }

  public addQuestion(question: Question): Question {
    const existingIdx = this.questions.findIndex(q => q.id === question.id);
    if (existingIdx >= 0) {
      this.questions[existingIdx] = question;
    } else {
      this.questions.push(question);
    }
    this.persist("questions");
    return question;
  }

  public updateQuestionStatus(id: string, status: Question["reviewStatus"]): boolean {
    const q = this.questions.find(item => item.id === id);
    if (q) {
      q.reviewStatus = status;
      this.persist("questions");
      return true;
    }
    return false;
  }

  public bulkImportQuestions(newQuestions: Question[]): { imported: number; duplicates: number } {
    let imported = 0;
    let duplicates = 0;

    for (const q of newQuestions) {
      const exists = this.questions.some(existing => existing.id === q.id || (existing.domainSlug === q.domainSlug && existing.questionText.trim().toLowerCase() === q.questionText.trim().toLowerCase()));
      if (exists) {
        duplicates++;
      } else {
        this.questions.push(q);
        imported++;
      }
    }

    if (imported > 0) {
      this.persist("questions");
    }

    return { imported, duplicates };
  }

  // --- Domains & Coverage ---
  public getDomains(): Domain[] {
    return DOMAINS.map(d => {
      const domainQs = this.questions.filter(q => q.domainSlug === d.slug);
      const approved = domainQs.filter(q => q.reviewStatus === "approved");
      
      return {
        ...d,
        questionCount: domainQs.length,
        approvedCount: approved.length,
        difficultyDistribution: {
          basic: approved.filter(q => q.difficulty === "basic").length,
          intermediate: approved.filter(q => q.difficulty === "intermediate").length,
          advanced: approved.filter(q => q.difficulty === "advanced").length,
          professional: approved.filter(q => q.difficulty === "professional").length,
        }
      };
    });
  }

  public getDomainCoverage() {
    const domains = this.getDomains();
    return domains.map(d => {
      const allDomainQs = this.questions.filter(q => q.domainSlug === d.slug);
      const approved = allDomainQs.filter(q => q.reviewStatus === "approved");
      const drafts = allDomainQs.filter(q => q.reviewStatus === "draft");
      const pending = allDomainQs.filter(q => q.reviewStatus === "pending_review");
      
      const basicCount = approved.filter(q => q.difficulty === "basic").length;
      const intermediateCount = approved.filter(q => q.difficulty === "intermediate").length;
      const advancedCount = approved.filter(q => q.difficulty === "advanced").length;
      const professionalCount = approved.filter(q => q.difficulty === "professional").length;

      const remainingRequired = Math.max(0, 50 - approved.length);
      const isComplete = approved.length >= 50 && basicCount >= 10 && intermediateCount >= 15 && advancedCount >= 15 && professionalCount >= 10;

      return {
        slug: d.slug,
        name: d.name,
        categoryCode: d.categoryCode,
        categoryName: d.categoryName,
        totalQuestions: allDomainQs.length,
        approvedQuestions: approved.length,
        draftQuestions: drafts.length,
        pendingReviewQuestions: pending.length,
        difficulty: {
          basic: basicCount,
          intermediate: intermediateCount,
          advanced: advancedCount,
          professional: professionalCount,
        },
        remainingRequired,
        isComplete
      };
    });
  }

  // --- Exams ---
  public getExams(): Examination[] {
    return this.exams;
  }

  public getExamById(id: string): Examination | undefined {
    return this.exams.find(e => e.id === id || e.slug === id);
  }

  public createExam(exam: Examination): Examination {
    this.exams.push(exam);
    this.persist("exams");
    return exam;
  }

  public updateExam(id: string, updates: Partial<Examination>): Examination | undefined {
    const idx = this.exams.findIndex(e => e.id === id);
    if (idx >= 0) {
      this.exams[idx] = { ...this.exams[idx], ...updates };
      this.persist("exams");
      return this.exams[idx];
    }
    return undefined;
  }

  // --- Attempts & Scoring ---
  public resetUserAttemptsForExam(userId: string, examId: string): boolean {
    const beforeCount = this.attempts.length;
    this.attempts = this.attempts.filter(a => !(a.examId === examId && a.userId === userId));
    this.persist("attempts");
    return this.attempts.length < beforeCount;
  }

  public getExamAttemptStatus(userId: string, examId: string): {
    attempts: ExamAttempt[];
    attemptsUsed: number;
    attemptLimit: number;
    isLimitReached: boolean;
    activeAttempt: ExamAttempt | null;
  } {
    const exam = this.getExamById(examId);
    const limit = exam?.attemptLimit ?? 3;
    const existing = this.attempts.filter(a => a.examId === examId && a.userId === userId);
    
    // Check if active attempt is expired
    const active = existing.find(a => a.status === "in_progress");
    let validActive: ExamAttempt | null = null;
    if (active) {
      if (new Date(active.expiresAt).getTime() < Date.now()) {
        this.submitAttempt({ attemptId: active.id, autoExpired: true });
      } else {
        validActive = active;
      }
    }

    const updatedExisting = this.attempts.filter(a => a.examId === examId && a.userId === userId);
    return {
      attempts: updatedExisting,
      attemptsUsed: updatedExisting.length,
      attemptLimit: limit,
      isLimitReached: updatedExisting.length >= limit && !validActive,
      activeAttempt: validActive,
    };
  }

  public startAttempt(params: {
    examId: string;
    userId: string;
    userEmail: string;
    userName: string;
    resetAttempts?: boolean;
    sessionToken?: string;
    reclaimSession?: boolean;
  }): { attempt: ExamAttempt; error?: string; isSecondLoginBlocked?: boolean } {
    const exam = this.getExamById(params.examId);
    if (!exam) return { attempt: null as any, error: "Examination not found." };

    if (params.resetAttempts) {
      this.resetUserAttemptsForExam(params.userId, params.examId);
    }

    const existingAttempts = this.attempts.filter(a => a.examId === exam.id && a.userId === params.userId);

    // 1. Check for ongoing active attempt FIRST before blocking by limit
    const active = existingAttempts.find(a => a.status === "in_progress");
    if (active) {
      if (new Date(active.expiresAt).getTime() < Date.now()) {
        this.submitAttempt({ attemptId: active.id, autoExpired: true });
      } else {
        // If candidate reclaims or reconnects their session
        if (params.reclaimSession) {
          if (params.sessionToken) {
            active.sessionToken = params.sessionToken;
          }
          if (active.proctoring) {
            active.proctoring.isDisqualified = false;
            active.proctoring.disqualificationReason = undefined;
            active.proctoring.secondLoginViolations = 0;
            active.proctoring.violations = (active.proctoring.violations || []).filter(v => v.type !== "second_login_attempt");
            active.proctoring.totalViolations = active.proctoring.violations.length;
            active.proctoring.integrityScore = Math.max(0, 100 - (active.proctoring.totalViolations * 15));
          }
          this.persist("attempts");
          return { attempt: active };
        }

        // Enforce No Second Login (1 time in the exam rule)
        if (params.sessionToken && active.sessionToken && params.sessionToken !== active.sessionToken) {
          active.proctoring = active.proctoring || {
            integrityScore: 0,
            totalViolations: 1,
            tabSwitchViolations: 0,
            fullscreenViolations: 0,
            blurViolations: 0,
            secondLoginViolations: 1,
            copyPasteViolations: 0,
            devtoolsViolations: 0,
            isDisqualified: true,
            disqualificationReason: "No second login allowed: Concurrent attempt detected from a second device/browser.",
            cameraActive: true,
            microphoneActive: true,
            violations: [],
          };
          active.proctoring.secondLoginViolations = (active.proctoring.secondLoginViolations || 0) + 1;
          active.proctoring.violations.push({
            id: `viol-sec-login-${Date.now()}`,
            type: "second_login_attempt",
            timestamp: new Date().toISOString(),
            details: "Concurrent second login blocked: Candidate attempted to access the exam from a second session/device.",
          });
          this.persist("attempts");

          return {
            attempt: null as any,
            error: "Concurrent session blocked: You already have an active exam session on another device or tab. Secondary logins during an examination are strictly prohibited.",
            isSecondLoginBlocked: true,
          };
        }

        // Attach sessionToken if not present
        if (!active.sessionToken && params.sessionToken) {
          active.sessionToken = params.sessionToken;
          this.persist("attempts");
        }
        return { attempt: active };
      }
    }

    // 2. Re-check total attempts against limit after potential auto-expiry
    const currentAttempts = this.attempts.filter(a => a.examId === exam.id && a.userId === params.userId);
    if (currentAttempts.length >= exam.attemptLimit) {
      return { attempt: null as any, error: `Maximum attempt limit (${exam.attemptLimit}) reached for this examination.` };
    }

    const now = new Date();
    const durationMs = exam.durationMinutes * 60 * 1000;
    const expiresAt = new Date(now.getTime() + durationMs);
    const sessionToken = params.sessionToken || `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const newAttempt: ExamAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      examId: exam.id,
      examTitle: exam.title,
      domainSlug: exam.domainSlug,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: "in_progress",
      answers: {},
      markedForReview: [],
      timeSpentSeconds: 0,
      sessionToken,
    };

    this.attempts.push(newAttempt);
    this.persist("attempts");
    return { attempt: newAttempt };
  }

  public autosaveAttempt(params: {
    attemptId: string;
    answers: Record<string, any>;
    markedForReview: string[];
    timeSpentSeconds: number;
    codingSubmissions?: Record<string, any>;
    proctoring?: ProctoringLog;
    sessionToken?: string;
  }): boolean {
    const attempt = this.attempts.find(a => a.id === params.attemptId);
    if (!attempt || attempt.status !== "in_progress") return false;

    // Reject autosave from unauthorized concurrent session
    if (params.sessionToken && attempt.sessionToken && params.sessionToken !== attempt.sessionToken) {
      return false;
    }

    if (new Date(attempt.expiresAt).getTime() < Date.now()) {
      this.submitAttempt({ attemptId: attempt.id, autoExpired: true, proctoring: params.proctoring });
      return false;
    }

    attempt.answers = { ...attempt.answers, ...params.answers };
    attempt.markedForReview = params.markedForReview;
    attempt.timeSpentSeconds = params.timeSpentSeconds;
    if (params.codingSubmissions) {
      attempt.codingSubmissions = { ...attempt.codingSubmissions, ...params.codingSubmissions };
    }
    if (params.proctoring) {
      attempt.proctoring = params.proctoring;
    }

    this.persist("attempts");
    return true;
  }

  public submitAttempt(params: {
    attemptId: string;
    answers?: Record<string, any>;
    autoExpired?: boolean;
    codingSubmissions?: Record<string, any>;
    proctoring?: ProctoringLog;
  }): { attempt: ExamAttempt; error?: string } {
    const attempt = this.attempts.find(a => a.id === params.attemptId);
    if (!attempt) return { attempt: null as any, error: "Attempt not found." };
    if (attempt.status === "submitted" || attempt.status === "graded") {
      return { attempt };
    }

    const exam = this.getExamById(attempt.examId);
    if (!exam) return { attempt: null as any, error: "Exam definition not found." };

    if (params.answers) {
      attempt.answers = { ...attempt.answers, ...params.answers };
    }
    if (params.codingSubmissions) {
      attempt.codingSubmissions = { ...attempt.codingSubmissions, ...params.codingSubmissions };
    }

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const topicStats: Record<string, { correct: number; total: number }> = {};
    const difficultyStats: Record<string, { correct: number; total: number }> = {
      basic: { correct: 0, total: 0 },
      intermediate: { correct: 0, total: 0 },
      advanced: { correct: 0, total: 0 },
      professional: { correct: 0, total: 0 },
    };

    const examQuestions = exam.questionIds.map(qid => this.getQuestionById(qid)).filter(Boolean) as Question[];

    for (const q of examQuestions) {
      const userAnswer = attempt.answers[q.id];
      const diff = q.difficulty;
      difficultyStats[diff].total += 1;

      if (!topicStats[q.topic]) {
        topicStats[q.topic] = { correct: 0, total: 0 };
      }
      topicStats[q.topic].total += 1;

      if (userAnswer === undefined || userAnswer === null || userAnswer === "" || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
        unansweredCount++;
        continue;
      }

      let isCorrect = false;

      if (q.type === "multiple_choice") {
        if (Array.isArray(userAnswer) && Array.isArray(q.correctAnswer)) {
          const sortedUser = [...userAnswer].sort().join(",");
          const sortedCorrect = [...q.correctAnswer].sort().join(",");
          isCorrect = sortedUser === sortedCorrect;
        }
      } else if (q.type === "numerical") {
        const uNum = parseFloat(String(userAnswer).trim());
        const cNum = typeof q.correctAnswer === "number" ? q.correctAnswer : parseFloat(String(q.correctAnswer));
        isCorrect = !isNaN(uNum) && Math.abs(uNum - cNum) <= 0.2;
      } else if (q.type === "coding") {
        const sub = attempt.codingSubmissions?.[q.id];
        if (sub && sub.passedCases === sub.totalCases && sub.totalCases > 0) {
          isCorrect = true;
        } else if (String(userAnswer).length > 20) {
          isCorrect = true;
        }
      } else {
        isCorrect = String(userAnswer).trim() === String(q.correctAnswer).trim();
      }

      if (isCorrect) {
        totalScore += q.marks;
        correctCount++;
        difficultyStats[diff].correct += 1;
        topicStats[q.topic].correct += 1;
      } else {
        totalScore -= (q.negativeMarks || exam.negativeMarkingPerWrong || 0);
        incorrectCount++;
      }
    }

    // Section-wise analysis (Section A: 25% Aptitude, Section B: 50% Technical, Section C: 25% Workplace)
    const sectionScores: Record<string, { score: number; maxScore: number; percentage: number; correct: number; total: number; name: string }> = {
      section_a: { score: 0, maxScore: 0, percentage: 0, correct: 0, total: 0, name: "Section A: Analytical Aptitude" },
      section_b: { score: 0, maxScore: 0, percentage: 0, correct: 0, total: 0, name: "Section B: Domain Technical Core" },
      section_c: { score: 0, maxScore: 0, percentage: 0, correct: 0, total: 0, name: "Section C: Workplace Readiness" },
    };

    if (exam.sections && exam.sections.length > 0) {
      for (const sec of exam.sections) {
        sectionScores[sec.id] = {
          score: 0,
          maxScore: 0,
          percentage: 0,
          correct: 0,
          total: 0,
          name: sec.name
        };
      }
    }

    for (let i = 0; i < examQuestions.length; i++) {
      const q = examQuestions[i];
      let secId = "section_b";
      if (exam.sections && exam.sections.length > 0) {
        const found = exam.sections.find(s => s.questionIds.includes(q.id));
        if (found) secId = found.id;
      } else {
        if (i < Math.floor(examQuestions.length * 0.25)) secId = "section_a";
        else if (i >= Math.floor(examQuestions.length * 0.75)) secId = "section_c";
        else secId = "section_b";
      }

      if (!sectionScores[secId]) {
        sectionScores[secId] = { score: 0, maxScore: 0, percentage: 0, correct: 0, total: 0, name: secId };
      }

      sectionScores[secId].total += 1;
      sectionScores[secId].maxScore += q.marks;

      const userAns = attempt.answers[q.id];
      if (userAns !== undefined && userAns !== null && userAns !== "" && !(Array.isArray(userAns) && userAns.length === 0)) {
        let isCorrect = false;
        if (q.type === "multiple_choice") {
          if (Array.isArray(userAns) && Array.isArray(q.correctAnswer)) {
            isCorrect = [...userAns].sort().join(",") === [...q.correctAnswer].sort().join(",");
          }
        } else if (q.type === "numerical") {
          const uNum = parseFloat(String(userAns).trim());
          const cNum = typeof q.correctAnswer === "number" ? q.correctAnswer : parseFloat(String(q.correctAnswer));
          isCorrect = !isNaN(uNum) && Math.abs(uNum - cNum) <= 0.2;
        } else if (q.type === "coding") {
          const sub = attempt.codingSubmissions?.[q.id];
          if (sub && sub.passedCases === sub.totalCases && sub.totalCases > 0) isCorrect = true;
          else if (String(userAns).length > 20) isCorrect = true;
        } else {
          isCorrect = String(userAns).trim() === String(q.correctAnswer).trim();
        }

        if (isCorrect) {
          sectionScores[secId].correct += 1;
          sectionScores[secId].score += q.marks;
        } else {
          sectionScores[secId].score -= (q.negativeMarks || exam.negativeMarkingPerWrong || 0);
        }
      }
    }

    for (const key of Object.keys(sectionScores)) {
      sectionScores[key].score = Math.max(0, Math.round(sectionScores[key].score * 100) / 100);
      const m = sectionScores[key].maxScore || 1;
      sectionScores[key].percentage = Math.round((sectionScores[key].score / m) * 1000) / 10;
    }

    totalScore = Math.max(0, Math.round(totalScore * 100) / 100);
    const maxScore = exam.totalMarks || examQuestions.reduce((sum, q) => sum + q.marks, 0);
    const percentage = Math.round((totalScore / maxScore) * 1000) / 10;
    const passed = percentage >= exam.passingPercentage;

    const allIndiaPercentile = Math.min(99.9, Math.max(15, Math.round((percentage * 0.98 + (correctCount > 10 ? 3 : 0)) * 10) / 10));
    const nationalRank = Math.max(1, Math.round((100 - allIndiaPercentile) * 124.5) + 1);
    const isTopRanker = allIndiaPercentile >= 95;
    const certSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const certificateId = `NXTMOVE-${new Date().getFullYear()}-${attempt.id.replace('att-', '').slice(0, 6).toUpperCase()}-${certSuffix}`;

    attempt.submittedAt = new Date().toISOString();
    attempt.status = params.autoExpired ? "expired" : "graded";
    attempt.score = totalScore;
    attempt.maxScore = maxScore;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.unansweredCount = unansweredCount;
    attempt.topicBreakdown = topicStats;
    attempt.difficultyBreakdown = difficultyStats;
    attempt.sectionScores = sectionScores;
    attempt.allIndiaPercentile = allIndiaPercentile;
    attempt.nationalRank = nationalRank;
    attempt.isTopRanker = isTopRanker;
    attempt.certificateId = certificateId;
    if (params.proctoring) {
      attempt.proctoring = params.proctoring;
    }
    if (attempt.proctoring?.isDisqualified) {
      attempt.passed = false;
    }

    this.persist("attempts");
    return { attempt };
  }

  public getAttemptById(attemptId: string): ExamAttempt | undefined {
    return this.attempts.find(a => a.id === attemptId);
  }

  public getAttempts(): ExamAttempt[] {
    return this.attempts;
  }

  public getUserAttempts(userId: string): ExamAttempt[] {
    return this.attempts.filter(a => a.userId === userId).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  // --- Rankings & Leaderboard ---
  public getLeaderboard(domainSlug?: string) {
    // Benchmark static student records to combine with dynamic attempts
    const seedLeaderboard = [
      {
        id: "att-seed-01",
        userId: "user-student-ramkumar",
        userName: "Ramkumar Malothu",
        userEmail: "ramkumar.malothu@nyeras.com",
        university: "Nyeras Institute of Technology",
        domainSlug: "dsa-system-design",
        domainName: "DSA & System Design",
        examTitle: "DSA & System Design Industry Benchmark & Placement Exam",
        score: 48.5,
        maxScore: 50,
        percentage: 97,
        timeSpentSeconds: 1120, // 18m 40s
        correctCount: 24,
        incorrectCount: 1,
        submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "att-seed-02",
        userId: "user-student-priya",
        userName: "Priya Nair",
        userEmail: "priya.nair@iitb.ac.in",
        university: "IIT Bombay",
        domainSlug: "dsa-system-design",
        domainName: "DSA & System Design",
        examTitle: "DSA & System Design Industry Benchmark & Placement Exam",
        score: 48.5,
        maxScore: 50,
        percentage: 97,
        timeSpentSeconds: 1280, // 21m 20s
        correctCount: 24,
        incorrectCount: 1,
        submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: "att-seed-03",
        userId: "user-student-arjun",
        userName: "Arjun Sharma",
        userEmail: "student@campusradar.edu.in",
        university: "VTU Belagavi",
        domainSlug: "dotnet",
        domainName: ".NET & C# Enterprise Engineering",
        examTitle: ".NET & C# Enterprise Placement Exam",
        score: 46.75,
        maxScore: 50,
        percentage: 93.5,
        timeSpentSeconds: 1340,
        correctCount: 23,
        incorrectCount: 2,
        submittedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: "att-seed-04",
        userId: "user-student-rohan",
        userName: "Rohan Gupta",
        userEmail: "rohan.gupta@bits-pilani.ac.in",
        university: "BITS Pilani",
        domainSlug: "ai-ml",
        domainName: "Artificial Intelligence & Machine Learning",
        examTitle: "AI & ML Industry Placement Exam",
        score: 46.0,
        maxScore: 50,
        percentage: 92,
        timeSpentSeconds: 1410,
        correctCount: 23,
        incorrectCount: 2,
        submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: "att-seed-05",
        userId: "user-student-vikram",
        userName: "Vikram Varma",
        userEmail: "vikram.v@nitk.edu.in",
        university: "NIT Surathkal",
        domainSlug: "vlsi",
        domainName: "VLSI Design & Semiconductor",
        examTitle: "VLSI Design Industry Benchmark Exam",
        score: 45.0,
        maxScore: 50,
        percentage: 90,
        timeSpentSeconds: 1490,
        correctCount: 22,
        incorrectCount: 3,
        submittedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
      {
        id: "att-seed-06",
        userId: "user-student-sneha",
        userName: "Sneha Reddy",
        userEmail: "sneha.reddy@iiit.ac.in",
        university: "IIIT Hyderabad",
        domainSlug: "cloud-devops",
        domainName: "Cloud Computing & DevOps",
        examTitle: "Cloud & DevOps Placement Exam",
        score: 44.5,
        maxScore: 50,
        percentage: 89,
        timeSpentSeconds: 1510,
        correctCount: 22,
        incorrectCount: 3,
        submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: "att-seed-07",
        userId: "user-student-ananya",
        userName: "Ananya Iyer",
        userEmail: "ananya.iyer@annauniv.edu",
        university: "Anna University Chennai",
        domainSlug: "finance",
        domainName: "Financial Management & Banking",
        examTitle: "Financial Management Industry Exam",
        score: 43.5,
        maxScore: 50,
        percentage: 87,
        timeSpentSeconds: 1580,
        correctCount: 21,
        incorrectCount: 4,
        submittedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
      }
    ];

    // Graded attempts from DB
    const realAttempts = this.attempts
      .filter(a => a.status === "graded" || a.status === "expired")
      .map(a => {
        const exam = this.getExamById(a.examId);
        return {
          id: a.id,
          userId: a.userId,
          userName: a.userName,
          userEmail: a.userEmail,
          university: "Nyeras Institute of Technology",
          domainSlug: a.domainSlug,
          domainName: exam ? exam.domainName : a.domainSlug,
          examTitle: a.examTitle,
          score: a.score || 0,
          maxScore: a.maxScore || 50,
          percentage: a.percentage || 0,
          timeSpentSeconds: a.timeSpentSeconds || 1200,
          correctCount: a.correctCount || 0,
          incorrectCount: a.incorrectCount || 0,
          submittedAt: a.submittedAt || a.startedAt,
        };
      });

    // Merge and filter
    const all = [...realAttempts, ...seedLeaderboard];

    const filtered = domainSlug && domainSlug !== "all"
      ? all.filter(e => e.domainSlug.toLowerCase() === domainSlug.toLowerCase())
      : all;

    // Sorting rule:
    // 1. Highest Score (marks obtained)
    // 2. Lowest Time Taken (timeSpentSeconds, faster completion wins ties!)
    filtered.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.timeSpentSeconds - b.timeSpentSeconds;
    });

    // Assign sequential ranks
    return filtered.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
  }

  // --- Pricing, Orders & Entitlements ---
  public getEntitlements(userId: string): Entitlement[] {
    const now = new Date().getTime();
    return this.entitlements.filter(e => e.userId === userId && new Date(e.expiresAt).getTime() > now && e.status === "active");
  }

  public grantEntitlement(params: {
    userId: string;
    tier: Entitlement["tier"];
    durationDays: number;
    orderId?: string;
    paymentRef?: string;
  }): Entitlement {
    const now = new Date();
    const expires = new Date(now.getTime() + params.durationDays * 24 * 3600 * 1000);

    const ent: Entitlement = {
      id: `ent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      tier: params.tier,
      startsAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      orderId: params.orderId,
      paymentRef: params.paymentRef,
      status: "active",
    };

    this.entitlements.push(ent);
    this.persist("entitlements");
    return ent;
  }

  public createPaymentIntent(input: {
    userId: string;
    userEmail: string;
    amountPaise: number;
    currency: "INR";
    purpose: PaymentIntent["purpose"];
    planId?: string;
    examId?: string;
  }): PaymentIntent {
    const now = new Date().toISOString();
    const intent: PaymentIntent = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      userId: input.userId,
      userEmail: input.userEmail.trim().toLowerCase(),
      amountPaise: input.amountPaise,
      currency: input.currency,
      status: "pending",
      purpose: input.purpose,
      planId: input.planId,
      examId: input.examId,
      createdAt: now,
      updatedAt: now,
    };
    this.paymentIntents.unshift(intent);
    this.persist("paymentIntents");
    return intent;
  }

  public getPaymentIntent(id: string): PaymentIntent | undefined {
    return this.paymentIntents.find((intent) => intent.id === id);
  }

  public updatePaymentIntent(id: string, updates: Partial<PaymentIntent>): PaymentIntent | undefined {
    const idx = this.paymentIntents.findIndex((intent) => intent.id === id);
    if (idx < 0) return undefined;
    this.paymentIntents[idx] = {
      ...this.paymentIntents[idx],
      ...updates,
      id: this.paymentIntents[idx].id,
      updatedAt: new Date().toISOString(),
    };
    this.persist("paymentIntents");
    return this.paymentIntents[idx];
  }

  public findLatestPendingIntentByEmail(email: string): PaymentIntent | undefined {
    const needle = email.trim().toLowerCase();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return this.paymentIntents.find((intent) => {
      if (intent.status !== "pending") return false;
      if (intent.userEmail !== needle) return false;
      return new Date(intent.createdAt).getTime() >= cutoff;
    });
  }

  public findCreditByPaymentRef(paymentRef: string): TokenTransaction | undefined {
    return this.tokenTransactions.find(
      (tx) => tx.type === "credit" && tx.paymentRef === paymentRef
    );
  }

  // --- Campus Deadlines ---
  public getDeadlines(): CampusDeadline[] {
    return this.deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  public addDeadline(deadline: CampusDeadline): CampusDeadline {
    this.deadlines.push(deadline);
    this.persist("deadlines");
    return deadline;
  }

  // --- Profiles & Bookmarks ---
  public getProfiles(): UserProfile[] {
    return this.profiles;
  }

  public getProfile(userIdOrEmail: string): UserProfile | undefined {
    return this.profiles.find(p => p.id === userIdOrEmail || p.email.toLowerCase() === userIdOrEmail.toLowerCase());
  }

  public getProfileByEmail(email: string): UserProfile | undefined {
    return this.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
  }

  public optInExam(userIdOrEmail: string, examId: string): string[] {
    const profile = this.getProfile(userIdOrEmail);
    if (profile) {
      const current = profile.optedExams || [];
      if (!current.includes(examId)) {
        current.push(examId);
      }
      profile.optedExams = current;
      this.persist("profiles");
      return current;
    }
    return [];
  }

  public optOutExam(userIdOrEmail: string, examId: string): string[] {
    const profile = this.getProfile(userIdOrEmail);
    if (profile) {
      profile.optedExams = (profile.optedExams || []).filter(id => id !== examId);
      this.persist("profiles");
      return profile.optedExams;
    }
    return [];
  }

  public updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const idx = this.profiles.findIndex(p => p.id === userId);
    if (idx >= 0) {
      this.profiles[idx] = { ...this.profiles[idx], ...updates };
      this.persist("profiles");
      return this.profiles[idx];
    }
    const newProfile: UserProfile = {
      id: userId,
      email: updates.email || "student@campusradar.edu.in",
      name: updates.name || "Student",
      role: updates.role || "student",
      onboarded: true,
      createdAt: new Date().toISOString(),
      ...updates
    };
    this.profiles.push(newProfile);
    this.persist("profiles");
    return newProfile;
  }

  public getBookmarks(userId: string): string[] {
    return this.bookmarks[userId] || [];
  }

  public toggleBookmark(userId: string, questionId: string): string[] {
    const userBm = this.bookmarks[userId] || [];
    const idx = userBm.indexOf(questionId);
    if (idx >= 0) {
      userBm.splice(idx, 1);
    } else {
      userBm.push(questionId);
    }
    this.bookmarks[userId] = userBm;
    this.persist("bookmarks");
    return userBm;
  }

  // --- Token Economy & Exam Purchases (1 Rs = 1 Token) ---
  public getUserTokens(userIdOrEmail: string): number {
    const profile = this.getProfile(userIdOrEmail);
    return profile?.tokens ?? 0;
  }

  public getTokenTransactions(userIdOrEmail: string): TokenTransaction[] {
    const profile = this.getProfile(userIdOrEmail);
    const id = profile ? profile.id : userIdOrEmail;
    return this.tokenTransactions
      .filter(t => t.userId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addTokens(params: {
    userId: string;
    tokens: number;
    rupees: number;
    paymentRef?: string;
    orderId?: string;
    description?: string;
    examId?: string;
  }): { newBalance: number; transaction: TokenTransaction } {
    let profile = this.getProfile(params.userId);
    if (!profile) {
      profile = this.updateProfile(params.userId, { tokens: 0 });
    }

    const currentBalance = profile.tokens ?? 0;
    const newBalance = currentBalance + params.tokens;
    profile.tokens = newBalance;

    // If an examId was passed with payment, unlock it directly
    if (params.examId) {
      const unlocked = profile.unlockedExams || [];
      if (!unlocked.includes(params.examId)) {
        unlocked.push(params.examId);
      }
      profile.unlockedExams = unlocked;
    }

    this.persist("profiles");

    const transaction: TokenTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: profile.id,
      type: "credit",
      amount: params.tokens,
      rupees: params.rupees,
      description: params.description || `Authenticated Razorpay payment: credited ${params.tokens} tokens (₹1 = 1 Token)`,
      paymentRef: params.paymentRef,
      orderId: params.orderId,
      examId: params.examId,
      createdAt: new Date().toISOString(),
    };

    this.tokenTransactions.unshift(transaction);
    this.persist("tokenTransactions");

    return { newBalance, transaction };
  }

  public unlockExamWithTokens(userIdOrEmail: string, examId: string): {
    success: boolean;
    newBalance: number;
    message: string;
    transaction?: TokenTransaction;
  } {
    const profile = this.getProfile(userIdOrEmail);
    if (!profile) {
      return { success: false, newBalance: 0, message: "User profile not found." };
    }

    const exam = this.getExamById(examId);
    if (!exam) {
      return { success: false, newBalance: profile.tokens ?? 0, message: "Exam not found." };
    }

    const unlocked = profile.unlockedExams || [];
    if (unlocked.includes(examId)) {
      return { success: true, newBalance: profile.tokens ?? 0, message: "Exam is already unlocked." };
    }

    const requiredTokens = exam.tokenFee ?? exam.feeRupees ?? 99;

    // Free exams cost 0 tokens
    if (requiredTokens === 0) {
      unlocked.push(examId);
      profile.unlockedExams = unlocked;
      this.persist("profiles");
      return { success: true, newBalance: profile.tokens ?? 0, message: "Free exam unlocked." };
    }

    const currentTokens = profile.tokens ?? 0;
    if (currentTokens < requiredTokens) {
      return {
        success: false,
        newBalance: currentTokens,
        message: `Insufficient tokens. This exam requires ${requiredTokens} tokens (₹${requiredTokens}), but you have ${currentTokens} tokens. Please top up on Razorpay.`,
      };
    }

    // Deduct tokens (1 Rs = 1 Token)
    const newBalance = currentTokens - requiredTokens;
    profile.tokens = newBalance;
    unlocked.push(examId);
    profile.unlockedExams = unlocked;
    this.persist("profiles");

    const transaction: TokenTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: profile.id,
      type: "debit",
      amount: requiredTokens,
      rupees: requiredTokens,
      description: `Exam fee unlock: ${exam.title} (${requiredTokens} Tokens / ₹${requiredTokens})`,
      examId: exam.id,
      createdAt: new Date().toISOString(),
    };

    this.tokenTransactions.unshift(transaction);
    this.persist("tokenTransactions");

    return {
      success: true,
      newBalance,
      message: `Exam unlocked successfully! Debited ${requiredTokens} tokens. Remaining balance: ${newBalance} tokens.`,
      transaction,
    };
  }

  public isExamUnlockedForUser(userIdOrEmail: string, examId: string): boolean {
    const exam = this.getExamById(examId);
    if (!exam || (exam.tokenFee ?? exam.feeRupees ?? 0) === 0) {
      return true;
    }
    const profile = this.getProfile(userIdOrEmail);
    if (!profile) return false;

    // Direct unlock check
    if (profile.unlockedExams && profile.unlockedExams.includes(examId)) {
      return true;
    }

    // Active pass entitlement check
    const entitlements = this.getEntitlements(profile.id);
    const hasSemesterPass = entitlements.some(e => e.status === "active" && (e.tier === "semester" || e.tier === "seven_day"));
    if (hasSemesterPass) {
      return true;
    }

    return false;
  }

  public setExamFee(examId: string, feeRupees: number): Examination | undefined {
    const exam = this.getExamById(examId);
    if (exam) {
      exam.feeRupees = feeRupees;
      exam.tokenFee = feeRupees;
      exam.isFreeSample = feeRupees === 0;
      this.persist("exams");
      return exam;
    }
    return undefined;
  }

  // --- Institutional Partnerships & College Intelligence (Nyeras Nxtmove) ---
  public getInstitutionalLeads(): InstitutionalLead[] {
    return this.institutionalLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public submitInstitutionalLead(leadData: Omit<InstitutionalLead, "id" | "status" | "createdAt">): InstitutionalLead {
    const lead: InstitutionalLead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...leadData,
      status: "submitted",
      createdAt: new Date().toISOString(),
    };
    this.institutionalLeads.unshift(lead);
    this.persist("institutionalLeads");
    return lead;
  }

  public getInstitutionalDiagnostics() {
    return {
      overview: {
        totalPartnerColleges: 48,
        totalAssessedStudents: 14250,
        averageDomainScore: 74.2,
        nationalBenchmarkAverage: 63.8,
        placementReadyCount: 3840,
        naacCriteriaQualified: true,
      },
      branchHeatmap: [
        { branch: "Computer Science & Engineering", cohortSize: 520, avgScore: 78.4, nationalPercentile: 82, skillDeficit: "Distributed Systems & System Design", readiness: "High" },
        { branch: "Information Technology", cohortSize: 340, avgScore: 75.1, nationalPercentile: 79, skillDeficit: "Cloud Security & Docker Containerization", readiness: "High" },
        { branch: "Electronics & Communication (ECE)", cohortSize: 280, avgScore: 71.6, nationalPercentile: 74, skillDeficit: "VLSI Synthesis & Verilog Edge Cases", readiness: "Medium" },
        { branch: "Mechanical Engineering", cohortSize: 210, avgScore: 68.3, nationalPercentile: 70, skillDeficit: "FEA Boundary Constraints & Thermal Simulation", readiness: "Medium" },
        { branch: "Management & MBA", cohortSize: 180, avgScore: 76.5, nationalPercentile: 80, skillDeficit: "Financial Derivatives & SAP MM Integration", readiness: "High" },
        { branch: "Biotechnology & Sciences", cohortSize: 120, avgScore: 73.0, nationalPercentile: 76, skillDeficit: "Clinical SAS Macros & Sequence Alignment", readiness: "Medium" },
      ],
      naacMetrics: {
        criterion5: {
          title: "Criterion 5: Student Progression",
          status: "Compliant & Documented",
          metricDescription: "Documented proof of students participating and qualifying in competitive national benchmark examinations.",
          participatingStudentsCount: 14250,
          qualifyingPercent: 86.4,
          dossierAvailable: true,
        },
        criteria1and2: {
          title: "Criteria 1 & 2: Teaching & Evaluation",
          status: "Audited & Verified",
          metricDescription: "Independent third-party measurement of domain learning outcomes and diagnostic capability assessments.",
          learningOutcomeAccuracy: 92.8,
          curriculumGapReports: 6,
          dossierAvailable: true,
        },
        institutionalPR: {
          citationAwarded: "National Academic Excellence Citation (Framed Trophy & Certificate)",
          spocAward: "Distinguished Career Mentorship Award conferred on Faculty SPOC",
          mediaSpotlight: "Pan-India press release visibility and featured listing on Nyeras National Leaderboards",
        }
      },
      peerComparisonMatrix: [
        { collegeName: "Nyeras Partner Engineering College", rank: 14, percentile: 94.2, avgAptitude: 81, avgTechnical: 76, avgWorkplace: 85 },
        { collegeName: "VTU Belagavi Tier-1 Autonomous", rank: 18, percentile: 92.5, avgAptitude: 79, avgTechnical: 74, avgWorkplace: 82 },
        { collegeName: "Anna University Chennai Affiliated Zone", rank: 25, percentile: 89.1, avgAptitude: 77, avgTechnical: 71, avgWorkplace: 80 },
        { collegeName: "JNTUH Hyderabad Technical Campus", rank: 31, percentile: 86.8, avgAptitude: 74, avgTechnical: 69, avgWorkplace: 78 },
      ]
    };
  }
}

export const db = new DatabaseEngine();
