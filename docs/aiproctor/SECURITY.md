# Security Architecture & Threat Model

## 1. Threat Model & Mitigation Controls

| Threat Scenario | Potential Impact | Implemented Mitigation |
| :--- | :--- | :--- |
| **Tampered Client Telemetry** | Client attempts to falsify confidence scores or clear flags | **Server-side Rule Validation:** Backend does not trust client-reported severity; AI inference occurs in trusted backend/FastAPI service. |
| **Insecure Direct Object Reference (IDOR)** | Student accesses another candidate's video/evidence | **Session Ownership Verification:** Every session query enforces `user_id == req.user.id` or staff role. |
| **API Denial of Service (DoS)** | Excessive image uploads exhausting memory/CPU | **Client throttling (1.5s interval)**, frame size validation (640x480 max), and request body limits. |
| **Unauthorized Evidence Access** | Leakage of candidate camera snapshots | **Private Object Storage with Short-Lived Signed URLs (15-min expiry)** and immutable audit logging. |
| **Replay / Spoofing Attacks** | Replaying past video feed | Real-time challenge-response heartbeats and timestamp validation across Socket.IO streams. |

## 2. Cryptographic Controls & Credentials
- All production traffic requires HTTPS / TLS 1.3.
- Secrets are loaded exclusively via environment variables (`process.env`).
- Database credentials and service role keys are strictly quarantined from client bundles.

## 3. Audit Trails & Tamper Evidence
All sensitive administrative actions:
- Viewing evidence snapshots
- Overriding review determinations
- Exporting institutional reports
are written to the append-only `audit_logs` table with actor ID, timestamp, resource ID, and client IP.

