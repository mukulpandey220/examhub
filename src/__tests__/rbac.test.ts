import { describe, it, expect } from "vitest";
import { 
  hashPassword, 
  verifyPassword, 
  signAuthToken, 
  verifyAuthToken 
} from "../lib/auth";
import { proctoringEngine, DEFAULT_PROCTORING_POLICY } from "../lib/proctoring-engine";

describe("Nyeras Nxtmove — Authentication, RBAC & Proctoring Test Suite", () => {

  // 1. Password Hashing & Verification
  it("should securely hash passwords and verify matching credentials", async () => {
    const rawPassword = "SecureExamPassword@2026";
    const hashed = await hashPassword(rawPassword);

    expect(hashed).not.toBe(rawPassword);
    expect(hashed.startsWith("$2a$") || hashed.startsWith("$2b$")).toBe(true);

    const isMatch = await verifyPassword(rawPassword, hashed);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword123", hashed);
    expect(isWrongMatch).toBe(false);
  });

  // 2. JWT Generation & 4-Tier RBAC Payload
  it("should generate and verify JWT tokens containing user role and tenant context", () => {
    const payload = {
      userId: "user-coord-suresh",
      email: "tpo@bmsce.ac.in",
      name: "Dr. K. R. Suresh",
      role: "institution_coordinator" as const,
      institutionId: "inst-bmsce-01",
    };

    const token = signAuthToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const decoded = verifyAuthToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe("user-coord-suresh");
    expect(decoded?.role).toBe("institution_coordinator");
    expect(decoded?.institutionId).toBe("inst-bmsce-01");
  });

  // 3. Proctoring Session Lifecycle
  it("should initialize proctoring sessions with CLEAR status and zero strikes", () => {
    const attemptId = `test-att-${Date.now()}`;
    const session = proctoringEngine.initSession({
      examId: "exam-dotnet-mock-01",
      attemptId,
      studentId: "user-student-test",
    });

    expect(session).toBeDefined();
    expect(session.status).toBe("CLEAR");
    expect(session.strikeCount).toBe(0);
    expect(session.policyVersion).toBe(DEFAULT_PROCTORING_POLICY.version);
  });

  // 4. Proctoring State Machine & Strike Escalation to Disqualification
  it("should increment strikes and transition to DISQUALIFIED upon 3 strikes", () => {
    const attemptId = `test-strike-att-${Date.now()}`;
    proctoringEngine.initSession({
      examId: "exam-dotnet-mock-01",
      attemptId,
      studentId: "user-student-strike",
    });

    // Strike 1: Tab switch
    const res1 = proctoringEngine.processEvent({
      eventId: `ev-strike-1-${Date.now()}`,
      attemptId,
      examId: "exam-dotnet-mock-01",
      studentId: "user-student-strike",
      eventType: "tab_switch",
      occurredAt: new Date().toISOString(),
    });
    expect(res1.session.strikeCount).toBe(1);
    expect(res1.session.status).toBe("WARNING");

    // Strike 2: Second tab switch
    const res2 = proctoringEngine.processEvent({
      eventId: `ev-strike-2-${Date.now()}`,
      attemptId,
      examId: "exam-dotnet-mock-01",
      studentId: "user-student-strike",
      eventType: "tab_switch",
      occurredAt: new Date().toISOString(),
    });
    expect(res2.session.strikeCount).toBe(2);
    expect(res2.session.status).toBe("WARNING");

    // Strike 3: Third tab switch -> DISQUALIFIED
    const res3 = proctoringEngine.processEvent({
      eventId: `ev-strike-3-${Date.now()}`,
      attemptId,
      examId: "exam-dotnet-mock-01",
      studentId: "user-student-strike",
      eventType: "tab_switch",
      occurredAt: new Date().toISOString(),
    });
    expect(res3.session.strikeCount).toBe(3);
    expect(res3.session.status).toBe("DISQUALIFIED");
    expect(res3.session.disqualificationReason).toContain("Exceeded maximum allowed security infractions");
  });

  // 5. Idempotent Proctoring Event Deduplication
  it("should safely ignore duplicate proctoring events with matching eventId", () => {
    const attemptId = `test-idemp-${Date.now()}`;
    const duplicateEventId = `ev-unique-idemp-${Date.now()}`;

    const res1 = proctoringEngine.processEvent({
      eventId: duplicateEventId,
      attemptId,
      examId: "exam-dotnet-mock-01",
      studentId: "user-idemp",
      eventType: "tab_switch",
      occurredAt: new Date().toISOString(),
    });
    expect(res1.session.strikeCount).toBe(1);

    // Replay identical event
    const res2 = proctoringEngine.processEvent({
      eventId: duplicateEventId,
      attemptId,
      examId: "exam-dotnet-mock-01",
      studentId: "user-idemp",
      eventType: "tab_switch",
      occurredAt: new Date().toISOString(),
    });
    expect(res2.session.strikeCount).toBe(1); // Strike not double-counted
    expect(res2.actionTaken).toBe("idempotent_duplicate_ignored");
  });

  // 6. Admin Dispute Review & Reversal
  it("should record administrative review decisions and audit status updates", () => {
    const attemptId = `test-review-att-${Date.now()}`;
    proctoringEngine.initSession({
      examId: "exam-dotnet-mock-01",
      attemptId,
      studentId: "user-student-dispute",
    });

    const review = proctoringEngine.submitReview({
      attemptId,
      reviewerId: "user-admin-nyeras",
      decision: "reinstated",
      reason: "Candidate experienced documented network hardware power outage; attempt cleared by integrity committee.",
    });

    expect(review.decision).toBe("reinstated");
    expect(review.newStatus).toBe("CLEAR");

    const session = proctoringEngine.getSession(attemptId);
    expect(session?.status).toBe("CLEAR");
    expect(session?.strikeCount).toBe(0);
  });
});
