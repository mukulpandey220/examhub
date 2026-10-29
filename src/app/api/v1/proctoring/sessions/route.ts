import { NextRequest, NextResponse } from "next/server";
import { proctoringEngine } from "@/lib/proctoring-engine";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { examId, attemptId, studentId, policy } = body;

    if (!examId || !attemptId) {
      return NextResponse.json({ error: "examId and attemptId are required" }, { status: 400 });
    }

    const auth = getAuthUser(req);
    const effectiveStudentId = studentId || auth?.userId || "user-student-ramkumar";

    const session = proctoringEngine.initSession({
      examId,
      attemptId,
      studentId: effectiveStudentId,
      policy,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to initialize proctoring session" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get("attemptId");

    if (!attemptId) {
      // Admin overview: list all active sessions
      const sessions = proctoringEngine.getAllSessions();
      return NextResponse.json({ sessions });
    }

    const session = proctoringEngine.getSession(attemptId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const events = proctoringEngine.getEvents(attemptId);

    return NextResponse.json({
      session,
      events,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to retrieve session" }, { status: 500 });
  }
}
