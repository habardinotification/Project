ملفات الإصلاح الكاملة للداشبورد
================================

الملفات الموجودة هنا:

1) server.js
- ربط كل ملفات views الظاهرة في الصورة بروابط مباشرة.
- إضافة aliases للروابط المكتوبة بشرطة أو underscore.
- إزالة الاعتماد على روابط موقع رئيسي خارج الداشبورد.
- إضافة API لفحص حالة الروابط:
  /api/routes/status

2) views/layout.ejs
- Sidebar كامل بروابط كل الصفحات.
- Active link يعمل حسب currentPath.
- زر وضع نهاري / ليلي.
- لا يحتوي على روابط خارجية للموقع الرئيسي.

3) public/css/style.css
- ألوان نهارية وليلية.
- شكل Sidebar منظم.
- دعم RTL.
- دعم الموبايل.

4) public/js/theme.js
- حفظ اختيار الوضع النهاري/الليلي في localStorage.

5) scripts/check-routes.js
- سكريبت سريع يتأكد أن ملفات views المطلوبة موجودة.
- شغله من جذر المشروع بعد النسخ:
  node scripts/check-routes.js

طريقة التركيب:

1) خذ نسخة احتياطية من مشروعك.
2) انسخ server.js مكان server.js القديم.
3) انسخ views/layout.ejs مكان layout.ejs القديم.
4) انسخ public/css/style.css مكان ملف الستايل الأساسي عندك.
5) انسخ public/js/theme.js.
6) شغل:
   node scripts/check-routes.js
7) شغل السيرفر:
   npm start
   أو:
   node server.js

الروابط التي تم ربطها في السيرفر والـ Sidebar:

/dashboard
/orders
/factory_orders
/distribution
/distribution-quality
/drivers
/trucks
/trucks-failed
/trucks-failed-report
/expenses
/cash_orders
/factories
/materials
/reports
/scale_report
/logs
/blocks
/pages
/contact
/custom_page
/settings
/users

Aliases إضافية تعمل وتحوّل للرابط الصحيح:

/factory-orders -> /factory_orders
/distribution_quality -> /distribution-quality
/trucks_failed -> /trucks-failed
/trucks_failed_report -> /trucks-failed-report
/cash-orders -> /cash_orders
/scale-report -> /scale_report
/custom-page -> /custom_page

ملاحظة مهمة:
لو عندك ملف CSS باسم مختلف، إما غيّر الرابط في layout.ejs أو انسخ محتوى style.css داخل ملفك الحالي.
