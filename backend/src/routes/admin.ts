import { Router, Response } from 'express';
import { db } from '../db/client.js';
import { AuthenticatedRequest, authenticate, requireRoles } from '../middlewares/auth.js';
import { ReviewStatus } from '../db/schema.js';

const router = Router();

// Require invigilator or administrator role for all admin routes
router.use(authenticate);
router.use(requireRoles(['invigilator', 'administrator']));

// GET /api/admin/overview or /api/admin/proctoring/overview - Dashboard KPIs and event analytics
router.get(['/overview', '/proctoring/overview'], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const overview = await db.getAdminOverview();
    res.json(overview);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/sessions - List candidate sessions with optional filters
router.get('/sessions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, examId, studentId } = req.query;
    let sessions = await db.getAllSessions();

    if (status) {
      sessions = sessions.filter((s) => s.status === status);
    }
    if (examId) {
      sessions = sessions.filter((s) => s.exam_id === examId);
    }
    if (studentId) {
      sessions = sessions.filter((s) => s.student_id === studentId);
    }

    res.json({ sessions, total: sessions.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/proctoring/events/:eventId/review - Reviewer decision and note submission
router.patch('/events/:eventId/review', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const { status, note } = req.body;
    const reviewerId = req.user?.id || '00000000-0000-0000-0000-000000000003';

    const validStatuses: ReviewStatus[] = [
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

// POST /api/admin/evidence/signed-url - Authorized short-lived evidence token
router.post('/evidence/signed-url', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId, sessionSnapshotKey } = req.body;

    // Emulate signed URL with a 15-minute token expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const mockSignedUrl = `https://supabase.internal/storage/v1/object/sign/proctoring-evidence/${sessionSnapshotKey || 'snapshot-placeholder.jpg'}?token=simulated_jwt_signature&expires=${expiresAt}`;

    await db.recordAuditLog(
      'ACCESS_EVIDENCE_SNAPSHOT',
      'proctoring_events',
      eventId,
      req.user?.id,
      { expiresAt }
    );

    res.json({
      signedUrl: mockSignedUrl,
      expiresAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/sessions/:sessionId/export - Export comprehensive session report
router.get('/sessions/:sessionId/export', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = await db.getProctoringSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Proctoring session not found' });
    }

    const events = await db.getEventsBySession(req.params.sessionId);
    const notes = await db.getNotesBySession(req.params.sessionId);
    const attempt = await db.getAttempt(session.attempt_id);

    const report = {
      reportId: `REP-${session.id.substring(0, 8).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.fullName,
      candidate: {
        id: session.student?.id,
        name: session.student?.full_name,
        email: session.student?.email,
        studentId: session.student?.student_id,
      },
      examination: {
        id: session.exam?.id,
        title: session.exam?.title,
        courseCode: session.exam?.course_code,
        durationMinutes: session.exam?.duration_minutes,
      },
      attempt: {
        id: attempt?.id,
        status: attempt?.status,
        score: attempt?.score,
        startedAt: attempt?.started_at,
        submittedAt: attempt?.submitted_at,
      },
      proctoringSummary: {
        sessionId: session.id,
        sessionStatus: session.status,
        totalEventsRecorded: events.length,
        highSeverityCount: events.filter((e) => e.severity === 'high').length,
        pendingReviewCount: events.filter((e) => e.review_status === 'pending_review').length,
        technicalIssuesCount: events.filter((e) => e.review_status === 'technical_issue').length,
      },
      eventsTimeline: events.map((e) => ({
        eventId: e.id,
        type: e.event_type,
        observedAt: e.observed_at,
        durationMs: e.duration_ms,
        severity: e.severity,
        confidence: e.confidence,
        reviewStatus: e.review_status,
        metadata: e.metadata,
      })),
      reviewerNotes: notes,
    };

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
