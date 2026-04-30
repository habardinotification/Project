const bcrypt = require('bcryptjs');
const { db, init } = require('./db');

init();

const hash = bcrypt.hashSync('123456', 10);
const adminHash = bcrypt.hashSync('admin123', 10);

const pages = [
  ['dashboard', '\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629', '/dashboard', '\ud83d\udcca', 10, 1, ''],
  ['orders', '\u0627\u0644\u0637\u0644\u0628\u0627\u062a', '/orders', '\ud83d\udcdd', 20, 1, ''],
  ['factory_orders', '\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0645\u0635\u0646\u0639', '/factory_orders', '\ud83c\udfed', 25, 1, ''],
  ['distribution', '\u0627\u0644\u062a\u0648\u0632\u064a\u0639', '/distribution', '\ud83d\ude9a', 30, 1, ''],
  ['distribution_quality', '\u062c\u0648\u062f\u0629 \u0627\u0644\u062a\u0648\u0632\u064a\u0639', '/distribution-quality', '\ud83d\udcca', 35, 1, ''],
  ['drivers', '\u0627\u0644\u0633\u0627\u0626\u0642\u064a\u0646', '/drivers', '\ud83d\udc68\u200d\u2708\ufe0f', 40, 1, ''],
  ['trucks', '\u0627\u0644\u0633\u064a\u0627\u0631\u0627\u062a', '/trucks', '\ud83d\ude9b', 45, 1, ''],
  ['trucks_failed', '\u0627\u0644\u0633\u064a\u0627\u0631\u0627\u062a \u063a\u064a\u0631 \u0627\u0644\u0645\u0633\u062a\u0648\u0641\u064a\u0629', '/trucks-failed', '\u26a0\ufe0f', 50, 1, ''],
  ['trucks_failed_report', '\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0645\u062e\u0627\u0644\u0641\u0627\u062a', '/trucks-failed-report', '\ud83d\udccb', 55, 1, ''],
  ['expenses', '\u0645\u0635\u0627\u0631\u064a\u0641 \u0627\u0644\u0633\u064a\u0627\u0631\u0627\u062a', '/expenses', '\ud83d\udcb0', 60, 1, ''],
  ['materials', '\u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0628\u062d\u0635', '/materials', '\ud83d\udce6', 70, 1, ''],
  ['factories', '\u0627\u0644\u0645\u0635\u0627\u0646\u0639', '/factories', '\ud83c\udfed', 80, 1, ''],
  ['cash_orders', '\u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0646\u0642\u062f\u064a\u0629', '/cash_orders', '\ud83d\udcb5', 90, 1, ''],
  ['reports', '\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u0643\u0633\u0627\u0631\u0629', '/reports', '\ud83d\udcc8', 100, 1, ''],
  ['scale_report', '\u062a\u0642\u0627\u0631\u064a\u0631 \u0627\u0644\u0645\u064a\u0632\u0627\u0646', '/scale_report', '\u2696\ufe0f', 110, 1, ''],
  ['blocks', '\u0627\u0644\u062d\u0638\u0631', '/blocks', '\u26d4', 120, 1, ''],
  ['users', '\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646', '/users', '\ud83d\udc65', 130, 1, ''],
  ['logs', '\u0627\u0644\u0633\u062c\u0644\u0627\u062a', '/logs', '\ud83d\udcdc', 140, 1, ''],
  ['settings', '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', '/settings', '\u2699\ufe0f', 150, 1, ''],
  ['pages', '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0635\u0641\u062d\u0627\u062a', '/pages', '\ud83e\udde9', 160, 1, ''],
  ['contact', '\u0627\u062a\u0635\u0644 \u0628\u0646\u0627', '/contact', '\u260e\ufe0f', 170, 1, '']
];

const materials = ['3/4', '3/8', '3/16', 'مغسول', 'بودرة', 'A1B'];

const drivers = [
  ['سليمان','2762','شارك في رود'], ['زرداد','2818','متاح'], ['شهداب','2927','شارك في رود'],
  ['مدثر','2928','شارك في رود'], ['سمر اقبال','2929','شارك في رود'], ['عرفان شبير','3321','متاح'],
  ['وقاص','3322','متاح'], ['نعيم','3324','متاح'], ['مجمد كليم','3325','شارك في رود'],
  ['اجسان','3326','شارك في رود'], ['نويد','3461','متاح'], ['جيفان كومار','3462','شارك في رود'],
  ['افتخار','3963','شارك في رود'], ['شكيل','4445','متاح'], ['عرفان','5324','متاح'],
  ['بابر','5367','متاح'], ['سلفر تان','5520','متاح'], ['نابين','5521','متاح'], ['فضل','5522','متاح'],
  ['عبيدالله','5523','متاح'], ['مجمد فيصل','5524','شارك في رود'], ['بير مجمد','5525','متاح'],
  ['صدير الاسلام','5526','متاح'], ['مجمد عبدو','5527','شارك في رود'], ['سکير','5528','شارك في رود'],
  ['تشاندان','5658','شارك في رود'], ['مسعود خان','5796','شارك في رود'], ['ساهيل طارق','5797','متاح'],
  ['عبد القادر','5800','شارك في رود'], ['غوا مجمد','6398','متاح'], ['نديم خان','6428','شارك في رود'],
  ['برديب','6429','شارك في رود'], ['طاهر','6430','متاح'], ['سليمان غولزار','6432','شارك في رود'],
  ['برويز اختر','6612','شارك في رود'], ['ذو القرنين','6613','شارك في رود'], ['نظيم خان','6614','متاح'],
  ['فينود','6615','شارك في رود'], ['رسول','6616','متاح'], ['يعقوب','6617','شارك في رود'],
  ['اظهر','6618','متاح'], ['عثمان','6619','شارك في رود'], ['مينا خان','6620','متاح'],
  ['مجمد ساجل','6621','شارك في رود'], ['اسد','6622','شارك في رود'], ['مانوج','6623','متاح'],
  ['خالد رجمان','6624','شارك في رود'], ['هداية','6626','شارك في رود'], ['HARENDRA','6629','شارك في رود'],
  ['جاويد','6935','متاح'], ['تيمور','6939','شارك في رود'], ['ارشد','7042','متاح'], ['فيراس','7043','متاح'],
  ['ايوب خان','7332','شارك في رود'], ['علي رضا','7682','متاح'], ['خالد','7750','شارك في رود'],
  ['نديم','7837','متاح'], ['ارسلان','7926','متاح'], ['سجاد','7927','متاح'], ['اكبر','7928','متاح'],
  ['امير','7929','شارك في رود'], ['طاهر محمود','7930','شارك في رود'], ['نارندر','7974','شارك في رود'],
  ['شريف','7980','شارك في رود'], ['شعيب','9103','شارك في رود'], ['ساكب','9492','متاح'], ['عدنان','9493','شارك في رود'],
  ['عامر','غير مسجل','شارك في رود']
];

const factories = [
  ['مصنع الفهد',337.99,'الرياض'], ['مصنع قوة معمارية',339.87,'الدمام'], ['مصنع سارمكس النظيم',352.64,'الرياض'],
  ['مصنع القيشان 3',396.22,'الدمام'], ['مصنع القيشان 1',396.22,'الدمام'], ['شركة الحارث للمنتجات الاسمنيه',401.37,'الدمام'],
  ['شركة برينسا للخرسانة الجاهزه',403.21,'الدمام'], ['مصنع الاحجار الشرقية',416.11,'الدمام'], ['شركةالحارث للمنتجات الاسمنتية',420.40,'الدمام'],
  ['مصنع باسل أبو الرب وشريكه',420.60,'الدمام'], ['شركة عبر الخليج',427.48,'الرياض'], ['مصنع المعجل',431.01,'الدمام'],
  ['مصنع نبراس2',439.61,'الدمام'], ['مصنع دعم وحلول الدرعية',441.05,'الرياض'], ['مصنع نبراس الخليج',448.99,'الدمام'],
  ['الحارث العزيزية',475.49,'الدمام'], ['انشاءات دبي',522.92,'الدمام'], ['الشركة الصينية',605.51,'الجبيل'],
  ['شركة اعمار',662.14,'الدمام'], ['SCCCL',396.22,'الدمام'], ['شركة رونق المساكن',12.00,'أخرى']
];

const insertPage = db.prepare(`INSERT OR IGNORE INTO pages (page_key,title,path,icon,sort_order,is_system,content_html) VALUES (?,?,?,?,?,?,?)`);
pages.forEach(p => insertPage.run(...p));

const insertMaterial = db.prepare(`INSERT OR IGNORE INTO materials (name) VALUES (?)`);
materials.forEach(m => insertMaterial.run(m));

const insertDriver = db.prepare(`INSERT INTO drivers (name, truck_number, status) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM drivers WHERE truck_number = ? AND name = ?)`);
drivers.forEach(([name, truck, status]) => insertDriver.run(name, truck, status, truck, name));

const insertFactory = db.prepare(`INSERT INTO factories (name, distance_km, city) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM factories WHERE name = ?)`);
factories.forEach(([name, distance, city]) => insertFactory.run(name, distance, city, name));

const insertUser = db.prepare(`INSERT OR IGNORE INTO users (username, password_hash, name, role, factory_id) VALUES (?, ?, ?, ?, ?)`);
insertUser.run('admin', adminHash, 'مدير النظام', 'admin', null);
insertUser.run('employee', hash, 'مستخدم تجريبي', 'employee', null);

const allFactories = db.prepare(`SELECT id, name FROM factories ORDER BY id`).all();
for (const f of allFactories) {
  insertUser.run(`factory_${f.id}`, hash, f.name, 'factory', f.id);
}

const allPages = db.prepare(`SELECT id, page_key FROM pages`).all();
const employee = db.prepare(`SELECT id FROM users WHERE username = 'employee'`).get();
const employeeAllowed = new Set(['dashboard','orders','factory_orders','distribution','distribution_quality','drivers','trucks','trucks_failed','trucks_failed_report','expenses','materials','factories','cash_orders','reports','scale_report','blocks','logs','contact']);
const grant = db.prepare(`INSERT OR REPLACE INTO user_pages (user_id, page_id, can_view) VALUES (?, ?, ?)`);
for (const page of allPages) {
  grant.run(employee.id, page.id, employeeAllowed.has(page.page_key) ? 1 : 0);
}

const factoryPages = allPages.filter(p => ['factory_orders'].includes(p.page_key));
const factoryUsers = db.prepare(`SELECT id FROM users WHERE role = 'factory'`).all();
for (const u of factoryUsers) {
  for (const p of factoryPages) grant.run(u.id, p.id, 1);
}

db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`).run('company_name', 'زرعة الخير للاستثمار والتطوير العقاري');
db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`).run('system_name', 'نظام طلبات الكسارة والنقليات');

console.log('تم تجهيز قاعدة البيانات بنجاح.');
console.log('دخول المدير: admin / admin123');
console.log('دخول مستخدم تجريبي: employee / 123456');
console.log('دخول المصانع: factory_1 إلى factory_21 / 123456');
