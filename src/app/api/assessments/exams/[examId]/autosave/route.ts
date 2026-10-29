import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const body = await req.json();
    const { attemptId, answers, markedForReview, timeSpentSeconds, codingSubmissions, proctoring, sessionToken } = body;

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId is required" }, { status: 400 });
    }

    const saved = db.autosaveAttempt({
      attemptId,
      answers: answers || {},
      markedForReview: markedForReview || [],
      timeSpentSeconds: timeSpentSeconds || 0,
      codingSubmissions: codingSubmissions || {},
      proctoring: proctoring || undefined,
      sessionToken,
    });

    return NextResponse.json({ success: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to autosave" }, { status: 500 });
  }
}
