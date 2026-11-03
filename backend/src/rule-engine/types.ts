import { EventType, EventSeverity } from '../db/schema.js';

export interface RuleEngineConfig {
  noFaceTimeoutMs: number;
  multiFaceMinConsecutive: number;
  headPoseDeviationTimeoutMs: number;
  maxAllowedYawDeg: number;
  maxAllowedPitchDeg: number;
  objectConfidenceThreshold: number;
}

export const DEFAULT_RULE_CONFIG: RuleEngineConfig = {
  noFaceTimeoutMs: 15000,
  multiFaceMinConsecutive: 3,
  headPoseDeviationTimeoutMs: 5000,
  maxAllowedYawDeg: 25,
  maxAllowedPitchDeg: 20,
  objectConfidenceThreshold: 0.35,
};

export interface TelemetryFrame {
  sessionId: string;
  timestamp: number;
  faceCount: number;
  isFacePresent: boolean;
  faces?: Array<{
    box: { x: number; y: number; width: number; height: number };
    confidence: number;
  }>;
  headPose?: {
    yaw: number;
    pitch: number;
    roll: number;
    isDeviated: boolean;
    deviationDirection?: string;
  };
  lighting?: {
    meanLuminance: number;
    status: string;
    isCompromised: boolean;
  };
  objects?: Array<{
    label: string;
    confidence: number;
  }>;
  browserFocus?: {
    hasFocus: boolean;
    visibilityState: 'visible' | 'hidden';
  };
  tabSwitch?: {
    isHidden: boolean;
    durationMs?: number;
  };
  windowSwitch?: {
    isBlurred: boolean;
    durationMs?: number;
  };
  fullscreenExited?: boolean;
  functionKey?: {
    key: string;
    code: string;
    purpose?: string;
    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
  };
  cameraActive?: boolean;
  extensionDetected?: {
    name: string;
    signature: string;
  };
  screenShareTerminated?: boolean;
  virtualDeviceDetected?: {
    deviceName: string;
    kind: string;
  };
}

export interface SessionRuleState {
  sessionId: string;
  // Face absence tracking
  absenceStartTime: number | null;
  absenceEventDispatched: boolean;

  // Multiple faces tracking
  consecutiveMultiFaceFrames: number;
  lastMultiFaceDispatchedTime: number | null;

  // Head pose tracking
  poseDeviationStartTime: number | null;
  poseDeviationDispatched: boolean;

  // Browser focus tracking
  focusLostStartTime: number | null;

  // Tab & Window switch tracking
  tabSwitchCount: number;
  lastTabHiddenTime: number | null;
  windowSwitchCount: number;
  lastWindowBlurTime: number | null;
  lastFunctionKeyTime: number | null;

  // Snapshot / deduplication
  lastEmittedEventTypes: Map<EventType, number>;
}

export interface FlaggedRuleEvent {
  eventType: EventType;
  severity: EventSeverity;
  confidence: number;
  durationMs: number;
  metadata: Record<string, any>;
  studentWarningMessage?: string;
}
