// routes/api/settings.js
const express = require('express');
const router = express.Router();
const { getSettings, saveSettings } = require('../../utils/dbHelpers');

// Middleware بسيط للتحقق من المصادقة (يمكنك استيراده من ملف منفصل لاحقاً)
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
  next();
}

// GET /api/settings
router.get('/', requireAuth, (req, res) => {
  res.json(getSettings());
});

// POST /api/settings
router.post('/', requireAuth, (req, res) => {
  const newSettings = { ...getSettings(), ...req.body, updatedAt: new Date().toISOString() };
  saveSettings(newSettings);
  res.json({ success: true, settings: newSettings });
});

// PUT /api/settings
router.put('/', requireAuth, (req, res) => {
  const newSettings = { ...getSettings(), ...req.body, updatedAt: new Date().toISOString() };
  saveSettings(newSettings);
  res.json({ success: true, settings: newSettings });
});

module.exports = router;