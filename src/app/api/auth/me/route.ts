import { NextRequest, NextResponse } from 'next/server';
import { dbSelect } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const profile = await dbSelect('users', { id: user.id }, { single: true }) as Record<string, unknown> | undefined;
    if (!profile) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    const { password: _, ...safeProfile } = profile;
    return NextResponse.json(safeProfile);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
