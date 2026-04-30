const express = require('express');
const router = express.Router();

// افتراض أن الدوال المساعدة (getOrdersByDay, getDistributionByDay) موجودة في req.app.locals أو سنقوم بحقنها
// ولكن لتبسيط الأمر، سنعيد تعريفها بشكل مبسط هنا (أو نستخدم نفس الدوال من app.js)
// لهذا سنقوم باستدعاء دوال من الـ main app عبر req.app.locals

router.get('/:start/:end', (req, res) => {
  try {
    const start = req.params.start;
    const end = req.params.end;
    const getOrdersByDay = req.app.locals.getOrdersByDay;
    const getDistributionByDay = req.app.locals.getDistributionByDay;
    if (!getOrdersByDay || !getDistributionByDay) {
      return res.status(500).json({ error: 'الخدمة غير متاحة' });
    }
    const result = {};
    let current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      const dateKey = current.toISOString().slice(0,10);
      result[dateKey] = {
        orders: getOrdersByDay(dateKey),
        distribution: getDistributionByDay(dateKey)
      };
      current.setDate(current.getDate() + 1);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;