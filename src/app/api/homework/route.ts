import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const homework = await queryAll(
      `SELECT h.*, s.title as sheet_title, c.title as course_title 
       FROM homework h JOIN sheets s ON h.sheet_id = s.id JOIN courses c ON s.course_id = c.id 
       WHERE h.student_id = $1 ORDER BY h.submitted_at DESC`,
      [String(user.id)]
    );
    return NextResponse.json(homework);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
