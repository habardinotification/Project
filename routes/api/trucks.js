const express = require('express');
const router = express.Router();
const { getTrucksData, insertFlexibleRow, safeRun, quoteId, tableExists, getTableColumns } = require('../../utils/dbHelpers');

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
  next();
}

router.get('/', requireAuth, (req, res) => {
  const trucks = getTrucksData();
  res.json(trucks);
});

router.post('/', requireAuth, (req, res) => {
  const { truck_number, driver_name, truck_type, status, plate_number, model } = req.body;
  if (!truck_number) return res.status(400).json({ error: 'رقم السيارة مطلوب' });
  const inserted = insertFlexibleRow('trucks', {
    truck_number, driver_name, truck_type, status, plate_number, model,
    created_at: new Date().toISOString()
  });
  if (inserted) res.json({ success: true });
  else res.status(500).json({ error: 'فشل الإضافة' });
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  if (tableExists('trucks') && getTableColumns('trucks').includes('id')) {
    safeRun(`DELETE FROM ${quoteId('trucks')} WHERE ${quoteId('id')} = ?`, [id]);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'السيارة غير موجودة' });
  }
});

module.exports = router;