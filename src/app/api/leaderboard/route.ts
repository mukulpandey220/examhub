import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domainSlug = searchParams.get("domain") || "all";

    const rankings = db.getLeaderboard(domainSlug);

    return NextResponse.json({
      success: true,
      domain: domainSlug,
      rankings,
      totalParticipants: rankings.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
