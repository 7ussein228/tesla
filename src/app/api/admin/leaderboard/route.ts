import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, energy, stage')
      .eq('role', 'student')
      .order('energy', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[Leaderboard] error:', error.message);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
