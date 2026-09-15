import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') || req.nextUrl.pathname.split('/').pop();
    const quizzes = await queryAll('SELECT * FROM quizzes WHERE course_id = $1', [courseId!]);
    return NextResponse.json(quizzes);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
