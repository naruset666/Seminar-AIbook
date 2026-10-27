const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

const signToken = (userId) => jwt.sign({}, jwtSecret, { subject: String(userId), expiresIn: jwtExpiresIn });

async function register(req, res) {
  const { email, password, display_name: displayName } = req.body;

  if (await User.findByEmail(email)) {
    return res.status(409).json({ message: 'อีเมลนี้ถูกใช้สมัครแล้ว' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, displayName });
  return res.status(201).json({ access_token: signToken(user.id), user });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  }

  const { password_hash: _hash, ...publicUser } = user;
  return res.json({ access_token: signToken(user.id), user: publicUser });
}

async function me(req, res) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ message: 'ไม่พบบัญชีผู้ใช้' });
  return res.json({ user });
}

module.exports = { register, login, me };
