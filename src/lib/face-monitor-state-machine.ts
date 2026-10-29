/**
 * Nyeras Nxtmove — Conservative Face Monitor State Machine & Temporal Confirmation Pipeline
 * Designed to eliminate false-positive "Multiple Faces Detected" alerts while reliably flagging
 * genuine multi-person presence.
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedFace {
  id?: string;
  boundingBox: BoundingBox;
  confidence: number;
  areaRatio?: number;
  isLandmarkOnly?: boolean;
}

export type FaceMonitorState =
  | "NO_FACE"
  | "ONE_FACE"
  | "POSSIBLE_MULTIPLE"
  | "MULTIPLE_CONFIRMED"
  | "UNCERTAIN";

export type ImageQualityStatus = "GOOD" | "LOW_LIGHT" | "GLARE" | "UNCERTAIN";

export interface FaceObservation {
  timestamp: number;
  rawFaces: DetectedFace[];
  reliableFaces: DetectedFace[];
  primaryConfidence: number;
  secondaryConfidence: number;
  imageQuality: ImageQualityStatus;
  state: FaceMonitorState;
}

export interface FaceMonitorConfig {
  MULTI_FACE_MIN_CONFIDENCE: number;      // Minimum confidence to treat a second face as genuine (default 0.70)
  MULTI_FACE_CONFIRM_FRAMES: number;      // Frames required in window (default 5)
  MULTI_FACE_CONFIRM_WINDOW_MS: number;   // Sliding window duration (default 2500ms)
  MULTI_FACE_REQUIRED_RATIO: number;      // Required ratio of multi-face frames in window (default 0.70)
  MULTI_FACE_COOLDOWN_MS: number;         // Minimum ms between confirmed alert emissions (default 10000ms)
  MIN_FACE_WIDTH_RATIO: number;           // Minimum face width relative to frame width (default 0.08)
  MIN_FACE_HEIGHT_RATIO: number;          // Minimum face height relative to frame height (default 0.08)
  MIN_FACE_AREA_RATIO: number;            // Minimum face area relative to frame area (default 0.008)
  RECOVERY_FRAMES_TO_CLEAR: number;       // Clean frames required to return to ONE_FACE (default 3)
}

export const DEFAULT_FACE_MONITOR_CONFIG: FaceMonitorConfig = {
  MULTI_FACE_MIN_CONFIDENCE: 0.70,
  MULTI_FACE_CONFIRM_FRAMES: 5,
  MULTI_FACE_CONFIRM_WINDOW_MS: 2500,
  MULTI_FACE_REQUIRED_RATIO: 0.70,
  MULTI_FACE_COOLDOWN_MS: 10000,
  MIN_FACE_WIDTH_RATIO: 0.08,
  MIN_FACE_HEIGHT_RATIO: 0.08,
  MIN_FACE_AREA_RATIO: 0.008,
  RECOVERY_FRAMES_TO_CLEAR: 2,
};

export interface TrackedFace {
  id: string;
  bbox: BoundingBox;
  confidence: number;
  firstSeenMs: number;
  lastSeenMs: number;
  seenFrameCount: number;
  missedFrameCount: number;
}

/**
 * Calculates Intersection-over-Union (IoU) between two bounding boxes
 */
export function calculateIoU(boxA: BoundingBox, boxB: BoundingBox): number {
  const xA = Math.max(boxA.x, boxB.x);
  const yA = Math.max(boxA.y, boxB.y);
  const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
  const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

  const interWidth = Math.max(0, xB - xA);
  const interHeight = Math.max(0, yB - yA);
  const interArea = interWidth * interHeight;

  const areaA = boxA.width * boxA.height;
  const areaB = boxB.width * boxB.height;
  const unionArea = areaA + areaB - interArea;

  if (unionArea <= 0) return 0;
  return interArea / unionArea;
}

/**
 * Spatial separation check: verifies that two bounding boxes are distinct physical entities
 * and not overlapping/split artifacts of the same face.
 */
export function areSpatiallySeparated(boxA: BoundingBox, boxB: BoundingBox): boolean {
  const iou = calculateIoU(boxA, boxB);
  // High overlap indicates the same face detected multiple times (e.g. multi-scale detections or glasses)
  if (iou > 0.25) return false;

  // Check centroid distance relative to average face width
  const centerAX = boxA.x + boxA.width / 2;
  const centerAY = boxA.y + boxA.height / 2;
  const centerBX = boxB.x + boxB.width / 2;
  const centerBY = boxB.y + boxB.height / 2;

  const dist = Math.hypot(centerAX - centerBX, centerAY - centerBY);
  const avgWidth = (boxA.width + boxB.width) / 2;

  // Centers must be separated by at least 60% of average face width
  return dist >= avgWidth * 0.6;
}

/**
 * Robust Face Tracker using IoU and centroid association
 */
export class FaceTracker {
  private tracks: Map<string, TrackedFace> = new Map();
  private nextTrackId = 1;

  public update(faces: DetectedFace[], timestamp: number): TrackedFace[] {
    const matchedTrackIds = new Set<string>();

    for (const face of faces) {
      let bestMatchId: string | null = null;
      let highestIoU = 0.15; // Minimum IoU threshold to associate

      for (const [id, track] of Array.from(this.tracks.entries())) {
        if (matchedTrackIds.has(id)) continue;
        const iou = calculateIoU(face.boundingBox, track.bbox);
        if (iou > highestIoU) {
          highestIoU = iou;
          bestMatchId = id;
        }
      }

      if (bestMatchId) {
        matchedTrackIds.add(bestMatchId);
        const track = this.tracks.get(bestMatchId)!;
        track.bbox = face.boundingBox;
        track.confidence = face.confidence;
        track.lastSeenMs = timestamp;
        track.seenFrameCount += 1;
        track.missedFrameCount = 0;
      } else {
        // Create new track
        const newId = `track-${this.nextTrackId++}`;
        matchedTrackIds.add(newId);
        this.tracks.set(newId, {
          id: newId,
          bbox: face.boundingBox,
          confidence: face.confidence,
          firstSeenMs: timestamp,
          lastSeenMs: timestamp,
          seenFrameCount: 1,
          missedFrameCount: 0,
        });
      }
    }

    // Prune tracks not seen in last 3000ms or missed for 4 consecutive cycles
    for (const [id, track] of Array.from(this.tracks.entries())) {
      if (!matchedTrackIds.has(id)) {
        track.missedFrameCount += 1;
        if (timestamp - track.lastSeenMs > 3000 || track.missedFrameCount > 4) {
          this.tracks.delete(id);
        }
      }
    }

    return Array.from(this.tracks.values());
  }

  public getActiveTracks(): TrackedFace[] {
    return Array.from(this.tracks.values());
  }

  public reset(): void {
    this.tracks.clear();
    this.nextTrackId = 1;
  }
}

/**
 * Main FaceMonitorStateMachine
 * Processes frame observations, applies temporal confirmation, hysteresis, and throttling.
 */
export class FaceMonitorStateMachine {
  private config: FaceMonitorConfig;
  private tracker = new FaceTracker();
  private history: FaceObservation[] = [];
  private currentState: FaceMonitorState = "NO_FACE";
  private consecutiveClearFrames = 0;
  private lastAlertTimestamp = -Infinity;
  private multiFacePersistenceCount = 0;

  constructor(customConfig?: Partial<FaceMonitorConfig>) {
    this.config = { ...DEFAULT_FACE_MONITOR_CONFIG, ...customConfig };
  }

  /**
   * Filter raw face detections:
   * 1. Reject landmark-only detections.
   * 2. Filter out detections with small width/height/area relative to frame.
   * 3. Sort by confidence descending.
   */
  public filterFaces(rawFaces: DetectedFace[], frameWidth: number, frameHeight: number): DetectedFace[] {
    const frameArea = frameWidth * frameHeight;

    return rawFaces
      .filter((face) => {
        // Rule 7: Do not confuse facial landmarks with separate face instances
        if (face.isLandmarkOnly) return false;

        const { width, height } = face.boundingBox;
        const area = width * height;

        // Rule 5: Face-size filtering (reject distant background noise/posters)
        const widthRatio = width / frameWidth;
        const heightRatio = height / frameHeight;
        const areaRatio = area / frameArea;

        if (widthRatio < this.config.MIN_FACE_WIDTH_RATIO) return false;
        if (heightRatio < this.config.MIN_FACE_HEIGHT_RATIO) return false;
        if (areaRatio < this.config.MIN_FACE_AREA_RATIO) return false;

        return true;
      })
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Process a single video frame.
   * Takes raw detections, frame dimensions, timestamp, and optional image quality flag.
   */
  public processFrame(params: {
    rawFaces: DetectedFace[];
    frameWidth: number;
    frameHeight: number;
    timestamp?: number;
    imageQuality?: ImageQualityStatus;
  }): {
    state: FaceMonitorState;
    reliableFaceCount: number;
    primaryConfidence: number;
    secondaryConfidence: number;
    shouldEmitViolation: boolean;
    violationDetails?: string;
    diagnostics: {
      detectedFaces: number;
      reliableFaces: number;
      primaryConfidence: number;
      secondaryConfidence: number;
      trackedFaces: number;
      multiFacePersistence: number;
      faceMonitorState: FaceMonitorState;
      imageQuality: ImageQualityStatus;
      cooldownRemainingMs: number;
    };
  } {
    const timestamp = params.timestamp || Date.now();
    const imageQuality = params.imageQuality || "GOOD";

    // Rule 8: Poor camera quality (glare/low light) produces UNCERTAIN, not violations!
    if (imageQuality === "UNCERTAIN" || imageQuality === "LOW_LIGHT" || imageQuality === "GLARE") {
      this.currentState = "UNCERTAIN";
      return {
        state: "UNCERTAIN",
        reliableFaceCount: 0,
        primaryConfidence: 0,
        secondaryConfidence: 0,
        shouldEmitViolation: false,
        diagnostics: {
          detectedFaces: params.rawFaces.length,
          reliableFaces: 0,
          primaryConfidence: 0,
          secondaryConfidence: 0,
          trackedFaces: 0,
          multiFacePersistence: 0,
          faceMonitorState: "UNCERTAIN",
          imageQuality,
          cooldownRemainingMs: Math.max(0, this.config.MULTI_FACE_COOLDOWN_MS - (timestamp - this.lastAlertTimestamp)),
        },
      };
    }

    // 1. Filter out landmark and size outliers
    const validSizeFaces = this.filterFaces(params.rawFaces, params.frameWidth, params.frameHeight);

    // 2. Separate into primary and secondary candidates with spatial verification
    const verifiedFaces: DetectedFace[] = [];
    for (let i = 0; i < validSizeFaces.length; i++) {
      const face = validSizeFaces[i];
      if (verifiedFaces.length === 0) {
        verifiedFaces.push(face);
      } else {
        // Verify secondary face is spatially separated from all existing faces
        const isSeparatedFromAll = verifiedFaces.every((v) =>
          areSpatiallySeparated(face.boundingBox, v.boundingBox)
        );
        if (isSeparatedFromAll) {
          verifiedFaces.push(face);
        }
      }
    }

    // Update temporal face tracks
    const tracks = this.tracker.update(verifiedFaces, timestamp);

    // Filter by confidence: Primary face must meet basic detection;
    // Rule 4: Require the second face itself to have confidence >= MULTI_FACE_MIN_CONFIDENCE
    const primaryFace = verifiedFaces[0] || null;
    const secondaryFace = verifiedFaces[1] || null;

    const primaryConfidence = primaryFace ? primaryFace.confidence : 0;
    const secondaryConfidence = secondaryFace ? secondaryFace.confidence : 0;

    const isSecondaryStrong =
      secondaryFace !== null &&
      secondaryConfidence >= this.config.MULTI_FACE_MIN_CONFIDENCE &&
      primaryConfidence >= this.config.MULTI_FACE_MIN_CONFIDENCE;

    const reliableFaceCount = isSecondaryStrong ? 2 : primaryFace ? 1 : 0;

    // Record observation in sliding temporal window
    const currentObservation: FaceObservation = {
      timestamp,
      rawFaces: params.rawFaces,
      reliableFaces: verifiedFaces.slice(0, reliableFaceCount),
      primaryConfidence,
      secondaryConfidence,
      imageQuality,
      state: this.currentState,
    };

    this.history.push(currentObservation);

    // Prune history to sliding window
    const windowStart = timestamp - this.config.MULTI_FACE_CONFIRM_WINDOW_MS;
    this.history = this.history.filter((obs) => obs.timestamp >= windowStart);

    // 3. State Machine Transition Logic
    let shouldEmitViolation = false;
    let violationDetails: string | undefined;

    if (reliableFaceCount === 0) {
      this.consecutiveClearFrames = 0;
      this.multiFacePersistenceCount = 0;
      this.currentState = "NO_FACE";
    } else if (reliableFaceCount === 1) {
      // Hysteresis: Require consecutive clear frames before clearing multiple-face state
      this.consecutiveClearFrames += 1;
      this.multiFacePersistenceCount = Math.max(0, this.multiFacePersistenceCount - 1);

      if (this.consecutiveClearFrames >= this.config.RECOVERY_FRAMES_TO_CLEAR) {
        this.currentState = "ONE_FACE";
      } else if (this.currentState === "MULTIPLE_CONFIRMED" || this.currentState === "POSSIBLE_MULTIPLE") {
        // In recovery period
        this.currentState = "POSSIBLE_MULTIPLE";
      } else {
        this.currentState = "ONE_FACE";
      }
    } else if (reliableFaceCount >= 2) {
      this.consecutiveClearFrames = 0;
      this.multiFacePersistenceCount += 1;

      // Temporal confirmation calculation across sliding window
      const framesInWindow = this.history.length;
      const multiFaceFramesInWindow = this.history.filter(
        (obs) => obs.reliableFaces.length >= 2 && obs.secondaryConfidence >= this.config.MULTI_FACE_MIN_CONFIDENCE
      ).length;

      const multiFaceRatio = framesInWindow > 0 ? multiFaceFramesInWindow / framesInWindow : 0;

      // Rule 6: Verify secondary face track has established persistence
      const secondaryTracks = tracks.filter((t) => t.seenFrameCount >= 2);
      const hasStableSecondaryTrack = secondaryTracks.length >= 2;

      // Rule 3: Add temporal confirmation (frames >= CONFIRM_FRAMES AND ratio >= REQUIRED_RATIO)
      const meetsFrameCount = this.multiFacePersistenceCount >= this.config.MULTI_FACE_CONFIRM_FRAMES;
      const meetsRatio = multiFaceRatio >= this.config.MULTI_FACE_REQUIRED_RATIO;

      if (meetsFrameCount && meetsRatio && hasStableSecondaryTrack) {
        this.currentState = "MULTIPLE_CONFIRMED";

        // Rule 12: Throttled violation emission with cooldown
        const timeSinceLastAlert = timestamp - this.lastAlertTimestamp;
        if (timeSinceLastAlert >= this.config.MULTI_FACE_COOLDOWN_MS) {
          shouldEmitViolation = true;
          this.lastAlertTimestamp = timestamp;
          violationDetails = `Persistent dual face presence confirmed across ${this.config.MULTI_FACE_CONFIRM_WINDOW_MS}ms window (Primary: ${(primaryConfidence * 100).toFixed(0)}%, Secondary: ${(secondaryConfidence * 100).toFixed(0)}%).`;
        }
      } else {
        // Section 9 & 10: State is POSSIBLE_MULTIPLE -> Warning/No strike yet
        this.currentState = "POSSIBLE_MULTIPLE";
      }
    }

    currentObservation.state = this.currentState;

    const cooldownRemainingMs = Math.max(
      0,
      this.config.MULTI_FACE_COOLDOWN_MS - (timestamp - this.lastAlertTimestamp)
    );

    return {
      state: this.currentState,
      reliableFaceCount,
      primaryConfidence,
      secondaryConfidence,
      shouldEmitViolation,
      violationDetails,
      diagnostics: {
        detectedFaces: params.rawFaces.length,
        reliableFaces: reliableFaceCount,
        primaryConfidence,
        secondaryConfidence,
        trackedFaces: tracks.length,
        multiFacePersistence: this.multiFacePersistenceCount,
        faceMonitorState: this.currentState,
        imageQuality,
        cooldownRemainingMs,
      },
    };
  }

  public getCurrentState(): FaceMonitorState {
    return this.currentState;
  }

  public reset(): void {
    this.history = [];
    this.currentState = "NO_FACE";
    this.consecutiveClearFrames = 0;
    this.lastAlertTimestamp = -Infinity;
    this.multiFacePersistenceCount = 0;
    this.tracker.reset();
  }
}
