import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryAll, runInsert } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const { id } = await req.nextUrl.pathname.match(/\/quizzes\/(\d+)\/submit/)
      ? { id: req.nextUrl.pathname.split('/')[3] }
      : { id: '' };

    const quiz = await queryOne('SELECT * FROM quizzes WHERE id = $1', [id]);
    if (!quiz) return NextResponse.json({ error: 'الكويز غير موجود' }, { status: 404 });

    const { answers } = await req.json();
    const questions = await queryAll<{ id: number; points: number; correct_answer: string }>(
      'SELECT * FROM quiz_questions WHERE quiz_id = $1', [id]
    );

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

    await runInsert(
      'INSERT INTO quiz_attempts (student_id, quiz_id, score, total_points, answers, completed_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)',
      [String(user.id), id, String(percentage), String(totalPoints), JSON.stringify(answers)]
    );

    if (percentage >= (quiz as { passing_score: number }).passing_score) {
      await runInsert('UPDATE users SET energy = energy + $1 WHERE id = $2', [String(percentage), String(user.id)]);
    }

    return NextResponse.json({
      score: percentage,
      total_points: totalPoints,
      passed: percentage >= (quiz as { passing_score: number }).passing_score,
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
