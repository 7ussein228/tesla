import { NextRequest, NextResponse } from 'next/server';
import { dbInsert } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const POST = requireRole(['teacher', 'admin'], async (req: NextRequest) => {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const courseId = parts[3];
    const { title, description, video_url, duration, sort_order, is_free } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'عنوان المحاضرة مطلوب' }, { status: 400 });
    }

    const lecture = await dbInsert('lectures', {
      course_id: Number(courseId),
      title,
      description: description || '',
      video_url: video_url || '',
      duration: duration || 0,
      sort_order: sort_order || 0,
      is_free: is_free || 0,
    });

    if (!lecture) {
      return NextResponse.json({ error: 'خطأ في إنشاء المحاضرة' }, { status: 500 });
    }

    return NextResponse.json(lecture);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
