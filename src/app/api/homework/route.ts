import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const { data, error } = await supabase
      .from('homework')
      .select('*, sheets(title, courses(title))')
      .eq('student_id', user.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('[Homework] my error:', error.message);
      return NextResponse.json([]);
    }

    const homework = (data || []).map((h: Record<string, unknown>) => {
      const sheet = h.sheets as Record<string, unknown> | null;
      const course = sheet?.courses as Record<string, unknown> | null;
      return {
        ...h,
        sheet_title: sheet?.title || '',
        course_title: course?.title || '',
        sheets: undefined,
      };
    });

    return NextResponse.json(homework);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
