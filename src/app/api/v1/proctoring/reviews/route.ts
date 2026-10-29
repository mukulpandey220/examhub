import { NextRequest, NextResponse } from "next/server";
import { proctoringEngine } from "@/lib/proctoring-engine";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = requireRole(req, ["exam_admin", "super_admin", "admin"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { attemptId, decision, reason } = body;

    if (!attemptId || !decision || !reason) {
      return NextResponse.json({ error: "attemptId, decision, and reason are required" }, { status: 400 });
    }

    const review = proctoringEngine.submitReview({
      attemptId,
      reviewerId: user?.userId || "user-admin-nyeras",
      decision,
      reason,
    });

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit proctoring review" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = requireRole(req, ["exam_admin", "super_admin", "admin"]);
    if (errorResponse) return errorResponse;

    const reviews = proctoringEngine.getAllReviews();
    return NextResponse.json({ reviews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to get reviews" }, { status: 500 });
  }
}
