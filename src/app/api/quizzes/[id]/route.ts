import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbSelect } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const quiz = await dbSelect('quizzes', { id: Number(id) }, { single: true });
    if (!quiz) return NextResponse.json({ error: 'الكويز غير موجود' }, { status: 404 });

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', id)
      .order('sort_order');

    return NextResponse.json({ ...quiz, questions: questions || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
