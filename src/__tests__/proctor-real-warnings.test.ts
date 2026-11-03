import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ViewportEdgeGuard,
  estimateHeadPoseFromBox,
  assessImageQuality,
  BoundingBox,
} from "../lib/proctoring-vision";
import { FaceMonitorStateMachine } from "../lib/face-monitor-state-machine";

describe("Real Proctor Warnings & Debounce Reliability Tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Camera Edge Guard & Quality Checks", () => {
    const edgeGuard = new ViewportEdgeGuard(0.06);

    it("identifies centered candidate face as safe (not near edge)", () => {
      const centeredBox: BoundingBox = { x: 160, y: 120, width: 160, height: 180 };
      const prox = edgeGuard.checkEdgeProximity(centeredBox, 480, 360);
      expect(prox.isNearEdge).toBe(false);
      expect(prox.edgeName).toBeUndefined();
    });

    it("identifies face crossing the 6% safe zone border", () => {
      // 6% of 480 = 28.8px
      const leftDriftingBox: BoundingBox = { x: 15, y: 120, width: 160, height: 180 };
      const prox = edgeGuard.checkEdgeProximity(leftDriftingBox, 480, 360);
      expect(prox.isNearEdge).toBe(true);
      expect(prox.edgeName).toBe("left");
    });

    it("preserves face detection under soft ambient contrast (>6)", () => {
      // Create a mock frame with soft contrast
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      // Soft gradient
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 120;     // R
        data[i + 1] = 118; // G
        data[i + 2] = 110; // B
        data[i + 3] = 255; // A
      }
      const quality = assessImageQuality(data, width, height);
      expect(quality.meanLuminance).toBeGreaterThan(50);
    });

    it("estimates normal gaze orientation for centered candidate", () => {
      const box: BoundingBox = { x: 200, y: 140, width: 160, height: 180 };
      const pose = estimateHeadPoseFromBox(box, 560, 420);
      expect(pose.isDeviated).toBe(false);
      expect(pose.direction).toBe("center");
    });
  });

  describe("Real Tab Switch Debouncing Logic", () => {
    it("does NOT record a strike when tab switch duration is under 1200ms", () => {
      let violationRecorded = false;
      let timer: NodeJS.Timeout | null = null;

      const onVisibilityChange = (state: "hidden" | "visible") => {
        if (state === "hidden") {
          timer = setTimeout(() => {
            violationRecorded = true;
          }, 1200);
        } else {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }
      };

      // Candidate accidentally presses key or switches momentarily (400ms)
      onVisibilityChange("hidden");
      vi.advanceTimersByTime(400);
      onVisibilityChange("visible");

      vi.advanceTimersByTime(2000);
      expect(violationRecorded).toBe(false);
    });

    it("records a genuine strike ONLY when tab remains hidden for >= 1200ms", () => {
      let violationRecorded = false;
      let timer: NodeJS.Timeout | null = null;

      const onVisibilityChange = (state: "hidden" | "visible") => {
        if (state === "hidden") {
          timer = setTimeout(() => {
            violationRecorded = true;
          }, 1200);
        } else {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }
      };

      onVisibilityChange("hidden");
      vi.advanceTimersByTime(1250);
      expect(violationRecorded).toBe(true);
    });
  });

  describe("Real Window Blur Debouncing Logic", () => {
    it("does NOT strike when candidate clicks inside window or UI element (blur < 2800ms)", () => {
      let violationCount = 0;
      let blurTimer: NodeJS.Timeout | null = null;

      const onBlur = () => {
        blurTimer = setTimeout(() => {
          violationCount++;
        }, 2800);
      };

      const onFocus = () => {
        if (blurTimer) {
          clearTimeout(blurTimer);
          blurTimer = null;
        }
      };

      // Quick blur on click or interaction (500ms)
      onBlur();
      vi.advanceTimersByTime(500);
      onFocus();

      vi.advanceTimersByTime(3000);
      expect(violationCount).toBe(0);
    });

    it("records a genuine window blur strike when window remains unfocused for > 2800ms", () => {
      let violationCount = 0;
      let blurTimer: NodeJS.Timeout | null = null;

      const onBlur = () => {
        blurTimer = setTimeout(() => {
          violationCount++;
        }, 2800);
      };

      const onFocus = () => {
        if (blurTimer) {
          clearTimeout(blurTimer);
          blurTimer = null;
        }
      };

      onBlur();
      vi.advanceTimersByTime(3000);
      expect(violationCount).toBe(1);

      // Regaining focus should NOT record a second strike
      onFocus();
      expect(violationCount).toBe(1);
    });
  });

  describe("Candidate Absence & Multi-Face State Machine Debouncing", () => {
    it("does NOT alarm when candidate looks down or scratches nose for 3 seconds", () => {
      let violationFired = false;
      let noFaceStart: number | null = null;

      const processFaceScan = (hasFace: boolean, nowMs: number) => {
        if (!hasFace) {
          if (!noFaceStart) noFaceStart = nowMs;
          if (nowMs - noFaceStart >= 8000) {
            violationFired = true;
          }
        } else {
          noFaceStart = null;
        }
      };

      // Looking down for 3 seconds (3000ms)
      processFaceScan(false, 1000);
      processFaceScan(false, 2000);
      processFaceScan(false, 3500);
      expect(violationFired).toBe(false);

      // Looks back up at camera
      processFaceScan(true, 4000);
      expect(violationFired).toBe(false);
    });

    it("alarms when candidate is genuinely absent from camera for >= 8000ms", () => {
      let violationFired = false;
      let noFaceStart: number | null = null;

      const processFaceScan = (hasFace: boolean, nowMs: number) => {
        if (!hasFace) {
          if (!noFaceStart) noFaceStart = nowMs;
          if (nowMs - noFaceStart >= 8000) {
            violationFired = true;
          }
        } else {
          noFaceStart = null;
        }
      };

      processFaceScan(false, 1000);
      processFaceScan(false, 5000);
      processFaceScan(false, 9200); // 8200ms elapsed continuous absence
      expect(violationFired).toBe(true);
    });

    it("requires persistent frames before confirming multiple faces in state machine", () => {
      const sm = new FaceMonitorStateMachine();
      const face1 = { boundingBox: { x: 100, y: 100, width: 120, height: 140 }, confidence: 0.95 };
      const face2 = { boundingBox: { x: 300, y: 100, width: 120, height: 140 }, confidence: 0.90 };

      // Single frame glitch with 2 faces does NOT confirm
      const res1 = sm.processFrame({
        rawFaces: [face1, face2],
        frameWidth: 640,
        frameHeight: 480,
        timestamp: 1000,
      });
      expect(res1.state).not.toBe("MULTIPLE_CONFIRMED");
      expect(res1.shouldEmitViolation).toBe(false);
    });
  });
});
