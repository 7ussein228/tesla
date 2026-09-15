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

// Wrapper that mimics the better-sqlite3 / DatabaseWrapper API
class SupabaseWrapper {
  constructor(client) {
    this.client = client;
  }

  exec(sql) {
    // DDL not supported via Supabase client — use migrations instead
    console.log('[Supabase] exec skipped (use migrations):', sql.substring(0, 60));
  }

  pragma(str) {
    // Not needed for Supabase
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        // Parse the SQL to determine operation
        const upper = sql.toUpperCase().trim();

        if (upper.startsWith('INSERT')) {
          return self._insert(sql, params);
        } else if (upper.startsWith('UPDATE')) {
          return self._update(sql, params);
        } else if (upper.startsWith('DELETE')) {
          return self._delete(sql, params);
        }
        return { lastInsertRowid: 0, changes: 0 };
      },
      get(...params) {
        return self._selectOne(sql, params);
      },
      all(...params) {
        return self._selectAll(sql, params);
      }
    };
  }

  _parseTable(sql) {
    const match = sql.match(/FROM\s+(\w+)/i);
    return match ? match[1] : null;
  }

  _parseInsert(sql, params) {
    const table = sql.match(/INTO\s+(\w+)/i)?.[1];
    const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
    if (!table || !colsMatch) return null;
    const cols = colsMatch[1].split(',').map(c => c.trim());
    const obj = {};
    cols.forEach((col, i) => { obj[col] = params[i]; });
    return { table, obj };
  }

  _insert(sql, params) {
    const parsed = this._parseInsert(sql, params);
    if (!parsed) return { lastInsertRowid: 0, changes: 0 };

    // Handle INSERT OR IGNORE
    const isIgnore = sql.toUpperCase().includes('OR IGNORE');

    return this.client
      .from(parsed.table)
      .upsert(parsed.obj, { onConflict: '*', ignoreDuplicates: isIgnore })
      .then(({ data, error }) => {
        if (error) console.error('[Supabase INSERT]', error.message);
        return { lastInsertRowid: data?.[0]?.id || 0, changes: data ? 1 : 0 };
      });
  }

  _update(sql, params) {
    const table = sql.match(/UPDATE\s+(\w+)/i)?.[1];
    if (!table) return { changes: 0 };

    // Parse SET clause
    const setMatch = sql.match(/SET\s+(.+?)(?:\s+WHERE)/is);
    const whereMatch = sql.match(/WHERE\s+(.+?)$/is);
    if (!setMatch) return { changes: 0 };

    const setParts = setMatch[1].split(',').map(s => s.trim());
    const obj = {};
    let paramIdx = 0;
    setParts.forEach(part => {
      const [col] = part.split('=');
      obj[col.trim()] = params[paramIdx++];
    });

    let query = this.client.from(table).update(obj);

    if (whereMatch) {
      const whereParts = whereMatch[1].split('AND').map(w => w.trim());
      whereParts.forEach(part => {
        const [col, op] = part.split(/\s*(=|!=|>|<|>=|<=)\s*/);
        const val = params[paramIdx++];
        if (op === '=' || op === '==') query = query.eq(col.trim(), val);
        else if (op === '!=') query = query.neq(col.trim(), val);
      });
    }

    return query.then(({ data, error }) => {
      if (error) console.error('[Supabase UPDATE]', error.message);
      return { changes: data ? data.length : 0 };
    });
  }

  _delete(sql, params) {
    const table = sql.match(/DELETE\s+FROM\s+(\w+)/i)?.[1];
    const whereMatch = sql.match(/WHERE\s+(.+?)$/is);
    if (!table) return { changes: 0 };

    let query = this.client.from(table).delete();
    let paramIdx = 0;

    if (whereMatch) {
      const whereParts = whereMatch[1].split('AND').map(w => w.trim());
      whereParts.forEach(part => {
        const col = part.split('=')[0].trim();
        const val = params[paramIdx++];
        query = query.eq(col, val);
      });
    }

    return query.then(({ data, error }) => {
      if (error) console.error('[Supabase DELETE]', error.message);
      return { changes: data ? data.length : 0 };
    });
  }

  _selectOne(sql, params) {
    const table = this._parseTable(sql);
    if (!table) return undefined;

    // Parse SELECT columns
    const colsMatch = sql.match(/SELECT\s+(.+?)\s+FROM/is);
    const cols = colsMatch && !colsMatch[1].includes('*') ? colsMatch[1].split(',').map(c => c.trim()) : '*';

    // Parse WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/is);
    let query = this.client.from(table).select(cols);

    let paramIdx = 0;
    if (whereMatch) {
      const whereParts = whereMatch[1].split('AND').map(w => w.trim());
      whereParts.forEach(part => {
        const col = part.split('=')[0].trim();
        const val = params[paramIdx++];
        query = query.eq(col, val);
      });
    }

    return query.limit(1).single()
      .then(({ data, error }) => {
        if (error && error.code !== 'PGRST116') console.error('[Supabase SELECT ONE]', error.message);
        return data || undefined;
      });
  }

  _selectAll(sql, params) {
    const table = this._parseTable(sql);
    if (!table) return [];

    const colsMatch = sql.match(/SELECT\s+(.+?)\s+FROM/is);
    const cols = colsMatch && !colsMatch[1].includes('*') ? colsMatch[1].split(',').map(c => c.trim()) : '*';

    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/is);
    const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/is);
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);

    let query = this.client.from(table).select(cols);

    let paramIdx = 0;
    if (whereMatch) {
      const whereStr = whereMatch[1];
      // Handle BETWEEN
      const betweenMatch = whereStr.match(/(\w+)\s+BETWEEN\s+\?\s+AND\s+\?/i);
      if (betweenMatch) {
        const col = betweenMatch[1];
        query = query.gte(col, params[paramIdx]).lte(col, params[paramIdx + 1]);
        paramIdx += 2;
      } else {
        const whereParts = whereStr.split('AND').map(w => w.trim());
        whereParts.forEach(part => {
          const col = part.split('=')[0].trim();
          const val = params[paramIdx++];
          query = query.eq(col, val);
        });
      }
    }

    if (orderMatch) {
      const asc = orderMatch[2]?.toUpperCase() !== 'DESC';
      query = query.order(orderMatch[1], { ascending: asc });
    }

    if (limitMatch) {
      query = query.limit(parseInt(limitMatch[1]));
    }

    return query.then(({ data, error }) => {
      if (error) console.error('[Supabase SELECT ALL]', error.message);
      return data || [];
    });
  }
}

module.exports = { getSupabase, SupabaseWrapper };
