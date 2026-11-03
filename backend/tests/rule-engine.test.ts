import { describe, it, expect, beforeEach } from 'vitest';
import { ProctoringRuleEngine } from '../src/rule-engine/engine.js';
import { TelemetryFrame } from '../src/rule-engine/types.js';

describe('ProctoringRuleEngine', () => {
  let engine: ProctoringRuleEngine;
  const sessionId = 'test-session-123';

  beforeEach(() => {
    engine = new ProctoringRuleEngine({
      noFaceTimeoutMs: 15000,
      multiFaceMinConsecutive: 3,
      headPoseDeviationTimeoutMs: 5000,
    });
  });

  it('does not flag momentary face absence (< 15s)', () => {
    const baseTime = 1000000;
    // Frame at t=0s without face
    const frame1: TelemetryFrame = {
      sessionId,
      timestamp: baseTime,
      faceCount: 0,
      isFacePresent: false,
    };
    const res1 = engine.evaluateFrame(frame1);
    expect(res1.length).toBe(0);

    // Frame at t=7s without face
    const frame2: TelemetryFrame = {
      sessionId,
      timestamp: baseTime + 7000,
      faceCount: 0,
      isFacePresent: false,
    };
    const res2 = engine.evaluateFrame(frame2);
    expect(res2.length).toBe(0);

    // Frame at t=12s without face
    const frame2b: TelemetryFrame = {
      sessionId,
      timestamp: baseTime + 12000,
      faceCount: 0,
      isFacePresent: false,
    };
    const res2b = engine.evaluateFrame(frame2b);
    expect(res2b.length).toBe(0);

    // Face returns at t=14s
    const frame3: TelemetryFrame = {
      sessionId,
      timestamp: baseTime + 14000,
      faceCount: 1,
      isFacePresent: true,
    };
    const res3 = engine.evaluateFrame(frame3);
    expect(res3.length).toBe(0);
  });

  it('flags NO_FACE_DETECTED after sustained absence (>= 15s)', () => {
    const baseTime = 2000000;
    // Start absence
    engine.evaluateFrame({
      sessionId,
      timestamp: baseTime,
      faceCount: 0,
      isFacePresent: false,
    });

    // 15.5 seconds later
    const flagged = engine.evaluateFrame({
      sessionId,
      timestamp: baseTime + 15500,
      faceCount: 0,
      isFacePresent: false,
    });

    expect(flagged.length).toBe(1);
    expect(flagged[0].eventType).toBe('NO_FACE_DETECTED');
    expect(flagged[0].severity).toBe('high');
    expect(flagged[0].durationMs).toBe(15500);
    expect(flagged[0].studentWarningMessage).toContain('Suspicious Activity Detected: Face not detected for more than 15 seconds');
  });

  it('flags MULTIPLE_FACES_DETECTED only after required consecutive frames', () => {
    const baseTime = 3000000;

    // Frame 1 with 2 faces
    const r1 = engine.evaluateFrame({
      sessionId,
      timestamp: baseTime,
      faceCount: 2,
      isFacePresent: true,
    });
    expect(r1.length).toBe(0);

    // Frame 2 with 2 faces
    const r2 = engine.evaluateFrame({
      sessionId,
      timestamp: baseTime + 1500,
      faceCount: 2,
      isFacePresent: true,
    });
    expect(r2.length).toBe(0);

    // Frame 3 with 2 faces (meets consecutive threshold = 3)
    const r3 = engine.evaluateFrame({
      sessionId,
      timestamp: baseTime + 3000,
      faceCount: 2,
      isFacePresent: true,
    });
    expect(r3.length).toBe(1);
    expect(r3[0].eventType).toBe('MULTIPLE_FACES_DETECTED');
    expect(r3[0].metadata.detectedFaceCount).toBe(2);
  });

  it('flags HEAD_POSE_DEVIATION after sustained looking away (>= 5s)', () => {
    const baseTime = 4000000;
    const deviatedPose = {
      yaw: 35.0,
      pitch: 0.0,
      roll: 0.0,
      isDeviated: true,
      deviationDirection: 'right',
    };

    // t=0
    engine.evaluateFrame({
      sessionId,
      timestamp: baseTime,
      faceCount: 1,
      isFacePresent: true,
      headPose: deviatedPose,
    });

    // t=2s (not yet threshold)
    const r2 = engine.evaluateFrame({
      sessionId,
      timestamp: baseTime + 2000,
      faceCount: 1,
      isFacePresent: true,
      headPose: deviatedPose,
    });
    expect(r2.length).toBe(0);

    // t=5.2s (exceeds 5000ms threshold)
    const r3 = engine.evaluateFrame({
      sessionId,
      timestamp: baseTime + 5200,
      faceCount: 1,
      isFacePresent: true,
      headPose: deviatedPose,
    });
    expect(r3.length).toBe(1);
    expect(r3[0].eventType).toBe('HEAD_POSE_DEVIATION');
    expect(r3[0].severity).toBe('medium');
    expect(r3[0].metadata.deviationDirection).toBe('right');
  });

  it('flags BROWSER_FOCUS_LOST on window blur after 2 seconds', () => {
    const baseTime = 5000000;
    engine.evaluateFrame({
      sessionId,
      timestamp: baseTime,
      faceCount: 1,
      isFacePresent: true,
      browserFocus: { hasFocus: false, visibilityState: 'hidden' },
    });

    const flagged = engine.evaluateFrame({
      sessionId,
      timestamp: baseTime + 2500,
      faceCount: 1,
      isFacePresent: true,
      browserFocus: { hasFocus: false, visibilityState: 'hidden' },
    });

    expect(flagged.length).toBe(1);
    expect(flagged[0].eventType).toBe('BROWSER_FOCUS_LOST');
    expect(flagged[0].severity).toBe('high');
  });

  it('flags TAB_SWITCH_DETECTED on tab hidden', () => {
    const baseTime = 6000000;
    const flagged = engine.evaluateFrame({
      sessionId,
      timestamp: baseTime,
      faceCount: 1,
      isFacePresent: true,
      tabSwitch: { isHidden: true, durationMs: 0 },
    });

    expect(flagged.length).toBe(1);
    expect(flagged[0].eventType).toBe('TAB_SWITCH_DETECTED');
    expect(flagged[0].severity).toBe('high');
    expect(flagged[0].metadata.switchCount).toBe(1);
  });

  it('flags WINDOW_SWITCH_DETECTED on window blur to external app', () => {
    const baseTime = 7000000;
    const flagged = engine.evaluateFrame({
      sessionId,
      timestamp: baseTime,
      faceCount: 1,
      isFacePresent: true,
      windowSwitch: { isBlurred: true, durationMs: 1200 },
    });

    expect(flagged.length).toBe(1);
    expect(flagged[0].eventType).toBe('WINDOW_SWITCH_DETECTED');
    expect(flagged[0].severity).toBe('high');
    expect(flagged[0].metadata.switchCount).toBe(1);
  });

  it('flags FUNCTION_KEY_PRESSED on restricted key (F12 DevTools)', () => {
    const baseTime = 8000000;
    const flagged = engine.evaluateFrame({
      sessionId,
      timestamp: baseTime,
      faceCount: 1,
      isFacePresent: true,
      functionKey: {
        key: 'F12',
        code: 'F12',
        purpose: 'Developer Tools / DOM Inspector',
      },
    });

    expect(flagged.length).toBe(1);
    expect(flagged[0].eventType).toBe('FUNCTION_KEY_PRESSED');
    expect(flagged[0].severity).toBe('high');
    expect(flagged[0].metadata.key).toBe('F12');
    expect(flagged[0].metadata.purpose).toContain('Developer Tools');
  });

  it('flags FULLSCREEN_EXITED on fullscreenExited: true', () => {
    const baseTime = 9000000;
    const flagged = engine.evaluateFrame({
      sessionId,
      timestamp: baseTime,
      faceCount: 1,
      isFacePresent: true,
      fullscreenExited: true,
    });

    expect(flagged.length).toBe(1);
    expect(flagged[0].eventType).toBe('FULLSCREEN_EXITED');
    expect(flagged[0].severity).toBe('high');
    expect(flagged[0].studentWarningMessage).toContain('Fullscreen mode is mandatory');
  });
});

