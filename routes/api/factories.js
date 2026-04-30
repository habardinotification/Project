const express = require('express');
const router = express.Router();
const { getFactoriesData } = require('../../utils/dbHelpers');

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
  next();
}

router.get('/', requireAuth, (req, res) => {
  const factories = getFactoriesData();
  res.json(factories);
});

module.exports = router;