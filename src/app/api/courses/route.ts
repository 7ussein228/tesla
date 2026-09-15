import { NextRequest, NextResponse } from 'next/server';
import { queryAll, runInsert } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage');

    let courses;
    if (stage && stage !== 'all') {
      courses = await queryAll(
        `SELECT c.*, u.name as teacher_name, 
         (SELECT COUNT(*) FROM lectures WHERE course_id = c.id) as lecture_count, 
         (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count 
         FROM courses c LEFT JOIN users u ON c.teacher_id = u.id 
         WHERE c.is_published = 1 AND c.stage = $1 ORDER BY c.created_at DESC`,
        [stage]
      );
    } else {
      courses = await queryAll(
        `SELECT c.*, u.name as teacher_name, 
         (SELECT COUNT(*) FROM lectures WHERE course_id = c.id) as lecture_count, 
         (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count 
         FROM courses c LEFT JOIN users u ON c.teacher_id = u.id 
         WHERE c.is_published = 1 ORDER BY c.created_at DESC`
      );
    }
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

    const result = await runInsert(
      'INSERT INTO courses (title, description, stage, price, teacher_id, is_published) VALUES ($1, $2, $3, $4, $5, 1)',
      [title, description || '', stage, String(price || 0), String(user.id)]
    );

    const course = await queryAll('SELECT * FROM courses WHERE id = $1', [String(result.lastInsertRowid)]);
    return NextResponse.json(course[0]);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
