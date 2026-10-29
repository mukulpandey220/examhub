import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user-student-ramkumar";
    const status = db.getExamAttemptStatus(userId, params.examId);
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to get attempt status" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user-student-ramkumar";
    const reset = db.resetUserAttemptsForExam(userId, params.examId);
    return NextResponse.json({ success: true, reset });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to reset attempts" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const examId = params.examId;
    const userId = body.userId || "user-student-ramkumar";
    const userEmail = body.userEmail || "ramkumar.malothu@nyeras.com";
    const userName = body.userName || "Ramkumar Malothu";
    const resetAttempts = body.resetAttempts === true || body.action === "reset";

    if (resetAttempts) {
      db.resetUserAttemptsForExam(userId, examId);
    }

    // Check if exam is unlocked or free
    const isUnlocked = db.isExamUnlockedForUser(userId, examId);
    if (!isUnlocked) {
      const exam = db.getExamById(examId);
      const requiredTokens = exam?.tokenFee ?? exam?.feeRupees ?? 99;
      const currentTokens = db.getUserTokens(userId);

      if (currentTokens >= requiredTokens) {
        // Automatically unlock using tokens (1 Rs = 1 Token)
        const unlock = db.unlockExamWithTokens(userId, examId);
        if (!unlock.success) {
          return NextResponse.json({ error: unlock.message }, { status: 402 });
        }
      } else {
        return NextResponse.json({
          error: `Examination locked. Requires ${requiredTokens} Tokens (₹${requiredTokens}). Your balance: ${currentTokens} Tokens. Please complete payment via Razorpay.`,
          requiresPayment: true,
          examFee: requiredTokens,
          userTokens: currentTokens,
        }, { status: 402 });
      }
    }

    const sessionToken = body.sessionToken;
    const reclaimSession = body.reclaimSession === true || body.action === "reclaim";

    const result = db.startAttempt({
      examId,
      userId,
      userEmail,
      userName,
      resetAttempts,
      sessionToken,
      reclaimSession,
    });

    if (result.error) {
      return NextResponse.json({ 
        error: result.error,
        isSecondLoginBlocked: !!result.isSecondLoginBlocked,
        isLimitReached: result.error.includes("limit"),
        attemptLimit: db.getExamById(examId)?.attemptLimit ?? 3,
      }, { status: result.isSecondLoginBlocked ? 409 : 400 });
    }

    const examDef = db.getExamById(examId);
    let questions: any[] = [];
    if (examDef) {
      const allQs = db.getQuestions();
      if (examDef.questionIds && examDef.questionIds.length > 0) {
        questions = examDef.questionIds
          .map(id => allQs.find(q => q.id === id))
          .filter(Boolean);
      }
      if (questions.length === 0 && examDef.domainSlug) {
        questions = allQs.filter(q => q.domainSlug === examDef.domainSlug).slice(0, examDef.questionCount || 25);
      }
      if (questions.length === 0) {
        questions = allQs.slice(0, examDef.questionCount || 25);
      }
    }

    return NextResponse.json({ 
      attempt: result.attempt,
      exam: examDef || null,
      questions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to start attempt" }, { status: 500 });
  }
}

