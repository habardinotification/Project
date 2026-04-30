// routes/api/cash-report.js
const express = require('express');
const router = express.Router();
const { getSettings, saveSettings } = require('../../utils/dbHelpers');

function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
    next();
}

router.post('/save', requireAuth, (req, res) => {
    try {
        const { date, data, summary } = req.body;
        const settings = getSettings();
        if (!settings.savedReports) settings.savedReports = {};
        if (!settings.savedReports.cash) settings.savedReports.cash = [];
        
        settings.savedReports.cash.unshift({
            id: Date.now(),
            title: `تقرير نقدي - ${date}`,
            date,
            data,
            summary,
            savedAt: new Date().toISOString(),
            savedBy: req.session.user?.username
        });
        
        saveSettings(settings);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;