const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/settings.controller');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(controller.get));
router.put(
  '/',
  [
    body('current_preset_id').optional({ values: 'null' }).isString(),
    body('layer_settings').optional().isObject().withMessage('layer_settings ต้องเป็น object'),
    body('open_tabs').optional().isArray().withMessage('open_tabs ต้องเป็น array'),
    body('open_tabs.*').optional().isInt({ min: 1 }).toInt(),
    body('active_tab_doc_id').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
  ],
  validate,
  asyncHandler(controller.update)
);

module.exports = router;
