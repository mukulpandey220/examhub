import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "nyeras-nxtmove-production-secret-key-2026-secure";

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId?: string;
}

// 1. Password Hashing & Verification
export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  if (!hashed) return false;
  // If plain matches hashed directly (legacy dev profile migration)
  if (plain === hashed) return true;
  try {
    return await bcrypt.compare(plain, hashed);
  } catch (e) {
    return plain === hashed;
  }
}

// 2. JWT Generation & Verification
export function signAuthToken(payload: TokenPayload, expiresIn: string = "7d"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
}

export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

// 3. Extract Token from Request Header or Cookie
export function getAuthUser(req: NextRequest): TokenPayload | null {
  // Authorization header: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const payload = verifyAuthToken(token);
    if (payload) return payload;
  }

  // Cookie fallback
  const cookieToken = req.cookies.get("nxtmove_token")?.value;
  if (cookieToken) {
    const payload = verifyAuthToken(cookieToken);
    if (payload) return payload;
  }

  return null;
}

// 4. Role Authorization Guard
export function requireRole(
  req: NextRequest,
  allowedRoles: (UserRole | "admin")[]
): { user: TokenPayload | null; errorResponse: NextResponse | null } {
  const user = getAuthUser(req);

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      ),
    };
  }

  // Map legacy 'admin' to exam_admin or super_admin
  const effectiveRole = user.role;
  const isAllowed =
    allowedRoles.includes(effectiveRole) ||
    (allowedRoles.includes("admin") && (effectiveRole === "exam_admin" || effectiveRole === "super_admin")) ||
    (allowedRoles.includes("exam_admin") && effectiveRole === "super_admin");

  if (!isAllowed) {
    return {
      user,
      errorResponse: NextResponse.json(
        {
          error: `Forbidden. Role '${user.role}' is not authorized to access this resource.`,
          requiredRoles: allowedRoles,
        },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}
