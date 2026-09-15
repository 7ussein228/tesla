import { NextRequest, NextResponse } from 'next/server';
import { queryAll, runInsert } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export const POST = requireRole(['teacher', 'admin'], async (req: NextRequest, user) => {
  try {
    const pathname = req.nextUrl.pathname;
    const courseId = pathname.split('/')[3];
    const { title, description, video_url, duration, sort_order, is_free } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'عنوان المحاضرة مطلوب' }, { status: 400 });
    }

    const result = await runInsert(
      'INSERT INTO lectures (course_id, title, description, video_url, duration, sort_order, is_free) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [courseId, title, description || '', video_url || '', String(duration || 0), String(sort_order || 0), String(is_free || 0)]
    );

    const lecture = await queryAll('SELECT * FROM lectures WHERE id = $1', [String(result.lastInsertRowid)]);
    return NextResponse.json(lecture[0]);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
