const express = require('express');
const router = express.Router();
const { getDriversData } = require('../../utils/dbHelpers');

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
  next();
}

router.get('/', requireAuth, (req, res) => {
  const drivers = getDriversData();
  res.json(drivers);
});

module.exports = router;