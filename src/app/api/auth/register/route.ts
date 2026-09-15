import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne, runInsert } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, stage, phone } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'الاسم والبريد وكلمة المرور مطلوبين' }, { status: 400 });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجل بالفعل' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await runInsert(
      'INSERT INTO users (name, email, password, role, stage, phone) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, email, hash, role || 'student', stage || '', phone || '']
    );

    const user = await queryOne<{ id: number; name: string; email: string; role: string; stage: string; energy: number }>(
      'SELECT id, name, email, role, stage, energy FROM users WHERE id = $1',
      [String(result.lastInsertRowid)]
    );

    const token = signToken({ id: user!.id, role: user!.role });
    return NextResponse.json({ token, user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: 'خطأ في الخادم: ' + msg }, { status: 500 });
  }
}
