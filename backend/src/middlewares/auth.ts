import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../db/schema.js';
import { db } from '../db/client.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Check authorization header or simulated role header for development/demo ease
  const authHeader = req.headers.authorization;
  const simulatedUserId = (req.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000001'; // Default student
  const simulatedRole = (req.headers['x-user-role'] as UserRole) || 'student';

  const profile = await db.getProfile(simulatedUserId);
  if (profile) {
    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.full_name,
    };
  } else {
    req.user = {
      id: simulatedUserId,
      email: `${simulatedRole}@university.edu`,
      role: simulatedRole,
      fullName: simulatedRole === 'student' ? 'Alex Mercer' : 'Invigilator Vance',
    };
  }

  next();
};

export const requireRoles = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: requires one of the following roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

