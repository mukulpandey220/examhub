# Operational Troubleshooting & Diagnostic Guide

## 1. Camera & Audio Diagnostics
- **Symptom:** `Camera permission denied` or black screen.
  - **Resolution:** Verify that camera permission is granted in the browser settings. In Chrome: `chrome://settings/content/camera`.
  - **Resolution:** Ensure no other application (Zoom, Teams, FaceTime) is locking the webcam device exclusively.

## 2. Low Light / Underexposed Warning
- **Symptom:** Banner indicates *"Low ambient lighting detected"*.
  - **Explanation:** Mean frame luminance is below 35. The system deliberately suppresses punitive absence alarms.
  - **Resolution:** Position a light source in front of the candidate. Avoid strong backlighting behind the candidate.

## 3. Real-Time Telemetry Disconnections
- **Symptom:** WebSocket indicator reports *"Offline"*.
  - **Explanation:** Temporary network drop or local socket timeout.
  - **Resolution:** The client automatically executes exponential backoff reconnects (up to 10 attempts). Exam progress is cached locally and synchronized upon reconnect.

## 4. AI Service Outage vs Candidate Misconduct
- **Symptom:** AI service returns 503 or network timeout.
  - **Architecture Guarantee:** The backend `InternalAIClient` explicitly catches `AIServiceOutageError` and will **never** generate a candidate misconduct alert due to an AI service interruption.

