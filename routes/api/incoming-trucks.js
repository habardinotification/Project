const express = require('express');
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
  next();
}

router.get('/', requireAuth, (req, res) => {
  try {
    const db = req.app.locals.db;
    const rows = db.prepare(`SELECT * FROM incoming_trucks WHERE assigned = 0 ORDER BY detected_at DESC`).all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/arrived', requireAuth, (req, res) => {
  try {
    const db = req.app.locals.db;
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const rows = db.prepare(`
      SELECT * FROM incoming_trucks 
      WHERE expected_arrival IS NOT NULL 
        AND expected_arrival <= datetime('now')
        AND detected_at >= ?
      ORDER BY expected_arrival DESC
    `).all(twoDaysAgo);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/distributed', requireAuth, (req, res) => {
  try {
    const db = req.app.locals.db;
    const todayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z';
    const rows = db.prepare(`
      SELECT * FROM incoming_trucks 
      WHERE assigned = 1 AND datetime(created_at) >= datetime(?)
      ORDER BY created_at DESC
    `).all(todayStart);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/manual', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const { truckNumber } = req.body;
  if (!truckNumber) return res.status(400).json({ error: 'رقم السيارة مطلوب' });
  const now = new Date();
  const expected = new Date(now.getTime() + 30 * 60000);
  db.prepare(`INSERT INTO incoming_trucks (truck_number, driver_name, detected_at, expected_arrival, assigned) VALUES (?,?,?,?,0)`)
    .run(truckNumber, 'إدخال يدوي', now.toISOString(), expected.toISOString());
  res.json({ success: true });
});

router.post('/assign', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const { truckId } = req.body;
  if (!truckId) return res.status(400).json({ error: 'معرف السيارة مطلوب' });
  const result = db.prepare(`UPDATE incoming_trucks SET assigned = 1 WHERE id = ? AND assigned = 0`).run(truckId);
  if (result.changes === 0) return res.status(404).json({ error: 'السيارة غير موجودة أو موزعة مسبقاً' });
  res.json({ success: true });
});

router.post('/ignore-suggestion', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const { truckId, reason } = req.body;
  if (!truckId) return res.status(400).json({ error: 'معرف السيارة مطلوب' });
  const truck = db.prepare(`SELECT truck_number FROM incoming_trucks WHERE id = ?`).get(truckId);
  if (!truck) return res.status(404).json({ error: 'السيارة غير موجودة' });
  db.prepare(`INSERT OR IGNORE INTO incoming_rejects (truck_id, truck_number, reason) VALUES (?,?,?)`)
    .run(truckId, truck.truck_number, reason || 'بدون سبب');
  res.json({ success: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const result = db.prepare(`DELETE FROM incoming_trucks WHERE id = ?`).run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'غير موجودة' });
  res.json({ success: true });
});

module.exports = router;