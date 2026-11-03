import { v4 as uuidv4 } from 'uuid';
import {
  Profile,
  Examination,
  ExamQuestion,
  ExamAttempt,
  ProctoringSession,
  ProctoringEvent,
  ReviewerNote,
  AuditLog,
  EventType,
  EventSeverity,
  ReviewStatus,
  SessionStatus,
  AttemptStatus,
} from './schema.js';

class DatabaseClient {
  private profiles: Map<string, Profile> = new Map();
  private examinations: Map<string, Examination> = new Map();
  private questions: Map<string, ExamQuestion> = new Map();
  private attempts: Map<string, ExamAttempt> = new Map();
  private sessions: Map<string, ProctoringSession> = new Map();
  private events: Map<string, ProctoringEvent> = new Map();
  private notes: Map<string, ReviewerNote> = new Map();
  private auditLogs: AuditLog[] = [];

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // 1. Profiles
    const student1: Profile = {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Alex Mercer',
      email: 'alex.mercer@university.edu',
      role: 'student',
      student_id: 'STU-2026-8911',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    };
    const student2: Profile = {
      id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Priya Sharma',
      email: 'priya.sharma@university.edu',
      role: 'student',
      student_id: 'STU-2026-9042',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    };
    const invigilator: Profile = {
      id: '00000000-0000-0000-0000-000000000003',
      full_name: 'Dr. Marcus Vance',
      email: 'marcus.vance@university.edu',
      role: 'invigilator',
      student_id: 'FAC-7710',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
      created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 60).toISOString(),
    };
    const admin: Profile = {
      id: '00000000-0000-0000-0000-000000000004',
      full_name: 'Sarah Connor',
      email: 'sarah.connor@university.edu',
      role: 'administrator',
      student_id: 'ADM-1001',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 90).toISOString(),
    };

    [student1, student2, invigilator, admin].forEach((p) => this.profiles.set(p.id, p));

    // 2. Examination
    const examId = '11111111-1111-1111-1111-111111111111';
    const exam: Examination = {
      id: examId,
      title: 'CS-402: Distributed Systems & Machine Learning Governance',
      description:
        'Official end-of-semester proctored examination covering distributed consensus, fault tolerance, ethical AI transparency, and real-time inference architectures.',
      course_code: 'CS-402',
      duration_minutes: 45,
      status: 'published',
      total_marks: 100,
      passing_marks: 50,
      config: {
        require_webcam: true,
        require_microphone: false,
        allow_tab_switch: false,
        max_tab_switches: 3,
        no_face_timeout_sec: 15,
        multi_face_confidence_threshold: 0.65,
        head_pose_yaw_threshold_deg: 25,
        head_pose_pitch_threshold_deg: 20,
        enable_phone_detection: true,
        frame_sample_rate_sec: 1.5,
      },
      created_by: admin.id,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    };
    this.examinations.set(exam.id, exam);

    // 3. Exam Questions
    const questionsList: ExamQuestion[] = [
      {
        id: '22222222-2222-2222-2222-222222220001',
        exam_id: examId,
        question_order: 1,
        question_type: 'multiple_choice',
        prompt:
          'Under the Raft consensus algorithm, which condition MUST be satisfied before a leader node commits a log entry from its current term?',
        options: [
          'The entry must be acknowledged by all follower nodes in the cluster.',
          'The entry must be replicated on a majority of nodes in the cluster.',
          'A new leader election cycle must be scheduled.',
          'The state machine must discard all uncommitted historical logs.',
        ],
        correct_option_index: 1,
        marks: 10,
        explanation: 'In Raft, a leader commits an entry from its current term once replicated on a quorum.',
        created_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-2222-2222-222222220002',
        exam_id: examId,
        question_order: 2,
        question_type: 'multiple_choice',
        prompt:
          'In distributed system design, what does the CAP theorem state regarding network partitions (P)?',
        options: [
          'A system can easily guarantee both Strong Consistency (C) and High Availability (A) simultaneously during a partition.',
          'Network partitions can be eliminated entirely using optical fiber links.',
          'When a network partition occurs, the system must choose between Consistency (yielding errors/timeouts) and Availability (returning stale data).',
          'Partitions only impact relational database transactions, not key-value stores.',
        ],
        correct_option_index: 2,
        marks: 10,
        explanation: 'CAP theorem proves that when a partition occurs, an architecture trades Consistency or Availability.',
        created_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-2222-2222-222222220003',
        exam_id: examId,
        question_order: 3,
        question_type: 'multiple_choice',
        prompt:
          'Which computer vision technique is standardly employed to estimate head pose (yaw, pitch, roll) from 2D facial landmark coordinates without depth sensor hardware?',
        options: [
          'Bresenhams line rasterization algorithm',
          'Perspective-n-Point (PnP) using Levenberg-Marquardt optimization against a canonical 3D facial model',
          'Fast Fourier Transform (FFT) across luminance gradients',
          'Direct pixel color histogram matching',
        ],
        correct_option_index: 1,
        marks: 10,
        explanation: 'cv2.solvePnP matches 2D landmark coordinates to a 3D canonical model to determine rotation vectors.',
        created_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-2222-2222-222222220004',
        exam_id: examId,
        question_order: 4,
        question_type: 'multiple_choice',
        prompt:
          'From an AI ethics and algorithmic fairness perspective, why is an automated cheating disqualification model considered unacceptable for online examinations?',
        options: [
          'Cheating detection algorithms always cost too much GPU computing power to run.',
          'False positives from lighting fluctuations, motor disabilities, neurodivergence, or camera artifacts can unjustly penalize students without due process.',
          'Students should be allowed to browse the web freely during all exams.',
          'Machine learning models cannot process video frames in real time.',
        ],
        correct_option_index: 1,
        marks: 10,
        explanation: 'Ethical proctoring systems preserve human agency; AI flags objective anomalies for human review.',
        created_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-2222-2222-222222220005',
        exam_id: examId,
        question_order: 5,
        question_type: 'multiple_choice',
        prompt:
          'Which HTTP/WebSocket architecture pattern provides the optimal trade-off for continuous proctoring telemetry transmission between client and backend?',
        options: [
          'Opening a brand new TCP connection for every single video frame sent.',
          'Persistent WebSocket / Socket.IO connection for lightweight telemetry metadata combined with client-side throttled frame dispatch.',
          'Storing all video on the student device and uploading a 20GB file at the end of the semester.',
          'Polling HTTP GET requests every 50 milliseconds.',
        ],
        correct_option_index: 1,
        marks: 10,
        explanation: 'Persistent WebSockets provide low-overhead bidirectional signaling for telemetry, heartbeats, and live review status.',
        created_at: new Date().toISOString(),
      },
    ];
    questionsList.forEach((q) => this.questions.set(q.id, q));

    // 4. Sample Attempt
    const attemptId = '33333333-3333-3333-3333-333333333331';
    const attempt: ExamAttempt = {
      id: attemptId,
      exam_id: examId,
      student_id: student1.id,
      status: 'in_progress',
      started_at: new Date(Date.now() - 15 * 60000).toISOString(),
      answers: {
        '22222222-2222-2222-2222-222222220001': 1,
        '22222222-2222-2222-2222-222222220002': 2,
      },
      device_info: {
        browser: 'Chrome 122',
        os: 'macOS',
        screen: '1920x1080',
        camera: 'FaceTime HD Camera',
      },
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60000).toISOString(),
    };
    this.attempts.set(attempt.id, attempt);

    // 5. Sample Proctoring Session
    const sessionId = '44444444-4444-4444-4444-444444444441';
    const session: ProctoringSession = {
      id: sessionId,
      attempt_id: attemptId,
      exam_id: examId,
      student_id: student1.id,
      status: 'active',
      client_ip: '192.168.1.104',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      heartbeat_at: new Date().toISOString(),
      started_at: new Date(Date.now() - 15 * 60000).toISOString(),
      total_events_count: 4,
      high_severity_events_count: 1,
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.sessions.set(session.id, session);

    // 6. Sample Proctoring Events
    const eventsList: ProctoringEvent[] = [
      {
        id: '55555555-5555-5555-5555-555555550001',
        session_id: sessionId,
        event_type: 'HEAD_POSE_DEVIATION',
        observed_at: new Date(Date.now() - 12 * 60000).toISOString(),
        duration_ms: 6200,
        confidence: 0.88,
        severity: 'medium',
        model_version: 'v1.0.0-mediapipe-pose',
        metadata: { yaw_deg: 32.4, pitch_deg: 4.1, threshold_yaw: 25, direction: 'right' },
        review_status: 'pending_review',
        created_at: new Date(Date.now() - 12 * 60000).toISOString(),
      },
      {
        id: '55555555-5555-5555-5555-555555550002',
        session_id: sessionId,
        event_type: 'BROWSER_FOCUS_LOST',
        observed_at: new Date(Date.now() - 8 * 60000).toISOString(),
        duration_ms: 4500,
        confidence: 1.0,
        severity: 'high',
        model_version: 'v1.0.0-dom-visibility',
        metadata: { trigger: 'visibilitychange', visibilityState: 'hidden', duration_sec: 4.5 },
        review_status: 'requires_follow_up',
        created_at: new Date(Date.now() - 8 * 60000).toISOString(),
      },
      {
        id: '55555555-5555-5555-5555-555555550003',
        session_id: sessionId,
        event_type: 'NO_FACE_DETECTED',
        observed_at: new Date(Date.now() - 4 * 60000).toISOString(),
        duration_ms: 11500,
        confidence: 0.94,
        severity: 'high',
        model_version: 'v1.0.0-mediapipe-pose',
        metadata: { mean_luminance: 112.5, lighting_status: 'adequate', absence_duration_ms: 11500 },
        review_status: 'pending_review',
        created_at: new Date(Date.now() - 4 * 60000).toISOString(),
      },
      {
        id: '55555555-5555-5555-5555-555555550004',
        session_id: sessionId,
        event_type: 'CAMERA_DISCONNECTED',
        observed_at: new Date(Date.now() - 2 * 60000).toISOString(),
        duration_ms: 3100,
        confidence: 0.99,
        severity: 'technical',
        model_version: 'v1.0.0-hardware-telemetry',
        metadata: { error_code: 'TrackEnded', message: 'Webcam stream momentarily interrupted' },
        review_status: 'technical_issue',
        created_at: new Date(Date.now() - 2 * 60000).toISOString(),
      },
    ];
    eventsList.forEach((e) => this.events.set(e.id, e));

    // 7. Sample Reviewer Note
    const note: ReviewerNote = {
      id: '66666666-6666-6666-6666-666666660001',
      session_id: sessionId,
      event_id: '55555555-5555-5555-5555-555555550004',
      reviewer_id: invigilator.id,
      note: 'Camera feed dropped for 3.1s due to browser permission re-negotiation. Verified student remained active.',
      decision: 'technical_issue',
      created_at: new Date(Date.now() - 1 * 60000).toISOString(),
    };
    this.notes.set(note.id, note);
  }

  // --- Profiles ---
  async getProfile(id: string): Promise<Profile | null> {
    return this.profiles.get(id) || null;
  }

  async getAllProfiles(): Promise<Profile[]> {
    return Array.from(this.profiles.values());
  }

  // --- Examinations ---
  async getExaminations(): Promise<Examination[]> {
    return Array.from(this.examinations.values());
  }

  async getExaminationById(id: string): Promise<Examination | null> {
    return this.examinations.get(id) || null;
  }

  async getExamQuestions(examId: string, includeAnswers = false): Promise<ExamQuestion[]> {
    const list = Array.from(this.questions.values())
      .filter((q) => q.exam_id === examId)
      .sort((a, b) => a.question_order - b.question_order);

    if (includeAnswers) return list;
    return list.map((q) => {
      const { correct_option_index, explanation, ...sanitized } = q;
      return sanitized as ExamQuestion;
    });
  }

  // --- Exam Attempts ---
  async createAttempt(
    examId: string,
    studentId: string,
    deviceInfo?: Record<string, any>
  ): Promise<ExamAttempt> {
    // Check if open attempt exists
    const existing = Array.from(this.attempts.values()).find(
      (a) => a.exam_id === examId && a.student_id === studentId && a.status === 'in_progress'
    );
    if (existing) return existing;

    const newAttempt: ExamAttempt = {
      id: uuidv4(),
      exam_id: examId,
      student_id: studentId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      answers: {},
      device_info: deviceInfo || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.attempts.set(newAttempt.id, newAttempt);
    return newAttempt;
  }

  async getAttempt(id: string): Promise<ExamAttempt | null> {
    return this.attempts.get(id) || null;
  }

  async updateAttemptAnswers(
    attemptId: string,
    answers: Record<string, any>
  ): Promise<ExamAttempt | null> {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) return null;
    attempt.answers = { ...attempt.answers, ...answers };
    attempt.updated_at = new Date().toISOString();
    return attempt;
  }

  async submitAttempt(attemptId: string): Promise<ExamAttempt | null> {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) return null;

    // Calculate score
    const questions = Array.from(this.questions.values()).filter(
      (q) => q.exam_id === attempt.exam_id
    );
    let totalScore = 0;
    for (const q of questions) {
      const studentAnswer = attempt.answers[q.id];
      if (studentAnswer !== undefined && studentAnswer === q.correct_option_index) {
        totalScore += q.marks;
      }
    }

    attempt.status = 'submitted';
    attempt.submitted_at = new Date().toISOString();
    attempt.score = totalScore;
    attempt.updated_at = new Date().toISOString();

    // Mark corresponding session as completed
    const session = Array.from(this.sessions.values()).find((s) => s.attempt_id === attemptId);
    if (session) {
      session.status = 'completed';
      session.ended_at = new Date().toISOString();
      session.updated_at = new Date().toISOString();
    }

    return attempt;
  }

  // --- Proctoring Sessions ---
  async createProctoringSession(
    attemptId: string,
    examId: string,
    studentId: string,
    metadata?: { clientIp?: string; userAgent?: string; webrtc?: Record<string, any> }
  ): Promise<ProctoringSession> {
    // Return existing active session if available
    const existing = Array.from(this.sessions.values()).find(
      (s) => s.attempt_id === attemptId && s.status === 'active'
    );
    if (existing) {
      existing.heartbeat_at = new Date().toISOString();
      return existing;
    }

    const session: ProctoringSession = {
      id: uuidv4(),
      attempt_id: attemptId,
      exam_id: examId,
      student_id: studentId,
      status: 'active',
      client_ip: metadata?.clientIp,
      user_agent: metadata?.userAgent,
      webrtc_metadata: metadata?.webrtc || {},
      heartbeat_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      total_events_count: 0,
      high_severity_events_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async getProctoringSession(sessionId: string): Promise<ProctoringSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    const student = this.profiles.get(session.student_id);
    const exam = this.examinations.get(session.exam_id);
    return { ...session, student, exam };
  }

  async getAllSessions(): Promise<ProctoringSession[]> {
    return Array.from(this.sessions.values()).map((session) => ({
      ...session,
      student: this.profiles.get(session.student_id),
      exam: this.examinations.get(session.exam_id),
    }));
  }

  async updateSessionHeartbeat(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.heartbeat_at = new Date().toISOString();
    session.updated_at = new Date().toISOString();
    return true;
  }

  // --- Proctoring Events ---
  async recordProctoringEvent(eventData: Omit<ProctoringEvent, 'id' | 'created_at'>): Promise<ProctoringEvent> {
    const event: ProctoringEvent = {
      ...eventData,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    this.events.set(event.id, event);

    // Increment session counters
    const session = this.sessions.get(event.session_id);
    if (session) {
      session.total_events_count += 1;
      if (event.severity === 'high') {
        session.high_severity_events_count += 1;
      }
      session.updated_at = new Date().toISOString();
    }

    return event;
  }

  async getEventsBySession(sessionId: string): Promise<ProctoringEvent[]> {
    return Array.from(this.events.values())
      .filter((e) => e.session_id === sessionId)
      .sort((a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime());
  }

  async getAllEvents(): Promise<ProctoringEvent[]> {
    return Array.from(this.events.values()).sort(
      (a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime()
    );
  }

  async updateEventReview(
    eventId: string,
    reviewerId: string,
    status: ReviewStatus,
    note?: string
  ): Promise<ProctoringEvent | null> {
    const event = this.events.get(eventId);
    if (!event) return null;

    event.review_status = status;
    event.reviewer_id = reviewerId;
    event.reviewed_at = new Date().toISOString();

    if (note) {
      const reviewNote: ReviewerNote = {
        id: uuidv4(),
        session_id: event.session_id,
        event_id: event.id,
        reviewer_id: reviewerId,
        note,
        decision: status,
        created_at: new Date().toISOString(),
      };
      this.notes.set(reviewNote.id, reviewNote);
    }

    return event;
  }

  // --- Reviewer Notes ---
  async getNotesBySession(sessionId: string): Promise<ReviewerNote[]> {
    return Array.from(this.notes.values())
      .filter((n) => n.session_id === sessionId)
      .map((n) => ({
        ...n,
        reviewer: this.profiles.get(n.reviewer_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // --- Admin Overview KPI Aggregations ---
  async getAdminOverview() {
    const totalExaminations = this.examinations.size;
    const allSessions = Array.from(this.sessions.values());
    const activeSessions = allSessions.filter((s) => s.status === 'active').length;
    const completedSessions = allSessions.filter((s) => s.status === 'completed').length;
    const interruptedSessions = allSessions.filter((s) => s.status === 'interrupted').length;

    const allEvents = Array.from(this.events.values());
    const eventsAwaitingReview = allEvents.filter((e) => e.review_status === 'pending_review').length;
    const highSeverityCount = allEvents.filter((e) => e.severity === 'high').length;

    // Distribution by event type
    const eventTypeDistribution: Record<string, number> = {};
    allEvents.forEach((e) => {
      eventTypeDistribution[e.event_type] = (eventTypeDistribution[e.event_type] || 0) + 1;
    });

    // Distribution by review status
    const reviewStatusDistribution: Record<string, number> = {};
    allEvents.forEach((e) => {
      reviewStatusDistribution[e.review_status] = (reviewStatusDistribution[e.review_status] || 0) + 1;
    });

    return {
      kpis: {
        totalExaminations,
        totalSessions: allSessions.length,
        activeSessions,
        completedSessions,
        interruptedSessions,
        eventsAwaitingReview,
        highSeverityCount,
      },
      eventTypeDistribution,
      reviewStatusDistribution,
      recentSessions: await this.getAllSessions(),
      recentEvents: allEvents.slice(0, 20),
    };
  }

  // --- Audit Logs ---
  async recordAuditLog(
    action: string,
    resourceType: string,
    resourceId?: string,
    actorId?: string,
    details?: Record<string, any>
  ): Promise<AuditLog> {
    const actor = actorId ? this.profiles.get(actorId) : undefined;
    const log: AuditLog = {
      id: uuidv4(),
      actor_id: actorId,
      actor_role: actor?.role,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    return log;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return this.auditLogs;
  }

  // --- External / Standalone Proctoring Session Creation ---
  async createExternalSession(params: {
    candidateId?: string;
    candidateName?: string;
    candidateEmail?: string;
    examTitle?: string;
    externalExamId?: string;
    webhookUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<{ session: ProctoringSession; attempt: ExamAttempt; exam: Examination; profile: Profile }> {
    const studentId = params.candidateId || uuidv4();
    let profile = this.profiles.get(studentId);
    if (!profile) {
      profile = {
        id: studentId,
        full_name: params.candidateName || 'External Candidate',
        email: params.candidateEmail || `${studentId}@external-exam.org`,
        role: 'student',
        student_id: params.candidateId || `EXT-${Date.now().toString().slice(-4)}`,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(params.candidateName || 'Candidate')}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.profiles.set(studentId, profile);
    }

    const examTitle = params.examTitle || 'External Proctoring Examination';
    let exam = Array.from(this.examinations.values()).find((e) => e.title === examTitle);
    if (!exam) {
      const newExamId = params.externalExamId || uuidv4();
      exam = {
        id: newExamId,
        title: examTitle,
        description: 'External proctored examination session.',
        course_code: 'EXT-PROCTOR',
        duration_minutes: 60,
        status: 'published',
        total_marks: 100,
        passing_marks: 50,
        config: {
          require_webcam: true,
          require_microphone: false,
          allow_tab_switch: false,
          max_tab_switches: 3,
          no_face_timeout_sec: 15,
          multi_face_confidence_threshold: 0.65,
          head_pose_yaw_threshold_deg: 25,
          head_pose_pitch_threshold_deg: 20,
          enable_phone_detection: true,
          frame_sample_rate_sec: 1.5,
        },
        created_by: '00000000-0000-0000-0000-000000000004',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.examinations.set(exam.id, exam);
    }

    const attempt = await this.createAttempt(exam.id, profile.id, params.metadata);
    const session = await this.createProctoringSession(attempt.id, exam.id, profile.id, {
      webrtc: { webhookUrl: params.webhookUrl, ...params.metadata },
    });

    return { session, attempt, exam, profile };
  }

  async finishSession(sessionId: string): Promise<ProctoringSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.status = 'completed';
    session.ended_at = new Date().toISOString();

    const attempt = this.attempts.get(session.attempt_id);
    if (attempt) {
      attempt.status = 'submitted';
      attempt.submitted_at = new Date().toISOString();
    }
    return session;
  }
}

export const db = new DatabaseClient();

