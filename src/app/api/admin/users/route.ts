import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const GET = requireRole(['admin'], async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    let query = 'SELECT id, name, email, role, stage, phone, energy, created_at, last_login FROM users WHERE 1=1';
    const params: string[] = [];

    if (role && role !== 'all') {
      query += ' AND role = $' + (params.length + 1);
      params.push(role);
    }
    if (search) {
      query += ` AND (name LIKE $${params.length + 1} OR email LIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY created_at DESC';

    const users = await queryAll(query, params);
    return NextResponse.json(users);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
