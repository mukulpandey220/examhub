import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Question } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");
    const difficulty = searchParams.get("difficulty");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let questions = db.getQuestions();

    if (domain) {
      questions = questions.filter(q => q.domainSlug === domain);
    }
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }
    if (status) {
      questions = questions.filter(q => q.reviewStatus === status);
    }
    if (search) {
      const s = search.toLowerCase();
      questions = questions.filter(q => 
        q.questionText.toLowerCase().includes(s) || 
        q.topic.toLowerCase().includes(s) ||
        q.id.toLowerCase().includes(s)
      );
    }

    const total = questions.length;
    const paginated = questions.slice(offset, offset + limit);

    return NextResponse.json({
      total,
      questions: paginated,
      offset,
      limit,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: Question = await req.json();
    if (!body.id || !body.domainSlug || !body.questionText) {
      return NextResponse.json({ error: "Missing required fields (id, domainSlug, questionText)" }, { status: 400 });
    }

    const saved = db.addQuestion(body);
    return NextResponse.json({ question: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, reviewStatus } = await req.json();
    if (!id || !reviewStatus) {
      return NextResponse.json({ error: "id and reviewStatus are required" }, { status: 400 });
    }

    const updated = db.updateQuestionStatus(id, reviewStatus);
    return NextResponse.json({ success: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
