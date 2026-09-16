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

// Direct table helpers using Supabase query builder (no RPC needed)
export async function dbSelect(table: string, filters: Record<string, unknown> = {}, options: { single?: boolean; orderBy?: string; ascending?: boolean; limit?: number } = {}) {
  let query = supabase.from(table).select('*');
  for (const [key, val] of Object.entries(filters)) {
    query = query.eq(key, val);
  }
  if (options.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? false });
  if (options.limit) query = query.limit(options.limit);
  if (options.single) {
    const { data, error } = await query.single();
    if (error) { console.error(`[Supabase] select single from ${table}:`, error.message); return undefined; }
    return data;
  }
  const { data, error } = await query;
  if (error) { console.error(`[Supabase] select from ${table}:`, error.message); return []; }
  return data || [];
}

export async function dbInsert(table: string, row: Record<string, unknown>) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) { console.error(`[Supabase] insert into ${table}:`, error.message); return null; }
  return data;
}

export async function dbUpdate(table: string, updates: Record<string, unknown>, filters: Record<string, unknown>) {
  let query = supabase.from(table).update(updates);
  for (const [key, val] of Object.entries(filters)) {
    query = query.eq(key, val);
  }
  const { error } = await query;
  if (error) { console.error(`[Supabase] update ${table}:`, error.message); return false; }
  return true;
}

export async function dbDelete(table: string, filters: Record<string, unknown>) {
  let query = supabase.from(table).delete();
  for (const [key, val] of Object.entries(filters)) {
    query = query.eq(key, val);
  }
  const { error } = await query;
  if (error) { console.error(`[Supabase] delete from ${table}:`, error.message); return false; }
  return true;
}

export async function dbCount(table: string, filters: Record<string, unknown> = {}) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  for (const [key, val] of Object.entries(filters)) {
    query = query.eq(key, val);
  }
  const { count, error } = await query;
  if (error) { console.error(`[Supabase] count ${table}:`, error.message); return 0; }
  return count || 0;
}

export async function dbRaw(sql: string, params: string[] = []) {
  const { data, error } = await supabase.rpc('exec_sql', { query: sql, params });
  if (error) {
    console.error('[Supabase] dbRaw error:', error.message);
    return [];
  }
  return data || [];
}
