import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbInsert } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const courseId = parts[3];

    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'أنت مسجل بالفعل في هذا الكورس' }, { status: 409 });
    }

    const result = await dbInsert('enrollments', {
      student_id: user.id,
      course_id: Number(courseId),
    });

    if (!result) {
      return NextResponse.json({ error: 'خطأ في التسجيل' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم التسجيل بنجاح' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
