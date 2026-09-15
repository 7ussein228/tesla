import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne, runInsert } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبين' }, { status: 400 });
    }

    const user = await queryOne<{ id: number; name: string; email: string; password: string; role: string; stage: string; energy: number; phone: string }>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    await runInsert('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [String(user.id)]);

    const token = signToken({ id: user.id, role: user.role });
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ token, user: safeUser });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: 'خطأ في الخادم: ' + msg }, { status: 500 });
  }
}
