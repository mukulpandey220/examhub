import { Router, Response } from 'express';
import { db } from '../db/client.js';
import { AuthenticatedRequest, authenticate } from '../middlewares/auth.js';

const router = Router();

// GET /api/exams - List all published examinations
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const exams = await db.getExaminations();
    res.json({ exams });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/exams/:examId - Get examination details
router.get('/:examId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const exam = await db.getExaminationById(req.params.examId);
    if (!exam) {
      return res.status(404).json({ error: 'Examination not found' });
    }
    res.json({ exam });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/exams/:examId/questions - Get questions for examination
router.get('/:examId/questions', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isStaff = req.user?.role === 'invigilator' || req.user?.role === 'administrator';
    const questions = await db.getExamQuestions(req.params.examId, isStaff);
    res.json({ questions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/exams/:examId/attempts - Start or resume examination attempt
router.post('/:examId/attempts', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    const { deviceInfo } = req.body;

    const exam = await db.getExaminationById(req.params.examId);
    if (!exam) {
      return res.status(404).json({ error: 'Examination not found' });
    }

    const attempt = await db.createAttempt(req.params.examId, studentId, deviceInfo);

    // Also initialize corresponding proctoring session
    const session = await db.createProctoringSession(
      attempt.id,
      exam.id,
      studentId,
      {
        userAgent: req.headers['user-agent'],
        clientIp: req.ip,
      }
    );

    await db.recordAuditLog(
      'START_EXAM_ATTEMPT',
      'exam_attempts',
      attempt.id,
      studentId,
      { examId: exam.id, sessionId: session.id }
    );

    res.status(201).json({ attempt, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/exams/:examId/answers - Autosave answer updates
router.patch('/:examId/answers', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { attemptId, answers } = req.body;
    if (!attemptId || !answers) {
      return res.status(400).json({ error: 'attemptId and answers are required' });
    }

    const attempt = await db.getAttempt(attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Security: ensure student can only update their own attempt
    if (attempt.student_id !== req.user?.id && req.user?.role === 'student') {
      return res.status(403).json({ error: 'Unauthorized to modify this attempt' });
    }

    const updated = await db.updateAttemptAnswers(attemptId, answers);
    res.json({ attempt: updated, message: 'Answers autosaved successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/exams/:examId/submit - Finalize and submit examination
router.post('/:examId/submit', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { attemptId } = req.body;
    if (!attemptId) {
      return res.status(400).json({ error: 'attemptId is required' });
    }

    const attempt = await db.getAttempt(attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    if (attempt.student_id !== req.user?.id && req.user?.role === 'student') {
      return res.status(403).json({ error: 'Unauthorized to submit this attempt' });
    }

    const finalizedAttempt = await db.submitAttempt(attemptId);

    await db.recordAuditLog(
      'SUBMIT_EXAM',
      'exam_attempts',
      attemptId,
      req.user?.id,
      { score: finalizedAttempt?.score }
    );

    res.json({
      attempt: finalizedAttempt,
      message: 'Examination submitted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

