import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('AI Proctor Backend REST APIs', () => {
  const app = createApp();
  const examId = '11111111-1111-1111-1111-111111111111';
  let createdAttemptId: string;
  let createdSessionId: string;
  let createdEventId: string;

  it('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /api/exams lists published examinations', async () => {
    const res = await request(app).get('/api/exams');
    expect(res.status).toBe(200);
    expect(res.body.exams).toBeDefined();
    expect(res.body.exams.length).toBeGreaterThan(0);
  });

  it('GET /api/exams/:examId/questions hides correct answers from students', async () => {
    const res = await request(app)
      .get(`/api/exams/${examId}/questions`)
      .set('x-user-role', 'student');

    expect(res.status).toBe(200);
    expect(res.body.questions.length).toBeGreaterThan(0);
    // Crucial security check: answers hidden
    expect(res.body.questions[0].correct_option_index).toBeUndefined();
    expect(res.body.questions[0].explanation).toBeUndefined();
  });

  it('POST /api/exams/:examId/attempts initializes student attempt and session', async () => {
    const res = await request(app)
      .post(`/api/exams/${examId}/attempts`)
      .set('x-user-id', '00000000-0000-0000-0000-000000000001')
      .set('x-user-role', 'student')
      .send({
        deviceInfo: { browser: 'Chrome', os: 'macOS' },
      });

    expect(res.status).toBe(201);
    expect(res.body.attempt).toBeDefined();
    expect(res.body.session).toBeDefined();
    createdAttemptId = res.body.attempt.id;
    createdSessionId = res.body.session.id;
  });

  it('POST /api/proctoring/events records proctoring event', async () => {
    const res = await request(app)
      .post('/api/proctoring/events')
      .set('x-user-id', '00000000-0000-0000-0000-000000000001')
      .send({
        sessionId: createdSessionId,
        eventType: 'HEAD_POSE_DEVIATION',
        durationMs: 5200,
        confidence: 0.89,
        severity: 'medium',
        metadata: { yaw: 28.5, pitch: 3.2 },
      });

    expect(res.status).toBe(201);
    expect(res.body.event).toBeDefined();
    expect(res.body.event.review_status).toBe('pending_review');
    createdEventId = res.body.event.id;
  });

  it('GET /api/proctoring/sessions/:sessionId/events returns timeline', async () => {
    const res = await request(app)
      .get(`/api/proctoring/sessions/${createdSessionId}/events`)
      .set('x-user-id', '00000000-0000-0000-0000-000000000001');

    expect(res.status).toBe(200);
    expect(res.body.events).toBeDefined();
    expect(res.body.events.length).toBeGreaterThan(0);
  });

  it('GET /api/admin/proctoring/overview blocks non-staff users', async () => {
    const res = await request(app)
      .get('/api/admin/proctoring/overview')
      .set('x-user-role', 'student');

    expect(res.status).toBe(403);
  });

  it('GET /api/admin/proctoring/overview succeeds for authorized invigilator', async () => {
    const res = await request(app)
      .get('/api/admin/proctoring/overview')
      .set('x-user-role', 'invigilator')
      .set('x-user-id', '00000000-0000-0000-0000-000000000003');

    expect(res.status).toBe(200);
    expect(res.body.kpis).toBeDefined();
    expect(res.body.eventTypeDistribution).toBeDefined();
  });

  it('PATCH /api/admin/events/:eventId/review allows invigilator human-in-the-loop decision', async () => {
    const res = await request(app)
      .patch(`/api/admin/events/${createdEventId}/review`)
      .set('x-user-role', 'invigilator')
      .set('x-user-id', '00000000-0000-0000-0000-000000000003')
      .send({
        status: 'reviewed_no_concern',
        note: 'Candidate momentarily adjusted seating position; no external materials observed.',
      });

    expect(res.status).toBe(200);
    expect(res.body.event.review_status).toBe('reviewed_no_concern');
  });

  it('POST /api/exams/:examId/submit completes exam attempt', async () => {
    const res = await request(app)
      .post(`/api/exams/${examId}/submit`)
      .set('x-user-id', '00000000-0000-0000-0000-000000000001')
      .send({
        attemptId: createdAttemptId,
      });

    expect(res.status).toBe(200);
    expect(res.body.attempt.status).toBe('submitted');
  });
});

