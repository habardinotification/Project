const express = require('express');
const router = express.Router();
const { getSettings, saveSettings, normalizeDayKey } = require('../../utils/dbHelpers');

function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
    next();
}

// GET: جلب التوزيعات
router.get('/', requireAuth, (req, res) => {
    try {
        const { date } = req.query;
        const settings = getSettings();
        
        if (date) {
            const dayData = settings.days[normalizeDayKey(date)] || { distribution: [] };
            return res.json(dayData.distribution);
        }
        
        const allDistribution = [];
        Object.keys(settings.days || {}).forEach(dateKey => {
            const distribution = settings.days[dateKey].distribution || [];
            distribution.forEach(dist => {
                allDistribution.push({ ...dist, date_key: dateKey });
            });
        });
        res.json(allDistribution);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: إضافة توزيع
router.post('/', requireAuth, (req, res) => {
    try {
        const { orderId, truck, factory, material, road, date } = req.body;
        const targetDate = normalizeDayKey(date || new Date());
        const settings = getSettings();
        
        if (!settings.days[targetDate]) {
            settings.days[targetDate] = { orders: [], distribution: [] };
        }
        
        const newDistribution = {
            orderId,
            truck,
            factory,
            material,
            road: road || 1,
            distributedAt: new Date().toISOString(),
            distributedBy: req.session.user?.username
        };
        
        settings.days[targetDate].distribution.push(newDistribution);
        saveSettings(settings);
        
        res.status(201).json({ success: true, distribution: newDistribution });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;