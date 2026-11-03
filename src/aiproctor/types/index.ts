export type UserRole = 'student' | 'invigilator' | 'administrator';
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
  full_name: string;
  email: string;
  role: UserRole;
  student_id?: string;
  avatar_url?: string;
}

export interface Examination {
  id: string;
  title: string;
  description: string;
  course_code: string;
  duration_minutes: number;
  status: string;
  total_marks: number;
  passing_marks: number;
  config: {
    require_webcam: boolean;
    require_microphone: boolean;
    allow_tab_switch: boolean;
    max_tab_switches: number;
    no_face_timeout_sec: number;
    frame_sample_rate_sec: number;
  };
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_order: number;
  question_type: string;
  prompt: string;
  options: string[];
  marks: number;
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
}

export interface ProctoringSession {
  id: string;
  attempt_id: string;
  exam_id: string;
  student_id: string;
  status: SessionStatus;
  client_ip?: string;
  user_agent?: string;
  heartbeat_at?: string;
  started_at: string;
  ended_at?: string;
  total_events_count: number;
  high_severity_events_count: number;
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

export interface AdminOverview {
  kpis: {
    totalExaminations: number;
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    interruptedSessions: number;
    eventsAwaitingReview: number;
    highSeverityCount: number;
  };
  eventTypeDistribution: Record<string, number>;
  reviewStatusDistribution: Record<string, number>;
  recentSessions: ProctoringSession[];
  recentEvents: ProctoringEvent[];
}

export interface DetectedObject {
  label: string;
  confidence: number;
  box: { x: number; y: number; width: number; height: number };
}

export interface AIFrameResponse {
  face_count: number;
  is_face_present: boolean;
  faces: Array<{
    box: { x: number; y: number; width: number; height: number };
    confidence: number;
    landmarks_count: number;
  }>;
  head_pose?: {
    yaw: number;
    pitch: number;
    roll: number;
    is_deviated: boolean;
    deviation_direction?: string;
  };
  lighting: {
    mean_luminance: number;
    contrast_rms: number;
    status: string;
    is_compromised: boolean;
  };
  objects: DetectedObject[];
  inference_latency_ms: number;
  technical_warnings: string[];
}
