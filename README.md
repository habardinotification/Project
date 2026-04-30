# نظام زرعة الخير للكسارة والنقليات

نسخة جاهزة للتشغيل مبنية بـ Node.js + Express + EJS + SQLite.

## الجديد في هذه النسخة

- دمج صفحات HTML القديمة داخل هيكل النظام الحالي.
- تحويل الروابط القديمة مثل `orders.html` و `trucks.html` إلى الصفحات الجديدة تلقائياً.
- Sidebar جانبي ديناميكي حسب جدول `pages` والصلاحيات.
- بحث تلقائي داخل كل جدول تقريباً بدون تعديل يدوي لكل صفحة.
- إكمال تلقائي للبحث داخل الجداول عبر `datalist`.
- إكمال تلقائي للقوائم المهمة: المصنع، نوع البحص، السيارة/السائق.
- بحث داخل القائمة الجانبية للوصول السريع للصفحات.
- وضع ليلي ونهاري محفوظ في المتصفح.
- دعم إضافة صفحات جديدة تلقائياً من مجلد `views/auto_pages`.

## التشغيل على Windows

```bat
copy .env.example .env
npm install
npm run seed
npm start
```

ثم افتح:

```text
http://localhost:3000
```

## بيانات الدخول الافتراضية

```text
الأدمن:
admin / admin123

مستخدم تجريبي:
employee / 123456

حسابات المصانع:
factory_1 إلى factory_21 / 123456
```

## إضافة صفحة تظهر تلقائياً في Sidebar

أضف ملف EJS داخل:

```text
views/auto_pages
```

مثال:

```text
views/auto_pages/diesel-followup.ejs
```

وفي أول الملف ضع بيانات الصفحة:

```html
<!-- title: متابعة الديزل -->
<!-- icon: ⛽ -->
<!-- sort: 320 -->
<section class="card">
  <h2>متابعة الديزل</h2>
  <p>محتوى الصفحة هنا.</p>
</section>
```

بعد إعادة تشغيل السيرفر ستظهر الصفحة تلقائياً للأدمن على الرابط:

```text
/auto/diesel-followup
```

وللمستخدمين العاديين يجب منح الصلاحية من صفحة:

```text
المستخدمين والصلاحيات
```

## إضافة صفحة من داخل النظام

من صفحة:

```text
إدارة الصفحات
```

يمكنك إضافة صفحة بعنوان ورابط وأيقونة ومحتوى HTML، وستظهر مباشرة للأدمن في القائمة الجانبية.

## صفحات HTML القديمة

تم وضع نسخة من الصفحات HTML المرسلة داخل:

```text
legacy_html_source
```

والروابط القديمة تتحول تلقائياً إلى روابط النظام الجديدة:

| الرابط القديم | الرابط الجديد |
|---|---|
| index.html | /dashboard |
| orders.html | /orders |
| distribution.html | /distribution |
| trucks.html | /drivers |
| products.html | /materials |
| factories.html | /factories |
| reports.html | /crusher-reports |
| scale_report.html | /reports/scale |
| trucks-failed.html | /reports/non-compliant-cars |
| trucks-failed-report.html | /reports/non-compliant |
| distribution-quality.html | /quality |
| restrictions.html | /blocks |
| users.html | /users |
| logs.html | /logs |
| settings.html | /settings |

## ملاحظات مهمة

- يفضل استخدام Node.js 22 أو 20 على Windows.
- لو المشروع داخل OneDrive وظهرت مشاكل صلاحيات، انقله إلى `C:\zarah_crusher_system`.
- قاعدة البيانات SQLite موجودة داخل مجلد `data` بعد تشغيل seed.
