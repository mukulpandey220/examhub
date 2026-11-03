-- Cloudflare D1 Migration: Student Proctoring Error Logs, 3 Warnings & Snapshot Evidence
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS student_proctoring_incidents (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT,
  student_email TEXT,
  incident_type TEXT NOT NULL,        -- 'multiple_faces', 'phone_detected', 'suspicious_device', 'tab_switch', etc.
  warning_number INTEGER NOT NULL,    -- 1, 2, or 3
  severity TEXT DEFAULT 'warning',    -- 'warning', 'strike', 'critical'
  details TEXT NOT NULL,              -- Error log description
  evidence_snapshot TEXT,             -- Base64 JPEG data URL of the captured moment
  exam_cancelled INTEGER DEFAULT 0,   -- 1 if this infraction cancelled/disqualified the exam
  cancellation_reason TEXT,           -- Reason if cancelled
  all_warnings_summary TEXT,          -- JSON array of all 3 warnings recorded
  occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proctoring_incidents_student ON student_proctoring_incidents(student_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_incidents_attempt ON student_proctoring_incidents(attempt_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_incidents_type ON student_proctoring_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_proctoring_incidents_cancelled ON student_proctoring_incidents(exam_cancelled);
