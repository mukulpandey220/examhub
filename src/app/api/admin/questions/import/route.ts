import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Question } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let questionsToImport: Question[] = [];

    if (contentType.includes("application/json")) {
      const body = await req.json();
      questionsToImport = Array.isArray(body) ? body : body.questions || [];
    } else {
      // CSV Text Import
      const csvText = await req.text();
      const lines = csvText.split("\n").filter(l => l.trim().length > 0);
      if (lines.length <= 1) {
        return NextResponse.json({ error: "Empty or invalid CSV file" }, { status: 400 });
      }

      // Format expected: id,domainSlug,topic,difficulty,type,questionText,opt1,opt2,opt3,opt4,correctAnswer,explanation,marks
      const header = lines[0].split(",").map(h => h.trim().toLowerCase());
      
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map(p => p.trim());
        if (parts.length >= 7) {
          const qId = parts[0] || `q-csv-${Date.now()}-${i}`;
          const domainSlug = parts[1] || "dotnet";
          const topic = parts[2] || "General";
          const diff = (["basic", "intermediate", "advanced", "professional"].includes(parts[3]?.toLowerCase()) 
            ? parts[3].toLowerCase() 
            : "intermediate") as any;
          const qType = (["single_choice", "multiple_choice", "true_false", "numerical", "coding", "practical"].includes(parts[4]?.toLowerCase())
            ? parts[4].toLowerCase()
            : "single_choice") as any;
          const qText = parts[5] || "Question prompt";
          const opt1 = parts[6] || "Option A";
          const opt2 = parts[7] || "Option B";
          const opt3 = parts[8] || "Option C";
          const opt4 = parts[9] || "Option D";
          const correct = parts[10] || "opt-1";
          const explanation = parts[11] || "Explanation";
          const marks = parseInt(parts[12] || "1", 10);

          questionsToImport.push({
            id: qId,
            domainSlug,
            subjectSlug: `${domainSlug}-core`,
            topic,
            difficulty: diff,
            type: qType,
            questionText: qText,
            options: [
              { id: "opt-1", text: opt1 },
              { id: "opt-2", text: opt2 },
              { id: "opt-3", text: opt3 },
              { id: "opt-4", text: opt4 },
            ],
            correctAnswer: correct,
            explanation,
            marks,
            negativeMarks: 0.25,
            reviewStatus: "approved",
            version: 1,
            sourceOrReference: "Bulk CSV Import",
          });
        }
      }
    }

    if (questionsToImport.length === 0) {
      return NextResponse.json({ error: "No valid questions found to import" }, { status: 400 });
    }

    const { imported, duplicates } = db.bulkImportQuestions(questionsToImport);

    return NextResponse.json({
      success: true,
      imported,
      duplicates,
      totalReceived: questionsToImport.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
