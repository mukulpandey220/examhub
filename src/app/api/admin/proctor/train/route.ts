import { NextRequest, NextResponse } from "next/server";
import { proctorAiTrainer } from "@/lib/proctor-training";

export async function GET(req: NextRequest) {
  try {
    const dataset = proctorAiTrainer.getDataset();
    const activeConfig = proctorAiTrainer.getActiveConfig();
    const history = proctorAiTrainer.getTrainingHistory();
    const evaluation = proctorAiTrainer.evaluate(activeConfig, dataset);

    return NextResponse.json({
      success: true,
      activeConfig,
      evaluation,
      datasetStats: {
        totalSamples: dataset.length,
        correctSamples: dataset.filter(s => s.isCorrect).length,
        disputedOrWrongAddedToDataset: dataset.filter(s => s.addedToTrainingSet).length,
        singleFaceSamples: dataset.filter(s => s.groundTruth === "ONE_FACE").length,
        multiFaceSamples: dataset.filter(s => s.groundTruth === "MULTIPLE_FACES").length,
        uncertainSamples: dataset.filter(s => s.groundTruth === "UNCERTAIN").length,
      },
      latestTuningResult: history[history.length - 1] || null,
      trainingRunsCount: history.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch training data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "train_and_tune";

    if (action === "train_and_tune") {
      const tuningResult = proctorAiTrainer.trainAndTune();
      return NextResponse.json({
        success: true,
        message: "Proctor AI model hyperparameters retrained & tuned across dataset successfully.",
        tuningResult,
      });
    }

    if (action === "deploy") {
      const configToDeploy = body.config || proctorAiTrainer.getTrainingHistory().slice(-1)[0]?.tunedConfig;
      if (!configToDeploy) {
        return NextResponse.json({ error: "No candidate configuration available to deploy" }, { status: 400 });
      }
      const deployResult = proctorAiTrainer.deployTrainedConfig(configToDeploy);
      return NextResponse.json({
        success: true,
        message: "Trained model parameters deployed to live examination proctoring engine.",
        deployedConfig: deployResult.deployedConfig,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Training operation failed" }, { status: 500 });
  }
}
