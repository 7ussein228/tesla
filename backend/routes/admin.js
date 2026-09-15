const express = require('express');
const { getDb } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const db = getDb();

const router = express.Router();

// GET /api/admin/stats
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const students = (await db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'student'").get()).cnt;
    const teachers = (await db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'teacher'").get()).cnt;
    const courses = (await db.prepare('SELECT COUNT(*) as cnt FROM courses').get()).cnt;
    const publishedCourses = (await db.prepare('SELECT COUNT(*) as cnt FROM courses WHERE is_published = 1').get()).cnt;
    const enrollments = (await db.prepare('SELECT COUNT(*) as cnt FROM enrollments').get()).cnt;
    const quizAttempts = (await db.prepare('SELECT COUNT(*) as cnt FROM quiz_attempts').get()).cnt;
    const homeworkCount = (await db.prepare('SELECT COUNT(*) as cnt FROM homework').get()).cnt;
    const pendingHomework = (await db.prepare("SELECT COUNT(*) as cnt FROM homework WHERE status = 'submitted'").get()).cnt;
    const totalEnergy = (await db.prepare('SELECT COALESCE(SUM(energy), 0) as total FROM users').get()).total;
    const recentUsers = await db.prepare('SELECT id, name, email, role, stage, created_at FROM users ORDER BY created_at DESC LIMIT 10').all();
    res.json({ students, teachers, courses, publishedCourses, enrollments, quizAttempts, homeworkCount, pendingHomework, totalEnergy, recentUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = 'SELECT id, name, email, role, stage, phone, energy, created_at, last_login FROM users WHERE 1=1';
    const params = [];
    if (role && role !== 'all') { query += ' AND role = ?'; params.push(role); }
    if (search) { query += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY created_at DESC';
    const users = await db.prepare(query).all(...params);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, stage } = req.body;
    if (role) await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
    if (stage !== undefined) await db.prepare('UPDATE users SET stage = ? WHERE id = ?').run(stage, req.params.id);
    const user = await db.prepare('SELECT id, name, email, role, stage, energy FROM users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'تم حذف المستخدم' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/courses
router.get('/courses', auth, authorize('admin'), async (req, res) => {
  try {
    const courses = await db.prepare(`
      SELECT c.*, u.name as teacher_name,
        (SELECT COUNT(*) FROM lectures WHERE course_id = c.id) as lecture_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
      FROM courses c LEFT JOIN users u ON c.teacher_id = u.id
      ORDER BY c.created_at DESC
    `).all();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaders = await db.prepare(`
      SELECT id, name, energy, stage FROM users WHERE role = 'student'
      ORDER BY energy DESC LIMIT 20
    `).all();
    res.json(leaders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;