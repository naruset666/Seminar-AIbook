const { Router } = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/documents.controller');
const { requireAuth } = require('../middleware/auth');
const { uploadPdfs } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = Router();
router.use(requireAuth);

const idParam = param('id').isInt({ min: 1 }).toInt().withMessage('รหัสเอกสารไม่ถูกต้อง');

router.get('/', asyncHandler(controller.list));
router.post('/', uploadPdfs, asyncHandler(controller.upload));
router.get('/:id/file', [idParam], validate, asyncHandler(controller.streamFile));
router.patch(
  '/:id',
  [
    idParam,
    body('last_page').optional().isInt({ min: 1 }).toInt().withMessage('เลขหน้าไม่ถูกต้อง'),
    body('page_count').optional().isInt({ min: 1 }).toInt().withMessage('จำนวนหน้าไม่ถูกต้อง'),
  ],
  validate,
  asyncHandler(controller.updateProgress)
);
router.delete('/:id', [idParam], validate, asyncHandler(controller.remove));
router.get('/:id/annotations', [idParam], validate, asyncHandler(controller.getAnnotations));
router.put('/:id/annotations', [idParam], validate, asyncHandler(controller.saveAnnotations));

module.exports = router;
