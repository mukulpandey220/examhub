import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const body = await req.json();
    const { attemptId, answers, autoExpired, codingSubmissions, proctoring } = body;

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId is required" }, { status: 400 });
    }

    const result = db.submitAttempt({
      attemptId,
      answers,
      autoExpired: !!autoExpired,
      codingSubmissions,
      proctoring: proctoring || undefined,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ attempt: result.attempt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit attempt" }, { status: 500 });
  }
}
