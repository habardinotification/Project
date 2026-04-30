const express = require('express');
const router = express.Router();
const { getSettings, saveSettings } = require('../../utils/dbHelpers');

function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
    next();
}

// جلب جميع التقارير
router.get('/all', requireAuth, (req, res) => {
    try {
        const settings = getSettings();
        const reports = {
            analytics: settings.savedReports?.analytics || [],
            cash: settings.savedReports?.cash || [],
            distribution: settings.savedReports?.distribution || [],
            quality: settings.savedReports?.quality || []
        };
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حفظ تقرير تحليلي
router.post('/save-analytics', requireAuth, (req, res) => {
    try {
        const settings = getSettings();
        if (!settings.savedReports) settings.savedReports = {};
        if (!settings.savedReports.analytics) settings.savedReports.analytics = [];
        
        const newReport = req.body;
        newReport.savedAt = new Date().toISOString();
        newReport.savedBy = req.session.user?.username;
        
        settings.savedReports.analytics.unshift(newReport);
        if (settings.savedReports.analytics.length > 100) settings.savedReports.analytics.pop();
        
        saveSettings(settings);
        res.json({ success: true, message: 'تم حفظ التقرير' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حفظ تقرير نقدي
router.post('/save-cash', requireAuth, (req, res) => {
    try {
        const settings = getSettings();
        if (!settings.savedReports) settings.savedReports = {};
        if (!settings.savedReports.cash) settings.savedReports.cash = [];
        
        const newReport = req.body;
        newReport.savedAt = new Date().toISOString();
        newReport.savedBy = req.session.user?.username;
        
        settings.savedReports.cash.unshift(newReport);
        if (settings.savedReports.cash.length > 100) settings.savedReports.cash.pop();
        
        saveSettings(settings);
        res.json({ success: true, message: 'تم حفظ التقرير النقدي' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حفظ تقرير توزيع
router.post('/save-distribution', requireAuth, (req, res) => {
    try {
        const settings = getSettings();
        if (!settings.savedReports) settings.savedReports = {};
        if (!settings.savedReports.distribution) settings.savedReports.distribution = [];
        
        const newReport = req.body;
        newReport.savedAt = new Date().toISOString();
        newReport.savedBy = req.session.user?.username;
        
        settings.savedReports.distribution.unshift(newReport);
        saveSettings(settings);
        res.json({ success: true, message: 'تم حفظ التقرير' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حفظ تقرير جودة
router.post('/save-quality', requireAuth, (req, res) => {
    try {
        const settings = getSettings();
        if (!settings.savedReports) settings.savedReports = {};
        if (!settings.savedReports.quality) settings.savedReports.quality = [];
        
        const newReport = req.body;
        newReport.savedAt = new Date().toISOString();
        newReport.savedBy = req.session.user?.username;
        
        settings.savedReports.quality.unshift(newReport);
        saveSettings(settings);
        res.json({ success: true, message: 'تم حفظ التقرير' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حذف تقرير
router.delete('/:type/:index', requireAuth, (req, res) => {
    try {
        const { type, index } = req.params;
        const settings = getSettings();
        
        if (settings.savedReports && settings.savedReports[type]) {
            settings.savedReports[type].splice(parseInt(index), 1);
            saveSettings(settings);
        }
        
        res.json({ success: true, message: 'تم حذف التقرير' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;