const express = require('express');
const { getDb } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const db = getDb();

const router = express.Router();

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
        'INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, points, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      questions.forEach((q, i) => {
        insert.run(quizId, q.question, q.option_a, q.option_b, q.option_c, q.option_d || '', q.correct_answer, q.points || 1, i);
      });
    }
    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId);
    res.json(quiz);
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
