import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Question } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { domainSlug, topic, difficulty, count = 5, type = "single_choice", learningObjectives } = await req.json();

    if (!domainSlug || !topic) {
      return NextResponse.json({ error: "domainSlug and topic are required" }, { status: 400 });
    }

    const generated: Question[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < Math.min(count, 20); i++) {
      const qId = `q-draft-${domainSlug}-${timestamp}-${i + 1}`;
      
      const q: Question = {
        id: qId,
        domainSlug,
        subjectSlug: `${domainSlug}-generated`,
        topic,
        difficulty: difficulty || "intermediate",
        type: type || "single_choice",
        questionText: `[Draft Question ${i + 1} • ${topic}] Analyze the standard implementation and performance characteristics of ${topic} when deployed in production under standard specifications.`,
        options: [
          { id: "opt-1", text: "Optimal deterministic execution complying with target latency SLAs" },
          { id: "opt-2", text: "High thread contention leading to cascading socket exhaustion" },
          { id: "opt-3", text: "Unbounded heap allocation causing repetitive minor collections" },
          { id: "opt-4", text: "Deprecation warning due to unsupported protocol handshakes" },
        ],
        correctAnswer: "opt-1",
        explanation: `Under proper specification guidelines for ${topic}, deterministic behavior and bound resource allocation protect operational stability.`,
        marks: difficulty === "basic" ? 1 : difficulty === "intermediate" ? 2 : difficulty === "advanced" ? 3 : 4,
        negativeMarks: 0.25,
        reviewStatus: "draft", // Stored strictly as Draft / Pending Review!
        version: 1,
        sourceOrReference: learningObjectives ? `Draft aligned to: ${learningObjectives}` : "AI Content Draft Engine",
      };

      generated.push(q);
      db.addQuestion(q);
    }

    return NextResponse.json({
      success: true,
      generatedCount: generated.length,
      questions: generated,
      notice: "Generated questions have been saved with reviewStatus: 'draft'. They must be reviewed and approved by an administrator before appearing in published examinations.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
