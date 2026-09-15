const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'newton-platform-secret-key-2026';

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح - سجل دخول أولاً' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'توكن غير صالح' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'غير مصرح بهذه العملية' });
    }
    next();
  };
}

module.exports = { auth, authorize, JWT_SECRET };
