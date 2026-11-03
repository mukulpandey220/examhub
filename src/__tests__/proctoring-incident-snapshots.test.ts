import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { proctoringEngine } from "@/lib/proctoring-engine";
import { StudentProctoringIncident } from "@/types";

describe("Student Proctoring Incidents & Evidence Snapshots (Cloudflare D1 Architecture)", () => {
  const mockAttemptId = "attempt-test-incidents-001";
  const mockExamId = "exam-dotnet-mock-01";
  const mockStudentId = "user-student-test";
  const mockStudentName = "Test Candidate";
  const mockStudentEmail = "candidate@example.com";
  const mockJpegSnapshot = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...";

  beforeEach(() => {
    // Reset proctoring session
    proctoringEngine.initSession({
      examId: mockExamId,
      attemptId: mockAttemptId,
      studentId: mockStudentId,
    });
  });

  it("should record incident with warning progress and photographic evidence on multiple faces", () => {
    const incident: Partial<StudentProctoringIncident> & {
      attemptId: string;
      studentId: string;
      incidentType: string;
      details: string;
    } = {
      attemptId: mockAttemptId,
      examId: mockExamId,
      studentId: mockStudentId,
      studentName: mockStudentName,
      studentEmail: mockStudentEmail,
      incidentType: "multiple_faces",
      warningNumber: 1,
      severity: "warning",
      details: "Multiple individuals confirmed in camera frame (Dual Face Warning 1/3)",
      evidenceSnapshot: mockJpegSnapshot,
      examCancelled: false,
    };

    const saved = proctoringEngine.recordIncident(incident);

    expect(saved).toBeDefined();
    expect(saved.id).toContain("inc-");
    expect(saved.incidentType).toBe("multiple_faces");
    expect(saved.warningNumber).toBe(1);
    expect(saved.evidenceSnapshot).toBe(mockJpegSnapshot);
    expect(saved.examCancelled).toBe(false);

    // Verify retrieval
    const retrieved = db.getProctoringIncidents({ attemptId: mockAttemptId });
    expect(retrieved.length).toBeGreaterThan(0);
    const found = retrieved.find((i) => i.id === saved.id);
    expect(found).toBeDefined();
    expect(found?.evidenceSnapshot).toBe(mockJpegSnapshot);
  });

  it("should record incident with phone detection and captured photo snapshot", () => {
    const incident = proctoringEngine.recordIncident({
      attemptId: mockAttemptId,
      examId: mockExamId,
      studentId: mockStudentId,
      studentName: mockStudentName,
      studentEmail: mockStudentEmail,
      incidentType: "phone_detected",
      warningNumber: 2,
      severity: "strike",
      details: "Mobile Phone Detected: Unauthorized handheld mobile device in camera view! (Warning 2/3)",
      evidenceSnapshot: mockJpegSnapshot,
      examCancelled: false,
    });

    expect(incident.incidentType).toBe("phone_detected");
    expect(incident.warningNumber).toBe(2);
    expect(incident.evidenceSnapshot).toBe(mockJpegSnapshot);
  });

  it("should record exam cancellation with all 3 warnings logged and final snapshot", () => {
    const threeWarnings = [
      {
        id: "w1",
        type: "tab_switch" as const,
        details: "Attempted tab/window switch shortcut (Ctrl+Tab)",
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
      {
        id: "w2",
        type: "multiple_faces" as const,
        details: "Multiple individuals confirmed in camera frame",
        timestamp: new Date(Date.now() - 30000).toISOString(),
      },
      {
        id: "w3",
        type: "phone_detected" as const,
        details: "Mobile Phone Detected in camera view",
        timestamp: new Date().toISOString(),
      },
    ];

    const cancellationIncident = proctoringEngine.recordIncident({
      attemptId: mockAttemptId,
      examId: mockExamId,
      studentId: mockStudentId,
      studentName: mockStudentName,
      studentEmail: mockStudentEmail,
      incidentType: "exam_cancelled",
      warningNumber: 3,
      severity: "critical",
      details: "Examination terminated: 3 security warnings exceeded.",
      evidenceSnapshot: mockJpegSnapshot,
      examCancelled: true,
      cancellationReason: "Exceeded maximum of 3 security warnings.",
      allWarningsSummary: threeWarnings,
    });

    expect(cancellationIncident.examCancelled).toBe(true);
    expect(cancellationIncident.warningNumber).toBe(3);
    expect(cancellationIncident.allWarningsSummary).toHaveLength(3);
    expect(cancellationIncident.cancellationReason).toContain("3 security warnings");
    expect(cancellationIncident.evidenceSnapshot).toBe(mockJpegSnapshot);

    // Filter by cancelled only
    const cancelledIncidents = db.getProctoringIncidents({ examCancelledOnly: true });
    expect(cancelledIncidents.some((i) => i.id === cancellationIncident.id)).toBe(true);
  });
});
