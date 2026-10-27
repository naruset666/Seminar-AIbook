const { Router } = require('express');

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', require('./auth.routes'));
router.use('/questionnaire', require('./questionnaire.routes'));
router.use('/presets', require('./presets.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/documents', require('./documents.routes'));

module.exports = router;
