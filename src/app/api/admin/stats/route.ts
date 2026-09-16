import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbCount } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const GET = requireRole(['admin'], async (req: NextRequest) => {
  try {
    const students = await dbCount('users', { role: 'student' });
    const teachers = await dbCount('users', { role: 'teacher' });
    const courses = await dbCount('courses');
    const enrollments = await dbCount('enrollments');

    const { count: pendingHomework } = await supabase
      .from('homework')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted');

    const { data: energyData } = await supabase.from('users').select('energy');
    const totalEnergy = (energyData || []).reduce((sum: number, u: Record<string, unknown>) => sum + ((u.energy as number) || 0), 0);

    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, name, email, role, stage, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      students,
      teachers,
      courses,
      publishedCourses: courses,
      enrollments,
      quizAttempts: 0,
      homeworkCount: 0,
      pendingHomework: pendingHomework || 0,
      totalEnergy,
      recentUsers: recentUsers || [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
