import { NextRequest, NextResponse } from 'next/server';
import { dbSelect } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) return NextResponse.json([], { status: 400 });

    const quizzes = await dbSelect('quizzes', { course_id: Number(courseId) });
    return NextResponse.json(quizzes);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
