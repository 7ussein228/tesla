import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbInsert } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage');

    let query = supabase.from('courses').select('*, users!courses_teacher_id_fkey(name), lectures(count), enrollments(count)');

    if (stage && stage !== 'all') {
      query = query.eq('stage', stage);
    }
    query = query.eq('is_published', 1).order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('[Courses] list error:', error.message);
      return NextResponse.json([], { status: 500 });
    }

    const courses = (data || []).map((c: Record<string, unknown>) => ({
      ...c,
      teacher_name: (c.users as Record<string, string>)?.name || '',
      lecture_count: Array.isArray(c.lectures) ? c.lectures.length : 0,
      student_count: Array.isArray(c.enrollments) ? c.enrollments.length : 0,
      users: undefined,
      lectures: undefined,
      enrollments: undefined,
    }));

    return NextResponse.json(courses);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
};

export const POST = requireRole(['teacher', 'admin'], async (req: NextRequest, user) => {
  try {
    const { title, description, stage, price } = await req.json();
    if (!title || !stage) {
      return NextResponse.json({ error: 'اسم الكورس والمرحلة مطلوبين' }, { status: 400 });
    }

    const course = await dbInsert('courses', {
      title,
      description: description || '',
      stage,
      price: price || 0,
      teacher_id: user.id,
      is_published: 1,
    });

    if (!course) {
      return NextResponse.json({ error: 'خطأ في إنشاء الكورس' }, { status: 500 });
    }

    return NextResponse.json(course);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
