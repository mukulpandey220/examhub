import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CampusDeadline } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const university = searchParams.get("university");

    let deadlines = db.getDeadlines();

    if (category) {
      deadlines = deadlines.filter(d => d.category === category);
    }
    if (university) {
      deadlines = deadlines.filter(d => d.universityOrBoard.toLowerCase().includes(university.toLowerCase()));
    }

    return NextResponse.json({
      total: deadlines.length,
      deadlines,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CampusDeadline = await req.json();
    if (!body.title || !body.dueDate || !body.universityOrBoard) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newDeadline: CampusDeadline = {
      ...body,
      id: body.id || `dl-${Date.now()}`,
      isVerified: true,
    };

    const saved = db.addDeadline(newDeadline);
    return NextResponse.json({ deadline: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
