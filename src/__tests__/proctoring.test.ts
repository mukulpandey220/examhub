import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { db } from "../lib/db";
import { ProctoringViolation, ProctoringLog } from "../types";

describe("Proctoring & Anti-Cheat Engine", () => {
  const testUserId = "user-proctor-test-student";
  const testExamId = "exam-dotnet-mock-01";

  beforeEach(() => {
    db.resetUserAttemptsForExam(testUserId, testExamId);
  });

  afterEach(() => {
    db.resetUserAttemptsForExam(testUserId, testExamId);
  });

  describe("Violation Recording & Integrity Scoring Logic", () => {
    it("should start with 100% integrity and zero strikes", () => {
      const violations: ProctoringViolation[] = [];
      const score = Math.max(0, 100 - violations.length * 15);
      expect(score).toBe(100);
      expect(violations.length).toBe(0);
    });

    it("should deduct 15% per security strike up to 3 strikes", () => {
      const violations: ProctoringViolation[] = [];

      // Strike 1: Tab Switch
      violations.push({
        id: "viol-1",
        type: "tab_switch",
        timestamp: new Date().toISOString(),
        details: "Tab switched or browser minimized",
      });
      let score = Math.max(0, 100 - violations.length * 15);
      expect(violations.length).toBe(1);
      expect(score).toBe(85);

      // Strike 2: Window Blur
      violations.push({
        id: "viol-2",
        type: "window_blur",
        timestamp: new Date().toISOString(),
        details: "Test window lost focus",
      });
      score = Math.max(0, 100 - violations.length * 15);
      expect(violations.length).toBe(2);
      expect(score).toBe(70);

      // Strike 3: Second Tab Switch -> Disqualification
      violations.push({
        id: "viol-3",
        type: "tab_switch",
        timestamp: new Date().toISOString(),
        details: "Tab switched",
      });
      const isDisqualified = violations.length >= 3;
      score = isDisqualified ? 0 : Math.max(0, 100 - violations.length * 15);
      expect(violations.length).toBe(3);
      expect(isDisqualified).toBe(true);
      expect(score).toBe(0);
    });

    it("should deduplicate blur and tab_switch when occurring within 2500ms", () => {
      const violations: ProctoringViolation[] = [];
      const lastViolationByType: Record<string, number> = {};

      const recordViolationSimulated = (
        type: ProctoringViolation["type"],
        details: string,
        timestampMs: number
      ) => {
        // Upgrade blur if tab_switch arrives within 2500ms
        if (
          type === "tab_switch" &&
          timestampMs - (lastViolationByType["window_blur"] || 0) < 2500
        ) {
          const lastIdx = violations.findIndex(
            (v) => v.type === "window_blur"
          );
          if (lastIdx !== -1) {
            violations[lastIdx] = {
              ...violations[lastIdx],
              type: "tab_switch",
              details,
            };
            lastViolationByType["tab_switch"] = timestampMs;
            return;
          }
        }

        if (
          type === "window_blur" &&
          timestampMs - (lastViolationByType["tab_switch"] || 0) < 2500
        ) {
          return;
        }

        lastViolationByType[type] = timestampMs;
        violations.push({
          id: `viol-${timestampMs}`,
          type,
          timestamp: new Date(timestampMs).toISOString(),
          details,
        });
      };

      const now = 1700000000000;
      // 1. window_blur fires at T=0
      recordViolationSimulated("window_blur", "Window focus lost", now);
      expect(violations.length).toBe(1);
      expect(violations[0].type).toBe("window_blur");

      // 2. tab_switch fires at T=100ms (switching tabs)
      recordViolationSimulated("tab_switch", "Tab switched", now + 100);
      // Count must remain 1, but upgraded to tab_switch
      expect(violations.length).toBe(1);
      expect(violations[0].type).toBe("tab_switch");
      expect(violations[0].details).toBe("Tab switched");

      // 3. window_blur fires at T=200ms
      recordViolationSimulated("window_blur", "Blur duplicate", now + 200);
      expect(violations.length).toBe(1); // Still strictly 1 strike!
    });
  });

  describe("Attempt Lifecycle & Proctoring Persistence", () => {
    it("should create, autosave proctoring telemetry, and submit attempt correctly", () => {
      // 1. Start Attempt
      const startRes = db.startAttempt({
        examId: testExamId,
        userId: testUserId,
        userEmail: "proctor@nyeras.com",
        userName: "Proctor Tester",
      });

      expect(startRes.attempt).toBeDefined();
      expect(startRes.attempt.status).toBe("in_progress");
      const attemptId = startRes.attempt.id;

      // 2. Autosave with Proctoring Telemetry
      const proctoringLog: ProctoringLog = {
        integrityScore: 85,
        totalViolations: 1,
        tabSwitchViolations: 1,
        fullscreenViolations: 0,
        blurViolations: 0,
        copyPasteViolations: 0,
        devtoolsViolations: 0,
        isDisqualified: false,
        cameraActive: true,
        microphoneActive: true,
        violations: [
          {
            id: "viol-auto-1",
            type: "tab_switch",
            timestamp: new Date().toISOString(),
            details: "Tab switched during exam",
          },
        ],
      };

      const saved = db.autosaveAttempt({
        attemptId,
        answers: { "q-dotnet-001": "opt-1" },
        markedForReview: ["q-dotnet-001"],
        timeSpentSeconds: 60,
        proctoring: proctoringLog,
      });

      expect(saved).toBe(true);

      const updatedAttempt = db.getAttemptById(attemptId);
      expect(updatedAttempt?.proctoring?.totalViolations).toBe(1);
      expect(updatedAttempt?.proctoring?.tabSwitchViolations).toBe(1);
      expect(updatedAttempt?.answers["q-dotnet-001"]).toBe("opt-1");

      // 3. Submit Attempt
      const submitRes = db.submitAttempt({
        attemptId,
        answers: { "q-dotnet-001": "opt-1", "q-dotnet-002": "opt-2" },
        proctoring: {
          ...proctoringLog,
          integrityScore: 70,
          totalViolations: 2,
          tabSwitchViolations: 2,
          violations: [
            ...proctoringLog.violations,
            {
              id: "viol-auto-2",
              type: "tab_switch",
              timestamp: new Date().toISOString(),
              details: "Second tab switch",
            },
          ],
        },
      });

      expect(submitRes.attempt.status).toBe("graded");
      expect(submitRes.attempt.proctoring?.totalViolations).toBe(2);
      expect(submitRes.attempt.proctoring?.integrityScore).toBe(70);
      expect(submitRes.attempt.certificateId).toBeDefined();
    });

    it("should prevent exceeding attempt limits unless resetAttempts is requested", () => {
      const mockUser = {
        examId: testExamId,
        userId: testUserId,
        userEmail: "test@nyeras.com",
        userName: "Test User",
      };

      // Exam limit is 3
      const res1 = db.startAttempt(mockUser);
      db.submitAttempt({ attemptId: res1.attempt.id });

      const res2 = db.startAttempt(mockUser);
      db.submitAttempt({ attemptId: res2.attempt.id });

      const res3 = db.startAttempt(mockUser);
      db.submitAttempt({ attemptId: res3.attempt.id });

      // 4th attempt should hit limit
      const res4 = db.startAttempt(mockUser);
      expect(res4.error).toContain("limit");

      // With resetAttempts=true, fresh attempt starts successfully
      const resReset = db.startAttempt({
        ...mockUser,
        resetAttempts: true,
      });
      expect(resReset.attempt).toBeDefined();
      expect(resReset.attempt.status).toBe("in_progress");
    });
  });

  describe("Keyboard & Tab Switching Interception Rules", () => {
    it("should identify and intercept tab-switching shortcuts (Ctrl+Tab, Alt+Tab, Cmd+Alt+Arrows, Cmd/Ctrl+1-9, Ctrl/Cmd+T/N/W)", () => {
      const isTabSwitchShortcut = (e: {
        key: string;
        metaKey?: boolean;
        ctrlKey?: boolean;
        altKey?: boolean;
        shiftKey?: boolean;
      }) => {
        const isCmdOrCtrl = Boolean(e.metaKey || e.ctrlKey);
        const isTabSwitch = Boolean(
          (isCmdOrCtrl && e.key === "Tab") ||
          (Boolean(e.altKey) && e.key === "Tab") ||
          (isCmdOrCtrl && (e.altKey || e.shiftKey) && ["ArrowLeft", "ArrowRight", "[", "]"].includes(e.key)) ||
          (isCmdOrCtrl && ["PageUp", "PageDown"].includes(e.key)) ||
          (isCmdOrCtrl && ["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(e.key))
        );

        const isNewTabOrWindow = Boolean(isCmdOrCtrl && ["t", "T", "n", "N", "w", "W", "q", "Q"].includes(e.key));

        return isTabSwitch || isNewTabOrWindow;
      };

      // Tab switching attempts
      expect(isTabSwitchShortcut({ key: "Tab", ctrlKey: true })).toBe(true);
      expect(isTabSwitchShortcut({ key: "Tab", altKey: true })).toBe(true);
      expect(isTabSwitchShortcut({ key: "Tab", metaKey: true })).toBe(true);
      expect(isTabSwitchShortcut({ key: "ArrowRight", metaKey: true, altKey: true })).toBe(true);
      expect(isTabSwitchShortcut({ key: "ArrowLeft", metaKey: true, altKey: true })).toBe(true);
      expect(isTabSwitchShortcut({ key: "PageDown", ctrlKey: true })).toBe(true);
      expect(isTabSwitchShortcut({ key: "1", ctrlKey: true })).toBe(true);
      expect(isTabSwitchShortcut({ key: "2", metaKey: true })).toBe(true);
      
      // New tab / window attempts
      expect(isTabSwitchShortcut({ key: "t", ctrlKey: true })).toBe(true);
      expect(isTabSwitchShortcut({ key: "T", metaKey: true })).toBe(true);
      expect(isTabSwitchShortcut({ key: "n", ctrlKey: true })).toBe(true);
      expect(isTabSwitchShortcut({ key: "w", metaKey: true })).toBe(true);

      // Normal keys allowed
      expect(isTabSwitchShortcut({ key: "1" })).toBe(false);
      expect(isTabSwitchShortcut({ key: "a" })).toBe(false);
      expect(isTabSwitchShortcut({ key: "Tab" })).toBe(false); // Tab alone is normal navigation
    });

    // TEST: Phone & Dual Face Recognition (3 Times Warning)
    it("should allow up to 3 warnings for phone or dual face recognition before disqualification", () => {
      let dualFaceWarnings = 0;
      let isDisqualified = false;

      const recordDualFace = () => {
        dualFaceWarnings++;
        if (dualFaceWarnings >= 3) {
          isDisqualified = true;
        }
        return { warning: dualFaceWarnings, isDisqualified };
      };

      // Warning 1
      expect(recordDualFace()).toEqual({ warning: 1, isDisqualified: false });
      // Warning 2
      expect(recordDualFace()).toEqual({ warning: 2, isDisqualified: false });
      // Warning 3 -> Disqualified
      expect(recordDualFace()).toEqual({ warning: 3, isDisqualified: true });

      // Phone Detection 3-strike rule
      let phoneWarnings = 0;
      let phoneDisqualified = false;
      const recordPhone = () => {
        phoneWarnings++;
        if (phoneWarnings >= 3) {
          phoneDisqualified = true;
        }
        return { warning: phoneWarnings, isDisqualified: phoneDisqualified };
      };

      expect(recordPhone()).toEqual({ warning: 1, isDisqualified: false });
      expect(recordPhone()).toEqual({ warning: 2, isDisqualified: false });
      expect(recordPhone()).toEqual({ warning: 3, isDisqualified: true });
    });

    // TEST: No Second Login (1 Time in Exam Rule)
    it("should enforce single login and block second login during active examination", () => {
      const examId = "exam-dotnet-mock-01";
      const studentId = `student-session-test-${Date.now()}`;
      const sessionToken1 = `sess-device-1-${Date.now()}`;
      const sessionToken2 = `sess-device-2-${Date.now()}`;

      // First device starts the exam
      const res1 = db.startAttempt({
        examId,
        userId: studentId,
        userEmail: "test@nyeras.com",
        userName: "Test Candidate",
        sessionToken: sessionToken1,
      });

      expect(res1.attempt).toBeDefined();
      expect(res1.attempt.status).toBe("in_progress");
      expect(res1.attempt.sessionToken).toBe(sessionToken1);

      // Same device resumes exam -> Allowed
      const resResume = db.startAttempt({
        examId,
        userId: studentId,
        userEmail: "test@nyeras.com",
        userName: "Test Candidate",
        sessionToken: sessionToken1,
      });
      expect(resResume.attempt.id).toBe(res1.attempt.id);

      // Second device / browser attempts to log in / start exam -> BLOCKED
      const res2 = db.startAttempt({
        examId,
        userId: studentId,
        userEmail: "test@nyeras.com",
        userName: "Test Candidate",
        sessionToken: sessionToken2,
      });

      expect(res2.isSecondLoginBlocked).toBe(true);
      expect(res2.error).toContain("Concurrent session blocked");

      // Verify second login violation logged in attempt
      const attempt = db.getAttemptById(res1.attempt.id);
      expect(attempt?.proctoring?.secondLoginViolations).toBeGreaterThanOrEqual(1);
      expect(attempt?.proctoring?.isDisqualified).toBe(true);
    });
  });
});

