import { NextRequest, NextResponse } from "next/server";
import { proctoringEngine } from "@/lib/proctoring-engine";
import { getAuthUser } from "@/lib/auth";
import { saveProctoringIncident, getProctoringIncidents } from "@/lib/d1";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      eventId, 
      attemptId, 
      examId, 
      studentId, 
      studentName,
      studentEmail,
      eventType, 
      severity, 
      occurredAt, 
      durationMs, 
      confidence, 
      metadata,
      warningNumber,
      evidenceSnapshot,
      examCancelled,
      cancellationReason,
      allWarningsSummary,
    } = body;

    if (!attemptId || !eventType) {
      return NextResponse.json({ error: "attemptId and eventType are required" }, { status: 400 });
    }

    const auth = getAuthUser(req);
    const effectiveStudentId = studentId || auth?.userId || "user-student-ramkumar";
    const effectiveStudentName = studentName || auth?.name || "Ramkumar Malothu";
    const effectiveStudentEmail = studentEmail || auth?.email || "ramkumar.malothu@nyeras.com";
    const effectiveEventId = eventId || `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Process event in proctoring state machine
    const result = proctoringEngine.processEvent({
      eventId: effectiveEventId,
      attemptId,
      examId: examId || "exam-dotnet-mock-01",
      studentId: effectiveStudentId,
      eventType,
      severity,
      occurredAt: occurredAt || new Date().toISOString(),
      durationMs,
      confidence,
      metadata,
    });

    const isCancelled = Boolean(examCancelled || result.session.status === "DISQUALIFIED");
    const incidentWarningNumber = typeof warningNumber === "number" ? warningNumber : (result.session.strikeCount || 1);

    // Prepare Incident record for database persistence (Cloudflare D1 + Local fallback)
    const incidentData = {
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      attemptId,
      examId: examId || "exam-dotnet-mock-01",
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      studentEmail: effectiveStudentEmail,
      incidentType: eventType,
      warningNumber: incidentWarningNumber,
      severity: severity || (isCancelled ? "critical" : "warning"),
      details: metadata?.details || `${eventType} detected during active examination`,
      evidenceSnapshot: evidenceSnapshot || null,
      examCancelled: isCancelled,
      cancellationReason: cancellationReason || (isCancelled ? result.session.disqualificationReason || "3 Security Warnings Exceeded" : null),
      allWarningsSummary: allWarningsSummary || null,
      occurredAt: occurredAt || new Date().toISOString(),
    };

    // 1. Record in local engine/fallback JSON
    const localSaved = proctoringEngine.recordIncident(incidentData);

    // 2. Persist to Cloudflare D1 table `student_proctoring_incidents` (asynchronous, non-blocking)
    let d1Saved = false;
    try {
      d1Saved = await saveProctoringIncident(incidentData);
    } catch (e) {
      console.warn("Cloudflare D1 incident persistence notice:", e);
    }

    return NextResponse.json({
      success: true,
      event: result.event,
      sessionStatus: result.session.status,
      strikeCount: result.session.strikeCount,
      actionTaken: result.actionTaken,
      isDisqualified: isCancelled,
      incidentRecorded: {
        id: localSaved.id,
        d1Persisted: d1Saved,
        warningNumber: incidentWarningNumber,
        hasEvidenceSnapshot: Boolean(evidenceSnapshot),
        examCancelled: isCancelled,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process proctoring event" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get("attemptId") || undefined;
    const studentId = searchParams.get("studentId") || undefined;
    const examCancelledOnly = searchParams.get("cancelledOnly") === "true";

    // 1. Attempt reading from Cloudflare D1 first
    let incidents: any[] = [];
    try {
      incidents = await getProctoringIncidents({ attemptId, studentId, examCancelledOnly });
    } catch (e) {
      // D1 query fallback
    }

    // 2. If D1 returned empty or unconfigured, read from local fallback database
    if (!incidents || incidents.length === 0) {
      incidents = proctoringEngine.getIncidents({ attemptId, studentId, examCancelledOnly });
    }

    return NextResponse.json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch proctoring incidents" }, { status: 500 });
  }
}
