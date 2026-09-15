import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const course = await queryOne(
      'SELECT c.*, u.name as teacher_name FROM courses c LEFT JOIN users u ON c.teacher_id = u.id WHERE c.id = $1',
      [id]
    );
    if (!course) return NextResponse.json({ error: 'الكورس غير موجود' }, { status: 404 });

    const lectures = await queryAll('SELECT * FROM lectures WHERE course_id = $1 ORDER BY sort_order', [id]);
    const quizzes = await queryAll('SELECT * FROM quizzes WHERE course_id = $1', [id]);
    const sheets = await queryAll('SELECT * FROM sheets WHERE course_id = $1', [id]);

    return NextResponse.json({ ...course, lectures, quizzes, sheets });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
