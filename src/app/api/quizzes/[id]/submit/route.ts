import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbInsert, dbUpdate } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const parts = req.nextUrl.pathname.split('/');
    const quizId = parts[3];

    const { data: quiz } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
    if (!quiz) return NextResponse.json({ error: 'الكويز غير موجود' }, { status: 404 });

    const { answers } = await req.json();
    const { data: questions } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId);

    if (!questions) return NextResponse.json({ error: 'لا يوجد أسئلة' }, { status: 500 });

    let score = 0;
    let totalPoints = 0;
    const results = questions.map(q => {
      totalPoints += q.points;
      const userAnswer = (answers as Record<string, string>)[q.id] || '';
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) score += q.points;
      return { id: q.id, correct: isCorrect, correct_answer: q.correct_answer };
    });

    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

    await dbInsert('quiz_attempts', {
      student_id: user.id,
      quiz_id: Number(quizId),
      score: percentage,
      total_points: totalPoints,
      answers: JSON.stringify(answers),
      completed_at: new Date().toISOString(),
    });

    if (percentage >= quiz.passing_score) {
      await dbUpdate('users', { energy: (await supabase.from('users').select('energy').eq('id', user.id).single()).data?.energy + percentage }, { id: user.id });
    }

    return NextResponse.json({
      score: percentage,
      total_points: totalPoints,
      passed: percentage >= quiz.passing_score,
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
