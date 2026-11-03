# AI Proctor Platform REST & WebSocket API Specification

## 1. Authentication & Security Headers

All requests expect authorization credentials. In development or test environments, identity simulation headers are supported:
- `Authorization: Bearer <jwt_token>` (Production Supabase token)
- `x-user-id: <uuid>` (Simulated profile identifier)
- `x-user-role: student | invigilator | administrator`

---

## 2. Examination Endpoints

### `GET /api/exams`
Lists all published examinations.
- **Access:** Student, Invigilator, Administrator
- **Response:** `{ exams: Examination[] }`

### `GET /api/exams/:examId`
Retrieves detailed metadata for a specific examination.
- **Access:** Student, Invigilator, Administrator
- **Response:** `{ exam: Examination }`

### `GET /api/exams/:examId/questions`
Fetches questions for an examination.
- **Access:** Enrolled student (active attempt) or Staff.
- **Security Rule:** For students, `correct_option_index` and `explanation` are strictly stripped from response payloads.
- **Response:** `{ questions: ExamQuestion[] }`

### `POST /api/exams/:examId/attempts`
Initializes or resumes a candidate examination attempt and auto-provisions a matching proctoring session.
- **Body:** `{ deviceInfo?: { browser: string, os: string, screen: string } }`
- **Response `201 Created`:** `{ attempt: ExamAttempt, session: ProctoringSession }`

### `PATCH /api/exams/:examId/answers`
Autosaves student answers during the active test session.
- **Body:** `{ attemptId: string, answers: { [questionId: string]: number } }`
- **Response `200 OK`:** `{ attempt: ExamAttempt, message: "Answers autosaved successfully" }`

### `POST /api/exams/:examId/submit`
Finalizes candidate submission, closes attempt, grades objective questions, and seals the proctoring session.
- **Body:** `{ attemptId: string }`
- **Response `200 OK`:** `{ attempt: ExamAttempt, message: "Examination submitted successfully." }`

---

## 3. Proctoring & Telemetry Endpoints

### `POST /api/proctoring/sessions`
Registers a new active proctoring session.
- **Body:** `{ attemptId: string, examId: string, webrtcMetadata?: object }`
- **Response `201 Created`:** `{ session: ProctoringSession }`

### `GET /api/proctoring/sessions/:sessionId`
Retrieves live status, student metadata, and event counts for a proctoring session.
- **Response `200 OK`:** `{ session: ProctoringSession }`

### `POST /api/proctoring/events`
Ingests a validated behavioral or technical anomaly event.
- **Body:**
  ```json
  {
    "sessionId": "44444444-4444-4444-4444-444444444441",
    "eventType": "HEAD_POSE_DEVIATION",
    "observedAt": "2026-10-28T16:00:00Z",
    "durationMs": 5200,
    "confidence": 0.88,
    "severity": "medium",
    "metadata": { "yaw": 28.5, "direction": "right" },
    "evidenceSnapshotUrl": "https://..."
  }
  ```
- **Response `201 Created`:** `{ event: ProctoringEvent }`

### `GET /api/proctoring/sessions/:sessionId/events`
Retrieves chronological timeline of all events detected during the session.
- **Response `200 OK`:** `{ events: ProctoringEvent[], total: number }`

### `POST /api/proctoring/telemetry/frame`
Submits raw frame telemetry through the server-side Rule Engine. Evaluates duration thresholds, debounces blinks/lighting, and broadcasts to invigilators.
- **Body:** `TelemetryFrame`
- **Response `200 OK`:** `{ success: true, flaggedCount: number, events: ProctoringEvent[] }`

---

## 4. Administrator & Invigilator Operations

### `GET /api/admin/proctoring/overview`
Returns platform-wide KPIs: active candidates, pending review queue, event category distributions, and recent sessions.
- **Access:** Invigilator, Administrator
- **Response `200 OK`:** `AdminOverview`

### `GET /api/admin/sessions`
Lists all candidate sessions with filtering options (`?status=active&examId=...`).
- **Response `200 OK`:** `{ sessions: ProctoringSession[], total: number }`

### `PATCH /api/proctoring/events/:eventId/review`
Submits formal human invigilator determination and audit notes.
- **Access:** Invigilator, Administrator
- **Body:**
  ```json
  {
    "status": "reviewed_no_concern | requires_follow_up | technical_issue | pending_review",
    "note": "Candidate momentarily turned to inspect scratch paper; verified camera unobstructed."
  }
  ```
- **Response `200 OK`:** `{ event: ProctoringEvent, message: string }`

### `POST /api/admin/evidence/signed-url`
Issues short-lived (15-minute) signed token for accessing evidentiary snapshots in Supabase Storage.
- **Body:** `{ eventId: string, sessionSnapshotKey: string }`
- **Response `200 OK`:** `{ signedUrl: string, expiresAt: string }`

### `GET /api/admin/sessions/:sessionId/export`
Exports comprehensive examination report with candidate info, timeline of all events, and reviewer notes in structured JSON.

---

## 5. Real-Time Socket.IO Protocol

- **Connection URL:** `ws://localhost:3001`

### Client Emitters:
- `join:session`: `{ sessionId: string, examId: string, role: string }`
- `client:telemetry`: Sends periodic structured frame telemetry (`faceCount`, `headPose`, `lighting`, `objects`)
- `client:focus_change`: `{ sessionId: string, hasFocus: boolean, visibilityState: string }`
- `client:camera_status`: `{ sessionId: string, active: boolean, error?: string }`

### Server Broadcasts:
- `admin:event_flagged`: Emitted to room `admin:room` when rule engine flags an incident.
- `student:warning`: Emitted directly to candidate with non-accusatory corrective feedback (e.g., *"Please keep your gaze centered on the examination screen"*).
- `session:heartbeat`: Periodic sync confirming candidate stream connectivity.

