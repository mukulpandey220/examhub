export type UserRole = 'student' | 'invigilator' | 'administrator';
export type ExamStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'archived';
export type AttemptStatus = 'initialized' | 'in_progress' | 'submitted' | 'abandoned' | 'evaluated';
export type SessionStatus = 'initialized' | 'active' | 'paused' | 'interrupted' | 'completed';
export type EventSeverity = 'low' | 'medium' | 'high' | 'technical';
export type ReviewStatus = 'pending_review' | 'reviewed_no_concern' | 'requires_follow_up' | 'technical_issue';

export type EventType =
  | 'NO_FACE_DETECTED'
  | 'MULTIPLE_FACES_DETECTED'
  | 'HEAD_POSE_DEVIATION'
  | 'SUSPICIOUS_OBJECT_DETECTED'
  | 'BROWSER_FOCUS_LOST'
  | 'TAB_SWITCH_DETECTED'
  | 'WINDOW_SWITCH_DETECTED'
  | 'FULLSCREEN_EXITED'
  | 'FUNCTION_KEY_PRESSED'
  | 'CAMERA_DISCONNECTED'
  | 'AUDIO_ANOMALY'
  | 'NETWORK_INSTABILITY'
  | 'EXTENSION_DETECTED'
  | 'SCREENSHARE_TERMINATED'
  | 'VIRTUAL_DEVICE_DETECTED'
  | 'SCREEN_LOG_CAPTURED';

export interface Profile {
  id: string;
  auth_user_id?: string;
  full_name: string;
  email: string;
  role: UserRole;
  student_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ExaminationConfig {
  require_webcam: boolean;
  require_microphone: boolean;
  allow_tab_switch: boolean;
  max_tab_switches: number;
  no_face_timeout_sec: number;
  multi_face_confidence_threshold: number;
  head_pose_yaw_threshold_deg: number;
  head_pose_pitch_threshold_deg: number;
  enable_phone_detection: boolean;
  frame_sample_rate_sec: number;
}

export interface Examination {
  id: string;
  title: string;
  description: string;
  course_code: string;
  duration_minutes: number;
  status: ExamStatus;
  total_marks: number;
  passing_marks: number;
  config: ExaminationConfig;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_order: number;
  question_type: string;
  prompt: string;
  options: string[];
  correct_option_index?: number;
  marks: number;
  explanation?: string;
  created_at: string;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  status: AttemptStatus;
  started_at?: string;
  submitted_at?: string;
  score?: number;
  answers: Record<string, number | string>;
  device_info?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProctoringSession {
  id: string;
  attempt_id: string;
  exam_id: string;
  student_id: string;
  status: SessionStatus;
  client_ip?: string;
  user_agent?: string;
  webrtc_metadata?: Record<string, any>;
  heartbeat_at?: string;
  started_at: string;
  ended_at?: string;
  total_events_count: number;
  high_severity_events_count: number;
  created_at: string;
  updated_at: string;
  // Joins
  student?: Profile;
  exam?: Examination;
}

export interface ProctoringEvent {
  id: string;
  session_id: string;
  event_type: EventType;
  observed_at: string;
  duration_ms: number;
  confidence: number;
  severity: EventSeverity;
  model_version: string;
  metadata: Record<string, any>;
  evidence_snapshot_url?: string;
  review_status: ReviewStatus;
  reviewer_id?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface ReviewerNote {
  id: string;
  session_id: string;
  event_id?: string;
  reviewer_id: string;
  note: string;
  decision: ReviewStatus;
  created_at: string;
  reviewer?: Profile;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_role?: UserRole;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

