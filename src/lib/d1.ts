/**
 * Cloudflare D1 Database Client Adapter for ExamHub (Nxtmove)
 *
 * Supports:
 * 1. Cloudflare Workers / Pages Edge runtime (using native env.DB)
 * 2. Next.js Node.js server routes (using Cloudflare D1 REST API)
 * 3. Graceful fallback for local development testing
 */

interface D1Result<T = any> {
  results?: T[];
  success: boolean;
  meta?: any;
  error?: string;
}

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const CLOUDFLARE_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || "";
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";

/**
 * Executes a parameterized SQL query against Cloudflare D1
 */
export async function queryD1<T = any>(
  sql: string,
  params: (string | number | boolean | null)[] = [],
  contextEnv?: any
): Promise<T[]> {
  // 1. Direct Edge Binding (when deployed on Cloudflare Pages/Workers)
  if (contextEnv?.DB) {
    const stmt = contextEnv.DB.prepare(sql).bind(...params);
    const { results } = await stmt.all();
    return (results as T[]) || [];
  }

  // 2. Cloudflare D1 REST API (when querying from Next.js server actions / API routes)
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_D1_DATABASE_ID && CLOUDFLARE_API_TOKEN) {
    try {
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql,
          params,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Cloudflare D1 HTTP query failed:", errText);
        throw new Error(`Cloudflare D1 query failed with status ${res.status}`);
      }

      const json = await res.json();
      const firstResult = json?.result?.[0];
      return (firstResult?.results as T[]) || [];
    } catch (err) {
      console.error("Cloudflare D1 API request error:", err);
      throw err;
    }
  }

  // 3. Log helpful warning if credentials not provided yet
  console.warn(
    "[D1 Warning] Cloudflare credentials not detected in .env.local. Falling back to local data layer."
  );
  return [];
}

/**
 * Execute a mutation query (INSERT, UPDATE, DELETE)
 */
export async function executeD1(
  sql: string,
  params: (string | number | boolean | null)[] = [],
  contextEnv?: any
): Promise<{ success: boolean; changes?: number }> {
  // Edge runtime
  if (contextEnv?.DB) {
    const stmt = contextEnv.DB.prepare(sql).bind(...params);
    const res = await stmt.run();
    return { success: res.success, changes: res.meta?.changes };
  }

  // HTTP API
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_D1_DATABASE_ID && CLOUDFLARE_API_TOKEN) {
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    });

    const json = await res.json();
    return {
      success: json?.success || false,
      changes: json?.result?.[0]?.meta?.changes || 0,
    };
  }

  return { success: false };
}

/**
 * Persists a proctoring incident log with optional camera snapshot into D1
 */
export async function saveProctoringIncident(incident: {
  id: string;
  attemptId: string;
  examId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  incidentType: string;
  warningNumber: number;
  severity?: string;
  details: string;
  evidenceSnapshot?: string | null;
  examCancelled?: boolean;
  cancellationReason?: string | null;
  allWarningsSummary?: any[] | null;
  occurredAt?: string;
}): Promise<boolean> {
  const sql = `
    INSERT OR REPLACE INTO student_proctoring_incidents (
      id, attempt_id, exam_id, student_id, student_name, student_email,
      incident_type, warning_number, severity, details, evidence_snapshot,
      exam_cancelled, cancellation_reason, all_warnings_summary, occurred_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    incident.id,
    incident.attemptId,
    incident.examId,
    incident.studentId,
    incident.studentName || "Candidate",
    incident.studentEmail || incident.studentId,
    incident.incidentType,
    incident.warningNumber,
    incident.severity || "warning",
    incident.details,
    incident.evidenceSnapshot || null,
    incident.examCancelled ? 1 : 0,
    incident.cancellationReason || null,
    incident.allWarningsSummary ? JSON.stringify(incident.allWarningsSummary) : null,
    incident.occurredAt || new Date().toISOString(),
  ];

  try {
    const res = await executeD1(sql, params);
    return res.success;
  } catch (err) {
    console.warn("Failed to persist incident directly to D1 (will use fallback):", err);
    return false;
  }
}

/**
 * Retrieves proctoring incident error logs and captured snapshot evidence from D1
 */
export async function getProctoringIncidents(filters?: {
  attemptId?: string;
  studentId?: string;
  examCancelledOnly?: boolean;
}): Promise<any[]> {
  let sql = `SELECT * FROM student_proctoring_incidents WHERE 1=1`;
  const params: (string | number | boolean | null)[] = [];

  if (filters?.attemptId) {
    sql += ` AND attempt_id = ?`;
    params.push(filters.attemptId);
  }
  if (filters?.studentId) {
    sql += ` AND student_id = ?`;
    params.push(filters.studentId);
  }
  if (filters?.examCancelledOnly) {
    sql += ` AND exam_cancelled = 1`;
  }

  sql += ` ORDER BY occurred_at DESC`;

  return queryD1(sql, params);
}

/**
 * Retrieves a user record from D1 by email address
 */
export async function getD1UserByEmail(email: string): Promise<any | null> {
  const users = await queryD1(`SELECT * FROM users WHERE email = ? LIMIT 1`, [email]);
  return users.length > 0 ? users[0] : null;
}

/**
 * Upserts a user record into D1
 */
export async function saveD1User(user: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role?: string;
  university?: string;
  courseDegree?: string;
  branch?: string;
  semester?: number;
  tokens?: number;
}): Promise<boolean> {
  const sql = `
    INSERT OR REPLACE INTO users (
      id, email, name, password_hash, role, university, course_degree, branch, semester, tokens
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    user.id,
    user.email,
    user.name,
    user.passwordHash,
    user.role || "student",
    user.university || null,
    user.courseDegree || null,
    user.branch || null,
    user.semester ?? 7,
    user.tokens ?? 100,
  ];
  const res = await executeD1(sql, params);
  return res.success;
}

/**
 * Retrieves an exam attempt from D1 by attempt ID
 */
export async function getD1AttemptById(attemptId: string): Promise<any | null> {
  const attempts = await queryD1(`SELECT * FROM attempts WHERE id = ? LIMIT 1`, [attemptId]);
  return attempts.length > 0 ? attempts[0] : null;
}

/**
 * Upserts an exam attempt record into D1
 */
export async function saveD1Attempt(attempt: {
  id: string;
  examId: string;
  examTitle: string;
  domainSlug: string;
  userId: string;
  userEmail: string;
  userName: string;
  startedAt: string;
  expiresAt: string;
  status: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
}): Promise<boolean> {
  const sql = `
    INSERT OR REPLACE INTO attempts (
      id, exam_id, exam_title, domain_slug, user_id, user_email, user_name,
      started_at, expires_at, status, score, max_score, percentage, passed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    attempt.id,
    attempt.examId,
    attempt.examTitle,
    attempt.domainSlug,
    attempt.userId,
    attempt.userEmail,
    attempt.userName,
    attempt.startedAt,
    attempt.expiresAt,
    attempt.status,
    attempt.score ?? null,
    attempt.maxScore ?? null,
    attempt.percentage ?? null,
    attempt.passed ? 1 : 0,
  ];
  const res = await executeD1(sql, params);
  return res.success;
}


