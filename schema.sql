-- =========================================================================
-- CLOUDFLARE D1 DATABASE SCHEMA — EXAMHUB (NYERAS NXTMOVE)
-- Production Serverless Edge SQL Schema
-- =========================================================================

-- Enable Foreign Key Enforcement
PRAGMA foreign_keys = ON;

-- -------------------------------------------------------------------------
-- 1. USERS & RBAC TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'institution_coordinator', 'exam_admin', 'super_admin')),
  institution_id TEXT,
  department_id TEXT,
  university TEXT,
  course_degree TEXT,
  branch TEXT,
  semester INTEGER,
  tokens INTEGER DEFAULT 100,
  unlocked_exams TEXT DEFAULT '[]', -- JSON array of exam IDs
  onboarded INTEGER DEFAULT 0,      -- Boolean (0 or 1)
  is_active INTEGER DEFAULT 1,      -- Boolean (0 or 1)
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);

-- -------------------------------------------------------------------------
-- 2. INSTITUTIONS & COLLEGES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL COLLATE NOCASE,
  university_affiliation TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  departments TEXT DEFAULT '[]',    -- JSON array of {id, name, code}
  coordinators TEXT DEFAULT '[]',   -- JSON array of {userId, name, email, designation}
  enrolled_students_count INTEGER DEFAULT 0,
  partnership_status TEXT DEFAULT 'lead' CHECK (partnership_status IN ('lead', 'scheduled', 'onboarded')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_institutions_code ON institutions(code);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(partnership_status);

-- -------------------------------------------------------------------------
-- 3. EXAM CATALOG TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_catalog (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain_slug TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  total_marks REAL NOT NULL,
  passing_marks REAL NOT NULL,
  negative_marking REAL DEFAULT 0.25,
  is_proctored INTEGER DEFAULT 1,
  sections TEXT DEFAULT '[]',       -- JSON array of {id, title, durationMinutes, marks}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exam_catalog_domain ON exam_catalog(domain_slug);
CREATE INDEX IF NOT EXISTS idx_exam_catalog_slug ON exam_catalog(slug);

-- -------------------------------------------------------------------------
-- 4. QUESTION BANK TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  section_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('mcq', 'multiple_choice', 'coding', 'subjective', 'boolean')),
  text TEXT NOT NULL,
  options TEXT DEFAULT '[]',        -- JSON array of {id, text, isCorrect}
  correct_answer TEXT,
  explanation TEXT,
  marks REAL DEFAULT 1.0,
  negative_marks REAL DEFAULT 0.25,
  difficulty TEXT CHECK (difficulty IN ('basic', 'intermediate', 'advanced', 'professional')),
  test_cases TEXT DEFAULT '[]',     -- JSON array of test cases for coding questions
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exam_catalog(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);

-- -------------------------------------------------------------------------
-- 5. EXAM ATTEMPTS TABLE (Active Sessions & Benchmark Grades)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  exam_title TEXT NOT NULL,
  domain_slug TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  submitted_at DATETIME,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'expired', 'graded', 'disqualified')),
  answers TEXT DEFAULT '{}',        -- JSON map: { [questionId]: value }
  marked_for_review TEXT DEFAULT '[]', -- JSON array of question IDs
  time_spent_seconds INTEGER DEFAULT 0,
  score REAL,
  max_score REAL,
  percentage REAL,
  passed INTEGER,                   -- 0 or 1
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  unanswered_count INTEGER DEFAULT 0,
  all_india_percentile REAL,
  national_rank INTEGER,
  is_top_ranker INTEGER DEFAULT 0,  -- 1 if top 5%
  certificate_id TEXT,
  section_scores TEXT DEFAULT '{}', -- Diagnostic report JSON
  coding_submissions TEXT DEFAULT '{}',
  proctoring_session_id TEXT,
  version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- High-performance query indexes for auto-grader, user dashboards & leaderboards
CREATE INDEX IF NOT EXISTS idx_attempts_user_exam ON attempts(user_id, exam_id, status);
CREATE INDEX IF NOT EXISTS idx_attempts_leaderboard ON attempts(exam_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_timeout ON attempts(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_attempts_cert ON attempts(certificate_id);

-- -------------------------------------------------------------------------
-- 6. PROCTORING SESSIONS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proctoring_sessions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  attempt_id TEXT UNIQUE NOT NULL,
  student_id TEXT NOT NULL,
  policy_version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'CLEAR' CHECK (status IN ('CLEAR', 'WARNING', 'FLAGGED_FOR_REVIEW', 'DISQUALIFICATION_PENDING', 'DISQUALIFIED', 'SUBMITTED')),
  strike_count INTEGER DEFAULT 0,
  camera_active INTEGER DEFAULT 0,
  microphone_active INTEGER DEFAULT 0,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  last_heartbeat_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  disqualification_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_proctoring_session_attempt ON proctoring_sessions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_session_status ON proctoring_sessions(exam_id, status);
CREATE INDEX IF NOT EXISTS idx_proctoring_heartbeat ON proctoring_sessions(status, last_heartbeat_at);

-- -------------------------------------------------------------------------
-- 7. PROCTORING EVENTS (Append-Only Immutable Audit Log)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proctoring_events (
  event_id TEXT PRIMARY KEY,        -- Idempotency key
  session_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  attempt_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  event_type TEXT NOT NULL,         -- tab_switch, no_face, multiple_faces, etc.
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'strike', 'critical')),
  occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_ms INTEGER DEFAULT 0,
  confidence REAL,
  metadata TEXT DEFAULT '{}',       -- JSON details
  processing_status TEXT DEFAULT 'processed' CHECK (processing_status IN ('processed', 'flagged', 'ignored')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES proctoring_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_proctoring_events_session ON proctoring_events(session_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_attempt ON proctoring_events(attempt_id);

-- -------------------------------------------------------------------------
-- 8. VERIFIED CERTIFICATES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
  certificate_id TEXT PRIMARY KEY,  -- e.g. NYE-2026-NXT-82910
  attempt_id TEXT UNIQUE NOT NULL,
  exam_id TEXT NOT NULL,
  exam_title TEXT NOT NULL,
  domain_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  score REAL NOT NULL,
  max_score REAL NOT NULL,
  percentage REAL NOT NULL,
  percentile REAL NOT NULL,
  national_rank INTEGER NOT NULL,
  is_top_ranker INTEGER DEFAULT 0,
  verification_hash TEXT UNIQUE NOT NULL, -- SHA-256 Digest
  public_url TEXT NOT NULL,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_certificates_hash ON certificates(verification_hash);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);

-- -------------------------------------------------------------------------
-- 9. CODING SUBMISSIONS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coding_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  exam_id TEXT,
  attempt_id TEXT,
  problem_id TEXT NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  status TEXT DEFAULT 'Pending Evaluation' CHECK (status IN ('Accepted', 'Wrong Answer', 'Compilation Error', 'Time Limit Exceeded', 'Pending Evaluation')),
  passed_cases INTEGER DEFAULT 0,
  total_cases INTEGER DEFAULT 0,
  score_awarded REAL DEFAULT 0,
  execution_time_ms REAL,
  memory_kb REAL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

