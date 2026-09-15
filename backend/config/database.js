const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'newton.db');
let db = null;

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const useSupabase = !!process.env.SUPABASE_URL;

class DatabaseWrapper {
  constructor(sqlDb) { this.sqlDb = sqlDb; }

  exec(sql) {
    this.sqlDb.run(sql);
    this.save();
  }

  pragma(str) {
    try { this.sqlDb.run(`PRAGMA ${str}`); } catch (e) {}
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self.sqlDb.run(sql, params);
        self.save();
        const lastInsert = self.sqlDb.exec('SELECT last_insert_rowid() as id');
        const lastInsertRowid = lastInsert.length ? lastInsert[0].values[0][0] : 0;
        const changes = self.sqlDb.getRowsModified();
        return { lastInsertRowid, changes };
      },
      get(...params) {
        const stmt = self.sqlDb.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const results = [];
        const stmt = self.sqlDb.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          results.push(row);
        }
        stmt.free();
        return results;
      }
    };
  }

  save() {
    if (isVercel) return; // Skip file writes on Vercel
    try {
      const data = this.sqlDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (e) { /* read-only filesystem */ }
  }
}

async function initDatabase() {
  // Use Supabase if configured
  if (useSupabase) {
    const { getSupabase, SupabaseWrapper } = require('./supabase');
    db = new SupabaseWrapper(getSupabase());
    console.log('✅ Using Supabase database');
    return db;
  }

  // Otherwise use SQLite (sql.js)
  const SQL = await initSqlJs();

  if (!isVercel && fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new DatabaseWrapper(new SQL.Database(fileBuffer));
  } else {
    db = new DatabaseWrapper(new SQL.Database());
  }

  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('student','teacher','admin')) DEFAULT 'student',
      stage TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      energy INTEGER DEFAULT 0,
      avatar TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      stage TEXT NOT NULL,
      price INTEGER DEFAULT 0,
      teacher_id INTEGER REFERENCES users(id),
      thumbnail TEXT DEFAULT '',
      is_published INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS lectures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      video_url TEXT DEFAULT '',
      duration INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_free INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES users(id),
      course_id INTEGER REFERENCES courses(id),
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      progress INTEGER DEFAULT 0,
      UNIQUE(student_id, course_id)
    );
    CREATE TABLE IF NOT EXISTS lecture_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES users(id),
      lecture_id INTEGER REFERENCES lectures(id),
      completed INTEGER DEFAULT 0,
      watched_seconds INTEGER DEFAULT 0,
      completed_at DATETIME,
      UNIQUE(student_id, lecture_id)
    );
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      time_limit INTEGER DEFAULT 15,
      passing_score INTEGER DEFAULT 60,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT DEFAULT '',
      correct_answer TEXT NOT NULL,
      points INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      image_url TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES users(id),
      quiz_id INTEGER REFERENCES quizzes(id),
      score INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      answers TEXT DEFAULT '{}',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );
    CREATE TABLE IF NOT EXISTS sheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      file_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS homework (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES users(id),
      sheet_id INTEGER REFERENCES sheets(id),
      file_url TEXT DEFAULT '',
      grade INTEGER DEFAULT NULL,
      feedback TEXT DEFAULT '',
      status TEXT CHECK(status IN ('submitted','graded','returned')) DEFAULT 'submitted',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      graded_at DATETIME
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES users(id),
      course_id INTEGER REFERENCES courses(id),
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      certificate_code TEXT UNIQUE NOT NULL
    );
  `);

  // Migration: add image_url to quiz_questions if missing
  try {
    db.exec(`ALTER TABLE quiz_questions ADD COLUMN image_url TEXT DEFAULT ''`);
  } catch (e) { /* column already exists */ }

  // Seed data on Vercel (in-memory DB is empty each cold start)
  if (isVercel && !useSupabase) {
    try { require(path.join(__dirname, '..', 'seed'))(db); } catch(e) {}
  }

  // Seed Supabase if empty
  if (useSupabase) {
    try { await require(path.join(__dirname, '..', 'seed-supabase'))(); } catch(e) { console.error('Supabase seed error:', e.message); }
  }

  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

module.exports = { initDatabase, getDb };
