import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';
import { getDb } from './db.js';
import type { UserRole } from './types.js';

const JWT_SECRET = env.SESSION_SECRET;

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

export function verifyAuthToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: payload.id,
      email: payload.email,
      full_name: payload.full_name,
      role: payload.role,
    };
  } catch (err) {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.gd_auth_token) {
    token = req.cookies.gd_auth_token;
  }

  if (token) {
    const user = verifyAuthToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient administrative permissions' });
    }
    next();
  };
}
