const { Router } = require('express');
const controller = require('../controllers/presets.controller');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = Router();

router.get('/', requireAuth, asyncHandler(controller.list));

module.exports = router;
