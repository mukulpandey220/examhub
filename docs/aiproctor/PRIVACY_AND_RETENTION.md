# Privacy Safeguards & Data Retention Policy

## 1. Ethical AI Safeguards
The platform enforces strict non-punitive, human-centric design rules:

1. **No Biometric Facial Recognition:** The platform does not extract biometric embeddings or match faces against student databases. Landmarks are processed in-memory solely for presence and head orientation.
2. **No Dishonesty / Emotion Inference:** Pseudoscience polygraph techniques, micro-expression analysis, and emotion classifiers are explicitly prohibited.
3. **No Automatic Penalties:** AI outputs are classified strictly as **evidentiary observations for review**. The system is technically prevented from automatically failing or disqualifying candidates.
4. **Transparent Consent Disclosure:** Before entering any exam, candidates must explicitly review and check the monitoring terms (`ConsentModal.tsx`).

## 2. Evidence Minimization & Retention Schedule
- **No Continuous Video Recording:** Continuous video is never stored to disk. Only isolated snapshots captured during confirmed behavioral flags are stored.
- **Short-Lived Signed Evidence Tokens:** Snapshots can only be viewed via 15-minute expiring signed URLs.
- **Automated Deletion Schedule:**
  - Raw event frame snapshots: Automatically pruned after **30 days** post-exam.
  - Review decisions and text audit records: Retained for **1 academic year** for institutional compliance.

