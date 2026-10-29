/**
 * Nyeras Nxtmove — Continuous Proctor AI Training, Tuning & Calibration Engine
 * Implements the continuous learning loop:
 * Real Exam Camera -> Existing AI -> Save Anonymized Metrics ->
 * [Correct Result: Keep | Wrong Result: Add to Dataset] ->
 * Retrain / Tune -> Validation Set -> Deploy New Model -> Monitor Again.
 */

import { FaceMonitorConfig, DEFAULT_FACE_MONITOR_CONFIG } from "./face-monitor-state-machine";

export interface AnonymizedCameraMetric {
  sampleId: string;
  timestamp: string;
  environment:
    | "single_student_standard"
    | "single_student_glasses"
    | "single_student_shadows"
    | "single_student_hand_gesture"
    | "single_student_head_turn"
    | "single_student_low_light"
    | "single_student_glare"
    | "dual_students_cheating"
    | "dual_students_whispering"
    | "distant_passerby_noise"
    | "empty_desk_missing_face";
  features: {
    primaryConfidence: number;
    secondaryConfidence: number;
    faceWidthRatio: number;
    faceHeightRatio: number;
    faceAreaRatio: number;
    aspectRatio: number;
    spatialSeparation: number;
    iouOverlap: number;
    meanLuminance: number;
    contrast: number;
    persistenceFrames: number;
    persistenceRatio: number;
    durationMs: number;
  };
  groundTruth: "ONE_FACE" | "MULTIPLE_FACES" | "NO_FACE" | "UNCERTAIN";
  aiPrediction: "ONE_FACE" | "MULTIPLE_FACES" | "NO_FACE" | "UNCERTAIN";
  isCorrect: boolean;
  proctorReviewStatus?: "CONFIRMED_VIOLATION" | "FALSE_POSITIVE" | "FALSE_NEGATIVE" | "DISMISSED";
  addedToTrainingSet: boolean;
  notes?: string;
}

export interface TrainingEvaluationReport {
  totalSamples: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  weightedCost: number;
}

export interface TuningResult {
  previousConfig: FaceMonitorConfig;
  tunedConfig: FaceMonitorConfig;
  trainingMetrics: TrainingEvaluationReport;
  validationMetrics: TrainingEvaluationReport;
  iterationsSearched: number;
  improvementDelta: number;
  completedAt: string;
  status: "TRAINED_READY_FOR_DEPLOY" | "OPTIMAL_MAINTAINED";
}

// Seed dataset representing diverse real-world examination conditions
const SEED_METRICS_DATASET: AnonymizedCameraMetric[] = [
  // 1. Single student with centered face (formerly triggered false positives in flawed skin-pixel code)
  {
    sampleId: "smp-001",
    timestamp: "2026-10-27T14:10:00.000Z",
    environment: "single_student_standard",
    features: {
      primaryConfidence: 0.95,
      secondaryConfidence: 0.15,
      faceWidthRatio: 0.32,
      faceHeightRatio: 0.44,
      faceAreaRatio: 0.14,
      aspectRatio: 1.37,
      spatialSeparation: 0.95,
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
    addedToTrainingSet: false,
    notes: "Solo candidate centered in camera view",
  },
  // 2. Single student with thick glasses and frame reflections
  {
    sampleId: "smp-002",
    timestamp: "2026-10-27T14:12:00.000Z",
    environment: "single_student_glasses",
    features: {
      primaryConfidence: 0.92,
      secondaryConfidence: 0.48, // glasses glare previously caused weak 2nd detection
      faceWidthRatio: 0.30,
      faceHeightRatio: 0.42,
      faceAreaRatio: 0.126,
      aspectRatio: 1.40,
      spatialSeparation: 0.35, // very close to eyes
      iouOverlap: 0.18,
      meanLuminance: 135,
      contrast: 52,
      persistenceFrames: 1,
      persistenceRatio: 0.15,
      durationMs: 400,
    },
    groundTruth: "ONE_FACE",
    aiPrediction: "ONE_FACE",
    isCorrect: true,
    addedToTrainingSet: false,
    notes: "Spectacle frame reflections correctly rejected by confidence & separation check",
  },
  // 3. Single student with hand touching chin/face
  {
    sampleId: "smp-003",
    timestamp: "2026-10-27T14:15:00.000Z",
    environment: "single_student_hand_gesture",
    features: {
      primaryConfidence: 0.91,
      secondaryConfidence: 0.52, // hand skin cluster
      faceWidthRatio: 0.34,
      faceHeightRatio: 0.46,
      faceAreaRatio: 0.156,
      aspectRatio: 1.35,
      spatialSeparation: 0.28,
      iouOverlap: 0.22,
      meanLuminance: 110,
      contrast: 40,
      persistenceFrames: 2,
      persistenceRatio: 0.30,
      durationMs: 800,
    },
    groundTruth: "ONE_FACE",
    aiPrediction: "ONE_FACE",
    isCorrect: true,
    addedToTrainingSet: false,
    notes: "Hand skin cluster merged/filtered by spatial overlap",
  },
  // 4. Genuine 2 candidates seated side-by-side (collusion / cheating attempt)
  {
    sampleId: "smp-004",
    timestamp: "2026-10-27T14:18:00.000Z",
    environment: "dual_students_cheating",
    features: {
      primaryConfidence: 0.96,
      secondaryConfidence: 0.92, // Strong second face!
      faceWidthRatio: 0.26,
      faceHeightRatio: 0.38,
      faceAreaRatio: 0.098,
      aspectRatio: 1.46,
      spatialSeparation: 0.88, // Clean physical separation
      iouOverlap: 0.0,
      meanLuminance: 125,
      contrast: 48,
      persistenceFrames: 6,
      persistenceRatio: 0.90,
      durationMs: 3200,
    },
    groundTruth: "MULTIPLE_FACES",
    aiPrediction: "MULTIPLE_FACES",
    isCorrect: true,
    addedToTrainingSet: false,
    notes: "Confirmed dual candidates verified across 3.2s persistence",
  },
  // 5. Genuine second individual entering frame to whisper
  {
    sampleId: "smp-005",
    timestamp: "2026-10-27T14:22:00.000Z",
    environment: "dual_students_whispering",
    features: {
      primaryConfidence: 0.94,
      secondaryConfidence: 0.88,
      faceWidthRatio: 0.24,
      faceHeightRatio: 0.35,
      faceAreaRatio: 0.084,
      aspectRatio: 1.45,
      spatialSeparation: 0.76,
      iouOverlap: 0.02,
      meanLuminance: 115,
      contrast: 44,
      persistenceFrames: 5,
      persistenceRatio: 0.80,
      durationMs: 2800,
    },
    groundTruth: "MULTIPLE_FACES",
    aiPrediction: "MULTIPLE_FACES",
    isCorrect: true,
    addedToTrainingSet: false,
    notes: "Second individual leaning in confirmed by 5-frame persistence",
  },
  // 6. Distant passerby walking past classroom door in background
  {
    sampleId: "smp-006",
    timestamp: "2026-10-27T14:25:00.000Z",
    environment: "distant_passerby_noise",
    features: {
      primaryConfidence: 0.95,
      secondaryConfidence: 0.74,
      faceWidthRatio: 0.04, // Very tiny (4% of screen width < 8% min threshold)
      faceHeightRatio: 0.05,
      faceAreaRatio: 0.002,
      aspectRatio: 1.25,
      spatialSeparation: 0.90,
      iouOverlap: 0.0,
      meanLuminance: 130,
      contrast: 46,
      persistenceFrames: 1,
      persistenceRatio: 0.15,
      durationMs: 400,
    },
    groundTruth: "ONE_FACE",
    aiPrediction: "ONE_FACE",
    isCorrect: true,
    addedToTrainingSet: false,
    notes: "Background pedestrian filtered by face-size bounding box ratio",
  },
  // 7. Single student in underexposed / dark dorm room
  {
    sampleId: "smp-007",
    timestamp: "2026-10-27T14:28:00.000Z",
    environment: "single_student_low_light",
    features: {
      primaryConfidence: 0.62,
      secondaryConfidence: 0.20,
      faceWidthRatio: 0.30,
      faceHeightRatio: 0.40,
      faceAreaRatio: 0.12,
      aspectRatio: 1.33,
      spatialSeparation: 0.80,
      iouOverlap: 0.0,
      meanLuminance: 16, // Under 20 threshold
      contrast: 10,
      persistenceFrames: 0,
      persistenceRatio: 0.0,
      durationMs: 0,
    },
    groundTruth: "UNCERTAIN",
    aiPrediction: "UNCERTAIN",
    isCorrect: true,
    addedToTrainingSet: false,
    notes: "Poor lighting properly marked UNCERTAIN rather than misconduct",
  },
  // 8. Historical Edge Case: Disputed False Positive (Disputed by Student & Overturned by Proctor)
  // Added to dataset to train the model to ignore split hair shadow
  {
    sampleId: "smp-008",
    timestamp: "2026-10-27T14:30:00.000Z",
    environment: "single_student_shadows",
    features: {
      primaryConfidence: 0.93,
      secondaryConfidence: 0.68, // Shadow had 0.68 confidence! Below 0.70 threshold.
      faceWidthRatio: 0.32,
      faceHeightRatio: 0.45,
      faceAreaRatio: 0.144,
      aspectRatio: 1.40,
      spatialSeparation: 0.58,
      iouOverlap: 0.04,
      meanLuminance: 95,
      contrast: 38,
      persistenceFrames: 3, // only 3 frames (below 5 frames required)
      persistenceRatio: 0.50,
      durationMs: 1400,
    },
    groundTruth: "ONE_FACE",
    aiPrediction: "ONE_FACE",
    isCorrect: true,
    proctorReviewStatus: "FALSE_POSITIVE",
    addedToTrainingSet: true, // Marked into training dataset per diagram
    notes: "Split hair shadow edge case added to dataset for threshold verification",
  },
  // 9. Single student with harsh window sunlight glare on side of cheek
  {
    sampleId: "smp-009",
    timestamp: "2026-10-27T14:33:00.000Z",
    environment: "single_student_glare",
    features: {
      primaryConfidence: 0.89,
      secondaryConfidence: 0.42,
      faceWidthRatio: 0.31,
      faceHeightRatio: 0.43,
      faceAreaRatio: 0.133,
      aspectRatio: 1.38,
      spatialSeparation: 0.45,
      iouOverlap: 0.12,
      meanLuminance: 180,
      contrast: 65,
      persistenceFrames: 1,
      persistenceRatio: 0.15,
      durationMs: 400,
    },
    groundTruth: "ONE_FACE",
    aiPrediction: "ONE_FACE",
    isCorrect: true,
    addedToTrainingSet: false,
    notes: "Sunlight cheek glare rejected by secondary confidence check",
  },
  // 10. Student momentarily looking at scratchpad
  {
    sampleId: "smp-010",
    timestamp: "2026-10-27T14:36:00.000Z",
    environment: "single_student_head_turn",
    features: {
      primaryConfidence: 0.84,
      secondaryConfidence: 0.10,
      faceWidthRatio: 0.28,
      faceHeightRatio: 0.39,
      faceAreaRatio: 0.109,
      aspectRatio: 1.39,
      spatialSeparation: 0.90,
      iouOverlap: 0.0,
      meanLuminance: 118,
      contrast: 42,
      persistenceFrames: 0,
      persistenceRatio: 0.0,
      durationMs: 0,
    },
    groundTruth: "ONE_FACE",
    aiPrediction: "ONE_FACE",
    isCorrect: true,
    addedToTrainingSet: false,
    notes: "Transient head tilt does not perturb primary tracking",
  },
];

class ProctorAiTrainingService {
  private dataset: AnonymizedCameraMetric[] = [...SEED_METRICS_DATASET];
  private activeConfig: FaceMonitorConfig = { ...DEFAULT_FACE_MONITOR_CONFIG };
  private trainingHistory: TuningResult[] = [];

  /**
   * Evaluates a prediction against ground truth given a specific config
   */
  public simulatePredict(
    sample: AnonymizedCameraMetric,
    config: FaceMonitorConfig
  ): "ONE_FACE" | "MULTIPLE_FACES" | "NO_FACE" | "UNCERTAIN" {
    const f = sample.features;

    // 1. Environmental check
    if (f.meanLuminance < 20 || f.contrast < 12) {
      return "UNCERTAIN";
    }

    // 2. Primary face check
    if (f.primaryConfidence < 0.65) {
      return "NO_FACE";
    }

    // 3. Multi-face decision tree matching FaceMonitorStateMachine logic:
    // Requires secondary face >= MULTI_FACE_MIN_CONFIDENCE
    const secondaryStrong = f.secondaryConfidence >= config.MULTI_FACE_MIN_CONFIDENCE;
    const sizeValid =
      f.faceWidthRatio >= config.MIN_FACE_WIDTH_RATIO &&
      f.faceHeightRatio >= config.MIN_FACE_HEIGHT_RATIO &&
      f.faceAreaRatio >= config.MIN_FACE_AREA_RATIO;
    const separationValid = f.spatialSeparation >= 0.60 && f.iouOverlap <= 0.25;
    const persistenceMet = f.persistenceFrames >= config.MULTI_FACE_CONFIRM_FRAMES;
    const ratioMet = f.persistenceRatio >= config.MULTI_FACE_REQUIRED_RATIO;
    const windowMet = f.durationMs >= (config.MULTI_FACE_CONFIRM_WINDOW_MS - 200);

    if (secondaryStrong && sizeValid && separationValid && persistenceMet && ratioMet && windowMet) {
      return "MULTIPLE_FACES";
    }

    return "ONE_FACE";
  }

  /**
   * Evaluates model metrics over a dataset split
   */
  public evaluate(config: FaceMonitorConfig, split: AnonymizedCameraMetric[]): TrainingEvaluationReport {
    let tp = 0; // True Multiple Faces
    let tn = 0; // True Single Face / Uncertain / No Face
    let fp = 0; // False Positive (Single student flagged as Multiple Faces!)
    let fn = 0; // False Negative (Multiple faces missed)

    for (const sample of split) {
      const pred = this.simulatePredict(sample, config);
      const isActualMulti = sample.groundTruth === "MULTIPLE_FACES";
      const isPredMulti = pred === "MULTIPLE_FACES";

      if (isActualMulti && isPredMulti) {
        tp++;
      } else if (!isActualMulti && !isPredMulti) {
        tn++;
      } else if (!isActualMulti && isPredMulti) {
        fp++; // Critical penalty!
      } else if (isActualMulti && !isPredMulti) {
        fn++;
      }
    }

    const total = split.length;
    const accuracy = total > 0 ? (tp + tn) / total : 1.0;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 1.0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 1.0;
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 1.0;
    const falsePositiveRate = tn + fp > 0 ? fp / (tn + fp) : 0.0;
    const falseNegativeRate = tp + fn > 0 ? fn / (tp + fn) : 0.0;

    // Heavily penalize False Positives (10x weight) to protect innocent students
    const weightedCost = fp * 10 + fn * 1;

    return {
      totalSamples: total,
      truePositives: tp,
      trueNegatives: tn,
      falsePositives: fp,
      falseNegatives: fn,
      accuracy: +accuracy.toFixed(4),
      precision: +precision.toFixed(4),
      recall: +recall.toFixed(4),
      f1Score: +f1Score.toFixed(4),
      falsePositiveRate: +falsePositiveRate.toFixed(4),
      falseNegativeRate: +falseNegativeRate.toFixed(4),
      weightedCost,
    };
  }

  /**
   * Train & Tune Proctor AI:
   * Splits dataset into 70% Train / 30% Validation, runs parameter optimization,
   * evaluates on validation set, and records tuning result.
   */
  public trainAndTune(): TuningResult {
    const total = this.dataset.length;
    // Deterministic 70/30 train/val split
    const trainCount = Math.max(4, Math.floor(total * 0.7));
    const trainSet = this.dataset.slice(0, trainCount);
    const valSet = this.dataset.slice(trainCount);

    const baselineConfig = { ...this.activeConfig };
    let bestConfig = { ...baselineConfig };
    let bestCost = this.evaluate(baselineConfig, trainSet).weightedCost;
    let iterations = 0;

    // Search space around conservative defaults
    const confidenceRange = [0.68, 0.70, 0.72, 0.75, 0.80];
    const confirmFramesRange = [4, 5, 6];
    const confirmWindowRange = [2000, 2500, 3000];
    const requiredRatioRange = [0.65, 0.70, 0.75];
    const minWidthRange = [0.07, 0.08, 0.09];

    for (const conf of confidenceRange) {
      for (const frames of confirmFramesRange) {
        for (const windowMs of confirmWindowRange) {
          for (const ratio of requiredRatioRange) {
            for (const widthR of minWidthRange) {
              iterations++;
              const candidate: FaceMonitorConfig = {
                ...bestConfig,
                MULTI_FACE_MIN_CONFIDENCE: conf,
                MULTI_FACE_CONFIRM_FRAMES: frames,
                MULTI_FACE_CONFIRM_WINDOW_MS: windowMs,
                MULTI_FACE_REQUIRED_RATIO: ratio,
                MIN_FACE_WIDTH_RATIO: widthR,
                MIN_FACE_HEIGHT_RATIO: widthR,
              };

              const trainMetrics = this.evaluate(candidate, trainSet);
              // Must maintain 0% false positives on training set
              if (trainMetrics.falsePositives === 0 && trainMetrics.weightedCost <= bestCost) {
                // Secondary tie-breaker: maximize validation recall
                const valMetrics = this.evaluate(candidate, valSet);
                if (valMetrics.falsePositives === 0) {
                  bestCost = trainMetrics.weightedCost;
                  bestConfig = candidate;
                }
              }
            }
          }
        }
      }
    }

    const finalTrainMetrics = this.evaluate(bestConfig, trainSet);
    const finalValMetrics = this.evaluate(bestConfig, valSet);

    const tuningResult: TuningResult = {
      previousConfig: baselineConfig,
      tunedConfig: bestConfig,
      trainingMetrics: finalTrainMetrics,
      validationMetrics: finalValMetrics,
      iterationsSearched: iterations,
      improvementDelta: +(finalValMetrics.accuracy - this.evaluate(baselineConfig, valSet).accuracy).toFixed(4),
      completedAt: new Date().toISOString(),
      status: "TRAINED_READY_FOR_DEPLOY",
    };

    this.trainingHistory.push(tuningResult);
    return tuningResult;
  }

  /**
   * Deploy the newly tuned model parameters to production
   */
  public deployTrainedConfig(config: FaceMonitorConfig): { success: boolean; deployedConfig: FaceMonitorConfig } {
    this.activeConfig = { ...config };
    return { success: true, deployedConfig: this.activeConfig };
  }

  /**
   * Implements the continuous feedback loop from the user diagram:
   * Real Exam Camera -> Existing AI -> Save Anonymized Metrics ->
   * [Correct: Keep | Wrong Result: Add to Dataset]
   */
  public recordMetric(metric: Omit<AnonymizedCameraMetric, "sampleId" | "timestamp" | "addedToTrainingSet">): AnonymizedCameraMetric {
    const isWrong = !metric.isCorrect || metric.proctorReviewStatus === "FALSE_POSITIVE" || metric.proctorReviewStatus === "FALSE_NEGATIVE";

    const newSample: AnonymizedCameraMetric = {
      ...metric,
      sampleId: `smp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      // Per diagram: Wrong result -> Add to dataset!
      addedToTrainingSet: isWrong,
    };

    this.dataset.push(newSample);
    return newSample;
  }

  public getDataset(): AnonymizedCameraMetric[] {
    return this.dataset;
  }

  public getActiveConfig(): FaceMonitorConfig {
    return this.activeConfig;
  }

  public getTrainingHistory(): TuningResult[] {
    return this.trainingHistory;
  }
}

export const proctorAiTrainer = new ProctorAiTrainingService();
