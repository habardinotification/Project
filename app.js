require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const fs = require('fs');
const os = require('os');
const bcrypt = require('bcrypt');
const expressLayouts = require('express-ejs-layouts');
const { google } = require('googleapis');
const { db, init } = require('./db');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { path: '/socket.io', cors: { origin: '*' } });
app.set('io', io);

// ======================
// Basic Setup
// ======================
app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));
app.use(bodyParser.json({ limit: '500mb' }));
app.use(methodOverride('_method'));
app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'zarah-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 }
}));

// Database
init();
app.locals.db = db;

// ======================
// Translation System (FULL)
// ======================
const translations = {
  ar: {
    dashboard: 'الرئيسية', orders: 'الطلبات', factory_orders: 'طلبات المصانع',
    cash_orders: 'طلبات الكاش', distribution: 'توزيع الطلبات', distribution_quality: 'جودة التوزيع',
    fleet: 'الأسطول', fleet_dashboard: 'لوحة الأسطول', materials: 'الخامات', factories: 'المصانع',
    blocks: 'الحظر', reports: 'التقارير', scale_report: 'تقرير الميزان', saved_reports: 'تقارير تحليلية',
    gps_comparison: 'داشبورد تحليلي', trucks_failed: 'سيارات غير مستوفية', trucks_failed_report: 'تقرير المخالفات',
    expenses: 'المصروفات', users: 'المستخدمين', logs: 'السجلات', settings: 'الإعدادات',
    login: 'تسجيل الدخول', logout: 'تسجيل خروج', welcome: 'مرحباً', save: 'حفظ', cancel: 'إلغاء',
    delete: 'حذف', edit: 'تعديل', add: 'إضافة', search: 'بحث', no_data: 'لا توجد بيانات',
    loading: 'جاري التحميل...', error: 'خطأ', success: 'تم بنجاح', confirm: 'تأكيد', back: 'رجوع',
    print: 'طباعة', export: 'تصدير', filter: 'تصفية', all: 'الكل', active: 'نشط', inactive: 'غير نشط',
    status: 'الحالة', actions: 'إجراءات', date: 'التاريخ', time: 'الوقت', name: 'الاسم', number: 'الرقم',
    driver: 'السائق', truck: 'السيارة', factory: 'المصنع', material: 'الخامة', distance: 'المسافة',
    quantity: 'الكمية', notes: 'ملاحظات', details: 'تفاصيل', total: 'المجموع', average: 'المتوسط',
    min: 'الحد الأدنى', max: 'الحد الأقصى', today: 'اليوم', yesterday: 'أمس', this_week: 'هذا الأسبوع',
    this_month: 'هذا الشهر', custom: 'مخصص', from: 'من', to: 'إلى', submit: 'إرسال', reset: 'إعادة تعيين',
    close: 'إغلاق', yes: 'نعم', no: 'لا', ok: 'موافق',
    username: 'اسم المستخدم', password: 'كلمة المرور', invalid_credentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    page_not_found: 'الصفحة غير موجودة', unauthorized: 'غير مصرح', server_error: 'خطأ في الخادم',
    company_name: 'مجموعة شركات زرعة الخير', system_name: 'إدارة عمليات النقل والكسارة',
    footer_text: 'تم برمجتها من قبل م/ علي مهران | 2026',
    login_success: 'تم تسجيل الدخول بنجاح', logout_success: 'تم تسجيل الخروج',
    user_login: 'تسجيل دخول المستخدم', user_logout: 'تسجيل خروج المستخدم'
  },
  en: {
    dashboard: 'Dashboard', orders: 'Orders', factory_orders: 'Factory Orders',
    cash_orders: 'Cash Orders', distribution: 'Distribution', distribution_quality: 'Distribution Quality',
    fleet: 'Fleet', fleet_dashboard: 'Fleet Dashboard', materials: 'Materials', factories: 'Factories',
    blocks: 'Blocks', reports: 'Reports', scale_report: 'Scale Report', saved_reports: 'Saved Reports',
    gps_comparison: 'GPS Dashboard', trucks_failed: 'Failed Trucks', trucks_failed_report: 'Violations Report',
    expenses: 'Expenses', users: 'Users', logs: 'Logs', settings: 'Settings',
    login: 'Login', logout: 'Logout', welcome: 'Welcome', save: 'Save', cancel: 'Cancel',
    delete: 'Delete', edit: 'Edit', add: 'Add', search: 'Search', no_data: 'No data available',
    loading: 'Loading...', error: 'Error', success: 'Success', confirm: 'Confirm', back: 'Back',
    print: 'Print', export: 'Export', filter: 'Filter', all: 'All', active: 'Active', inactive: 'Inactive',
    status: 'Status', actions: 'Actions', date: 'Date', time: 'Time', name: 'Name', number: 'Number',
    driver: 'Driver', truck: 'Truck', factory: 'Factory', material: 'Material', distance: 'Distance',
    quantity: 'Quantity', notes: 'Notes', details: 'Details', total: 'Total', average: 'Average',
    min: 'Min', max: 'Max', today: 'Today', yesterday: 'Yesterday', this_week: 'This Week',
    this_month: 'This Month', custom: 'Custom', from: 'From', to: 'To', submit: 'Submit', reset: 'Reset',
    close: 'Close', yes: 'Yes', no: 'No', ok: 'OK',
    username: 'Username', password: 'Password', invalid_credentials: 'Invalid username or password',
    page_not_found: 'Page Not Found', unauthorized: 'Unauthorized', server_error: 'Server Error',
    company_name: 'Zarah Al-Khair Group', system_name: 'Transport & Crusher Management',
    footer_text: 'Developed by Eng. Ali Mehran | 2026',
    login_success: 'Logged in successfully', logout_success: 'Logged out successfully',
    user_login: 'User login', user_logout: 'User logout'
  }
};

function translate(key, lang) {
  return translations[lang]?.[key] || translations['ar']?.[key] || key;
}

// ======================
// Settings (JSON)
// ======================
const SETTINGS_PATH = path.resolve(__dirname, 'data/settings.json');
const DEFAULT_SETTINGS = {
  theme: 'light', language: 'ar', days: {},
  distribution: { autoRefresh: true, refreshSeconds: 30 },
  gmail: { linked: false }, fuelEfficiency: {}, analyticsReports: {}
};

function getSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return DEFAULT_SETTINGS;
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    if (!raw.trim()) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) { return DEFAULT_SETTINGS; }
}

function saveSettings(settings) {
  const dir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
}

function normalizeDayKey(d) {
  const raw = String(d || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return new Date().toISOString().slice(0, 10);
}

function getFactoryDistance(factoryName) {
  const distances = {
    "مصنع الفهد": 337.99, "مصنع قوة معمارية": 339.87, "مصنع سارمكس النظيم": 352.64,
    "مصنع القيشان 3": 396.22, "مصنع القيشان 1": 396.22, "شركة الحارث للمنتجات الاسمنيه حي المنار": 401.37,
    "شركة برينسا للخرسانة الجاهزه": 403.21, "مصنع الاحجار الشرقية": 416.11, "شركة ابتك للخرسانة الجاهزه": 418.11,
    "شركةالحارث للمنتجات الاسمنتية": 420.4, "مصنع باسل أبو الرب وشريكه": 420.6, "شركة عبر الخليج": 427.48,
    "مصنع المعجل": 431.01, "مصنع نبراس2": 439.61, "مصنع دعم وحلول الدرعية": 441.05, "مصنع نبراس الخليج": 448.99,
    "الحارث العزيزية": 475.49, "انشاءات دبي": 522.92, "الشركة الصينية": 605.51, "شركة اعمار": 662.14
  };
  return distances[factoryName] || 150;
}

// ======================
// Helper: Log to Database
// ======================
function logSystemAction(username, role, action, details, ip, location) {
  try {
    db.prepare(`INSERT INTO logs (username, role, action, details, ip, location, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      username, role, action, details || '', ip || '', location || '', new Date().toISOString()
    );
  } catch(e) { console.error('Failed to log action:', e.message); }
}

// ======================
// Middleware
// ======================
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Language middleware
app.use((req, res, next) => {
  const settings = getSettings();
  req.language = req.query.lang || req.session.language || settings.language || 'ar';
  req.session.language = req.language;
  res.locals.lang = req.language;
  res.locals.t = (key) => translate(key, req.language);
  res.locals.translations = translations[req.language] || translations['ar'];
  res.locals.currentPath = req.path;
  res.locals.user = req.session.user || null;
  res.locals.settings = settings;
  next();
});

// ======================
// Navigation Items
// ======================
const navItems = [
  { href: '/dashboard', label: { ar: 'الرئيسية', en: 'Dashboard' }, icon: '🏠', view: 'dashboard' },
  { href: '/orders', label: { ar: 'الطلبات', en: 'Orders' }, icon: '📝', view: 'orders' },
  { href: '/factory_orders', label: { ar: 'طلبات المصانع', en: 'Factory Orders' }, icon: '🏭', view: 'factory_orders' },
  { href: '/cash_orders', label: { ar: 'طلبات الكاش', en: 'Cash Orders' }, icon: '💵', view: 'cash_orders' },
  { href: '/distribution', label: { ar: 'توزيع الطلبات', en: 'Distribution' }, icon: '🚚', view: 'distribution' },
  { href: '/distribution-quality', label: { ar: 'جودة التوزيع', en: 'Quality' }, icon: '📊', view: 'distribution-quality' },
  { href: '/fleet', label: { ar: 'الأسطول', en: 'Fleet' }, icon: '🚛', view: 'fleet' },
  { href: '/fleet_dashboard', label: { ar: 'لوحة الأسطول', en: 'Fleet Board' }, icon: '📊', view: 'fleet_dashboard' },
  { href: '/materials', label: { ar: 'الخامات', en: 'Materials' }, icon: '🧱', view: 'materials' },
  { href: '/factories', label: { ar: 'المصانع', en: 'Factories' }, icon: '🏭', view: 'factories' },
  { href: '/blocks', label: { ar: 'الحظر', en: 'Blocks' }, icon: '⛔', view: 'blocks' },
  { href: '/reports', label: { ar: 'التقارير', en: 'Reports' }, icon: '📊', view: 'reports' },
  { href: '/scale_report', label: { ar: 'تقرير الميزان', en: 'Scale Report' }, icon: '⚖️', view: 'scale_report' },
  { href: '/saved-reports', label: { ar: 'تقارير تحليلية', en: 'Saved Reports' }, icon: '📊', view: 'saved-reports' },
  { href: '/gps-comparison', label: { ar: 'داشبورد تحليلي', en: 'GPS Dashboard' }, icon: '📍', view: 'gps-comparison' },
  { href: '/trucks-failed', label: { ar: 'سيارات غير مستوفية', en: 'Failed Trucks' }, icon: '⚠️', view: 'trucks-failed' },
  { href: '/trucks-failed-report', label: { ar: 'تقرير المخالفات', en: 'Violations Report' }, icon: '📋', view: 'trucks-failed-report' },
  { href: '/expenses', label: { ar: 'المصروفات', en: 'Expenses' }, icon: '💰', view: 'expenses' },
  { href: '/users', label: { ar: 'المستخدمين', en: 'Users' }, icon: '👥', view: 'users' },
  { href: '/logs', label: { ar: 'السجلات', en: 'Logs' }, icon: '📜', view: 'logs' },
  { href: '/settings', label: { ar: 'الإعدادات', en: 'Settings' }, icon: '⚙️', view: 'settings' }
];

app.use((req, res, next) => {
  res.locals.navItems = navItems;
  next();
});

// Get local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

// ======================
// API Routes
// ======================
const apiRoutes = [
  '/api/day', '/api/range', '/api/incoming-trucks', '/api/restrictions',
  '/api/truck-violations', '/api/backup', '/api/logs', '/api/users',
  '/api/settings', '/api/trucks', '/api/drivers', '/api/factories',
  '/api/materials', '/api/orders', '/api/distribution', '/api/gmail',
  '/api/quality', '/api/reports', '/api/cash-report', '/api/saved-reports', '/api/analytics'
];

apiRoutes.forEach(route => {
  try { app.use(route, require('./routes' + route)); } catch(e) {}
});

// ======================
// API: Current User
// ======================
app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: req.session.user });
});

// ======================
// Login / Logout WITH LOGGING
// ======================
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { title: translate('login', req.language), layout: false, flash: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash || '')) {
    return res.render('login', {
      title: translate('login', req.language),
      layout: false,
      flash: { type: 'error', message: translate('invalid_credentials', req.language) }
    });
  }
  req.session.user = { id: user.id, username: user.username, name: user.name, role: user.role };
  
  // Log login
  const ip = req.ip || req.connection?.remoteAddress || '';
  logSystemAction(user.username, user.role, translate('user_login', req.language), translate('login_success', req.language), ip, '');
  
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  if (req.session.user) {
    const ip = req.ip || req.connection?.remoteAddress || '';
    logSystemAction(
      req.session.user.username, 
      req.session.user.role || 'User', 
      translate('user_logout', req.session.language || 'ar'), 
      translate('logout_success', req.session.language || 'ar'), 
      ip, 
      ''
    );
  }
  req.session.destroy(() => res.redirect('/login'));
});

// ======================
// Google OAuth
// ======================
function makeOAuthClient() {
  const credPath = process.env.GOOGLE_CREDENTIALS_PATH;
  if (credPath && fs.existsSync(credPath)) {
    const content = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const web = content.web || content;
    return new google.auth.OAuth2(web.client_id, web.client_secret, process.env.GOOGLE_REDIRECT_URI);
  }
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI
  );
}

app.get('/auth/google', requireAuth, (req, res) => {
  const client = makeOAuthClient();
  res.redirect(client.generateAuthUrl({
    access_type: 'offline', prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.readonly']
  }));
});

app.get('/oauth2callback', requireAuth, async (req, res) => {
  try {
    const client = makeOAuthClient();
    const { tokens } = await client.getToken(req.query.code);
    const dir = path.resolve(__dirname, 'data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.resolve(dir, 'google-token.json'), JSON.stringify(tokens, null, 2), 'utf8');
    res.send('<html><body><h1>Gmail linked successfully!</h1><a href="/dashboard">Back</a></body></html>');
  } catch(err) { res.status(500).send('Error: '+err.message); }
});

// ======================
// API: Language Switch
// ======================
app.get('/api/lang/:lang', (req, res) => {
  const lang = req.params.lang === 'en' ? 'en' : 'ar';
  req.session.language = lang;
  res.json({ success: true, lang });
});

// ======================
// Page Routes
// ======================
const pages = {
  '/': '/dashboard',
  '/dashboard': 'dashboard', '/orders': 'orders', '/factory_orders': 'factory_orders',
  '/cash_orders': 'cash_orders', '/distribution': 'distribution',
  '/distribution-quality': 'distribution-quality', '/fleet': 'fleet',
  '/fleet_dashboard': 'fleet_dashboard', '/factories': 'factories',
  '/materials': 'materials', '/reports': 'reports', '/scale_report': 'scale_report',
  '/saved-reports': 'saved-reports', '/gps-comparison': 'gps-comparison',
  '/expenses': 'expenses', '/blocks': 'blocks', '/users': 'users',
  '/logs': 'logs', '/settings': 'settings', '/trucks-failed': 'trucks-failed',
  '/trucks-failed-report': 'trucks-failed-report'
};

for (const [route, view] of Object.entries(pages)) {
  app.get(route, requireAuth, (req, res) => {
    if (route === '/') return res.redirect(view);
    const titleKey = view.replace(/-/g, '_');
    res.render(view, { title: translate(titleKey, req.language) });
  });
}

// ======================
// 404
// ======================
app.use((req, res) => {
  res.status(404).render('not_found', { title: translate('page_not_found', req.language || 'ar') });
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 3000;
const localIP = getLocalIP();
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${localIP}:${PORT}`);
});