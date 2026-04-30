const express = require('express');
const router = express.Router();
const { getSettings } = require('../../utils/dbHelpers');

function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
    next();
}

// جلب ملخص استهلاك الديزل
router.get('/fuel-summary', requireAuth, (req, res) => {
    try {
        const settings = getSettings();
        const days = settings.days || {};
        const fuelEfficiency = settings.fuelEfficiency || {};
        
        let totalTrips = 0;
        let totalDistance = 0;
        let totalFuel = 0;
        let todayTrips = 0;
        let todayDistance = 0;
        let todayFuel = 0;
        
        const today = new Date().toISOString().slice(0, 10);
        
        Object.keys(days).forEach(date => {
            const dayData = days[date];
            const distribution = dayData.distribution || [];
            
            let dayTrips = 0;
            let dayDistance = 0;
            
            distribution.forEach(dist => {
                const truckNum = dist.truck?.number;
                const efficiency = fuelEfficiency[truckNum] || 3.2;
                const distKm = dist.distance || 150; // مسافة تقديرية
                
                dayTrips++;
                dayDistance += distKm;
                
                if (date === today) {
                    todayTrips++;
                    todayDistance += distKm;
                }
            });
            
            totalTrips += dayTrips;
            totalDistance += dayDistance;
        });
        
        totalFuel = totalDistance / 3.2; // متوسط الكفاءة
        todayFuel = todayDistance / 3.2;
        
        const result = {
            totalTrips: totalTrips,
            totalDistance: totalDistance.toFixed(1),
            totalConsumption: totalFuel.toFixed(1),
            dailyConsumption: todayFuel.toFixed(1),
            todayTrips: todayTrips,
            averageConsumption: totalTrips > 0 ? (totalFuel / totalTrips).toFixed(1) : 0,
            efficiency: 3.2
        };
        
        res.json(result);
    } catch (error) {
        console.error('Error in fuel-summary:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;