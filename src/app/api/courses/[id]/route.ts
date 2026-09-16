import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*, users!courses_teacher_id_fkey(name)')
      .eq('id', id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'الكورس غير موجود' }, { status: 404 });
    }

    const { data: lectures } = await supabase.from('lectures').select('*').eq('course_id', id).order('sort_order');
    const { data: quizzes } = await supabase.from('quizzes').select('*').eq('course_id', id);
    const { data: sheets } = await supabase.from('sheets').select('*').eq('course_id', id);

    const teacherName = (course.users as Record<string, string>)?.name || '';

    return NextResponse.json({
      ...course,
      teacher_name: teacherName,
      users: undefined,
      lectures: lectures || [],
      quizzes: quizzes || [],
      sheets: sheets || [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
