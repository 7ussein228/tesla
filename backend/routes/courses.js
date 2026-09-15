const express = require('express');
const { getDb } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const db = getDb();

const router = express.Router();

// GET /api/courses - all published courses
router.get('/', (req, res) => {
  try {
    const { stage } = req.query;
    let courses;
    if (stage && stage !== 'all') {
      courses = db.prepare(`
        SELECT c.*, u.name as teacher_name,
          (SELECT COUNT(*) FROM lectures WHERE course_id = c.id) as lecture_count,
          (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
        FROM courses c LEFT JOIN users u ON c.teacher_id = u.id
        WHERE c.is_published = 1 AND c.stage = ?
        ORDER BY c.created_at DESC
      `).all(stage);
    } else {
      courses = db.prepare(`
        SELECT c.*, u.name as teacher_name,
          (SELECT COUNT(*) FROM lectures WHERE course_id = c.id) as lecture_count,
          (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
        FROM courses c LEFT JOIN users u ON c.teacher_id = u.id
        WHERE c.is_published = 1
        ORDER BY c.created_at DESC
      `).all();
    }
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:id
router.get('/:id', (req, res) => {
  try {
    const course = db.prepare(`
      SELECT c.*, u.name as teacher_name
      FROM courses c LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `).get(req.params.id);
    if (!course) return res.status(404).json({ error: 'الكورس غير موجود' });

    const lectures = db.prepare('SELECT * FROM lectures WHERE course_id = ? ORDER BY sort_order').all(req.params.id);
    const quizzes = db.prepare('SELECT * FROM quizzes WHERE course_id = ?').all(req.params.id);
    const sheets = db.prepare('SELECT * FROM sheets WHERE course_id = ?').all(req.params.id);

    res.json({ ...course, lectures, quizzes, sheets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses - teacher creates course
router.post('/', auth, authorize('teacher', 'admin'), (req, res) => {
  try {
    const { title, description, stage, price } = req.body;
    if (!title || !stage) return res.status(400).json({ error: 'اسم الكورس والمرحلة مطلوبين' });
    const result = db.prepare(
      'INSERT INTO courses (title, description, stage, price, teacher_id, is_published) VALUES (?, ?, ?, ?, ?, 1)'
    ).run(title, description || '', stage, price || 0, req.user.id);
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/courses/:id
router.put('/:id', auth, authorize('teacher', 'admin'), (req, res) => {
  try {
    const { title, description, stage, price, is_published } = req.body;
    db.prepare(`
      UPDATE courses SET title = COALESCE(?, title), description = COALESCE(?, description),
      stage = COALESCE(?, stage), price = COALESCE(?, price), is_published = COALESCE(?, is_published)
      WHERE id = ?
    `).run(title, description, stage, price, is_published, req.params.id);
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/courses/:id
router.delete('/:id', auth, authorize('teacher', 'admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
    res.json({ message: 'تم حذف الكورس' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses/:id/enroll
router.post('/:id/enroll', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?').get(req.user.id, req.params.id);
    if (existing) return res.status(409).json({ error: 'أنت مسجل بالفعل في هذا الكورس' });
    db.prepare('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)').run(req.user.id, req.params.id);
    res.json({ message: 'تم التسجيل بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/my/enrolled
router.get('/my/enrolled', auth, (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT c.*, e.progress, e.enrolled_at,
        (SELECT COUNT(*) FROM lectures WHERE course_id = c.id) as lecture_count
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `).all(req.user.id);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/teacher/my-courses
router.get('/teacher/my-courses', auth, authorize('teacher'), (req, res) => {
  try {
    const courses = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM lectures WHERE course_id = c.id) as lecture_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
      FROM courses c WHERE c.teacher_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user.id);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses/:id/lectures
router.post('/:id/lectures', auth, authorize('teacher', 'admin'), (req, res) => {
  try {
    const { title, description, video_url, duration, sort_order, is_free } = req.body;
    if (!title) return res.status(400).json({ error: 'عنوان المحاضرة مطلوب' });
    const result = db.prepare(
      'INSERT INTO lectures (course_id, title, description, video_url, duration, sort_order, is_free) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.params.id, title, description || '', video_url || '', duration || 0, sort_order || 0, is_free || 0);
    const lecture = db.prepare('SELECT * FROM lectures WHERE id = ?').get(result.lastInsertRowid);
    res.json(lecture);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lectures/:id/progress
router.post('/lectures/:id/progress', auth, (req, res) => {
  try {
    const { watched_seconds, completed } = req.body;
    const existing = db.prepare('SELECT id FROM lecture_progress WHERE student_id = ? AND lecture_id = ?').get(req.user.id, req.params.id);
    if (existing) {
      db.prepare(`
        UPDATE lecture_progress SET watched_seconds = ?, completed = ?,
        completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE student_id = ? AND lecture_id = ?
      `).run(watched_seconds || 0, completed || 0, completed || 0, req.user.id, req.params.id);
    } else {
      db.prepare(
        'INSERT INTO lecture_progress (student_id, lecture_id, watched_seconds, completed, completed_at) VALUES (?, ?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)'
      ).run(req.user.id, req.params.id, watched_seconds || 0, completed || 0, completed || 0);
    }
    // Update enrollment progress
    const lecture = db.prepare('SELECT course_id FROM lectures WHERE id = ?').get(req.params.id);
    if (lecture) {
      const total = db.prepare('SELECT COUNT(*) as cnt FROM lectures WHERE course_id = ?').get(lecture.course_id);
      const done = db.prepare(`
        SELECT COUNT(*) as cnt FROM lecture_progress lp
        JOIN lectures l ON lp.lecture_id = l.id
        WHERE l.course_id = ? AND lp.student_id = ? AND lp.completed = 1
      `).get(lecture.course_id, req.user.id);
      const progress = total.cnt > 0 ? Math.round((done.cnt / total.cnt) * 100) : 0;
      db.prepare('UPDATE enrollments SET progress = ? WHERE student_id = ? AND course_id = ?').run(progress, req.user.id, lecture.course_id);
      // Add energy if completed
      if (completed) {
        db.prepare('UPDATE users SET energy = energy + 50 WHERE id = ?').run(req.user.id);
      }
    }
    res.json({ message: 'تم تحديث التقدم' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
