import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbSelect, dbInsert } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, stage, phone } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'الاسم والبريد وكلمة المرور مطلوبين' }, { status: 400 });
    }

    const existing = await dbSelect('users', { email }, { single: true });
    if (existing) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجل بالفعل' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await dbInsert('users', {
      name,
      email,
      password: hash,
      role: role || 'student',
      stage: stage || '',
      phone: phone || '',
      energy: 0,
    });

    if (!user) {
      return NextResponse.json({ error: 'خطأ في إنشاء الحساب' }, { status: 500 });
    }

    const token = signToken({ id: user.id as number, role: (user.role as string) || 'student' });
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ token, user: safeUser });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: 'خطأ في الخادم: ' + msg }, { status: 500 });
  }
}
