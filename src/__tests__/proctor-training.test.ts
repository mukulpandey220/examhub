import { describe, it, expect, beforeEach } from "vitest";
import { proctorAiTrainer, AnonymizedCameraMetric } from "../lib/proctor-training";
import { DEFAULT_FACE_MONITOR_CONFIG } from "../lib/face-monitor-state-machine";

describe("Proctor AI Training & Continuous Learning Pipeline", () => {
  // Fresh state before tests
  const initialConfig = { ...DEFAULT_FACE_MONITOR_CONFIG };

  it("Step 1 & 2: should keep correct prediction results and not flag for dataset retraining", () => {
    const correctSample = proctorAiTrainer.recordMetric({
      environment: "single_student_standard",
      features: {
        primaryConfidence: 0.95,
        secondaryConfidence: 0.12,
        faceWidthRatio: 0.30,
        faceHeightRatio: 0.42,
        faceAreaRatio: 0.126,
        aspectRatio: 1.40,
        spatialSeparation: 0.90,
        iouOverlap: 0.0,
        meanLuminance: 120,
        contrast: 45,
        persistenceFrames: 0,
        persistenceRatio: 0.0,
        durationMs: 0,
      },
      groundTruth: "ONE_FACE",
      aiPrediction: "ONE_FACE",
      isCorrect: true,
      notes: "Solo candidate verified",
    });

    // Per diagram: Correct result -> Keep (addedToTrainingSet: false)
    expect(correctSample.addedToTrainingSet).toBe(false);
    expect(correctSample.isCorrect).toBe(true);
  });

  it("Step 3: should triage wrong / disputed proctor results and add them to training dataset", () => {
    const falsePositiveSample = proctorAiTrainer.recordMetric({
      environment: "single_student_shadows",
      features: {
        primaryConfidence: 0.92,
        secondaryConfidence: 0.69, // shadow noise that caused false alarm
        faceWidthRatio: 0.32,
        faceHeightRatio: 0.44,
        faceAreaRatio: 0.14,
        aspectRatio: 1.37,
        spatialSeparation: 0.55,
        iouOverlap: 0.05,
        meanLuminance: 105,
        contrast: 42,
        persistenceFrames: 3,
        persistenceRatio: 0.50,
        durationMs: 1200,
      },
      groundTruth: "ONE_FACE",
      aiPrediction: "MULTIPLE_FACES",
      isCorrect: false, // Flagged as incorrect!
      proctorReviewStatus: "FALSE_POSITIVE",
      notes: "False alarm caused by window curtain shadow",
    });

    // Per diagram: Wrong result -> Add to dataset (addedToTrainingSet: true)
    expect(falsePositiveSample.addedToTrainingSet).toBe(true);
    expect(falsePositiveSample.isCorrect).toBe(false);
  });

  it("Step 4: should evaluate benchmark metrics with zero false positive rate", () => {
    const dataset = proctorAiTrainer.getDataset();
    const evaluation = proctorAiTrainer.evaluate(initialConfig, dataset);

    expect(evaluation.totalSamples).toBeGreaterThanOrEqual(10);
    // Crucial requirement: 0% False Positive Rate on innocent students!
    expect(evaluation.falsePositives).toBe(0);
    expect(evaluation.falsePositiveRate).toBe(0.0);
    expect(evaluation.precision).toBe(1.0);
  });

  it("Step 5 & 6: should execute retrain/tuning across training split and validate on held-out validation set", () => {
    const tuning = proctorAiTrainer.trainAndTune();

    expect(tuning.status).toBe("TRAINED_READY_FOR_DEPLOY");
    expect(tuning.iterationsSearched).toBeGreaterThan(0);
    expect(tuning.trainingMetrics.falsePositives).toBe(0);
    expect(tuning.validationMetrics.falsePositives).toBe(0);
    expect(tuning.validationMetrics.accuracy).toBeGreaterThanOrEqual(0.9);
    expect(tuning.tunedConfig.MULTI_FACE_MIN_CONFIDENCE).toBeGreaterThanOrEqual(0.68);
  });

  it("Step 7: should deploy newly tuned configuration to live proctoring engine", () => {
    const candidateConfig = {
      ...DEFAULT_FACE_MONITOR_CONFIG,
      MULTI_FACE_MIN_CONFIDENCE: 0.72,
      MULTI_FACE_CONFIRM_FRAMES: 5,
    };

    const res = proctorAiTrainer.deployTrainedConfig(candidateConfig);

    expect(res.success).toBe(true);
    expect(proctorAiTrainer.getActiveConfig().MULTI_FACE_MIN_CONFIDENCE).toBe(0.72);
  });
});
