const path = require('path');

// Backend directory
const BACKEND = path.join(__dirname, '..', 'backend');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initDatabase } = require(path.join(BACKEND, 'config', 'database'));

let app;
let dbReady = false;

async function getApp() {
  if (app && dbReady) return app;
  if (!dbReady) {
    await initDatabase();
    dbReady = true;
  }

  app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use('/uploads', (req, res, next) => {
    res.sendFile(path.join(BACKEND, 'uploads', req.path));
  });

  app.use('/api/auth', require(path.join(BACKEND, 'routes', 'auth')));
  app.use('/api/courses', require(path.join(BACKEND, 'routes', 'courses')));
  app.use('/api/quizzes', require(path.join(BACKEND, 'routes', 'quizzes')));
  app.use('/api/homework', require(path.join(BACKEND, 'routes', 'homework')));
  app.use('/api/admin', require(path.join(BACKEND, 'routes', 'admin')));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'خطأ داخلي في الخادم' });
  });

  return app;
}

module.exports = async (req, res) => {
  const application = await getApp();
  return application(req, res);
};
