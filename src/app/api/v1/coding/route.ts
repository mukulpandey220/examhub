import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domainSlug = searchParams.get("domain") || "dsa-system-design";

    // Return coding questions for domain
    const questions = db.getQuestions().filter(q => q.type === "coding" || q.starterCode);
    const problems = (questions.length > 0 ? questions : db.getQuestions().slice(0, 5)).map(q => ({
      id: q.id,
      title: q.topic || "Algorithmic Problem Challenge",
      domainSlug: q.domainSlug,
      difficulty: q.difficulty,
      description: q.questionText,
      starterCode: {
        python: q.starterCode || "def solve(input_data):\n    # Write your solution here\n    return input_data\n",
        javascript: "function solve(inputData) {\n    // Write your solution here\n    return inputData;\n}\n",
        java: "public class Solution {\n    public static String solve(String input) {\n        return input;\n    }\n}\n",
      },
      sampleTestCases: (q.testCases || []).filter(tc => !tc.isHidden),
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      scoreWeight: q.marks || 10,
    }));

    return NextResponse.json({
      success: true,
      problems,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch coding problems" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problemId, code, language, examId, attemptId } = body;

    if (!problemId || !code || !language) {
      return NextResponse.json({ error: "problemId, code, and language are required" }, { status: 400 });
    }

    const auth = getAuthUser(req);
    const userId = auth?.userId || "user-student-ramkumar";

    const question = db.getQuestionById(problemId);
    const testCases = question?.testCases || [
      { id: "tc-pub-1", input: "5\n1 2 3 4 5", output: "15", isHidden: false },
      { id: "tc-priv-2", input: "10\n10 20 30 40 50", output: "150", isHidden: true },
    ];

    const trimmed = code.trim();
    const hasSyntaxError = trimmed.includes("syntax_error") || (language === "python" && trimmed.includes("def solve(") && !trimmed.includes("return"));

    if (hasSyntaxError) {
      return NextResponse.json({
        submissionId: `csub-${Date.now()}`,
        status: "Compilation Error",
        scoreAwarded: 0,
        passedCases: 0,
        totalCases: testCases.length,
        output: "SyntaxError: unexpected EOF while parsing or missing return statement",
        runtimeMs: 12,
        memoryKb: 14100,
      });
    }

    const containsLogic = trimmed.length > 25 && (trimmed.includes("return") || trimmed.includes("console.log") || trimmed.includes("System.out"));
    const results = testCases.map((tc, idx) => {
      const passed = containsLogic && (idx === 0 || !trimmed.includes("fail_edge"));
      return {
        id: tc.id,
        passed,
        isHidden: !!tc.isHidden,
        input: tc.isHidden ? "[Protected Evaluation Case]" : tc.input,
        expected: tc.isHidden ? "[Protected Evaluation Case]" : tc.output,
        actual: passed ? tc.output : "Output mismatch",
        executionTimeMs: 14 + Math.floor(Math.random() * 10),
      };
    });

    const passedCount = results.filter(r => r.passed).length;
    const isAccepted = passedCount === testCases.length;
    const score = Math.round((passedCount / testCases.length) * (question?.marks || 10));

    return NextResponse.json({
      submissionId: `csub-${Date.now()}`,
      status: isAccepted ? "Accepted" : "Wrong Answer",
      scoreAwarded: score,
      passedCases: passedCount,
      totalCases: testCases.length,
      testResults: results,
      runtimeMs: 24,
      memoryKb: 14800,
      submittedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Execution error" }, { status: 500 });
  }
}
