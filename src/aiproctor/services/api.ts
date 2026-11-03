import {
  Examination,
  ExamQuestion,
  ExamAttempt,
  ProctoringSession,
  ProctoringEvent,
  AdminOverview,
  AIFrameResponse,
  ReviewStatus,
} from '../types/index.js';

const API_BASE = '/api';
const AI_BASE = '/ai';

export const api = {
  // Examinations
  async getExaminations(): Promise<Examination[]> {
    const res = await fetch(`${API_BASE}/exams`);
    const data = await res.json();
    return data.exams || [];
  },

  async getExamination(id: string): Promise<Examination> {
    const res = await fetch(`${API_BASE}/exams/${id}`);
    const data = await res.json();
    return data.exam;
  },

  async getExamQuestions(examId: string): Promise<ExamQuestion[]> {
    const res = await fetch(`${API_BASE}/exams/${examId}/questions`);
    const data = await res.json();
    return data.questions || [];
  },

  async startAttempt(
    examId: string,
    deviceInfo?: Record<string, any>
  ): Promise<{ attempt: ExamAttempt; session: ProctoringSession }> {
    const res = await fetch(`${API_BASE}/exams/${examId}/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceInfo }),
    });
    return res.json();
  },

  async autosaveAnswers(
    examId: string,
    attemptId: string,
    answers: Record<string, any>
  ): Promise<void> {
    await fetch(`${API_BASE}/exams/${examId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId, answers }),
    });
  },

  async submitExam(
    examId: string,
    attemptId: string
  ): Promise<{ attempt: ExamAttempt; message: string }> {
    const res = await fetch(`${API_BASE}/exams/${examId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId }),
    });
    return res.json();
  },

  // Proctoring
  async getSession(sessionId: string): Promise<ProctoringSession> {
    const res = await fetch(`${API_BASE}/proctoring/sessions/${sessionId}`);
    const data = await res.json();
    return data.session;
  },

  async getSessionEvents(sessionId: string): Promise<ProctoringEvent[]> {
    const res = await fetch(`${API_BASE}/proctoring/sessions/${sessionId}/events`);
    const data = await res.json();
    return data.events || [];
  },

  // Direct AI Computer Vision Service
  async analyzeFrame(imageBase64: string, sessionId?: string): Promise<AIFrameResponse> {
    const res = await fetch(`${AI_BASE}/analyze/frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: imageBase64,
        session_id: sessionId,
        client_timestamp: Date.now() / 1000,
      }),
    });
    if (!res.ok) {
      throw new Error(`AI Service error: ${res.statusText}`);
    }
    return res.json();
  },

  // Admin & Invigilator Operations
  async getAdminOverview(): Promise<AdminOverview> {
    const res = await fetch(`${API_BASE}/admin/proctoring/overview`, {
      headers: { 'x-user-role': 'invigilator' },
    });
    return res.json();
  },

  async getAdminSessions(filter?: { status?: string; examId?: string }): Promise<ProctoringSession[]> {
    const params = new URLSearchParams(filter as any);
    const res = await fetch(`${API_BASE}/admin/sessions?${params.toString()}`, {
      headers: { 'x-user-role': 'invigilator' },
    });
    const data = await res.json();
    return data.sessions || [];
  },

  async reviewEvent(
    eventId: string,
    status: ReviewStatus,
    note?: string
  ): Promise<{ event: ProctoringEvent; message: string }> {
    const res = await fetch(`${API_BASE}/admin/events/${eventId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'invigilator',
      },
      body: JSON.stringify({ status, note }),
    });
    return res.json();
  },

  async exportSessionReport(sessionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/sessions/${sessionId}/export`, {
      headers: { 'x-user-role': 'invigilator' },
    });
    return res.json();
  },
};

