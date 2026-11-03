-- =========================================================================
-- ExamHub (Nyeras Nxtmove) - Cloudflare D1 Migration: Initial Relational Schema
-- =========================================================================

PRAGMA foreign_keys = ON;

-- -------------------------------------------------------------------------
-- 1. USERS & ROLES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin', 'proctor', 'evaluator')),
  category TEXT,
  university TEXT,
  course_degree TEXT,
  branch TEXT,
  semester INTEGER,
  tokens INTEGER DEFAULT 0,
  onboarded INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- -------------------------------------------------------------------------
-- 2. EXAMINATIONS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain_slug TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  total_marks REAL NOT NULL,
  passing_marks REAL NOT NULL,
  negative_marking REAL DEFAULT 0.0,
  instructions TEXT,
  proctoring_enabled INTEGER DEFAULT 1,
  proctoring_mode TEXT DEFAULT 'standard',
  max_attempts INTEGER DEFAULT 1,
  fee_rupees REAL DEFAULT 0,
  token_fee INTEGER DEFAULT 0,
  mode TEXT DEFAULT 'timed' CHECK (mode IN ('timed', 'practice')),
  is_free_sample INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exams_slug ON exams(slug);
CREATE INDEX IF NOT EXISTS idx_exams_domain ON exams(domain_slug);
CREATE INDEX IF NOT EXISTS idx_exams_published ON exams(is_published);

-- -------------------------------------------------------------------------
-- 3. QUESTIONS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT,
  domain_slug TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'intermediate', 'hard')),
  question_type TEXT CHECK (question_type IN ('single_choice', 'multiple_choice', 'coding_problem')),
  question_text TEXT NOT NULL,
  options TEXT, -- JSON array of strings
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  marks REAL DEFAULT 1.0,
  negative_marks REAL DEFAULT 0.0,
  coding_test_cases TEXT, -- JSON string for coding problems
  review_status TEXT DEFAULT 'approved' CHECK (review_status IN ('draft', 'review_pending', 'approved', 'rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain_slug);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);

-- -------------------------------------------------------------------------
-- 4. EXAM ATTEMPTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_attempts (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'disqualified', 'abandoned')),
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  duration_seconds INTEGER DEFAULT 0,
  score REAL DEFAULT 0.0,
  total_marks REAL DEFAULT 0.0,
  percentage REAL DEFAULT 0.0,
  passed INTEGER DEFAULT 0,
  is_disqualified INTEGER DEFAULT 0,
  disqualification_reason TEXT,
  integrity_score REAL DEFAULT 100.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attempts_user ON exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON exam_attempts(status);

-- -------------------------------------------------------------------------
-- 5. STUDENT ANSWERS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  user_answer TEXT,
  is_correct INTEGER DEFAULT 0,
  marks_awarded REAL DEFAULT 0.0,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_answers_attempt ON student_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON student_answers(question_id);

-- -------------------------------------------------------------------------
-- 6. PROCTORING SESSIONS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proctoring_sessions (
  id TEXT PRIMARY KEY,
  attempt_id TEXT UNIQUE NOT NULL,
  exam_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  policy_version TEXT DEFAULT '2026.1',
  status TEXT DEFAULT 'CLEAR' CHECK (status IN ('CLEAR', 'WARNING', 'FLAGGED_FOR_REVIEW', 'DISQUALIFIED')),
  strike_count INTEGER DEFAULT 0,
  camera_active INTEGER DEFAULT 0,
  microphone_active INTEGER DEFAULT 0,
  disqualification_reason TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_heartbeat_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_proctor_session_attempt ON proctoring_sessions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_proctor_session_status ON proctoring_sessions(status);

-- -------------------------------------------------------------------------
-- 7. PROCTORING EVENTS & AUDIT LOG TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proctoring_events (
  id TEXT PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  session_id TEXT NOT NULL,
  attempt_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'strike', 'critical')),
  occurred_at DATETIME NOT NULL,
  duration_ms INTEGER,
  confidence REAL,
  metadata TEXT, -- JSON payload of infraction details
  processing_status TEXT DEFAULT 'processed' CHECK (processing_status IN ('processed', 'flagged', 'ignored')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_proctor_events_attempt ON proctoring_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_proctor_events_type ON proctoring_events(event_type);
CREATE INDEX IF NOT EXISTS idx_proctor_events_occurred ON proctoring_events(occurred_at);

-- -------------------------------------------------------------------------
-- 8. PROCTORING REVIEWS & DECISIONS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proctoring_reviews (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('cleared', 'upheld_warning', 'disqualified', 'reinstated')),
  reason TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_proctor_reviews_attempt ON proctoring_reviews(attempt_id);

-- -------------------------------------------------------------------------
-- 9. CODING SUBMISSIONS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coding_submissions (
  id TEXT PRIMARY KEY,
  attempt_id TEXT,
  user_id TEXT NOT NULL,
  problem_id TEXT NOT NULL,
  language TEXT NOT NULL,
  source_code TEXT NOT NULL,
  passed_cases INTEGER DEFAULT 0,
  total_cases INTEGER DEFAULT 0,
  execution_time_ms REAL,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('accepted', 'wrong_answer', 'runtime_error', 'time_limit_exceeded')),
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coding_user_problem ON coding_submissions(user_id, problem_id);
CREATE INDEX IF NOT EXISTS idx_coding_attempt ON coding_submissions(attempt_id);

-- -------------------------------------------------------------------------
-- 10. PAYMENTS & TOKEN TRANSACTIONS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount_rupees REAL NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  tokens_credited INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_rzp_order ON payments(razorpay_order_id);

