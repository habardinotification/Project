const express = require('express');
const router = express.Router();
const { 
    tableExists,
    safeAll,
    safeGet,
    normalizeDayKey,
    getSettings
} = require('../../utils/dbHelpers');

function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
    next();
}

// ======================
// GET: تقرير جودة التوزيع ليوم محدد
// ======================
router.get('/:date', requireAuth, (req, res) => {
    try {
        const date = normalizeDayKey(req.params.date);
        const result = {
            date: date,
            summary: {
                totalDistributions: 0,
                autoDistributions: 0,
                manualDistributions: 0,
                rejectedCount: 0,
                cancelledCount: 0,
                qualityScore: 100,
                qualityLevel: '',
                qualityIcon: ''
            },
            manualDistributions: [],
            rejectedDistributions: [],
            cancelledDistributions: []
        };
        
        // جلب التوزيعات اليدوية من جدول distribution
        if (tableExists('distribution')) {
            const manualDists = safeAll(
                `SELECT * FROM distribution WHERE date_key = ? AND (manual_override = 1 OR manual_override = '1') ORDER BY created_at DESC`,
                [date]
            );
            
            result.manualDistributions = manualDists.map(d => ({
                orderId: d.order_id,
                truckNumber: d.truck_number,
                driverName: d.driver_name || 'غير محدد',
                factory: d.factory,
                material: d.material,
                reason: d.override_reason || 'تم التوزيع يدوياً بدون سبب محدد',
                createdBy: d.created_by || 'غير معروف',
                createdAt: d.created_at,
                type: 'manual'
            }));
            result.summary.manualDistributions = manualDists.length;
            
            // جلب التوزيعات التلقائية
            const autoDists = safeAll(
                `SELECT * FROM distribution WHERE date_key = ? AND (manual_override = 0 OR manual_override IS NULL OR manual_override = '0') ORDER BY created_at DESC`,
                [date]
            );
            result.summary.autoDistributions = autoDists.length;
            result.summary.totalDistributions = result.summary.autoDistributions + result.summary.manualDistributions;
        }
        
        // محاولة جلب الرفض من جدول rejected_distributions (إذا كان موجوداً)
        if (tableExists('rejected_distributions')) {
            const rejects = safeAll(
                `SELECT * FROM rejected_distributions WHERE date_key = ? ORDER BY rejected_at DESC`,
                [date]
            );
            result.rejectedDistributions = rejects.map(r => ({
                truck_id: r.truck_id,
                reason: r.reason || 'غير محدد',
                rejected_by: r.rejected_by || 'غير معروف',
                rejected_at: r.rejected_at,
                date_key: r.date_key,
                type: 'reject'
            }));
            result.summary.rejectedCount = rejects.length;
        }
        
        // محاولة جلب الإلغاءات من جدول cancelled_distributions (إذا كان موجوداً)
        if (tableExists('cancelled_distributions')) {
            const cancels = safeAll(
                `SELECT * FROM cancelled_distributions WHERE date_key = ? ORDER BY cancelled_at DESC`,
                [date]
            );
            result.cancelledDistributions = cancels.map(c => ({
                order_id: c.order_id,
                reason: c.reason || 'غير محدد',
                cancelled_by: c.cancelled_by || 'غير معروف',
                cancelled_at: c.cancelled_at,
                date_key: c.date_key,
                type: 'cancel'
            }));
            result.summary.cancelledCount = cancels.length;
        }
        
        // إذا لم توجد جداول للمخالفات، نحاول استخراج المخالفات من settings.json
        if (!tableExists('rejected_distributions') && !tableExists('cancelled_distributions')) {
            const settings = getSettings();
            const dayData = settings.days[date] || { orders: [], distribution: [] };
            
            // استخراج التوزيعات اليدوية من settings
            const manualFromSettings = (dayData.distribution || []).filter(d => d.manualOverride === true);
            manualFromSettings.forEach(d => {
                result.manualDistributions.push({
                    orderId: d.orderId,
                    truckNumber: d.truck?.number || '',
                    driverName: d.truck?.driver || '',
                    factory: d.factory,
                    material: d.material,
                    reason: d.overrideReason || 'تم التوزيع يدوياً',
                    createdBy: d.distributedBy || 'غير معروف',
                    createdAt: d.distributedAt || new Date().toISOString(),
                    type: 'manual'
                });
            });
            result.summary.manualDistributions = manualFromSettings.length;
            
            // حساب التوزيعات التلقائية
            const autoFromSettings = (dayData.distribution || []).filter(d => !d.manualOverride);
            result.summary.autoDistributions = autoFromSettings.length;
            result.summary.totalDistributions = (dayData.distribution || []).length;
        }
        
        // حساب درجة الجودة
        let qualityScore = 100;
        qualityScore -= result.summary.manualDistributions * 5;  // كل توزيع يدوي ينقص 5 درجات
        qualityScore -= result.summary.rejectedCount * 3;       // كل رفض ينقص 3 درجات
        qualityScore -= result.summary.cancelledCount * 4;      // كل إلغاء ينقص 4 درجات
        result.summary.qualityScore = Math.max(0, Math.min(100, qualityScore));
        
        // تحديد مستوى الجودة
        if (result.summary.qualityScore >= 90) {
            result.summary.qualityLevel = 'ممتاز';
            result.summary.qualityIcon = '🌟';
        } else if (result.summary.qualityScore >= 75) {
            result.summary.qualityLevel = 'جيد';
            result.summary.qualityIcon = '👍';
        } else if (result.summary.qualityScore >= 60) {
            result.summary.qualityLevel = 'مقبول';
            result.summary.qualityIcon = '⚠️';
        } else {
            result.summary.qualityLevel = 'ضعيف - يحتاج تحسين';
            result.summary.qualityIcon = '❌';
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('خطأ في جلب تقرير الجودة:', error);
        res.status(500).json({ error: 'خطأ في جلب تقرير الجودة: ' + error.message });
    }
});

// ======================
// GET: تقرير جودة لفترة زمنية
// ======================
router.get('/range/:start/:end', requireAuth, (req, res) => {
    try {
        const start = normalizeDayKey(req.params.start);
        const end = normalizeDayKey(req.params.end);
        
        const result = {
            start,
            end,
            dailyReports: {},
            totalSummary: {
                totalDistributions: 0,
                autoDistributions: 0,
                manualDistributions: 0,
                rejectedCount: 0,
                cancelledCount: 0,
                averageQuality: 0,
                daysCount: 0
            }
        };
        
        let current = new Date(start);
        const endDate = new Date(end);
        let totalQuality = 0;
        let daysCount = 0;
        
        while (current <= endDate) {
            const dateKey = current.toISOString().slice(0, 10);
            
            // جلب بيانات كل يوم
            if (tableExists('distribution')) {
                const distributions = safeAll(`SELECT * FROM distribution WHERE date_key = ?`, [dateKey]);
                const manualCount = distributions.filter(d => d.manual_override === 1 || d.manual_override === '1').length;
                const autoCount = distributions.length - manualCount;
                
                result.dailyReports[dateKey] = {
                    total: distributions.length,
                    auto: autoCount,
                    manual: manualCount,
                    qualityScore: 100 - (manualCount * 5)
                };
                
                result.totalSummary.totalDistributions += distributions.length;
                result.totalSummary.autoDistributions += autoCount;
                result.totalSummary.manualDistributions += manualCount;
                totalQuality += (100 - (manualCount * 5));
                daysCount++;
            }
            
            // جلب بيانات الرفض والإلغاء من الجداول إذا وجدت
            if (tableExists('rejected_distributions')) {
                const rejects = safeAll(`SELECT * FROM rejected_distributions WHERE date_key = ?`, [dateKey]);
                result.totalSummary.rejectedCount += rejects.length;
                totalQuality -= rejects.length * 3;
            }
            
            if (tableExists('cancelled_distributions')) {
                const cancels = safeAll(`SELECT * FROM cancelled_distributions WHERE date_key = ?`, [dateKey]);
                result.totalSummary.cancelledCount += cancels.length;
                totalQuality -= cancels.length * 4;
            }
            
            current.setDate(current.getDate() + 1);
        }
        
        result.totalSummary.averageQuality = daysCount > 0 ? Math.max(0, totalQuality / daysCount) : 0;
        result.totalSummary.daysCount = daysCount;
        
        res.json(result);
        
    } catch (error) {
        console.error('خطأ في جلب تقرير الجودة للفترة:', error);
        res.status(500).json({ error: 'خطأ في جلب تقرير الجودة للفترة' });
    }
});

// ======================
// POST: تسجيل رفض توزيع
// ======================
router.post('/reject', requireAuth, (req, res) => {
    try {
        const { truckId, reason, date } = req.body;
        
        if (!truckId || !reason) {
            return res.status(400).json({ error: 'معرف السيارة والسبب مطلوبان' });
        }
        
        const targetDate = normalizeDayKey(date || new Date());
        
        // محاولة حفظ في قاعدة البيانات
        if (tableExists('rejected_distributions')) {
            const stmt = db.prepare(`
                INSERT INTO rejected_distributions (truck_id, reason, rejected_by, rejected_at, date_key)
                VALUES (?, ?, ?, ?, ?)
            `);
            stmt.run(truckId, reason, req.session.user?.username || 'unknown', new Date().toISOString(), targetDate);
        } else {
            // إذا لم يوجد جدول، نسجل في console فقط
            console.log(`📝 رفض توزيع: سيارة ${truckId}, السبب: ${reason}, التاريخ: ${targetDate}`);
        }
        
        res.json({ success: true, message: 'تم تسجيل رفض التوزيع' });
        
    } catch (error) {
        console.error('خطأ في تسجيل رفض التوزيع:', error);
        res.status(500).json({ error: 'خطأ في تسجيل رفض التوزيع' });
    }
});

// ======================
// POST: تسجيل إلغاء توزيع
// ======================
router.post('/cancel', requireAuth, (req, res) => {
    try {
        const { orderId, reason, date } = req.body;
        
        if (!orderId || !reason) {
            return res.status(400).json({ error: 'معرف الطلب والسبب مطلوبان' });
        }
        
        const targetDate = normalizeDayKey(date || new Date());
        
        // محاولة حفظ في قاعدة البيانات
        if (tableExists('cancelled_distributions')) {
            const stmt = db.prepare(`
                INSERT INTO cancelled_distributions (order_id, reason, cancelled_by, cancelled_at, date_key)
                VALUES (?, ?, ?, ?, ?)
            `);
            stmt.run(orderId, reason, req.session.user?.username || 'unknown', new Date().toISOString(), targetDate);
        } else {
            // إذا لم يوجد جدول، نسجل في console فقط
            console.log(`🗑️ إلغاء توزيع: طلب ${orderId}, السبب: ${reason}, التاريخ: ${targetDate}`);
        }
        
        res.json({ success: true, message: 'تم تسجيل إلغاء التوزيع' });
        
    } catch (error) {
        console.error('خطأ في تسجيل إلغاء التوزيع:', error);
        res.status(500).json({ error: 'خطأ في تسجيل إلغاء التوزيع' });
    }
});

// ======================
// GET: إحصائيات سريعة لليوم
// ======================
router.get('/stats/today', requireAuth, (req, res) => {
    try {
        const today = normalizeDayKey(new Date());
        
        let stats = {
            date: today,
            totalTrips: 0,
            manualTrips: 0,
            autoTrips: 0,
            qualityScore: 100
        };
        
        if (tableExists('distribution')) {
            const distributions = safeAll(`SELECT * FROM distribution WHERE date_key = ?`, [today]);
            stats.totalTrips = distributions.length;
            stats.manualTrips = distributions.filter(d => d.manual_override === 1 || d.manual_override === '1').length;
            stats.autoTrips = stats.totalTrips - stats.manualTrips;
            stats.qualityScore = Math.max(0, 100 - (stats.manualTrips * 5));
        }
        
        res.json(stats);
        
    } catch (error) {
        console.error('خطأ في جلب إحصائيات اليوم:', error);
        res.status(500).json({ error: 'خطأ في جلب إحصائيات اليوم' });
    }
});

module.exports = router;