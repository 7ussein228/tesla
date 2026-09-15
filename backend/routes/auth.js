const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');
const { auth, JWT_SECRET } = require('../middleware/auth');
const db = getDb();

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, stage, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'الاسم والبريد وكلمة المرور مطلوبين' });
    }
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = await db.prepare(
      'INSERT INTO users (name, email, password, role, stage, phone) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, email, hash, role || 'student', stage || '', phone || '');

    const user = await db.prepare('SELECT id, name, email, role, stage, energy FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'البريد وكلمة المرور مطلوبين' });
    }
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }
    await db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await db.prepare('SELECT id, name, email, role, stage, phone, energy, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;