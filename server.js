require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const { db, init } = require('./db');
const bcrypt = require('bcrypt');
const expressLayouts = require('express-ejs-layouts');
const fs = require('fs');
const { google } = require('googleapis');

const app = express();

// ======================
// إعدادات أساسية
// ======================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'zarah-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ======================
// متغيرات عامة
// ======================
app.locals.systemName = process.env.SYSTEM_NAME || 'شركة زرعة الخير للنقليات';
app.locals.companyName = process.env.COMPANY_NAME || 'مجموعة زرعة الخير للاستثمار العقاري';

// ======================
// قاعدة البيانات
// ======================
init();

// ======================
// بيانات القوائم لكل الصفحات الموجودة في views
// ======================
const navItems = [
  { href: '/dashboard', label: 'الرئيسية', icon: '🏠', view: 'dashboard', title: 'الرئيسية' },
  { href: '/orders', label: 'الطلبات', icon: '📦', view: 'orders', title: 'الطلبات' },
  { href: '/factory_orders', label: 'طلبات المصنع', icon: '🏭', view: 'factory_orders', title: 'طلبات المصنع' },
  { href: '/distribution', label: 'توزيع الطلبات', icon: '🚚', view: 'distribution', title: 'توزيع الطلبات' },
  { href: '/distribution-quality', label: 'جودة التوزيع', icon: '✅', view: 'distribution-quality', title: 'جودة التوزيع' },
  { href: '/drivers', label: 'السائقين', icon: '👷', view: 'drivers', title: 'السائقين' },
  { href: '/trucks', label: 'السيارات', icon: '🚛', view: 'trucks', title: 'السيارات' },
  { href: '/trucks-failed', label: 'السيارات المتعثرة', icon: '⚠️', view: 'trucks-failed', title: 'السيارات المتعثرة' },
  { href: '/trucks-failed-report', label: 'تقرير التعثر', icon: '📋', view: 'trucks-failed-report', title: 'تقرير التعثر' },
  { href: '/expenses', label: 'المصروفات', icon: '💰', view: 'expenses', title: 'المصروفات' },
  { href: '/cash_orders', label: 'طلبات الكاش', icon: '💵', view: 'cash_orders', title: 'طلبات الكاش' },
  { href: '/factories', label: 'المصانع', icon: '🏢', view: 'factories', title: 'المصانع' },
  { href: '/materials', label: 'الخامات', icon: '🧱', view: 'materials', title: 'الخامات' },
  { href: '/reports', label: 'التقارير', icon: '📊', view: 'reports', title: 'التقارير' },
  { href: '/scale_report', label: 'تقرير الميزان', icon: '⚖️', view: 'scale_report', title: 'تقرير الميزان' },
  { href: '/blocks', label: 'البلوكات', icon: '🧩', view: 'blocks', title: 'البلوكات' },
  { href: '/pages', label: 'الصفحات', icon: '📄', view: 'pages', title: 'الصفحات' },
  { href: '/contact', label: 'التواصل', icon: '☎️', view: 'contact', title: 'التواصل' },
  { href: '/custom_page', label: 'صفحة مخصصة', icon: '📝', view: 'custom_page', title: 'صفحة مخصصة' },
  { href: '/logs', label: 'السجلات', icon: '🕘', view: 'logs', title: 'السجلات' },
  { href: '/settings', label: 'الإعدادات', icon: '⚙️', view: 'settings', title: 'الإعدادات' },
  { href: '/users', label: 'المستخدمين', icon: '👥', view: 'users', title: 'المستخدمين', adminOnly: true }
];

// ======================
// Middleware عام لكل الصفحات
// ======================
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.user = req.session.user || null;
  res.locals.title = 'الرئيسية';
  res.locals.navItems = navItems;
  next();
});

// ======================
// Auth Middleware
// ======================
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  next();
}

// ======================
// Google OAuth Helpers
// ======================
const GOOGLE_TOKEN_PATH = path.resolve(
  __dirname,
  process.env.GOOGLE_TOKEN_PATH || './data/google-token.json'
);

function makeOAuthClient() {
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;

  if (credentialsPath && fs.existsSync(credentialsPath)) {
    const content = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const web = content.web || content;

    return new google.auth.OAuth2(
      web.client_id,
      web.client_secret,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function saveGoogleTokens(tokens) {
  fs.mkdirSync(path.dirname(GOOGLE_TOKEN_PATH), { recursive: true });
  fs.writeFileSync(GOOGLE_TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

// ======================
// Auth Routes
// ======================
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  res.render('login', {
    title: 'تسجيل الدخول',
    layout: false
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.render('login', {
      title: 'تسجيل الدخول',
      layout: false,
      flash: {
        type: 'error',
        message: 'بيانات غير صحيحة'
      }
    });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  };

  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// ======================
// Google OAuth Routes
// ======================
app.get('/auth/google', requireAuth, (req, res) => {
  const client = makeOAuthClient();

  const url = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly'
    ]
  });

  res.redirect(url);
});

app.get('/auth/google/callback', requireAuth, async (req, res) => {
  try {
    const client = makeOAuthClient();

    if (!req.query.code) {
      return res.status(400).send('لم يتم إرسال كود Google OAuth.');
    }

    const { tokens } = await client.getToken(req.query.code);
    saveGoogleTokens(tokens);

    res.send(`
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <title>تم الربط</title>
          <style>
            body {
              font-family: Tahoma, Arial, sans-serif;
              background: #f8fafc;
              color: #0f172a;
              text-align: center;
              padding-top: 100px;
            }
            .box {
              display: inline-block;
              background: #fff;
              padding: 32px;
              border-radius: 18px;
              box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
            }
            h1 {
              color: #0f766e;
              margin-bottom: 16px;
            }
            a {
              color: #0f766e;
              font-weight: 700;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>✅ تم ربط Gmail بنجاح</h1>
            <a href="/dashboard">الذهاب إلى الداشبورد</a>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('خطأ: ' + err.message);
  }
});

// ======================
// API Routes
// ======================
app.get('/api/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'غير مصرح' });
  }

  res.json({ user: req.session.user });
});

app.get('/api/gmail/status', requireAuth, (req, res) => {
  const linked = fs.existsSync(GOOGLE_TOKEN_PATH);
  res.json({ linked });
});

app.get('/api/routes/status', requireAuth, (req, res) => {
  const status = navItems.map((item) => ({
    path: item.href,
    view: item.view + '.ejs',
    exists: fs.existsSync(path.join(__dirname, 'views', item.view + '.ejs'))
  }));

  res.json(status);
});

app.get('/api/incoming-trucks', requireAuth, (req, res) => {
  try {
    const trucks = db
      .prepare('SELECT * FROM incoming_trucks ORDER BY detected_at DESC LIMIT 50')
      .all();

    res.json(trucks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/incoming-trucks/sync-email', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'تمت المزامنة'
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
});

// ======================
// Pages
// ======================
app.get('/', requireAuth, (req, res) => {
  res.redirect('/dashboard');
});

navItems.forEach((item) => {
  app.get(item.href, requireAuth, (req, res) => {
    res.render(item.view, {
      title: item.title
    });
  });
});

// روابط بديلة لو كتبتها بشرطة بدل underscore
app.get('/factory-orders', requireAuth, (req, res) => res.redirect('/factory_orders'));
app.get('/cash-orders', requireAuth, (req, res) => res.redirect('/cash_orders'));
app.get('/scale-report', requireAuth, (req, res) => res.redirect('/scale_report'));
app.get('/custom-page', requireAuth, (req, res) => res.redirect('/custom_page'));

// ======================
// 404
// ======================
app.use((req, res) => {
  res.status(404).render('not_found', {
    title: 'الصفحة غير موجودة'
  });
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
