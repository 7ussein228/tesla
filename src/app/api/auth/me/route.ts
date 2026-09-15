import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const profile = await queryOne(
      'SELECT id, name, email, role, stage, phone, energy, created_at FROM users WHERE id = $1',
      [String(user.id)]
    );
    if (!profile) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    return NextResponse.json(profile);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
