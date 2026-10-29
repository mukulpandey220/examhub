import { describe, it, expect, beforeEach } from "vitest";
import {
  FaceMonitorStateMachine,
  DetectedFace,
  DEFAULT_FACE_MONITOR_CONFIG,
  calculateIoU,
  areSpatiallySeparated,
} from "../lib/face-monitor-state-machine";

describe("FaceMonitorStateMachine — Multi-Face Accuracy & False-Positive Tests", () => {
  let stateMachine: FaceMonitorStateMachine;
  const frameWidth = 640;
  const frameHeight = 480;

  // Primary candidate centered in webcam
  const primaryFace: DetectedFace = {
    boundingBox: { x: 220, y: 120, width: 200, height: 220 },
    confidence: 0.96,
  };

  // Strong genuine secondary candidate seated next to primary
  const secondaryFaceStrong: DetectedFace = {
    boundingBox: { x: 20, y: 130, width: 170, height: 200 },
    confidence: 0.92,
  };

  // Weak/noisy secondary detection (e.g. wall poster, shadow, glare, chair)
  const secondaryFaceWeak: DetectedFace = {
    boundingBox: { x: 30, y: 140, width: 150, height: 180 },
    confidence: 0.35,
  };

  // Tiny distant background noise (e.g. reflection on glasses or door)
  const tinyBackgroundArtifact: DetectedFace = {
    boundingBox: { x: 10, y: 10, width: 20, height: 20 }, // 20x20 is tiny
    confidence: 0.88,
  };

  beforeEach(() => {
    stateMachine = new FaceMonitorStateMachine();
  });

  // TEST 1 — Normal student sitting alone
  it("Test 1 — normal student [1,1,1,1,1,1,1] maintains CLEAR / ONE_FACE", () => {
    const sequence = [1, 1, 1, 1, 1, 1, 1];
    let lastResult: any;

    sequence.forEach((count, i) => {
      lastResult = stateMachine.processFrame({
        rawFaces: [primaryFace],
        frameWidth,
        frameHeight,
        timestamp: 1000 + i * 300,
      });
      expect(lastResult.state).toBe("ONE_FACE");
      expect(lastResult.shouldEmitViolation).toBe(false);
    });

    expect(lastResult.state).toBe("ONE_FACE");
    expect(lastResult.reliableFaceCount).toBe(1);
  });

  // TEST 2 — One false positive (camera glitch or hand scratch)
  it("Test 2 — single-frame false positive [1,1,2,1,1,1] does NOT trigger MULTIPLE_CONFIRMED", () => {
    const stream = [
      [primaryFace],
      [primaryFace],
      [primaryFace, secondaryFaceStrong], // Brief 1-frame spike!
      [primaryFace],
      [primaryFace],
      [primaryFace],
    ];

    const states: string[] = [];
    const violations: boolean[] = [];

    stream.forEach((faces, i) => {
      const res = stateMachine.processFrame({
        rawFaces: faces,
        frameWidth,
        frameHeight,
        timestamp: 1000 + i * 300,
      });
      states.push(res.state);
      violations.push(res.shouldEmitViolation);
    });

    // None of the frames should have emitted a confirmed violation
    expect(violations.every((v) => v === false)).toBe(true);
    // Final state must remain ONE_FACE
    expect(states[states.length - 1]).toBe("ONE_FACE");
    expect(stateMachine.getCurrentState()).toBe("ONE_FACE");
  });

  // TEST 3 — Intermittent false positives
  it("Test 3 — intermittent false positives [1,2,1,2,1,1,2] does NOT trigger MULTIPLE_CONFIRMED", () => {
    const stream = [
      [primaryFace],
      [primaryFace, secondaryFaceStrong],
      [primaryFace],
      [primaryFace, secondaryFaceStrong],
      [primaryFace],
      [primaryFace],
      [primaryFace, secondaryFaceStrong],
    ];

    let emittedViolation = false;
    stream.forEach((faces, i) => {
      const res = stateMachine.processFrame({
        rawFaces: faces,
        frameWidth,
        frameHeight,
        timestamp: 1000 + i * 300,
      });
      if (res.shouldEmitViolation) emittedViolation = true;
    });

    expect(emittedViolation).toBe(false);
    expect(stateMachine.getCurrentState()).not.toBe("MULTIPLE_CONFIRMED");
  });

  // TEST 4 — Genuine second person sitting persistently
  it("Test 4 — genuine second person [1,2,2,2,2,2] triggers MULTIPLE_CONFIRMED and violation", () => {
    const stream = [
      [primaryFace],
      [primaryFace, secondaryFaceStrong],
      [primaryFace, secondaryFaceStrong],
      [primaryFace, secondaryFaceStrong],
      [primaryFace, secondaryFaceStrong],
      [primaryFace, secondaryFaceStrong],
    ];

    let lastRes: any;
    const states: string[] = [];
    stream.forEach((faces, i) => {
      lastRes = stateMachine.processFrame({
        rawFaces: faces,
        frameWidth,
        frameHeight,
        timestamp: 1000 + i * 400,
      });
      states.push(lastRes.state);
    });

    expect(lastRes.state).toBe("MULTIPLE_CONFIRMED");
    expect(lastRes.shouldEmitViolation).toBe(true);
    expect(lastRes.violationDetails).toContain("Persistent dual face presence confirmed");
  });

  // TEST 5 — Weak second detection (shadow/poster/low confidence)
  it("Test 5 — weak second detection (primary=0.96, secondary=0.35) remains CLEAR / ONE_FACE", () => {
    const stream = [
      [primaryFace, secondaryFaceWeak],
      [primaryFace, secondaryFaceWeak],
      [primaryFace, secondaryFaceWeak],
      [primaryFace, secondaryFaceWeak],
      [primaryFace, secondaryFaceWeak],
    ];

    let lastRes: any;
    stream.forEach((faces, i) => {
      lastRes = stateMachine.processFrame({
        rawFaces: faces,
        frameWidth,
        frameHeight,
        timestamp: 1000 + i * 300,
      });
    });

    // Secondary face confidence is 0.35 which is < 0.70 threshold
    expect(lastRes.reliableFaceCount).toBe(1);
    expect(lastRes.state).toBe("ONE_FACE");
    expect(lastRes.shouldEmitViolation).toBe(false);
  });

  // TEST 6 — Strong persistent second face across confirmation window
  it("Test 6 — strong persistent second face (primary=0.95, secondary=0.91) triggers MULTIPLE_CONFIRMED", () => {
    const pFace = { ...primaryFace, confidence: 0.95 };
    const sFace = { ...secondaryFaceStrong, confidence: 0.91 };

    let confirmedEmitted = false;
    for (let i = 0; i < 6; i++) {
      const res = stateMachine.processFrame({
        rawFaces: [pFace, sFace],
        frameWidth,
        frameHeight,
        timestamp: 1000 + i * 400,
      });
      if (res.state === "MULTIPLE_CONFIRMED" && res.shouldEmitViolation) {
        confirmedEmitted = true;
      }
    }

    expect(confirmedEmitted).toBe(true);
    expect(stateMachine.getCurrentState()).toBe("MULTIPLE_CONFIRMED");
  });

  // TEST 7 — Second face enters briefly and leaves
  it("Test 7 — second face enters briefly [1,1,1,2,2,1,1] remains CLEAR / does not confirm", () => {
    const stream = [
      [primaryFace],
      [primaryFace],
      [primaryFace],
      [primaryFace, secondaryFaceStrong], // Enters for 2 frames only
      [primaryFace, secondaryFaceStrong],
      [primaryFace],                      // Leaves
      [primaryFace],
    ];

    let emittedViolation = false;
    let finalState = "";

    stream.forEach((faces, i) => {
      const res = stateMachine.processFrame({
        rawFaces: faces,
        frameWidth,
        frameHeight,
        timestamp: 1000 + i * 300,
      });
      if (res.shouldEmitViolation) emittedViolation = true;
      finalState = res.state;
    });

    expect(emittedViolation).toBe(false);
    expect(finalState).toBe("ONE_FACE");
  });

  // TEST 8 — Low-quality camera (glare/underexposed) yields UNCERTAIN, not misconduct
  it("Test 8 — poor image quality yields UNCERTAIN without generating violation", () => {
    const res = stateMachine.processFrame({
      rawFaces: [primaryFace, secondaryFaceStrong],
      frameWidth,
      frameHeight,
      timestamp: 1000,
      imageQuality: "LOW_LIGHT",
    });

    expect(res.state).toBe("UNCERTAIN");
    expect(res.shouldEmitViolation).toBe(false);
    expect(stateMachine.getCurrentState()).toBe("UNCERTAIN");
  });

  // ADDITIONAL SAFETY TESTS:
  it("should reject tiny background artifacts via face-size filtering", () => {
    const res = stateMachine.processFrame({
      rawFaces: [primaryFace, tinyBackgroundArtifact],
      frameWidth,
      frameHeight,
      timestamp: 1000,
    });

    // Tiny artifact (20x20 on 640x480) is filtered out
    expect(res.reliableFaceCount).toBe(1);
    expect(res.state).toBe("ONE_FACE");
  });

  it("should reject landmark-only points so eyes/mouth are never counted as separate faces", () => {
    const eyeLandmark: DetectedFace = {
      boundingBox: { x: 260, y: 150, width: 30, height: 20 },
      confidence: 0.99,
      isLandmarkOnly: true,
    };

    const res = stateMachine.processFrame({
      rawFaces: [primaryFace, eyeLandmark],
      frameWidth,
      frameHeight,
      timestamp: 1000,
    });

    expect(res.reliableFaceCount).toBe(1);
    expect(res.state).toBe("ONE_FACE");
  });

  it("should throttle confirmed multiple-face violation alerts with 10,000ms cooldown", () => {
    // 1. Establish initial persistent multi-face frames (4 frames)
    for (let i = 0; i < 4; i++) {
      stateMachine.processFrame({
        rawFaces: [primaryFace, secondaryFaceStrong],
        frameWidth,
        frameHeight,
        timestamp: 1000 + i * 400,
      });
    }

    // Frame 6 (T=3000ms): Confirmed and emits violation
    const alert1 = stateMachine.processFrame({
      rawFaces: [primaryFace, secondaryFaceStrong],
      frameWidth,
      frameHeight,
      timestamp: 3000,
    });
    expect(alert1.state).toBe("MULTIPLE_CONFIRMED");
    expect(alert1.shouldEmitViolation).toBe(true);

    // Frame 7 (T=4000ms): Still MULTIPLE_CONFIRMED, but cooldown is active (10s) -> shouldEmitViolation must be FALSE
    const alert2 = stateMachine.processFrame({
      rawFaces: [primaryFace, secondaryFaceStrong],
      frameWidth,
      frameHeight,
      timestamp: 4000,
    });
    expect(alert2.state).toBe("MULTIPLE_CONFIRMED");
    expect(alert2.shouldEmitViolation).toBe(false);

    // Frame 8 (T=13500ms): Cooldown expired (10.5s > 10s) -> shouldEmitViolation can emit again
    const alert3 = stateMachine.processFrame({
      rawFaces: [primaryFace, secondaryFaceStrong],
      frameWidth,
      frameHeight,
      timestamp: 13500,
    });
    expect(alert3.state).toBe("MULTIPLE_CONFIRMED");
    expect(alert3.shouldEmitViolation).toBe(true);
  });

  it("should correctly compute IoU and spatial separation between bounding boxes", () => {
    const boxA = { x: 100, y: 100, width: 100, height: 100 };
    const boxIdentical = { x: 100, y: 100, width: 100, height: 100 };
    const boxSeparate = { x: 300, y: 100, width: 100, height: 100 };

    expect(calculateIoU(boxA, boxIdentical)).toBe(1);
    expect(calculateIoU(boxA, boxSeparate)).toBe(0);

    expect(areSpatiallySeparated(boxA, boxIdentical)).toBe(false); // Same face, not separate!
    expect(areSpatiallySeparated(boxA, boxSeparate)).toBe(true);   // Distinct people
  });
});
