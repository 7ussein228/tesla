import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

export async function execSql(query: string, params: string[] = []) {
  const { data, error } = await supabase.rpc('exec_sql', { query, params });
  if (error) {
    console.error('[Supabase] execSql error:', error.message, '\nSQL:', query.substring(0, 120));
    return [];
  }
  return data || [];
}

export async function queryOne<T = Record<string, unknown>>(query: string, params: string[] = []): Promise<T | undefined> {
  const trimmed = query.trim();
  const upper = trimmed.toUpperCase();

  let wrapped = query;
  if (upper.startsWith('SELECT') && !trimmed.includes('row_to_json')) {
    const fromIdx = trimmed.toUpperCase().indexOf('\nFROM ');
    const fromIdx2 = trimmed.toUpperCase().indexOf(' FROM ');
    const idx = fromIdx > 0 ? fromIdx : fromIdx2;
    if (idx > 0) {
      const selectPart = trimmed.substring(0, idx);
      const rest = trimmed.substring(idx);
      wrapped = `SELECT row_to_json(t) FROM (${selectPart}${rest}) t`;
    }
  }

  const { data, error } = await supabase.rpc('exec_sql', { query: wrapped, params: params.map(String) });
  if (error) {
    console.error('[Supabase] queryOne error:', error.message);
    return undefined;
  }
  return data?.[0] as T | undefined;
}

export async function queryAll<T = Record<string, unknown>>(query: string, params: string[] = []): Promise<T[]> {
  const trimmed = query.trim();
  const upper = trimmed.toUpperCase();

  let wrapped = query;
  if (upper.startsWith('SELECT') && !trimmed.includes('row_to_json')) {
    const fromIdx = trimmed.toUpperCase().indexOf('\nFROM ');
    const fromIdx2 = trimmed.toUpperCase().indexOf(' FROM ');
    const idx = fromIdx > 0 ? fromIdx : fromIdx2;
    if (idx > 0) {
      const selectPart = trimmed.substring(0, idx);
      const rest = trimmed.substring(idx);
      wrapped = `SELECT row_to_json(t) FROM (${selectPart}${rest}) t`;
    }
  }

  const { data, error } = await supabase.rpc('exec_sql', { query: wrapped, params: params.map(String) });
  if (error) {
    console.error('[Supabase] queryAll error:', error.message);
    return [];
  }
  return (data || []) as T[];
}

export async function runInsert(query: string, params: string[]): Promise<{ lastInsertRowid: number; changes: number }> {
  let q = query;
  if (q.toUpperCase().includes('INSERT OR IGNORE')) {
    q = q.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i, 'INSERT INTO');
    if (!q.includes('ON CONFLICT')) q += ' ON CONFLICT DO NOTHING';
  }
  const { data, error } = await supabase.rpc('exec_sql', { query: q, params: params.map(String) });
  if (error) {
    console.error('[Supabase] runInsert error:', error.message);
    return { lastInsertRowid: 0, changes: 0 };
  }
  return { lastInsertRowid: data?.[0]?.id || 0, changes: 1 };
}

export async function runUpdate(query: string, params: string[]): Promise<{ changes: number }> {
  const { error } = await supabase.rpc('exec_sql', { query, params: params.map(String) });
  if (error) {
    console.error('[Supabase] runUpdate error:', error.message);
    return { changes: 0 };
  }
  return { changes: 1 };
}

export async function runDelete(query: string, params: string[]): Promise<{ changes: number }> {
  const { error } = await supabase.rpc('exec_sql', { query, params: params.map(String) });
  if (error) {
    console.error('[Supabase] runDelete error:', error.message);
    return { changes: 0 };
  }
  return { changes: 1 };
}
