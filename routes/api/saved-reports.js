const express = require('express');
const router = express.Router();
const { getSettings, saveSettings } = require('../../utils/dbHelpers');

function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
    next();
}

// جلب التقارير المحفوظة
router.get('/', requireAuth, (req, res) => {
    try {
        const settings = getSettings();
        const reports = settings.savedReports || {
            analytics: [],
            cash: [],
            distribution: [],
            quality: [],
            fuel: []
        };
        
        // تجميع جميع التقارير في مصفوفة واحدة
        const allReports = [];
        
        // إضافة التقارير التحليلية
        if (reports.analytics && Array.isArray(reports.analytics)) {
            reports.analytics.forEach(r => allReports.push({ ...r, type: 'analytics' }));
        }
        
        // إضافة التقارير النقدية
        if (reports.cash && Array.isArray(reports.cash)) {
            reports.cash.forEach(r => allReports.push({ ...r, type: 'cash' }));
        }
        
        // إضافة تقارير التوزيع
        if (reports.distribution && Array.isArray(reports.distribution)) {
            reports.distribution.forEach(r => allReports.push({ ...r, type: 'distribution' }));
        }
        
        // إضافة تقارير الجودة
        if (reports.quality && Array.isArray(reports.quality)) {
            reports.quality.forEach(r => allReports.push({ ...r, type: 'quality' }));
        }
        
        // إضافة تقارير الديزل
        if (reports.fuel && Array.isArray(reports.fuel)) {
            reports.fuel.forEach(r => allReports.push({ ...r, type: 'fuel' }));
        }
        
        // ترتيب حسب التاريخ
        allReports.sort((a, b) => new Date(b.savedAt || b.createdAt) - new Date(a.savedAt || a.createdAt));
        
        res.json({ reports: allReports });
    } catch (error) {
        console.error('Error loading saved reports:', error);
        res.status(500).json({ error: error.message, reports: [] });
    }
});

// حفظ تقرير
router.post('/', requireAuth, (req, res) => {
    try {
        const { type, data, title, date } = req.body;
        const settings = getSettings();
        
        if (!settings.savedReports) settings.savedReports = {};
        if (!settings.savedReports[type]) settings.savedReports[type] = [];
        
        const newReport = {
            id: Date.now(),
            title: title || `تقرير ${type} - ${date || new Date().toISOString().split('T')[0]}`,
            data: data,
            date: date || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            savedBy: req.session.user?.username
        };
        
        settings.savedReports[type].unshift(newReport);
        
        // الاحتفاظ فقط بآخر 100 تقرير
        if (settings.savedReports[type].length > 100) settings.savedReports[type].pop();
        
        saveSettings(settings);
        res.json({ success: true, report: newReport });
    } catch (error) {
        console.error('Error saving report:', error);
        res.status(500).json({ error: error.message });
    }
});

// حذف تقرير
router.delete('/:type/:id', requireAuth, (req, res) => {
    try {
        const { type, id } = req.params;
        const settings = getSettings();
        
        if (settings.savedReports && settings.savedReports[type]) {
            settings.savedReports[type] = settings.savedReports[type].filter(r => r.id != id);
            saveSettings(settings);
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;