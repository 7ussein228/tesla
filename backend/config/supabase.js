const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

let supabase = null;

function getSupabase() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
    }
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
  }
  return supabase;
}

// Wrap any SELECT query to return row_to_json
function wrapQuery(sql, params) {
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();

  // Only wrap SELECT queries, not INSERT/UPDATE/DELETE
  if (!upper.startsWith('SELECT')) return { query: sql, params };

  // Find the FROM clause and wrap everything before it as a subquery
  // Pattern: SELECT ... FROM table [WHERE ...] [ORDER BY ...] [LIMIT ...]
  // We need to wrap the whole thing: SELECT row_to_json(t) FROM (...) t

  const fromIdx = upper.indexOf('\nFROM ');
  const fromIdx2 = upper.indexOf(' FROM ');
  const idx = fromIdx > 0 ? fromIdx : fromIdx2;

  if (idx < 0) return { query: sql, params };

  // Check if it already has row_to_json
  if (trimmed.includes('row_to_json')) return { query: sql, params };

  const selectPart = trimmed.substring(0, idx);
  const rest = trimmed.substring(idx);

  const wrapped = `SELECT row_to_json(t) FROM (${selectPart}${rest}) t`;
  return { query: wrapped, params };
}

class SupabaseWrapper {
  constructor(client) {
    this.client = client;
  }

  exec(sql) {
    // DDL
    this.client.rpc('exec_sql', { query: sql }).then(r => {
      if (r.error) console.error('[Supabase] exec error:', r.error.message);
    });
  }

  pragma(str) {}

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        const upper = sql.toUpperCase().trim();
        if (upper.startsWith('INSERT')) return self._runInsert(sql, params);
        if (upper.startsWith('UPDATE')) return self._runUpdate(sql, params);
        if (upper.startsWith('DELETE')) return self._runDelete(sql, params);
        return Promise.resolve({ lastInsertRowid: 0, changes: 0 });
      },
      get(...params) {
        return self._queryOne(sql, params);
      },
      all(...params) {
        return self._queryAll(sql, params);
      }
    };
  }

  async _queryOne(sql, params) {
    const wrapped = wrapQuery(sql, params);
    const { data, error } = await this.client.rpc('exec_sql', {
      query: wrapped.query,
      params: wrapped.params.map(String)
    });
    if (error) {
      console.error('[Supabase] queryOne error:', error.message, '\nSQL:', sql.substring(0, 100));
      return undefined;
    }
    return data?.[0] || undefined;
  }

  async _queryAll(sql, params) {
    const wrapped = wrapQuery(sql, params);
    const { data, error } = await this.client.rpc('exec_sql', {
      query: wrapped.query,
      params: wrapped.params.map(String)
    });
    if (error) {
      console.error('[Supabase] queryAll error:', error.message, '\nSQL:', sql.substring(0, 100));
      return [];
    }
    return data || [];
  }

  async _runInsert(sql, params) {
    let q = sql;
    const isIgnore = q.toUpperCase().includes('OR IGNORE');
    if (isIgnore) {
      q = q.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i, 'INSERT INTO');
      if (!q.includes('ON CONFLICT')) q += ' ON CONFLICT DO NOTHING';
    }
    const { data, error } = await this.client.rpc('exec_sql', {
      query: q,
      params: params.map(String)
    });
    if (error) {
      console.error('[Supabase] runInsert error:', error.message);
      return { lastInsertRowid: 0, changes: 0 };
    }
    return { lastInsertRowid: data?.[0]?.id || 0, changes: 1 };
  }

  async _runUpdate(sql, params) {
    const { error } = await this.client.rpc('exec_sql', {
      query: sql,
      params: params.map(String)
    });
    if (error) {
      console.error('[Supabase] runUpdate error:', error.message);
      return { changes: 0 };
    }
    return { changes: 1 };
  }

  async _runDelete(sql, params) {
    const { error } = await this.client.rpc('exec_sql', {
      query: sql,
      params: params.map(String)
    });
    if (error) {
      console.error('[Supabase] runDelete error:', error.message);
      return { changes: 0 };
    }
    return { changes: 1 };
  }
}

module.exports = { getSupabase, SupabaseWrapper };
