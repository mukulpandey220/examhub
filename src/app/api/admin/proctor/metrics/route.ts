import { NextRequest, NextResponse } from "next/server";
import { proctorAiTrainer } from "@/lib/proctor-training";

export async function GET(req: NextRequest) {
  try {
    const dataset = proctorAiTrainer.getDataset();
    return NextResponse.json({
      success: true,
      metricsCount: dataset.length,
      metrics: dataset,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch metrics" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { environment, features, groundTruth, aiPrediction, isCorrect, proctorReviewStatus, notes } = body;

    if (!features || !groundTruth) {
      return NextResponse.json({ error: "features and groundTruth are required" }, { status: 400 });
    }

    const recorded = proctorAiTrainer.recordMetric({
      environment: environment || "single_student_standard",
      features,
      groundTruth,
      aiPrediction: aiPrediction || groundTruth,
      isCorrect: isCorrect !== undefined ? isCorrect : (aiPrediction === groundTruth),
      proctorReviewStatus,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: recorded.addedToTrainingSet
        ? "Metric evaluated as wrong/disputed result -> Added to training dataset per continuous learning pipeline."
        : "Metric evaluated as correct baseline result -> Stored in telemetry pool.",
      sample: recorded,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to record metric" }, { status: 500 });
  }
}
