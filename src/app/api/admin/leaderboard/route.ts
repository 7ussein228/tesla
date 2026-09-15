import { NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';

export async function GET() {
  try {
    const leaders = await queryAll(
      "SELECT id, name, energy, stage FROM users WHERE role = 'student' ORDER BY energy DESC LIMIT 20"
    );
    return NextResponse.json(leaders);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
