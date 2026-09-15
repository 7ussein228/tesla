import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quiz = await queryOne('SELECT * FROM quizzes WHERE id = $1', [id]);
    if (!quiz) return NextResponse.json({ error: 'الكويز غير موجود' }, { status: 404 });
    const questions = await queryAll('SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY sort_order', [id]);
    return NextResponse.json({ ...quiz, questions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
