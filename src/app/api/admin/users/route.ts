import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const GET = requireRole(['admin'], async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    let query = supabase
      .from('users')
      .select('id, name, email, role, stage, phone, energy, created_at, last_login');

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('[Admin] users error:', error.message);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
