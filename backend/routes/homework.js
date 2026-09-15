const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const db = getDb();

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'sheets')),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// POST /api/homework/submit
router.post('/submit', auth, upload.single('file'), async (req, res) => {
  try {
    const { sheet_id } = req.body;
    if (!sheet_id) return res.status(400).json({ error: 'sheet_id مطلوب' });
    const fileUrl = req.file ? `/uploads/sheets/${req.file.filename}` : '';
    const result = await db.prepare(
      'INSERT INTO homework (student_id, sheet_id, file_url) VALUES (?, ?, ?)'
    ).run(req.user.id, sheet_id, fileUrl);
    const hw = await db.prepare('SELECT * FROM homework WHERE id = ?').get(result.lastInsertRowid);
    res.json(hw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/homework/my
router.get('/my', auth, async (req, res) => {
  try {
    const homework = await db.prepare(`
      SELECT h.*, s.title as sheet_title, c.title as course_title
      FROM homework h
      JOIN sheets s ON h.sheet_id = s.id
      JOIN courses c ON s.course_id = c.id
      WHERE h.student_id = ?
      ORDER BY h.submitted_at DESC
    `).all(req.user.id);
    res.json(homework);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/homework/pending - teacher view pending
router.get('/pending', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const homework = await db.prepare(`
      SELECT h.*, s.title as sheet_title, c.title as course_title, u.name as student_name
      FROM homework h
      JOIN sheets s ON h.sheet_id = s.id
      JOIN courses c ON s.course_id = c.id
      JOIN users u ON h.student_id = u.id
      WHERE c.teacher_id = ? AND h.status = 'submitted'
      ORDER BY h.submitted_at DESC
    `).all(req.user.id);
    res.json(homework);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/homework/:id/grade
router.put('/:id/grade', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    await db.prepare(`
      UPDATE homework SET grade = ?, feedback = ?, status = 'graded', graded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(grade, feedback || '', req.params.id);
    const hw = await db.prepare('SELECT * FROM homework WHERE id = ?').get(req.params.id);
    if (hw) {
      await db.prepare('UPDATE users SET energy = energy + ? WHERE id = ?').run(grade || 0, hw.student_id);
    }
    res.json(hw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;