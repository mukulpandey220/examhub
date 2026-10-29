import { NextRequest, NextResponse } from "next/server";
import { proctoringEngine } from "@/lib/proctoring-engine";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      eventId, 
      attemptId, 
      examId, 
      studentId, 
      eventType, 
      severity, 
      occurredAt, 
      durationMs, 
      confidence, 
      metadata 
    } = body;

    if (!attemptId || !eventType) {
      return NextResponse.json({ error: "attemptId and eventType are required" }, { status: 400 });
    }

    const auth = getAuthUser(req);
    const effectiveStudentId = studentId || auth?.userId || "user-student-ramkumar";
    const effectiveEventId = eventId || `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

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

    return NextResponse.json({
      success: true,
      event: result.event,
      sessionStatus: result.session.status,
      strikeCount: result.session.strikeCount,
      actionTaken: result.actionTaken,
      isDisqualified: result.session.status === "DISQUALIFIED",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process proctoring event" }, { status: 500 });
  }
}
