import { Router, Response } from 'express';
import { db } from '../db/client.js';
import { AuthenticatedRequest, authenticate } from '../middlewares/auth.js';
import { ruleEngine } from '../rule-engine/engine.js';
import { TelemetryFrame } from '../rule-engine/types.js';
import { aiClient } from '../modules/ai/aiClient.js';

const router = Router();

// POST /api/proctoring/sessions - Create new proctoring session
router.post('/sessions', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { attemptId, examId } = req.body;
    const studentId = req.user?.id || '00000000-0000-0000-0000-000000000001';

    if (!attemptId || !examId) {
      return res.status(400).json({ error: 'attemptId and examId are required' });
    }

    const session = await db.createProctoringSession(attemptId, examId, studentId, {
      userAgent: req.headers['user-agent'],
      clientIp: req.ip,
      webrtc: req.body.webrtcMetadata,
    });

    res.status(201).json({ session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/proctoring/sessions/:sessionId - Get proctoring session details
router.get('/sessions/:sessionId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = await db.getProctoringSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Proctoring session not found' });
    }

    // Security: Student cannot read another student's session
    if (session.student_id !== req.user?.id && req.user?.role === 'student') {
      return res.status(403).json({ error: 'Access denied to this proctoring session' });
    }

    res.json({ session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/proctoring/events - Ingest confirmed proctoring event
router.post('/events', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      sessionId,
      eventType,
      observedAt,
      durationMs,
      confidence,
      severity,
      modelVersion,
      metadata,
      evidenceSnapshotUrl,
    } = req.body;

    if (!sessionId || !eventType) {
      return res.status(400).json({ error: 'sessionId and eventType are required' });
    }

    const session = await db.getProctoringSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Proctoring session not found' });
    }

    const event = await db.recordProctoringEvent({
      session_id: sessionId,
      event_type: eventType,
      observed_at: observedAt || new Date().toISOString(),
      duration_ms: durationMs || 0,
      confidence: confidence ?? 0.9,
      severity: severity || 'medium',
      model_version: modelVersion || 'v1.2.0-mediapipe-hybrid',
      metadata: metadata || {},
      evidence_snapshot_url: evidenceSnapshotUrl,
      review_status: 'pending_review',
    });

    res.status(201).json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/proctoring/sessions/:sessionId/events - Chronological event timeline
router.get('/sessions/:sessionId/events', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = await db.getProctoringSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Proctoring session not found' });
    }

    if (session.student_id !== req.user?.id && req.user?.role === 'student') {
      return res.status(403).json({ error: 'Access denied to this session timeline' });
    }

    const events = await db.getEventsBySession(req.params.sessionId);
    res.json({ events, total: events.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/proctoring/telemetry/frame - Real-time telemetry ingestion and rule evaluation
router.post('/telemetry/frame', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const frame: TelemetryFrame = req.body;
    if (!frame || !frame.sessionId) {
      return res.status(400).json({ error: 'Frame payload with sessionId is required' });
    }

    await db.updateSessionHeartbeat(frame.sessionId);
    const flagged = ruleEngine.evaluateFrame(frame);
    const recordedEvents = [];

    for (const ev of flagged) {
      const saved = await db.recordProctoringEvent({
        session_id: frame.sessionId,
        event_type: ev.eventType,
        observed_at: new Date(frame.timestamp || Date.now()).toISOString(),
        duration_ms: ev.durationMs,
        confidence: ev.confidence,
        severity: ev.severity,
        model_version: 'v1.2.0-mediapipe-hybrid',
        metadata: ev.metadata,
        review_status: 'pending_review',
      });
      recordedEvents.push({ ...saved, warningMessage: ev.studentWarningMessage });
    }

    res.json({
      success: true,
      flaggedCount: flagged.length,
      events: recordedEvents,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/proctoring/events/:eventId/review - Reviewer decision and note submission
router.patch('/events/:eventId/review', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const { status, note } = req.body;
    const reviewerId = req.user?.id || '00000000-0000-0000-0000-000000000003';

    const validStatuses = [
      'pending_review',
      'reviewed_no_concern',
      'requires_follow_up',
      'technical_issue',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid review status. Allowed values: ${validStatuses.join(', ')}`,
      });
    }

    const updatedEvent = await db.updateEventReview(eventId, reviewerId, status, note);
    if (!updatedEvent) {
      return res.status(404).json({ error: 'Proctoring event not found' });
    }

    await db.recordAuditLog(
      'REVIEW_PROCTORING_EVENT',
      'proctoring_events',
      eventId,
      reviewerId,
      { decision: status, note }
    );

    res.json({
      event: updatedEvent,
      message: 'Review status and notes recorded successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/proctoring/analyze/frame - Proxy computer vision frame inference
router.post('/analyze/frame', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { image_base64, session_id } = req.body;
    if (!image_base64) {
      return res.status(400).json({ error: 'image_base64 is required' });
    }

    const aiRes = await aiClient.inferFrame(image_base64, session_id);
    res.json(aiRes);
  } catch (error: any) {
    res.status(502).json({
      error: error.message || 'AI vision service unavailable',
      fallback: true,
      face_count: 1,
      is_face_present: true,
      head_pose: { yaw: 0, pitch: 0, roll: 0, is_deviated: false },
      lighting: { mean_luminance: 120, status: 'adequate', is_compromised: false },
      objects: [],
    });
  }
});

// POST /api/proctoring/sessions/external - External website session creation
router.post('/sessions/external', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      candidateId,
      candidateName,
      candidateEmail,
      examTitle,
      externalExamId,
      webhookUrl,
      metadata,
    } = req.body;

    const result = await db.createExternalSession({
      candidateId,
      candidateName,
      candidateEmail,
      examTitle,
      externalExamId,
      webhookUrl,
      metadata,
    });

    const host = req.get('host') || 'localhost:3001';
    const protocol = req.protocol;

    res.status(201).json({
      success: true,
      sessionId: result.session.id,
      attemptId: result.attempt.id,
      examId: result.exam.id,
      candidate: {
        id: result.profile.id,
        name: result.profile.full_name,
        studentId: result.profile.student_id,
      },
      exam: {
        id: result.exam.id,
        title: result.exam.title,
      },
      embedCode: `<script src="${protocol}://${host}/proctor.js" data-session-id="${result.session.id}" data-exam-id="${result.exam.id}" data-backend-url="${protocol}://${host}"></script>`,
      widgetUrl: `${protocol}://${host}/session?sessionId=${result.session.id}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/proctoring/sessions/:sessionId/finish - Mark session completed
router.post('/sessions/:sessionId/finish', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await db.finishSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const events = await db.getEventsBySession(sessionId);
    res.json({
      success: true,
      message: 'Proctoring session concluded successfully.',
      session,
      totalEvents: events.length,
      highSeverityEvents: events.filter((e) => e.severity === 'high').length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/proctoring/sessions/:sessionId/summary - Get summary report
router.get('/sessions/:sessionId/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await db.getProctoringSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const events = await db.getEventsBySession(sessionId);
    const flagsByType: Record<string, number> = {};
    for (const ev of events) {
      flagsByType[ev.event_type] = (flagsByType[ev.event_type] || 0) + 1;
    }

    res.json({
      sessionId: session.id,
      status: session.status,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      totalViolations: events.length,
      flagsByType,
      recentEvents: events.slice(-10),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
