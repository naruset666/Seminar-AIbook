const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = Router();

const emailRule = body('email').trim().toLowerCase().isEmail().withMessage('รูปแบบอีเมลไม่ถูกต้อง');

router.post(
  '/register',
  [
    emailRule,
    body('password').isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
    body('display_name').trim().isLength({ min: 1, max: 50 }).withMessage('กรุณากรอกชื่อผู้ใช้ (ไม่เกิน 50 ตัวอักษร)'),
  ],
  validate,
  asyncHandler(controller.register)
);

router.post(
  '/login',
  [emailRule, body('password').notEmpty().withMessage('กรุณากรอกรหัสผ่าน')],
  validate,
  asyncHandler(controller.login)
);

router.get('/me', requireAuth, asyncHandler(controller.me));

module.exports = router;
