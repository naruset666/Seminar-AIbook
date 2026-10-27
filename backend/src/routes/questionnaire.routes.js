const { Router } = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/questionnaire.controller');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = Router();
router.use(requireAuth);

const idParam = param('id').isInt({ min: 1 }).toInt().withMessage('รหัสความชอบไม่ถูกต้อง');

router.get('/', controller.getQuestions);
router.post('/', asyncHandler(controller.submit));
router.get('/latest', asyncHandler(controller.latest));
router.get('/history', asyncHandler(controller.history));
router.patch(
  '/:id',
  [
    idParam,
    body('label').optional({ values: 'null' }).isString().trim().isLength({ max: 40 })
      .withMessage('ชื่อ mood ต้องไม่เกิน 40 ตัวอักษร'),
    body('chosen_preset_id').optional().isString(),
  ],
  validate,
  asyncHandler(controller.update)
);
router.delete('/:id', [idParam], validate, asyncHandler(controller.remove));

module.exports = router;
