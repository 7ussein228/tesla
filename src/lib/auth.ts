import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { dbSelect } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'newton-platform-secret-key-2026';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  stage: string;
}

export function signToken(user: { id: number; role: string }) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): { id: number; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await dbSelect('users', { id: payload.id }, { single: true }) as Record<string, unknown> | undefined;
  if (!user) return null;
  return { id: user.id as number, name: user.name as string, email: user.email as string, role: user.role as 'student' | 'teacher' | 'admin', stage: user.stage as string };
}

export function requireAuth(handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    return handler(req, user);
  };
}

export function requireRole(roles: string[], handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    if (!roles.includes(user.role)) {
      return NextResponse.json({ error: 'غير مصرح لهذا الإجراء' }, { status: 403 });
    }
    return handler(req, user);
  };
}
