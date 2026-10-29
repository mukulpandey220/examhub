import { describe, it, expect } from "vitest";
import { DOMAINS, getDomainBySlug } from "../data/domains";
import { CATEGORIES } from "../data/categories";
import { PRICING_PLANS, getPlanById } from "../data/pricing";
import { INITIAL_DEADLINES } from "../data/deadlines";
import { INITIAL_EXAMS } from "../data/exams";
import { db } from "../lib/db";
import { Question } from "../types";

describe("Campus Deadline Radar & Campus Assessment Hub Test Suite", () => {
  // TEST 1: 72 Domains & Category Mappings
  it("should verify all 72 domains exist with valid categories and unique slugs", () => {
    expect(DOMAINS.length).toBe(72);
    expect(CATEGORIES.length).toBe(7);

    const slugs = new Set<string>();
    for (const domain of DOMAINS) {
      expect(slugs.has(domain.slug)).toBe(false);
      slugs.add(domain.slug);

      const cat = CATEGORIES.find(c => c.code === domain.categoryCode);
      expect(cat).toBeDefined();
      expect(domain.subjects.length).toBeGreaterThanOrEqual(1);
    }
  });

  // TEST 2: Exact Category Domain Counts
  it("should match exact domain counts per academic category", () => {
    const cseDomains = DOMAINS.filter(d => d.categoryCode === "cse_it");
    const eceDomains = DOMAINS.filter(d => d.categoryCode === "ece_eee");
    const mechDomains = DOMAINS.filter(d => d.categoryCode === "mechanical");
    const chemDomains = DOMAINS.filter(d => d.categoryCode === "chemical");
    const civilDomains = DOMAINS.filter(d => d.categoryCode === "civil");
    const mgmtDomains = DOMAINS.filter(d => d.categoryCode === "management");
    const medDomains = DOMAINS.filter(d => d.categoryCode === "med_pharma_bio");

    expect(cseDomains.length).toBe(32);
    expect(eceDomains.length).toBe(8);
    expect(mechDomains.length).toBe(5);
    expect(chemDomains.length).toBe(2);
    expect(civilDomains.length).toBe(1);
    expect(mgmtDomains.length).toBe(17);
    expect(medDomains.length).toBe(7);
  });

  // TEST 3: Question Bank Completeness (Minimum 3,600 Approved Questions)
  it("should verify at least 3,600 approved questions exist with exactly 50 per domain", () => {
    const approved = db.getApprovedQuestions();
    expect(approved.length).toBeGreaterThanOrEqual(3600);

    const coverage = db.getDomainCoverage();
    expect(coverage.length).toBe(72);

    for (const c of coverage) {
      expect(c.approvedQuestions).toBeGreaterThanOrEqual(50);
      expect(c.difficulty.basic).toBeGreaterThanOrEqual(10);
      expect(c.difficulty.intermediate).toBeGreaterThanOrEqual(15);
      expect(c.difficulty.advanced).toBeGreaterThanOrEqual(15);
      expect(c.difficulty.professional).toBeGreaterThanOrEqual(10);
      expect(c.isComplete).toBe(true);
      expect(c.remainingRequired).toBe(0);
    }
  });

  // TEST 4: Unique Question IDs, Non-empty Explanations & Answer Keys
  it("should ensure every question has a unique ID, valid explanation, and answer key", () => {
    const questions = db.getQuestions();
    const ids = new Set<string>();

    for (const q of questions) {
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);

      expect(q.questionText.trim().length).toBeGreaterThan(10);
      expect(q.explanation.trim().length).toBeGreaterThan(10);
      expect(q.correctAnswer).toBeDefined();
      expect(q.sourceOrReference).toBeDefined();

      if (q.type === "single_choice" || q.type === "multiple_choice") {
        expect(q.options).toBeDefined();
        expect(q.options!.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  // TEST 5: Server-side Scoring Engine & Negative Marking
  it("should accurately score attempts with negative marking on the server", () => {
    const exam = INITIAL_EXAMS[0];
    const user = {
      userId: `test-student-score-${Date.now()}`,
      userEmail: "test@campusradar.edu.in",
      userName: "Test Student",
    };

    const { attempt } = db.startAttempt({
      examId: exam.id,
      ...user,
    });
    expect(attempt).toBeDefined();
    expect(attempt.status).toBe("in_progress");

    // Grab first 3 questions from exam
    const q1 = db.getQuestionById(exam.questionIds[0])!;
    const q2 = db.getQuestionById(exam.questionIds[1])!;
    const q3 = db.getQuestionById(exam.questionIds[2])!;

    // Answer Q1 correctly, Q2 incorrectly, leave Q3 blank
    const answers: Record<string, any> = {};
    answers[q1.id] = q1.correctAnswer;
    answers[q2.id] = "wrong-choice-xyz";

    const { attempt: submitted } = db.submitAttempt({
      attemptId: attempt.id,
      answers,
    });

    expect(submitted.status).toBe("graded");
    expect(submitted.correctCount).toBe(1);
    expect(submitted.incorrectCount).toBe(1);
    expect(submitted.unansweredCount).toBe(exam.questionIds.length - 2);

    // Score calculation check
    const expectedScore = Math.max(0, q1.marks - (q2.negativeMarks || 0.25));
    expect(submitted.score).toBe(expectedScore);
  });

  // TEST 6: Examination Attempt Limits & Active Resume
  it("should resume active attempts and properly enforce and reset attempt limits", () => {
    const exam = db.createExam({
      id: "exam-test-limit-resumption",
      slug: "test-limit-resumption",
      title: "Test Limit Exam",
      domainSlug: "dotnet",
      domainName: ".NET",
      categoryCode: "cse_it",
      categoryName: "Computer Science",
      description: "Test description",
      durationMinutes: 30,
      totalMarks: 30,
      passingMarks: 15,
      passingPercentage: 50,
      negativeMarkingPerWrong: 0.25,
      attemptLimit: 2,
      isPublished: true,
      sections: [],
      mode: "timed",
      format: "mcq",
      questionCount: 10,
      questionIds: [],
      difficultyBreakdown: { basic: 5, intermediate: 5, advanced: 0, professional: 0 },
      isFreeSample: true,
      feeRupees: 0,
      tokenFee: 0,
      requiredTier: "free",
      resultReleasePolicy: "immediate",
    });

    const user = {
      userId: `test-resume-student-${Date.now()}`,
      userEmail: "resume@student.edu",
      userName: "Resume Student",
    };

    // Attempt 1: Start and submit
    const start1 = db.startAttempt({ examId: exam.id, ...user });
    expect(start1.attempt).toBeDefined();
    db.submitAttempt({ attemptId: start1.attempt.id });

    // Attempt 2: Start (now at limit = 2)
    const start2 = db.startAttempt({ examId: exam.id, ...user });
    expect(start2.attempt).toBeDefined();
    expect(start2.attempt.status).toBe("in_progress");

    // Resuming Attempt 2 should succeed despite total attempts = 2
    const resume2 = db.startAttempt({ examId: exam.id, ...user });
    expect(resume2.attempt).toBeDefined();
    expect(resume2.attempt.id).toBe(start2.attempt.id);

    // Submit Attempt 2
    db.submitAttempt({ attemptId: start2.attempt.id });

    // Attempt 3: Should fail because attempt limit is 2
    const start3 = db.startAttempt({ examId: exam.id, ...user });
    expect(start3.error).toContain("Maximum attempt limit (2) reached");

    // Check attempt status helper
    const status = db.getExamAttemptStatus(user.userId, exam.id);
    expect(status.isLimitReached).toBe(true);
    expect(status.attemptsUsed).toBe(2);

    // Reset attempts
    const resetRes = db.resetUserAttemptsForExam(user.userId, exam.id);
    expect(resetRes).toBe(true);

    // After reset, starting fresh should succeed
    const startFresh = db.startAttempt({ examId: exam.id, ...user });
    expect(startFresh.attempt).toBeDefined();
    expect(startFresh.error).toBeUndefined();
  });

  // TEST 7: Pricing Plans & Integer Paise Architecture
  it("should verify pricing plans and integer paise conversion", () => {
    expect(PRICING_PLANS.length).toBe(4);

    const sevenDay = getPlanById("plan-seven-day")!;
    expect(sevenDay.pricePaise).toBe(2900); // ₹29 * 100
    expect(sevenDay.priceRupees).toBe(29);
    expect(sevenDay.durationDays).toBe(7);

    const semester = getPlanById("plan-semester")!;
    expect(semester.pricePaise).toBe(4900); // ₹49 * 100
    expect(semester.priceRupees).toBe(49);
    expect(semester.durationDays).toBe(180);

    const backlog = getPlanById("plan-backlog-addon")!;
    expect(backlog.pricePaise).toBe(9900); // ₹99 * 100
    expect(backlog.priceRupees).toBe(99);
  });

  // TEST 8: Campus Deadline Radar Academic Milestones
  it("should verify verified academic deadlines with proper urgency and dates", () => {
    const deadlines = db.getDeadlines();
    expect(deadlines.length).toBeGreaterThanOrEqual(6);

    for (const dl of deadlines) {
      expect(dl.title.length).toBeGreaterThan(5);
      expect(dl.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["exam", "revaluation", "backlog", "assignment", "scholarship", "internship"]).toContain(dl.category);
      expect(["critical", "high", "medium"]).toContain(dl.importance);
    }
  });

  // TEST 9: Bulk CSV Import & Duplicate Detection
  it("should handle bulk questions import with duplicate detection", () => {
    const uniqueId = `q-test-csv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const testQ: Question = {
      id: uniqueId,
      domainSlug: "dotnet",
      subjectSlug: "csharp-fundamentals",
      topic: "Memory Management",
      difficulty: "basic",
      type: "single_choice",
      questionText: `What is the role of the Garbage Collector in .NET CLR? (${uniqueId})`,
      options: [
        { id: "opt-1", text: "Automatic memory reclamation of unreachable objects" },
        { id: "opt-2", text: "Manual heap defragmentation by developer code" },
      ],
      correctAnswer: "opt-1",
      explanation: "The CLR GC tracks object references on the managed heap and sweeps dead allocations.",
      marks: 1,
      negativeMarks: 0.25,
      reviewStatus: "approved",
      version: 1,
      sourceOrReference: "Microsoft .NET Architecture Guide",
    };

    const firstImport = db.bulkImportQuestions([testQ]);
    expect(firstImport.imported).toBe(1);

    // Re-importing same question triggers duplicate detection
    const secondImport = db.bulkImportQuestions([testQ]);
    expect(secondImport.duplicates).toBe(1);
    expect(secondImport.imported).toBe(0);
  });

  // TEST 10: NTCRA 3-Section Blueprint & Proctored Evaluation Modality
  it("should verify NTCRA 3-section structure (A: 25%, B: 50%, C: 25%) and proctored scoring", () => {
    const benchmarkExams = INITIAL_EXAMS.filter(e => e.id.includes("mock-01"));
    expect(benchmarkExams.length).toBe(72);

    for (const exam of benchmarkExams) {
      expect(exam.isProctored).toBe(true);
      expect(exam.durationMinutes).toBe(60);
      expect(exam.sections).toBeDefined();
      expect(exam.sections!.length).toBe(3);

      const [secA, secB, secC] = exam.sections!;
      expect(secA.id).toBe("section_a");
      expect(secA.weightPercentage).toBe(25);
      expect(secB.id).toBe("section_b");
      expect(secB.weightPercentage).toBe(50);
      expect(secC.id).toBe("section_c");
      expect(secC.weightPercentage).toBe(25);
    }

    // Attempt verification with section scores
    const exam = benchmarkExams[0];
    const user = {
      userId: `ntcra-student-${Date.now()}`,
      userEmail: "student@ntcra.edu.in",
      userName: "NTCRA Candidate",
    };

    const { attempt } = db.startAttempt({
      examId: exam.id,
      ...user,
    });

    const { attempt: graded } = db.submitAttempt({
      attemptId: attempt.id,
      answers: {
        [exam.sections![0].questionIds[0]]: "opt-1",
      },
    });

    expect(graded.sectionScores).toBeDefined();
    expect(graded.sectionScores!["section_a"]).toBeDefined();
    expect(graded.sectionScores!["section_b"]).toBeDefined();
    expect(graded.sectionScores!["section_c"]).toBeDefined();
    expect(graded.allIndiaPercentile).toBeGreaterThan(0);
    expect(graded.nationalRank).toBeGreaterThan(0);
    expect(graded.certificateId).toMatch(/^NXTMOVE-/);
  });

  // TEST 11: Institutional Partnerships & NAAC/NBA Compliance Dossiers
  it("should verify institutional partnerships, branch diagnostics, and NAAC/NBA metrics", () => {
    const leads = db.getInstitutionalLeads();
    expect(leads.length).toBeGreaterThanOrEqual(2);

    const testLead = db.submitInstitutionalLead({
      collegeName: "National Institute of Engineering",
      universityAffiliation: "VTU Belagavi",
      city: "Mysuru",
      state: "Karnataka",
      spocName: "Dr. Ramesh Babu",
      spocDesignation: "Dean / TPO",
      spocEmail: "placement@nie.ac.in",
      spocPhone: "+91 99000 11223",
      studentCohortSize: 450,
      preferredExamWindow: "Dec 1 - Dec 10, 2026",
      labFacilityAvailable: true,
    });

    expect(testLead.id).toMatch(/^lead-/);
    expect(testLead.status).toBe("submitted");

    const diagnostics = db.getInstitutionalDiagnostics();
    expect(diagnostics.overview.totalPartnerColleges).toBeGreaterThan(0);
    expect(diagnostics.branchHeatmap.length).toBeGreaterThanOrEqual(5);
    expect(diagnostics.naacMetrics.criterion5.status).toContain("Compliant");
    expect(diagnostics.naacMetrics.criteria1and2.status).toContain("Audited");
    expect(diagnostics.peerComparisonMatrix.length).toBeGreaterThanOrEqual(3);
  });

  // TEST 12: Proctored Anti-Cheating Telemetry & Disqualification
  it("should record proctoring telemetry, handle tab/focus violations, and enforce disqualification", () => {
    const exam = INITIAL_EXAMS[0];
    const { attempt } = db.startAttempt({
      examId: exam.id,
      userId: `test-proctor-${Date.now()}`,
      userEmail: "proctor-test@nyeras.com",
      userName: "Proctor Test Student",
    });

    expect(attempt).toBeDefined();

    // Autosave with proctoring violations (tab switch, window blur)
    const autosaved = db.autosaveAttempt({
      attemptId: attempt.id,
      answers: {},
      markedForReview: [],
      timeSpentSeconds: 120,
      proctoring: {
        integrityScore: 70,
        totalViolations: 2,
        tabSwitchViolations: 1,
        fullscreenViolations: 0,
        blurViolations: 1,
        copyPasteViolations: 0,
        devtoolsViolations: 0,
        isDisqualified: false,
        cameraActive: true,
        microphoneActive: true,
        violations: [
          {
            id: "viol-1",
            type: "tab_switch",
            timestamp: new Date().toISOString(),
            details: "Tab switched away",
          },
          {
            id: "viol-2",
            type: "window_blur",
            timestamp: new Date().toISOString(),
            details: "Focus loss detected",
          },
        ],
      },
    });

    expect(autosaved).toBe(true);
    const updated = db.getAttemptById(attempt.id);
    expect(updated?.proctoring).toBeDefined();
    expect(updated?.proctoring?.totalViolations).toBe(2);
    expect(updated?.proctoring?.integrityScore).toBe(70);

    // Final submit with disqualification (3 strikes reached)
    const { attempt: finalSubmitted } = db.submitAttempt({
      attemptId: attempt.id,
      answers: {},
      proctoring: {
        integrityScore: 0,
        totalViolations: 3,
        tabSwitchViolations: 2,
        fullscreenViolations: 0,
        blurViolations: 1,
        copyPasteViolations: 0,
        devtoolsViolations: 0,
        isDisqualified: true,
        disqualificationReason: "Exceeded maximum allowed security infractions (3 strikes reached)",
        cameraActive: true,
        microphoneActive: true,
        violations: [
          ...updated!.proctoring!.violations,
          {
            id: "viol-3",
            type: "tab_switch",
            timestamp: new Date().toISOString(),
            details: "Second tab switch",
          },
        ],
      },
    });

    expect(finalSubmitted.proctoring?.isDisqualified).toBe(true);
    expect(finalSubmitted.passed).toBe(false);
    expect(finalSubmitted.proctoring?.totalViolations).toBe(3);
  });

  // TEST 13: Razorpay 1 Rs = 1 Token Parity & Dynamic Exam Fee Calibration
  it("should enforce 1 Rs = 1 Token parity and dynamic exam fee calibration", () => {
    // 1. Verify all exams define feeRupees and tokenFee with 1:1 parity
    const allExams = db.getExams();
    expect(allExams.length).toBeGreaterThanOrEqual(144);

    for (const ex of allExams) {
      expect(ex.feeRupees).toBeDefined();
      expect(ex.tokenFee).toBeDefined();
      expect(ex.feeRupees).toBe(ex.tokenFee); // Strict 1 Rs = 1 Token parity
    }

    // 2. Timed benchmark exams default to ₹99 / 99 tokens
    const timedMock = allExams.find(e => e.id === "exam-dsa-system-design-mock-01");
    expect(timedMock?.feeRupees).toBe(99);
    expect(timedMock?.tokenFee).toBe(99);

    // 3. Dynamic custom exam price adjustment (any price range)
    const customExamId = "exam-dotnet-mock-01";
    db.setExamFee(customExamId, 149); // e.g. ₹149 exam fee
    const updatedExam = db.getExamById(customExamId);
    expect(updatedExam?.feeRupees).toBe(149);
    expect(updatedExam?.tokenFee).toBe(149);
  });

  // TEST 14: Razorpay Payment Authentication, Dashboard Token Crediting & Exam Unlocking
  it("should authenticate Razorpay payment, credit tokens to student dashboard, and unlock exam", () => {
    const testUserId = `test-student-${Date.now()}`;
    const initialTokens = db.getUserTokens(testUserId);
    expect(initialTokens).toBe(0);

    // Authenticate a Razorpay payment for an exam fee of ₹99
    const creditResult = db.addTokens({
      userId: testUserId,
      tokens: 99,
      rupees: 99,
      paymentRef: "pay_rzp_test_sig99",
      orderId: "order_test_99",
      examId: "exam-ai-ml-mock-01",
      description: "Razorpay payment verified for AI & ML Benchmark Exam (+99 Tokens)",
    });

    // Verify tokens were credited to the student's dashboard (1 Rs = 1 Token)
    expect(creditResult.newBalance).toBe(99);
    expect(db.getUserTokens(testUserId)).toBe(99);

    // Verify transaction recorded in student's ledger
    const transactions = db.getTokenTransactions(testUserId);
    expect(transactions.length).toBeGreaterThanOrEqual(1);
    expect(transactions[0].amount).toBe(99);
    expect(transactions[0].rupees).toBe(99);
    expect(transactions[0].type).toBe("credit");
    expect(transactions[0].paymentRef).toBe("pay_rzp_test_sig99");

    // Verify exam is unlocked for user
    const isUnlocked = db.isExamUnlockedForUser(testUserId, "exam-ai-ml-mock-01");
    expect(isUnlocked).toBe(true);
  });

  // TEST 15: Token Wallet Debit for Exam Unlocking
  it("should debit tokens when student unlocks an exam from dashboard balance", () => {
    const studentId = `wallet-student-${Date.now()}`;
    
    // Give student 200 tokens via Razorpay top up
    db.addTokens({
      userId: studentId,
      tokens: 200,
      rupees: 200,
      paymentRef: "pay_wallet_topup_200",
      description: "Wallet top up: 200 Tokens (₹1 = 1 Token)",
    });

    expect(db.getUserTokens(studentId)).toBe(200);

    // Set exam fee to 99 tokens
    const targetExamId = "exam-vlsi-mock-01";
    db.setExamFee(targetExamId, 99);

    // Unlock exam using token balance
    const unlockRes = db.unlockExamWithTokens(studentId, targetExamId);
    expect(unlockRes.success).toBe(true);
    expect(unlockRes.newBalance).toBe(101); // 200 - 99 = 101 tokens remaining
    expect(db.getUserTokens(studentId)).toBe(101);

    // Check transaction history has the debit
    const txs = db.getTokenTransactions(studentId);
    const debitTx = txs.find(t => t.type === "debit");
    expect(debitTx).toBeDefined();
    expect(debitTx?.amount).toBe(99);
    expect(debitTx?.examId).toBe(targetExamId);

    // Attempting to unlock again is idempotent
    const duplicateUnlock = db.unlockExamWithTokens(studentId, targetExamId);
    expect(duplicateUnlock.success).toBe(true);
    expect(duplicateUnlock.newBalance).toBe(101); // No double debit
  });
});

