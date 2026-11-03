import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from '../db/client.js';
import { ruleEngine } from '../rule-engine/engine.js';
import { TelemetryFrame } from '../rule-engine/types.js';

export function initializeSocketGateway(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    // 1. Join room
    socket.on('join:session', async (data: { sessionId: string; examId: string; role?: string }) => {
      const { sessionId, examId, role = 'student' } = data;
      socket.join(`session:${sessionId}`);
      socket.join(`exam:${examId}`);

      if (role === 'invigilator' || role === 'administrator') {
        socket.join('admin:room');
      }

      await db.updateSessionHeartbeat(sessionId);
    });

    // 2. Client Telemetry stream
    socket.on('client:telemetry', async (frame: TelemetryFrame) => {
      if (!frame || !frame.sessionId) return;

      // Update session heartbeat in DB
      await db.updateSessionHeartbeat(frame.sessionId);

      // Evaluate frame through the rule engine
      const flaggedEvents = ruleEngine.evaluateFrame(frame);

      for (const flagged of flaggedEvents) {
        // Record event in DB
        const savedEvent = await db.recordProctoringEvent({
          session_id: frame.sessionId,
          event_type: flagged.eventType,
          observed_at: new Date(frame.timestamp || Date.now()).toISOString(),
          duration_ms: flagged.durationMs,
          confidence: flagged.confidence,
          severity: flagged.severity,
          model_version: 'v1.2.0-mediapipe-hybrid',
          metadata: flagged.metadata,
          review_status: 'pending_review',
        });

        // Broadcast to admin dashboard
        io.to('admin:room').emit('admin:event_flagged', {
          sessionId: frame.sessionId,
          event: savedEvent,
        });

        // Send non-punitive guidance warning to student
        if (flagged.studentWarningMessage) {
          socket.emit('student:warning', {
            eventType: flagged.eventType,
            message: flagged.studentWarningMessage,
            severity: flagged.severity,
            timestamp: Date.now(),
          });
        }
      }
    });

    // 3. Browser Focus Lost Signal (Aggregate)
    socket.on('client:focus_change', async (data: { sessionId: string; hasFocus: boolean; visibilityState: string }) => {
      const { sessionId, hasFocus, visibilityState } = data;
      const frame: TelemetryFrame = {
        sessionId,
        timestamp: Date.now(),
        faceCount: 1,
        isFacePresent: true,
        browserFocus: { hasFocus, visibilityState: visibilityState as any },
      };

      const flagged = ruleEngine.evaluateFrame(frame);
      for (const ev of flagged) {
        const saved = await db.recordProctoringEvent({
          session_id: sessionId,
          event_type: ev.eventType,
          observed_at: new Date().toISOString(),
          duration_ms: ev.durationMs,
          confidence: ev.confidence,
          severity: ev.severity,
          model_version: 'v1.0.0-dom-focus',
          metadata: ev.metadata,
          review_status: 'pending_review',
        });

        io.to('admin:room').emit('admin:event_flagged', { sessionId, event: saved });
        socket.emit('student:warning', {
          eventType: ev.eventType,
          message: ev.studentWarningMessage,
          severity: ev.severity,
          timestamp: Date.now(),
        });
      }
    });

    // 4. Dedicated Tab Switch Signal
    socket.on('client:tab_switch', async (data: { sessionId: string; status: 'hidden' | 'visible'; durationMs?: number }) => {
      const { sessionId, status, durationMs = 0 } = data;
      if (!sessionId) return;

      const frame: TelemetryFrame = {
        sessionId,
        timestamp: Date.now(),
        faceCount: 1,
        isFacePresent: true,
        tabSwitch: { isHidden: status === 'hidden', durationMs },
      };

      const flagged = ruleEngine.evaluateFrame(frame);
      for (const ev of flagged) {
        const saved = await db.recordProctoringEvent({
          session_id: sessionId,
          event_type: ev.eventType,
          observed_at: new Date().toISOString(),
          duration_ms: ev.durationMs,
          confidence: ev.confidence,
          severity: ev.severity,
          model_version: 'v1.0.0-tab-tracker',
          metadata: ev.metadata,
          review_status: 'pending_review',
        });

        io.to('admin:room').emit('admin:event_flagged', { sessionId, event: saved });
        socket.emit('student:warning', {
          eventType: ev.eventType,
          message: ev.studentWarningMessage,
          severity: ev.severity,
          timestamp: Date.now(),
        });
      }
    });

    // 5. Dedicated Window Switch Signal
    socket.on('client:window_switch', async (data: { sessionId: string; hasFocus: boolean; durationMs?: number }) => {
      const { sessionId, hasFocus, durationMs = 0 } = data;
      if (!sessionId) return;

      const frame: TelemetryFrame = {
        sessionId,
        timestamp: Date.now(),
        faceCount: 1,
        isFacePresent: true,
        windowSwitch: { isBlurred: !hasFocus, durationMs },
      };

      const flagged = ruleEngine.evaluateFrame(frame);
      for (const ev of flagged) {
        const saved = await db.recordProctoringEvent({
          session_id: sessionId,
          event_type: ev.eventType,
          observed_at: new Date().toISOString(),
          duration_ms: ev.durationMs,
          confidence: ev.confidence,
          severity: ev.severity,
          model_version: 'v1.0.0-window-tracker',
          metadata: ev.metadata,
          review_status: 'pending_review',
        });

        io.to('admin:room').emit('admin:event_flagged', { sessionId, event: saved });
        socket.emit('student:warning', {
          eventType: ev.eventType,
          message: ev.studentWarningMessage,
          severity: ev.severity,
          timestamp: Date.now(),
        });
      }
    });

    // 6. Dedicated Fullscreen Exit Signal
    socket.on('client:fullscreen_exit', async (data: { sessionId: string; count: number }) => {
      const { sessionId, count } = data;
      if (!sessionId) return;

      const saved = await db.recordProctoringEvent({
        session_id: sessionId,
        event_type: 'FULLSCREEN_EXITED',
        observed_at: new Date().toISOString(),
        duration_ms: 0,
        confidence: 1.0,
        severity: 'high',
        model_version: 'v1.0.0-fullscreen-guard',
        metadata: {
          exitCount: count,
          reason: 'Candidate exited mandatory examination full screen mode.',
        },
        review_status: 'pending_review',
      });

      io.to('admin:room').emit('admin:event_flagged', { sessionId, event: saved });
      socket.emit('student:warning', {
        eventType: 'FULLSCREEN_EXITED',
        message: `⚠️ Fullscreen Exited: Fullscreen is mandatory (Exit #${count}). Please restore fullscreen.`,
        severity: 'high',
        timestamp: Date.now(),
      });
    });

    // 7. Dedicated Function Key & Inspection Shortcut Signal
    socket.on('client:function_key', async (data: {
      sessionId: string;
      key: string;
      code: string;
      purpose?: string;
      altKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
      shiftKey?: boolean;
    }) => {
      const { sessionId, key, code, purpose, altKey, ctrlKey, metaKey, shiftKey } = data;
      if (!sessionId) return;

      const frame: TelemetryFrame = {
        sessionId,
        timestamp: Date.now(),
        faceCount: 1,
        isFacePresent: true,
        functionKey: { key, code, purpose, altKey, ctrlKey, metaKey, shiftKey },
      };

      const flagged = ruleEngine.evaluateFrame(frame);
      for (const ev of flagged) {
        const saved = await db.recordProctoringEvent({
          session_id: sessionId,
          event_type: ev.eventType,
          observed_at: new Date().toISOString(),
          duration_ms: ev.durationMs,
          confidence: ev.confidence,
          severity: ev.severity,
          model_version: 'v1.0.0-keyboard-guard',
          metadata: ev.metadata,
          review_status: 'pending_review',
        });

        io.to('admin:room').emit('admin:event_flagged', { sessionId, event: saved });
        socket.emit('student:warning', {
          eventType: ev.eventType,
          message: ev.studentWarningMessage,
          severity: ev.severity,
          timestamp: Date.now(),
        });
      }
    });

    // 7. Hardware Camera Interruption Signal
    socket.on('client:camera_status', async (data: { sessionId: string; active: boolean; error?: string }) => {
      const { sessionId, active, error } = data;
      const frame: TelemetryFrame = {
        sessionId,
        timestamp: Date.now(),
        faceCount: active ? 1 : 0,
        isFacePresent: active,
        cameraActive: active,
      };

      const flagged = ruleEngine.evaluateFrame(frame);
      for (const ev of flagged) {
        const saved = await db.recordProctoringEvent({
          session_id: sessionId,
          event_type: ev.eventType,
          observed_at: new Date().toISOString(),
          duration_ms: ev.durationMs,
          confidence: ev.confidence,
          severity: ev.severity,
          model_version: 'v1.0.0-hardware-telemetry',
          metadata: { ...ev.metadata, hardwareError: error },
          review_status: 'technical_issue',
        });

        io.to('admin:room').emit('admin:event_flagged', { sessionId, event: saved });
      }
    });

    // 8. Extension Detected Signal
    socket.on('client:extension_detected', async (data: { sessionId: string; name: string; signature: string }) => {
      const { sessionId, name, signature } = data;
      if (!sessionId) return;

      const frame: TelemetryFrame = {
        sessionId,
        timestamp: Date.now(),
        faceCount: 1,
        isFacePresent: true,
        extensionDetected: { name, signature },
      };

      const flagged = ruleEngine.evaluateFrame(frame);
      for (const ev of flagged) {
        const saved = await db.recordProctoringEvent({
          session_id: sessionId,
          event_type: ev.eventType,
          observed_at: new Date().toISOString(),
          duration_ms: ev.durationMs,
          confidence: ev.confidence,
          severity: ev.severity,
          model_version: 'v1.0.0-extension-guard',
          metadata: ev.metadata,
          review_status: 'pending_review',
        });

        io.to('admin:room').emit('admin:event_flagged', { sessionId, event: saved });
        socket.emit('student:warning', {
          eventType: ev.eventType,
          message: ev.studentWarningMessage,
          severity: ev.severity,
          timestamp: Date.now(),
        });
      }
    });

    // 9. Screen Share Status Signal
    socket.on('client:screenshare_status', async (data: { sessionId: string; active: boolean; displaySurface?: string; reason?: string }) => {
      const { sessionId, active, displaySurface, reason } = data;
      if (!sessionId) return;

      if (!active || (displaySurface && displaySurface !== 'monitor')) {
        const frame: TelemetryFrame = {
          sessionId,
          timestamp: Date.now(),
          faceCount: 1,
          isFacePresent: true,
          screenShareTerminated: true,
        };

        const flagged = ruleEngine.evaluateFrame(frame);
        for (const ev of flagged) {
          const saved = await db.recordProctoringEvent({
            session_id: sessionId,
            event_type: ev.eventType,
            observed_at: new Date().toISOString(),
            duration_ms: ev.durationMs,
            confidence: ev.confidence,
            severity: ev.severity,
            model_version: 'v1.0.0-screenshare-guard',
            metadata: { ...ev.metadata, displaySurface, reason },
            review_status: 'pending_review',
          });

          io.to('admin:room').emit('admin:event_flagged', { sessionId, event: saved });
          socket.emit('student:warning', {
            eventType: ev.eventType,
            message: ev.studentWarningMessage,
            severity: ev.severity,
            timestamp: Date.now(),
          });
        }
      }
    });

    // 10. Virtual Device Signal
    socket.on('client:virtual_device', async (data: { sessionId: string; deviceName: string; kind: string }) => {
      const { sessionId, deviceName, kind } = data;
      if (!sessionId) return;

      const frame: TelemetryFrame = {
        sessionId,
        timestamp: Date.now(),
        faceCount: 1,
        isFacePresent: true,
        virtualDeviceDetected: { deviceName, kind },
      };

      const flagged = ruleEngine.evaluateFrame(frame);
      for (const ev of flagged) {
        const saved = await db.recordProctoringEvent({
          session_id: sessionId,
          event_type: ev.eventType,
          observed_at: new Date().toISOString(),
          duration_ms: ev.durationMs,
          confidence: ev.confidence,
          severity: ev.severity,
          model_version: 'v1.0.0-virtual-device-guard',
          metadata: ev.metadata,
          review_status: 'pending_review',
        });

        io.to('admin:room').emit('admin:event_flagged', { sessionId, event: saved });
        socket.emit('student:warning', {
          eventType: ev.eventType,
          message: ev.studentWarningMessage,
          severity: ev.severity,
          timestamp: Date.now(),
        });
      }
    });

    // 11. Screen Sharing Log & Snapshot Capture
    socket.on('client:screenshare_log', async (data: {
      sessionId: string;
      displaySurface: string;
      trackLabel?: string;
      resolution?: string;
      snapshotBase64?: string;
      isSuspiciousSurface?: boolean;
    }) => {
      const { sessionId, displaySurface, trackLabel, resolution, snapshotBase64, isSuspiciousSurface } = data;
      if (!sessionId) return;

      const event = await db.recordProctoringEvent({
        session_id: sessionId,
        event_type: isSuspiciousSurface ? 'SCREENSHARE_TERMINATED' : 'SCREEN_LOG_CAPTURED',
        observed_at: new Date().toISOString(),
        duration_ms: 0,
        confidence: 0.95,
        severity: isSuspiciousSurface ? 'medium' : 'low',
        model_version: 'v1.0.0-screenshare-logger',
        metadata: {
          displaySurface,
          trackLabel,
          resolution,
          isSuspiciousSurface,
          note: isSuspiciousSurface ? `Candidate shared a single ${displaySurface}` : 'Screen share log captured',
        },
        evidence_snapshot_url: snapshotBase64,
        review_status: 'pending_review',
      });

      io.to('admin:room').emit('admin:event_flagged', { sessionId, event });
    });

    socket.on('disconnect', () => {
      // Disconnected client
    });
  });
}
