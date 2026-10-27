const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

// Requires "Authorization: Bearer <token>". Sets req.userId.
function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.userId = Number(payload.sub);
    return next();
  } catch {
    return res.status(401).json({ message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
  }
}

module.exports = { requireAuth };
