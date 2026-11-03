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
