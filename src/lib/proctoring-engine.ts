import { db } from "@/lib/db";
import { 
  ProctoringPolicy, 
  ProctoringSession, 
  ProctoringEvent, 
  ProctoringReview, 
  ProctoringSessionStatus, 
  ProctoringEventType 
} from "@/types";

// Default Production Proctoring Policy (Nyeras Nxtmove Section 24)
export const DEFAULT_PROCTORING_POLICY: ProctoringPolicy = {
  version: "2026.1",
  requireCamera: true,
  requireMicrophone: true,
  requireFullscreen: true,
  tabSwitchPolicy: "warn", // "warn" with 3-strike threshold or "disqualify_immediate"
  maxStrikes: 3,
  faceDetectionEnabled: true,
  faceAbsentGraceSeconds: 15,
  headPoseDetectionEnabled: true,
  headDeviationMaxSeconds: 20,
  audioMonitoringEnabled: true,
  audioAnomalyThresholdDb: 70,
  networkReconnectGraceSeconds: 60,
  multiFaceMinConfidence: 0.70,
  multiFaceConfirmFrames: 5,
  multiFaceConfirmWindowMs: 2500,
  multiFaceRequiredRatio: 0.70,
  multiFaceCooldownMs: 10000,
};

// In-memory / persisted proctoring state store
class ProctoringEngineService {
  private sessions: Map<string, ProctoringSession> = new Map();
  private events: ProctoringEvent[] = [];
  private reviews: ProctoringReview[] = [];
  private processedEventIds: Set<string> = new Set();

  /**
   * 1. Initialize or resume a Proctoring Session
   */
  public initSession(params: {
    examId: string;
    attemptId: string;
    studentId: string;
    policy?: Partial<ProctoringPolicy>;
  }): ProctoringSession {
    const existing = this.sessions.get(params.attemptId);
    if (existing) {
      existing.lastHeartbeatAt = new Date().toISOString();
      return existing;
    }

    const session: ProctoringSession = {
      id: `psess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      examId: params.examId,
      attemptId: params.attemptId,
      studentId: params.studentId,
      policyVersion: params.policy?.version || DEFAULT_PROCTORING_POLICY.version,
      status: "CLEAR",
      strikeCount: 0,
      startedAt: new Date().toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      cameraActive: false,
      microphoneActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(params.attemptId, session);
    return session;
  }

  /**
   * 2. Process an incoming proctoring event with deduplication & state machine
   */
  public processEvent(rawEvent: {
    eventId: string;
    attemptId: string;
    examId: string;
    studentId: string;
    eventType: ProctoringEventType;
    severity?: "info" | "warning" | "strike" | "critical";
    occurredAt: string;
    durationMs?: number;
    confidence?: number;
    metadata?: Record<string, any>;
    policyVersion?: string;
  }): { event: ProctoringEvent; session: ProctoringSession; actionTaken: string } {
    // A. Idempotency Check
    if (this.processedEventIds.has(rawEvent.eventId)) {
      const existingEv = this.events.find(e => e.eventId === rawEvent.eventId);
      const sess = this.sessions.get(rawEvent.attemptId) || this.initSession(rawEvent);
      return {
        event: existingEv || (rawEvent as any),
        session: sess,
        actionTaken: "idempotent_duplicate_ignored",
      };
    }

    const session = this.sessions.get(rawEvent.attemptId) || this.initSession(rawEvent);
    this.processedEventIds.add(rawEvent.eventId);

    const now = new Date().toISOString();
    let actionTaken = "logged";
    let isStrike = false;

    // B. State Machine & Violation Evaluation
    switch (rawEvent.eventType) {
      case "tab_switch":
        isStrike = true;
        session.strikeCount += 1;
        actionTaken = `tab_switch_strike_${session.strikeCount}_of_3`;
        if (DEFAULT_PROCTORING_POLICY.tabSwitchPolicy === "disqualify_immediate" || session.strikeCount >= DEFAULT_PROCTORING_POLICY.maxStrikes) {
          session.status = "DISQUALIFIED";
          session.disqualificationReason = "Exceeded maximum allowed security infractions (3 tab switch strikes: No Tab Switch rule violated)";
          actionTaken = "disqualified_max_strikes_reached";
        } else {
          session.status = "WARNING";
        }
        break;

      case "window_blur":
        isStrike = true;
        session.strikeCount += 1;
        actionTaken = `window_switch_strike_${session.strikeCount}_of_3`;
        if (session.strikeCount >= DEFAULT_PROCTORING_POLICY.maxStrikes) {
          session.status = "DISQUALIFIED";
          session.disqualificationReason = "No Window Switch rule violated: Window focus lost or external application invoked (3 strikes reached)";
          actionTaken = "disqualified_window_switch_reached";
        } else {
          session.status = "WARNING";
        }
        break;

      case "phone_detected":
        isStrike = true;
        session.strikeCount += 1;
        actionTaken = `phone_detected_strike_${session.strikeCount}_of_3`;
        if (session.strikeCount >= DEFAULT_PROCTORING_POLICY.maxStrikes) {
          session.status = "DISQUALIFIED";
          session.disqualificationReason = "Mobile phone detected in examination frame (exceeded 3 warnings)";
          actionTaken = "disqualified_phone_detected";
        } else {
          session.status = "WARNING";
        }
        break;

      case "multiple_faces":
        // Rule 13: Backend confidence validation - reject weak detections below minimum threshold
        const minConfidence = DEFAULT_PROCTORING_POLICY.multiFaceMinConfidence ?? 0.70;
        if (rawEvent.confidence !== undefined && rawEvent.confidence < minConfidence) {
          actionTaken = `rejected_low_confidence_multiple_faces (${(rawEvent.confidence * 100).toFixed(0)}% < ${(minConfidence * 100).toFixed(0)}%)`;
          break;
        }

        isStrike = true;
        session.strikeCount += 1;
        actionTaken = `dual_face_strike_${session.strikeCount}_of_3`;

        // Rule 14: Evidence-based progressive escalation
        if (session.strikeCount === 1) {
          session.status = "WARNING";
        } else if (session.strikeCount === 2) {
          session.status = "FLAGGED_FOR_REVIEW";
        } else if (session.strikeCount >= DEFAULT_PROCTORING_POLICY.maxStrikes) {
          session.status = "DISQUALIFIED";
          session.disqualificationReason = "Dual face presence confirmed by multi-frame persistence across 3 security strikes (Disqualified pending proctor audit)";
          actionTaken = "disqualified_dual_face_detected";
        }
        break;

      case "second_login_attempt":
        isStrike = true;
        session.strikeCount += 1;
        session.status = "DISQUALIFIED";
        session.disqualificationReason = "No Second Login rule violated: Concurrent login or secondary session attempted during active examination (1 time limit)";
        actionTaken = "disqualified_second_login_attempt";
        break;

      case "fullscreen_exit":
        isStrike = true;
        session.strikeCount += 1;
        actionTaken = `fullscreen_exit_strike_${session.strikeCount}`;
        if (session.strikeCount >= DEFAULT_PROCTORING_POLICY.maxStrikes) {
          session.status = "DISQUALIFIED";
          session.disqualificationReason = "Candidate persistently exited full-screen examination mode";
        } else {
          session.status = "WARNING";
        }
        break;

      case "face_absent":
        if ((rawEvent.durationMs || 0) > DEFAULT_PROCTORING_POLICY.faceAbsentGraceSeconds * 1000) {
          session.status = "FLAGGED_FOR_REVIEW";
          actionTaken = "flagged_for_review_face_absent";
        }
        break;

      case "head_deviation":
        if ((rawEvent.durationMs || 0) > DEFAULT_PROCTORING_POLICY.headDeviationMaxSeconds * 1000) {
          session.status = "WARNING";
          actionTaken = "warning_sustained_head_deviation";
        }
        break;

      case "audio_anomaly":
        if (rawEvent.confidence && rawEvent.confidence > 0.8) {
          session.status = "FLAGGED_FOR_REVIEW";
          actionTaken = "flagged_for_review_audio_anomaly";
        }
        break;

      case "device_disconnected":
        session.status = "WARNING";
        actionTaken = "device_disconnected_warning";
        break;

      case "device_reconnected":
        actionTaken = "device_reconnected";
        break;

      default:
        actionTaken = "audit_event_recorded";
    }

    session.updatedAt = now;
    session.lastHeartbeatAt = now;

    // C. Record Event in Append-Only Log
    const newEvent: ProctoringEvent = {
      id: `pevt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventId: rawEvent.eventId,
      sessionId: session.id,
      examId: rawEvent.examId,
      attemptId: rawEvent.attemptId,
      studentId: rawEvent.studentId,
      eventType: rawEvent.eventType,
      severity: isStrike ? "strike" : (rawEvent.severity || "warning"),
      occurredAt: rawEvent.occurredAt || now,
      receivedAt: now,
      durationMs: rawEvent.durationMs,
      confidence: rawEvent.confidence,
      metadata: rawEvent.metadata,
      policyVersion: rawEvent.policyVersion || DEFAULT_PROCTORING_POLICY.version,
      processingStatus: "processed",
    };

    this.events.push(newEvent);

    // If disqualified, mirror update to persistent Attempt
    if (session.status === "DISQUALIFIED") {
      const existingAttempt = db.getAttemptById(rawEvent.attemptId);
      if (existingAttempt && existingAttempt.status === "in_progress") {
        db.submitAttempt({
          attemptId: rawEvent.attemptId,
          answers: existingAttempt.answers,
          autoExpired: false,
          proctoring: {
            integrityScore: 0,
            totalViolations: session.strikeCount,
            tabSwitchViolations: session.strikeCount,
            fullscreenViolations: 0,
            blurViolations: 0,
            copyPasteViolations: 0,
            devtoolsViolations: 0,
            isDisqualified: true,
            disqualificationReason: session.disqualificationReason,
            cameraActive: session.cameraActive,
            microphoneActive: session.microphoneActive,
            violations: this.events
              .filter(e => e.attemptId === rawEvent.attemptId)
              .map(e => ({
                id: e.eventId,
                type: e.eventType as any,
                timestamp: e.occurredAt,
                details: `${e.eventType}: ${JSON.stringify(e.metadata || {})}`,
              })),
          },
        });
      }
    }

    return { event: newEvent, session, actionTaken };
  }

  /**
   * 3. Admin Dispute Resolution / Review Decision
   */
  public submitReview(params: {
    attemptId: string;
    reviewerId: string;
    decision: "cleared" | "upheld_warning" | "disqualified" | "reinstated";
    reason: string;
  }): ProctoringReview {
    const session = this.sessions.get(params.attemptId);
    const prevStatus = session?.status || "FLAGGED_FOR_REVIEW";
    let newStatus: ProctoringSessionStatus = prevStatus;

    if (params.decision === "cleared" || params.decision === "reinstated") {
      newStatus = "CLEAR";
      if (session) session.strikeCount = 0;
    } else if (params.decision === "disqualified") {
      newStatus = "DISQUALIFIED";
    }

    if (session) {
      session.status = newStatus;
      session.updatedAt = new Date().toISOString();
    }

    const review: ProctoringReview = {
      id: `prev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      attemptId: params.attemptId,
      reviewerId: params.reviewerId,
      decision: params.decision,
      reason: params.reason,
      reviewedAt: new Date().toISOString(),
      previousStatus: prevStatus,
      newStatus,
    };

    this.reviews.push(review);
    return review;
  }

  public getSession(attemptId: string): ProctoringSession | undefined {
    return this.sessions.get(attemptId);
  }

  public getEvents(attemptId: string): ProctoringEvent[] {
    return this.events.filter(e => e.attemptId === attemptId);
  }

  public getAllSessions(): ProctoringSession[] {
    return Array.from(this.sessions.values());
  }

  public getAllReviews(): ProctoringReview[] {
    return this.reviews;
  }
}

export const proctoringEngine = new ProctoringEngineService();
