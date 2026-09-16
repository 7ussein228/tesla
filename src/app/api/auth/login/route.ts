import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbSelect, dbUpdate } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبين' }, { status: 400 });
    }

    const user = await dbSelect('users', { email }, { single: true }) as Record<string, unknown> | undefined;

    if (!user || !(await bcrypt.compare(password, user.password as string))) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    await dbUpdate('users', { last_login: new Date().toISOString() }, { id: user.id });

    const token = signToken({ id: user.id as number, role: user.role as string });
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ token, user: safeUser });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: 'خطأ في الخادم: ' + msg }, { status: 500 });
  }
}
