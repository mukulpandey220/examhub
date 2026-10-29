import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const coverage = db.getDomainCoverage();
    const totalApproved = coverage.reduce((acc, c) => acc + c.approvedQuestions, 0);
    const completeDomainsCount = coverage.filter(c => c.isComplete).length;
    const remainingToComplete = coverage.reduce((acc, c) => acc + c.remainingRequired, 0);

    return NextResponse.json({
      coverage,
      totalDomains: coverage.length,
      completeDomainsCount,
      totalApprovedQuestions: totalApproved,
      remainingToComplete,
      targetQuestions: 72 * 50,
      isFullyComplete: completeDomainsCount === 72,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
