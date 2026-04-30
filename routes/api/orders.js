const express = require('express');
const router = express.Router();
const { getSettings, saveSettings, normalizeDayKey } = require('../../utils/dbHelpers');

function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
    next();
}

// GET: جلب الطلبات
router.get('/', requireAuth, (req, res) => {
    try {
        const { date } = req.query;
        const settings = getSettings();
        
        if (date) {
            const dayData = settings.days[normalizeDayKey(date)] || { orders: [] };
            return res.json(dayData.orders);
        }
        
        const allOrders = [];
        Object.keys(settings.days || {}).forEach(dateKey => {
            const orders = settings.days[dateKey].orders || [];
            orders.forEach(order => {
                allOrders.push({ ...order, date_key: dateKey });
            });
        });
        res.json(allOrders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: إضافة طلب
router.post('/', requireAuth, (req, res) => {
    try {
        const { factory, material, quantity, deliveryDate } = req.body;
        const targetDate = normalizeDayKey(deliveryDate || new Date());
        const settings = getSettings();
        
        if (!settings.days[targetDate]) {
            settings.days[targetDate] = { orders: [], distribution: [] };
        }
        
        const newOrder = {
            id: Date.now(),
            factory,
            material,
            quantity: quantity || 1,
            createdAt: new Date().toISOString(),
            createdBy: req.session.user?.username
        };
        
        settings.days[targetDate].orders.push(newOrder);
        saveSettings(settings);
        
        res.status(201).json({ success: true, order: newOrder });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE: حذف طلب
router.delete('/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const settings = getSettings();
        let found = false;
        
        Object.keys(settings.days || {}).forEach(date => {
            const orders = settings.days[date].orders || [];
            const index = orders.findIndex(o => o.id == id);
            if (index !== -1) {
                orders.splice(index, 1);
                settings.days[date].orders = orders;
                saveSettings(settings);
                found = true;
            }
        });
        
        if (!found) return res.status(404).json({ error: 'الطلب غير موجود' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;