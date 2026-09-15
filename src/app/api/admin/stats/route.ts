import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const GET = requireRole(['admin'], async (req: NextRequest) => {
  try {
    const students = (await queryOne<{ cnt: number }>("SELECT COUNT(*) as cnt FROM users WHERE role = 'student'"))?.cnt ?? 0;
    const teachers = (await queryOne<{ cnt: number }>("SELECT COUNT(*) as cnt FROM users WHERE role = 'teacher'"))?.cnt ?? 0;
    const courses = (await queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM courses'))?.cnt ?? 0;
    const publishedCourses = (await queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM courses WHERE is_published = 1'))?.cnt ?? 0;
    const enrollments = (await queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM enrollments'))?.cnt ?? 0;
    const quizAttempts = (await queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM quiz_attempts'))?.cnt ?? 0;
    const homeworkCount = (await queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM homework'))?.cnt ?? 0;
    const pendingHomework = (await queryOne<{ cnt: number }>("SELECT COUNT(*) as cnt FROM homework WHERE status = 'submitted'"))?.cnt ?? 0;
    const totalEnergy = (await queryOne<{ total: number }>('SELECT COALESCE(SUM(energy), 0) as total FROM users'))?.total ?? 0;
    const recentUsers = await queryAll('SELECT id, name, email, role, stage, created_at FROM users ORDER BY created_at DESC LIMIT 10');

    return NextResponse.json({ students, teachers, courses, publishedCourses, enrollments, quizAttempts, homeworkCount, pendingHomework, totalEnergy, recentUsers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
