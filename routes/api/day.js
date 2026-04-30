const express = require('express');
const router = express.Router();
const { 
    getSettings, 
    saveSettings, 
    normalizeDayKey,
    safeAll,
    safeRun,
    tableExists,
    insertFlexibleRow
} = require('../../utils/dbHelpers');

function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
    next();
}

// GET: جلب بيانات يوم معين
router.get('/:date', requireAuth, (req, res) => {
    try {
        const date = normalizeDayKey(req.params.date);
        const settings = getSettings();
        const dayData = settings.days[date] || { orders: [], distribution: [] };
        res.json(dayData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT: تحديث بيانات يوم معين
router.put('/:date', requireAuth, (req, res) => {
    try {
        const date = normalizeDayKey(req.params.date);
        const { orders, distribution } = req.body;
        const settings = getSettings();
        
        if (!settings.days[date]) {
            settings.days[date] = { orders: [], distribution: [] };
        }
        settings.days[date].orders = orders || [];
        settings.days[date].distribution = distribution || [];
        saveSettings(settings);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;