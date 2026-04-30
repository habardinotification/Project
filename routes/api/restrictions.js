const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_DIR = path.resolve(__dirname, '../../data');
const RESTRICTIONS_FILE = path.join(DATA_DIR, 'restrictions.json');

// التأكد من وجود المجلد والملف
function ensureRestrictionsFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(RESTRICTIONS_FILE)) {
    fs.writeFileSync(RESTRICTIONS_FILE, JSON.stringify([]), 'utf8');
  }
}

// GET /api/restrictions
router.get('/', (req, res) => {
  try {
    ensureRestrictionsFile();
    const data = fs.readFileSync(RESTRICTIONS_FILE, 'utf8');
    const restrictions = JSON.parse(data);
    res.json(Array.isArray(restrictions) ? restrictions : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/restrictions
router.post('/', (req, res) => {
  try {
    ensureRestrictionsFile();
    const newRestrictions = req.body.restrictions || [];
    if (!Array.isArray(newRestrictions)) {
      return res.status(400).json({ error: 'يجب إرسال مصفوفة' });
    }
    fs.writeFileSync(RESTRICTIONS_FILE, JSON.stringify(newRestrictions, null, 2));
    res.json({ success: true, restrictions: newRestrictions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;