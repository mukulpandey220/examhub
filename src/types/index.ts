export type CategoryCode =
  | "cse_it"
  | "ece_eee"
  | "mechanical"
  | "chemical"
  | "civil"
  | "management"
  | "med_pharma_bio";

export interface Category {
  code: CategoryCode;
  name: string;
  shortName: string;
  badgeLabel?: string;
  examCount?: number;
  domainCount: number;
  description: string;
  iconName: string;
  accentColor: string;
}

export type DifficultyLevel = "basic" | "intermediate" | "advanced" | "professional";

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "numerical"
  | "coding"
  | "practical";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface TestCase {
  id: string;
  input: string;
  output: string;
  explanation?: string;
  isHidden?: boolean;
}

export interface Question {
  id: string;
  domainSlug: string;
  subjectSlug: string;
  topic: string;
  difficulty: DifficultyLevel;
  type: QuestionType;
  questionText: string;
  options?: QuestionOption[];
  correctAnswer: string | string[] | number; // option id or string or number or array of option ids
  explanation: string;
  marks: number;
  negativeMarks: number;
  reviewStatus: "approved" | "draft" | "pending_review" | "rejected";
  version: number;
  sourceOrReference: string;
  // Coding / practical specific
  starterCode?: string;
  language?: string;
  testCases?: TestCase[];
  practicalRubric?: string;
  section?: "section_a" | "section_b" | "section_c";
  sectionName?: string;
}

export interface Domain {
  id: string;
  slug: string;
  name: string;
  categoryCode: CategoryCode;
  categoryName: string;
  description: string;
  icon: string;
  hasCoding: boolean;
  hasSimulationOrPractical: boolean;
  subjects: {
    slug: string;
    name: string;
    topics: string[];
  }[];
  questionCount: number;
  approvedCount: number;
  difficultyDistribution: {
    basic: number;
    intermediate: number;
    advanced: number;
    professional: number;
  };
}

export interface ExamSection {
  id: "section_a" | "section_b" | "section_c";
  name: string;
  weightPercentage: number; // e.g. 25, 50, 25
  description: string;
  questionIds: string[];
}

export interface Examination {
  id: string;
  slug: string;
  title: string;
  domainSlug: string;
  domainName: string;
  subjectSlug?: string;
  subjectName?: string;
  categoryCode: CategoryCode;
  categoryName: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  passingPercentage: number;
  negativeMarkingPerWrong: number; // e.g. 0.25
  attemptLimit: number;
  isPublished: boolean;
  isFreeSample: boolean;
  isProctored?: boolean;
  sections?: ExamSection[];
  requiredTier: "free" | "seven_day" | "semester" | "backlog_add_on";
  mode: "timed" | "practice";
  format: "mcq" | "coding" | "hybrid" | "practical";
  questionCount: number;
  questionIds: string[];
  difficultyBreakdown: {
    basic: number;
    intermediate: number;
    advanced: number;
    professional: number;
  };
  allowedResources?: string[];
  resultReleasePolicy: "immediate" | "after_deadline" | "manual";
  feeRupees?: number; // Exam fee in INR
  tokenFee?: number;  // 1 Rs = 1 Token
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  domainSlug: string;
  userId: string;
  userEmail: string;
  userName: string;
  startedAt: string; // ISO
  expiresAt: string; // ISO
  submittedAt?: string; // ISO
  status: "in_progress" | "submitted" | "expired" | "graded";
  answers: Record<string, string | string[] | number>;
  markedForReview: string[]; // question ids
  timeSpentSeconds: number;
  score?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  topicBreakdown?: Record<string, { correct: number; total: number }>;
  difficultyBreakdown?: Record<string, { correct: number; total: number }>;
  sectionScores?: Record<string, {
    score: number;
    maxScore: number;
    percentage: number;
    correct: number;
    total: number;
    name: string;
  }>;
  allIndiaPercentile?: number;
  nationalRank?: number;
  isTopRanker?: boolean;
  certificateId?: string;
  codingSubmissions?: Record<string, {
    code: string;
    language: string;
    passedCases: number;
    totalCases: number;
    status: string;
  }>;
  sessionToken?: string;
  proctoring?: ProctoringLog;
}

export interface ProctoringViolation {
  id: string;
  type:
  | "tab_switch"
  | "fullscreen_exit"
  | "window_blur"
  | "phone_detected"
  | "multiple_faces"
  | "second_login_attempt"
  | "secondary_display"
  | "copy_paste_attempt"
  | "devtools_attempt"
  | "right_click_attempt"
  | "resize_attempt";
  timestamp: string;
  details: string;
}

export interface ProctoringLog {
  integrityScore: number;
  totalViolations: number;
  tabSwitchViolations: number;
  fullscreenViolations: number;
  blurViolations: number;
  phoneViolations?: number;
  dualFaceViolations?: number;
  secondLoginViolations?: number;
  copyPasteViolations: number;
  devtoolsViolations: number;
  isDisqualified: boolean;
  disqualificationReason?: string;
  cameraActive: boolean;
  microphoneActive: boolean;
  violations: ProctoringViolation[];
}

export interface InstitutionalLead {
  id: string;
  collegeName: string;
  universityAffiliation: string;
  city: string;
  state: string;
  spocName: string;
  spocDesignation: string; // "Principal" | "TPO" | "Dean" | "HOD"
  spocEmail: string;
  spocPhone: string;
  studentCohortSize: number;
  preferredExamWindow: string;
  labFacilityAvailable: boolean;
  status: "submitted" | "scheduled" | "onboarded";
  createdAt: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  tier: "free" | "seven_day" | "semester" | "backlog_add_on";
  pricePaise: number; // stored as integer paise e.g. 2900 = ₹29
  priceRupees: number;
  originalPriceRupees?: number;
  durationDays: number;
  durationLabel: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
}

export interface Entitlement {
  id: string;
  userId: string;
  tier: "free" | "seven_day" | "semester" | "backlog_add_on";
  startsAt: string;
  expiresAt: string;
  orderId?: string;
  paymentRef?: string;
  status: "active" | "expired" | "revoked";
}

export interface CampusDeadline {
  id: string;
  title: string;
  category: "exam" | "revaluation" | "backlog" | "assignment" | "scholarship" | "internship";
  universityOrBoard: string;
  domainSlug?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string;
  description: string;
  importance: "high" | "critical" | "medium";
  actionUrl?: string;
  isVerified: boolean;
}

export type UserRole = "student" | "institution_coordinator" | "exam_admin" | "super_admin";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole | "admin";
  category?: CategoryCode;
  domainSlug?: string;
  university?: string;
  institutionId?: string;
  departmentId?: string;
  courseDegree?: string;
  branch?: string;
  semester?: number;
  selectedDifficulty?: DifficultyLevel;
  preferredMode?: "timed" | "practice";
  onboarded: boolean;
  password?: string;
  optedExams?: string[];
  tokens?: number; // 1 Rs = 1 Token balance
  unlockedExams?: string[]; // IDs of exams unlocked via tokens/fee
  createdAt: string;
  lastLoginAt?: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  type: "credit" | "debit";
  amount: number; // Token amount (1 Rs = 1 Token)
  rupees: number;
  description: string;
  paymentRef?: string;
  orderId?: string;
  examId?: string;
  createdAt: string;
}

// =========================================================================
// SECTION 24: AI-ASSISTED PROCTORING & INTEGRITY SUBSYSTEM CONTRACTS
// =========================================================================
export type ProctoringSessionStatus = 
  | "CLEAR"
  | "WARNING"
  | "FLAGGED_FOR_REVIEW"
  | "DISQUALIFICATION_PENDING"
  | "DISQUALIFIED"
  | "SUBMITTED";

export type ProctoringEventType =
  | "tab_switch"
  | "window_blur"
  | "window_focus"
  | "fullscreen_exit"
  | "fullscreen_enter"
  | "face_absent"
  | "multiple_faces"
  | "phone_detected"
  | "second_login_attempt"
  | "head_deviation"
  | "audio_anomaly"
  | "device_disconnected"
  | "device_reconnected"
  | "copy_paste_attempt"
  | "devtools_attempt"
  | "right_click_attempt"
  | "resize_attempt";

export interface ProctoringPolicy {
  version: string;
  requireCamera: boolean;
  requireMicrophone: boolean;
  requireFullscreen: boolean;
  tabSwitchPolicy: "warn" | "disqualify_immediate";
  maxStrikes: number;
  faceDetectionEnabled: boolean;
  faceAbsentGraceSeconds: number;
  headPoseDetectionEnabled: boolean;
  headDeviationMaxSeconds: number;
  audioMonitoringEnabled: boolean;
  audioAnomalyThresholdDb: number;
  networkReconnectGraceSeconds: number;
  multiFaceMinConfidence?: number;
  multiFaceConfirmFrames?: number;
  multiFaceConfirmWindowMs?: number;
  multiFaceRequiredRatio?: number;
  multiFaceCooldownMs?: number;
}

export interface ProctoringSession {
  id: string;
  examId: string;
  attemptId: string;
  studentId: string;
  policyVersion: string;
  status: ProctoringSessionStatus;
  strikeCount: number;
  startedAt: string;
  endedAt?: string;
  lastHeartbeatAt: string;
  cameraActive: boolean;
  microphoneActive: boolean;
  disqualificationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProctoringEvent {
  id: string;
  eventId: string;
  sessionId: string;
  examId: string;
  attemptId: string;
  studentId: string;
  eventType: ProctoringEventType;
  severity: "info" | "warning" | "strike" | "critical";
  occurredAt: string;
  receivedAt: string;
  durationMs?: number;
  confidence?: number;
  metadata?: Record<string, any>;
  policyVersion: string;
  processingStatus: "processed" | "flagged" | "ignored";
}

export interface ProctoringReview {
  id: string;
  eventId?: string;
  attemptId: string;
  reviewerId: string;
  decision: "cleared" | "upheld_warning" | "disqualified" | "reinstated";
  reason: string;
  reviewedAt: string;
  previousStatus: ProctoringSessionStatus;
  newStatus: ProctoringSessionStatus;
}

// =========================================================================
// SECTION 9 & 10: CODING CHALLENGES & PROJECT SUBMISSIONS
// =========================================================================
export interface CodingProblem {
  id: string;
  examId?: string;
  title: string;
  domainSlug: string;
  difficulty: DifficultyLevel;
  description: string;
  starterCode: Record<string, string>; // language -> starter snippet
  sampleTestCases: TestCase[];
  hiddenTestCases: TestCase[];
  timeLimitMs: number;
  memoryLimitMb: number;
  scoreWeight: number;
  allowedLanguages: string[];
}

export interface CodingSubmissionRecord {
  id: string;
  userId: string;
  examId?: string;
  attemptId?: string;
  problemId: string;
  code: string;
  language: string;
  status: "Accepted" | "Wrong Answer" | "Compilation Error" | "Time Limit Exceeded" | "Pending Evaluation";
  passedCases: number;
  totalCases: number;
  scoreAwarded: number;
  executionTimeMs?: number;
  memoryKb?: number;
  submittedAt: string;
}

export interface ProjectAttachment {
  name: string;
  fileUrl: string;
  sizeBytes: number;
  mimeType: string;
}

export interface ProjectJudgingScorecard {
  judgeId: string;
  judgeName: string;
  criteriaScores: {
    innovation: number; // 0-25
    architecture: number; // 0-25
    execution: number; // 0-25
    presentation: number; // 0-25
  };
  totalScore: number; // 0-100
  feedback: string;
  scoredAt: string;
}

export interface ProjectSubmission {
  id: string;
  teamId?: string;
  teamName: string;
  leadUserId: string;
  members: { userId: string; name: string; email: string }[];
  projectTitle: string;
  domainSlug: string;
  description: string;
  repositoryUrl: string;
  demoUrl?: string;
  attachments: ProjectAttachment[];
  status: "draft" | "submitted" | "judged";
  scorecards?: ProjectJudgingScorecard[];
  finalScore?: number;
  createdAt: string;
  updatedAt: string;
}

// =========================================================================
// SECTION 12 & 14: INSTITUTION & CERTIFICATES
// =========================================================================
export interface InstitutionRecord {
  id: string;
  name: string;
  code: string;
  universityAffiliation: string;
  city: string;
  state: string;
  departments: { id: string; name: string; code: string }[];
  coordinators: { userId: string; name: string; email: string; designation: string }[];
  enrolledStudentsCount: number;
  partnershipStatus: "onboarded" | "scheduled" | "lead";
  createdAt: string;
}

export interface CertificateRecord {
  id: string;
  certificateId: string; // e.g. NYE-2026-NXT-94821
  attemptId: string;
  examId: string;
  examTitle: string;
  domainName: string;
  studentId: string;
  studentName: string;
  institutionName: string;
  score: number;
  maxScore: number;
  percentage: number;
  percentile: number;
  nationalRank: number;
  isTopRanker: boolean;
  issuedAt: string;
  verificationHash: string;
  publicUrl: string;
}

export interface AuditEventRecord {
  id: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  timestamp: string;
}
