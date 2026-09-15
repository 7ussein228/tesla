const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const db = getDb();

const router = express.Router();

// Quiz image upload config
const quizImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'quizzes')),
  filename: (req, file, cb) => cb(null, 'quiz-' + uuidv4() + path.extname(file.originalname))
});
const quizImageUpload = multer({
  storage: quizImageStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext || mime);
  }
});

// POST /api/quizzes/upload-image - upload question image
router.post('/upload-image', auth, authorize('teacher', 'admin'), quizImageUpload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
    res.json({ url: `/uploads/quizzes/${req.file.filename}`, filename: req.file.originalname });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quizzes/course/:courseId
router.get('/course/:courseId', (req, res) => {
  try {
    const quizzes = db.prepare('SELECT * FROM quizzes WHERE course_id = ?').all(req.params.courseId);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quizzes/:id
router.get('/:id', (req, res) => {
  try {
    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'الكويز غير موجود' });
    const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order').all(req.params.id);
    res.json({ ...quiz, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quizzes - teacher creates quiz
router.post('/', auth, authorize('teacher', 'admin'), (req, res) => {
  try {
    const { course_id, title, description, time_limit, passing_score, questions } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id و title مطلوبين' });
    const result = db.prepare(
      'INSERT INTO quizzes (course_id, title, description, time_limit, passing_score) VALUES (?, ?, ?, ?, ?)'
    ).run(course_id, title, description || '', time_limit || 15, passing_score || 60);
    const quizId = result.lastInsertRowid;
    if (questions && Array.isArray(questions)) {
      const insert = db.prepare(
        'INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, points, sort_order, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      questions.forEach((q, i) => {
        insert.run(quizId, q.question || '', q.option_a || '', q.option_b || '', q.option_c || '', q.option_d || '', q.correct_answer || 'A', q.points || 1, i, q.image_url || '');
      });
    }
    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId);
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quizzes/:id/questions - add questions to existing quiz
router.post('/:id/questions', auth, authorize('teacher', 'admin'), (req, res) => {
  try {
    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'الكويز غير موجود' });
    const { questions } = req.body;
    if (!questions || !Array.isArray(questions)) return res.status(400).json({ error: 'الأسئلة مطلوبة' });
    const existingCount = db.prepare('SELECT COUNT(*) as cnt FROM quiz_questions WHERE quiz_id = ?').get(req.params.id).cnt;
    const insert = db.prepare(
      'INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, points, sort_order, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    questions.forEach((q, i) => {
      insert.run(req.params.id, q.question || '', q.option_a || '', q.option_b || '', q.option_c || '', q.option_d || '', q.correct_answer || 'A', q.points || 1, existingCount + i, q.image_url || '');
    });
    const updatedQuiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
    const allQuestions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order').all(req.params.id);
    res.json({ ...updatedQuiz, questions: allQuestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/quizzes/:quizId/questions/:questionId - delete a question
router.delete('/:quizId/questions/:questionId', auth, authorize('teacher', 'admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM quiz_questions WHERE id = ? AND quiz_id = ?').run(req.params.questionId, req.params.quizId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quizzes/:id/submit
router.post('/:id/submit', auth, (req, res) => {
  try {
    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'الكويز غير موجود' });
    const { answers } = req.body;
    const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ?').all(req.params.id);
    let score = 0;
    let totalPoints = 0;
    const results = questions.map(q => {
      totalPoints += q.points;
      const userAnswer = answers[q.id] || '';
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) score += q.points;
      return { id: q.id, correct: isCorrect, correct_answer: q.correct_answer };
    });
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    db.prepare(
      'INSERT INTO quiz_attempts (student_id, quiz_id, score, total_points, answers, completed_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).run(req.user.id, req.params.id, percentage, totalPoints, JSON.stringify(answers));
    // Add energy
    if (percentage >= quiz.passing_score) {
      db.prepare('UPDATE users SET energy = energy + ? WHERE id = ?').run(percentage, req.user.id);
    }
    res.json({ score: percentage, total_points: totalPoints, passed: percentage >= quiz.passing_score, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quizzes/:id/attempts - teacher view attempts
router.get('/:id/attempts', auth, authorize('teacher', 'admin'), (req, res) => {
  try {
    const attempts = db.prepare(`
      SELECT qa.*, u.name as student_name
      FROM quiz_attempts qa JOIN users u ON qa.student_id = u.id
      WHERE qa.quiz_id = ?
      ORDER BY qa.completed_at DESC
    `).all(req.params.id);
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
