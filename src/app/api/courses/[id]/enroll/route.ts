import { NextRequest, NextResponse } from 'next/server';
import { queryOne, runInsert } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const { id } = await req.nextUrl.pathname.match(/\/courses\/(\d+)\/enroll/)
      ? { id: req.nextUrl.pathname.split('/')[3] }
      : { id: '' };

    const existing = await queryOne(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [String(user.id), id]
    );
    if (existing) {
      return NextResponse.json({ error: 'أنت مسجل بالفعل في هذا الكورس' }, { status: 409 });
    }

    await runInsert(
      'INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2)',
      [String(user.id), id]
    );
    return NextResponse.json({ message: 'تم التسجيل بنجاح' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
