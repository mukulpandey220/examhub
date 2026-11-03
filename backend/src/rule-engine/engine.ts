import {
  RuleEngineConfig,
  DEFAULT_RULE_CONFIG,
  TelemetryFrame,
  SessionRuleState,
  FlaggedRuleEvent,
} from './types.js';
import { EventType } from '../db/schema.js';

export class ProctoringRuleEngine {
  private config: RuleEngineConfig;
  private sessionStates: Map<string, SessionRuleState> = new Map();

  constructor(config: Partial<RuleEngineConfig> = {}) {
    this.config = { ...DEFAULT_RULE_CONFIG, ...config };
  }

  private getOrCreateState(sessionId: string): SessionRuleState {
    let state = this.sessionStates.get(sessionId);
    if (!state) {
      state = {
        sessionId,
        absenceStartTime: null,
        absenceEventDispatched: false,
        consecutiveMultiFaceFrames: 0,
        lastMultiFaceDispatchedTime: null,
        poseDeviationStartTime: null,
        poseDeviationDispatched: false,
        focusLostStartTime: null,
        tabSwitchCount: 0,
        lastTabHiddenTime: null,
        windowSwitchCount: 0,
        lastWindowBlurTime: null,
        lastFunctionKeyTime: null,
        lastEmittedEventTypes: new Map(),
      };
      this.sessionStates.set(sessionId, state);
    }
    return state;
  }

  public resetSession(sessionId: string): void {
    this.sessionStates.delete(sessionId);
  }

  public evaluateFrame(frame: TelemetryFrame): FlaggedRuleEvent[] {
    const state = this.getOrCreateState(frame.sessionId);
    const flaggedEvents: FlaggedRuleEvent[] = [];
    const now = frame.timestamp || Date.now();

    // -------------------------------------------------------------
    // Rule 1: Face Absence & Duration Debounce (>= 15,000ms)
    // -------------------------------------------------------------
    if (frame.faceCount === 0 || !frame.isFacePresent) {
      if (state.absenceStartTime === null) {
        state.absenceStartTime = now;
      } else {
        const absenceDuration = now - state.absenceStartTime;
        if (absenceDuration >= this.config.noFaceTimeoutMs && !state.absenceEventDispatched) {
          state.absenceEventDispatched = true;
          state.lastEmittedEventTypes.set('NO_FACE_DETECTED', now);

          // Gracefully note if lighting was compromised
          const lightingCompromised = frame.lighting?.isCompromised ?? false;
          flaggedEvents.push({
            eventType: 'NO_FACE_DETECTED',
            severity: lightingCompromised ? 'medium' : 'high',
            confidence: lightingCompromised ? 0.75 : 0.94,
            durationMs: absenceDuration,
            metadata: {
              absenceDurationMs: absenceDuration,
              lightingStatus: frame.lighting?.status || 'unknown',
              lightingCompromised,
              reason: 'No face detected in video stream for more than 15 seconds.',
            },
            studentWarningMessage: '⚠️ Suspicious Activity Detected: Face not detected for more than 15 seconds. Please return to the camera view immediately.',
          });
        }
      }
    } else {
      // Face has returned
      state.absenceStartTime = null;
      state.absenceEventDispatched = false;
    }

    // -------------------------------------------------------------
    // Rule 2: Multiple Faces Detected (Consecutive frames filter)
    // -------------------------------------------------------------
    if (frame.faceCount > 1) {
      state.consecutiveMultiFaceFrames += 1;
      const lastEmitted = state.lastMultiFaceDispatchedTime || 0;
      const cooldownMs = 15000; // 15-second debounce between repeated alerts

      if (
        state.consecutiveMultiFaceFrames >= this.config.multiFaceMinConsecutive &&
        now - lastEmitted > cooldownMs
      ) {
        state.lastMultiFaceDispatchedTime = now;
        state.lastEmittedEventTypes.set('MULTIPLE_FACES_DETECTED', now);

        flaggedEvents.push({
          eventType: 'MULTIPLE_FACES_DETECTED',
          severity: 'high',
          confidence: 0.92,
          durationMs: state.consecutiveMultiFaceFrames * 1500,
          metadata: {
            detectedFaceCount: frame.faceCount,
            consecutiveFrames: state.consecutiveMultiFaceFrames,
            reason: 'Multiple individuals identified in examination area.',
          },
          studentWarningMessage: 'Multiple faces detected. Please ensure you are alone in your room.',
        });
      }
    } else {
      state.consecutiveMultiFaceFrames = 0;
    }

    // -------------------------------------------------------------
    // Rule 3: Head Pose & Gaze Sustained Deviation (>= 5,000ms)
    // -------------------------------------------------------------
    if (frame.headPose && frame.headPose.isDeviated) {
      if (state.poseDeviationStartTime === null) {
        state.poseDeviationStartTime = now;
      } else {
        const poseDuration = now - state.poseDeviationStartTime;
        if (poseDuration >= this.config.headPoseDeviationTimeoutMs && !state.poseDeviationDispatched) {
          state.poseDeviationDispatched = true;
          state.lastEmittedEventTypes.set('HEAD_POSE_DEVIATION', now);

          flaggedEvents.push({
            eventType: 'HEAD_POSE_DEVIATION',
            severity: 'medium',
            confidence: 0.86,
            durationMs: poseDuration,
            metadata: {
              yaw: frame.headPose.yaw,
              pitch: frame.headPose.pitch,
              roll: frame.headPose.roll,
              deviationDirection: frame.headPose.deviationDirection,
              sustainedDurationMs: poseDuration,
              reason: 'Candidate head orientation turned away from primary screen.',
            },
            studentWarningMessage: 'Please keep your gaze centered on the examination screen.',
          });
        }
      }
    } else {
      // Normal head pose resumed
      state.poseDeviationStartTime = null;
      state.poseDeviationDispatched = false;
    }

    // -------------------------------------------------------------
    // Rule 4: Suspicious Object / Phone Detection
    // -------------------------------------------------------------
    if (frame.objects && frame.objects.length > 0) {
      for (const obj of frame.objects) {
        if (obj.confidence >= this.config.objectConfidenceThreshold) {
          const lastObjEmitted = state.lastEmittedEventTypes.get('SUSPICIOUS_OBJECT_DETECTED') || 0;
          if (now - lastObjEmitted > 6000) {
            // 6s cooldown
            state.lastEmittedEventTypes.set('SUSPICIOUS_OBJECT_DETECTED', now);
            flaggedEvents.push({
              eventType: 'SUSPICIOUS_OBJECT_DETECTED',
              severity: 'high',
              confidence: obj.confidence,
              durationMs: 1500,
              metadata: {
                objectLabel: obj.label,
                confidence: obj.confidence,
                reason: `Unauthorized peripheral device (${obj.label}) identified in camera feed.`,
              },
              studentWarningMessage: `🚨 Suspicious Device Detected: ${obj.label} identified. Remove all phones and camera devices immediately.`,
            });
          }
        }
      }
    }

    // -------------------------------------------------------------
    // Rule 5: Browser Focus & Tab Visibility Changes (Aggregate)
    // -------------------------------------------------------------
    if (frame.browserFocus) {
      const isLost = !frame.browserFocus.hasFocus || frame.browserFocus.visibilityState === 'hidden';
      if (isLost) {
        if (state.focusLostStartTime === null) {
          state.focusLostStartTime = now;
        } else {
          const blurDuration = now - state.focusLostStartTime;
          const lastFocusEmitted = state.lastEmittedEventTypes.get('BROWSER_FOCUS_LOST') || 0;

          // Emit after 2 seconds of lost focus
          if (blurDuration >= 2000 && now - lastFocusEmitted > 10000) {
            state.lastEmittedEventTypes.set('BROWSER_FOCUS_LOST', now);
            flaggedEvents.push({
              eventType: 'BROWSER_FOCUS_LOST',
              severity: 'high',
              confidence: 1.0,
              durationMs: blurDuration,
              metadata: {
                visibilityState: frame.browserFocus.visibilityState,
                durationMs: blurDuration,
                reason: 'Candidate navigated away from the exam browser tab or window.',
              },
              studentWarningMessage: 'Exam window lost focus. Please return to the exam tab immediately.',
            });
          }
        }
      } else {
        state.focusLostStartTime = null;
      }
    }

    // -------------------------------------------------------------
    // Rule 6: Dedicated Tab Switch Detection
    // -------------------------------------------------------------
    if (frame.tabSwitch && frame.tabSwitch.isHidden) {
      state.tabSwitchCount += 1;
      state.lastEmittedEventTypes.set('TAB_SWITCH_DETECTED', now);
      flaggedEvents.push({
        eventType: 'TAB_SWITCH_DETECTED',
        severity: 'high',
        confidence: 1.0,
        durationMs: frame.tabSwitch.durationMs || 0,
        metadata: {
          switchCount: state.tabSwitchCount,
          durationAwayMs: frame.tabSwitch.durationMs || 0,
          reason: 'Candidate switched away from the active examination browser tab.',
        },
        studentWarningMessage: `⚠️ Tab Switch Detected: Switching tabs is recorded (Occurrence #${state.tabSwitchCount}).`,
      });
    }

    // -------------------------------------------------------------
    // Rule 7: Dedicated Window Switch Detection
    // -------------------------------------------------------------
    if (frame.windowSwitch && frame.windowSwitch.isBlurred) {
      state.windowSwitchCount += 1;
      state.lastEmittedEventTypes.set('WINDOW_SWITCH_DETECTED', now);
      flaggedEvents.push({
        eventType: 'WINDOW_SWITCH_DETECTED',
        severity: 'high',
        confidence: 1.0,
        durationMs: frame.windowSwitch.durationMs || 0,
        metadata: {
          switchCount: state.windowSwitchCount,
          durationAwayMs: frame.windowSwitch.durationMs || 0,
          reason: 'Candidate navigated away to another application or window.',
        },
        studentWarningMessage: `⚠️ Window Switch Detected: Focus lost from examination window (Occurrence #${state.windowSwitchCount}).`,
      });
    }

    // -------------------------------------------------------------
    // Rule 8: Fullscreen Exit Detection
    // -------------------------------------------------------------
    if (frame.fullscreenExited) {
      state.lastEmittedEventTypes.set('FULLSCREEN_EXITED', now);
      flaggedEvents.push({
        eventType: 'FULLSCREEN_EXITED',
        severity: 'high',
        confidence: 1.0,
        durationMs: 0,
        metadata: {
          reason: 'Candidate exited mandatory examination full screen mode.',
        },
        studentWarningMessage: '⚠️ Fullscreen mode is mandatory during the examination.',
      });
    }

    // -------------------------------------------------------------
    // Rule 9: Function Key & Prohibited Shortcut Detection
    // -------------------------------------------------------------
    if (frame.functionKey) {
      state.lastFunctionKeyTime = now;
      state.lastEmittedEventTypes.set('FUNCTION_KEY_PRESSED', now);
      flaggedEvents.push({
        eventType: 'FUNCTION_KEY_PRESSED',
        severity: 'high',
        confidence: 1.0,
        durationMs: 0,
        metadata: {
          key: frame.functionKey.key,
          code: frame.functionKey.code,
          purpose: frame.functionKey.purpose || 'Function / Inspection key',
          altKey: frame.functionKey.altKey ?? false,
          ctrlKey: frame.functionKey.ctrlKey ?? false,
          metaKey: frame.functionKey.metaKey ?? false,
          shiftKey: frame.functionKey.shiftKey ?? false,
          reason: `Restricted key ${frame.functionKey.key} was pressed during the examination.`,
        },
        studentWarningMessage: `⚠️ Restricted Key: ${frame.functionKey.key} (${frame.functionKey.purpose || 'Function key'}) is prohibited during the examination.`,
      });
    }

    // -------------------------------------------------------------
    // Rule 10: Hardware Camera Disconnection / Stream Interruption
    // -------------------------------------------------------------
    if (frame.cameraActive === false) {
      const lastCamEmitted = state.lastEmittedEventTypes.get('CAMERA_DISCONNECTED') || 0;
      if (now - lastCamEmitted > 15000) {
        state.lastEmittedEventTypes.set('CAMERA_DISCONNECTED', now);
        flaggedEvents.push({
          eventType: 'CAMERA_DISCONNECTED',
          severity: 'technical',
          confidence: 0.99,
          durationMs: 2000,
          metadata: {
            reason: 'Webcam media stream interrupted or hardware permission revoked.',
          },
          studentWarningMessage: 'Camera connection lost. Reconnecting video feed...',
        });
      }
    }

    // -------------------------------------------------------------
    // Rule 11: Active Browser Extension Detected
    // -------------------------------------------------------------
    if (frame.extensionDetected) {
      const lastExtEmitted = state.lastEmittedEventTypes.get('EXTENSION_DETECTED') || 0;
      if (now - lastExtEmitted > 6000) {
        state.lastEmittedEventTypes.set('EXTENSION_DETECTED', now);
        flaggedEvents.push({
          eventType: 'EXTENSION_DETECTED',
          severity: 'high',
          confidence: 1.0,
          durationMs: 0,
          metadata: {
            name: frame.extensionDetected.name,
            signature: frame.extensionDetected.signature,
            reason: `Active third-party Chrome extension (${frame.extensionDetected.name}) detected in DOM/context.`,
          },
          studentWarningMessage: `⚠️ Prohibited Browser Extension: "${frame.extensionDetected.name}" is active. Please turn off all extensions immediately.`,
        });
      }
    }

    // -------------------------------------------------------------
    // Rule 12: Screen Share Interruption / Termination
    // -------------------------------------------------------------
    if (frame.screenShareTerminated) {
      const lastScreenEmitted = state.lastEmittedEventTypes.get('SCREENSHARE_TERMINATED') || 0;
      if (now - lastScreenEmitted > 6000) {
        state.lastEmittedEventTypes.set('SCREENSHARE_TERMINATED', now);
        flaggedEvents.push({
          eventType: 'SCREENSHARE_TERMINATED',
          severity: 'high',
          confidence: 1.0,
          durationMs: 0,
          metadata: {
            reason: 'Mandatory entire screen sharing stream was stopped or closed by the candidate.',
          },
          studentWarningMessage: '🚨 Screen Sharing Terminated: Entire screen sharing is mandatory to monitor background processes. Please re-share screen immediately.',
        });
      }
    }

    // -------------------------------------------------------------
    // Rule 13: Virtual Device / Background Capture Software Detected
    // -------------------------------------------------------------
    if (frame.virtualDeviceDetected) {
      const lastVirtEmitted = state.lastEmittedEventTypes.get('VIRTUAL_DEVICE_DETECTED') || 0;
      if (now - lastVirtEmitted > 10000) {
        state.lastEmittedEventTypes.set('VIRTUAL_DEVICE_DETECTED', now);
        flaggedEvents.push({
          eventType: 'VIRTUAL_DEVICE_DETECTED',
          severity: 'high',
          confidence: 0.98,
          durationMs: 0,
          metadata: {
            deviceName: frame.virtualDeviceDetected.deviceName,
            kind: frame.virtualDeviceDetected.kind,
            reason: `Virtual camera, audio router, or background capture software (${frame.virtualDeviceDetected.deviceName}) was detected.`,
          },
          studentWarningMessage: `⚠️ Virtual Recording Device Detected: "${frame.virtualDeviceDetected.deviceName}". Close OBS, ManyCam, or virtual capture software.`,
        });
      }
    }

    return flaggedEvents;
  }
}

export const ruleEngine = new ProctoringRuleEngine();
