const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'zarah.sqlite');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function ensureColumn(table, column, definition) {
  try {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
    if (!columns.includes(column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`Added column ${column} to ${table}`);
    }
  } catch (e) {
    console.error(`Error ensuring column ${column} in ${table}:`, e.message);
  }
}

function init() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS factories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        distance_km REAL DEFAULT 0,
        city TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin','employee','factory')),
        factory_id INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(factory_id) REFERENCES factories(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_key TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        path TEXT UNIQUE NOT NULL,
        icon TEXT DEFAULT '📄',
        sort_order INTEGER DEFAULT 100,
        is_active INTEGER DEFAULT 1,
        is_system INTEGER DEFAULT 0,
        content_html TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS user_pages (
        user_id INTEGER NOT NULL,
        page_id INTEGER NOT NULL,
        can_view INTEGER DEFAULT 1,
        PRIMARY KEY(user_id, page_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        license_number TEXT UNIQUE,
        status TEXT DEFAULT 'available',
        current_truck_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(current_truck_id) REFERENCES trucks(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS trucks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate_number TEXT UNIQUE NOT NULL,
        model TEXT,
        status TEXT DEFAULT 'available',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        factory_id INTEGER NOT NULL,
        material_id INTEGER NOT NULL,
        requested_time TEXT NOT NULL,
        quantity REAL DEFAULT 1,
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'جديد',
        created_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(factory_id) REFERENCES factories(id) ON DELETE RESTRICT,
        FOREIGN KEY(material_id) REFERENCES materials(id) ON DELETE RESTRICT,
        FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        driver_id INTEGER NOT NULL,
        status TEXT DEFAULT 'موزع',
        assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY(driver_id) REFERENCES drivers(id) ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS blocked_drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        driver_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        from_date TEXT DEFAULT CURRENT_TIMESTAMP,
        to_date TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY(driver_id) REFERENCES drivers(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT DEFAULT '',
        role TEXT DEFAULT 'User',
        action TEXT NOT NULL,
        entity TEXT DEFAULT '',
        entity_id INTEGER,
        details TEXT DEFAULT '',
        ip TEXT DEFAULT '',
        location TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Ensure logs table columns
    ensureColumn('logs', 'username', "TEXT DEFAULT ''");
    ensureColumn('logs', 'role', "TEXT DEFAULT 'User'");
    ensureColumn('logs', 'ip', "TEXT DEFAULT ''");
    ensureColumn('logs', 'location', "TEXT DEFAULT ''");

    // Trucks
    ensureColumn('trucks', 'driver_name', "TEXT DEFAULT ''");
    
    // Drivers
    ensureColumn('drivers', 'truck_number', "TEXT DEFAULT ''");
    
    // Assignments
    ensureColumn('assignments', 'truck_number', "TEXT DEFAULT ''");
    ensureColumn('assignments', 'road', 'INTEGER DEFAULT 1');
    ensureColumn('assignments', 'factory_id', 'INTEGER');
    ensureColumn('assignments', 'override_reason', "TEXT DEFAULT ''");
    ensureColumn('assignments', 'override_by', "TEXT DEFAULT ''");
    ensureColumn('assignments', 'quality_score', 'REAL DEFAULT 100');
    
    // Factories
    ensureColumn('factories', 'distance_km', 'REAL DEFAULT 0');
    ensureColumn('factories', 'city', "TEXT DEFAULT ''");
    ensureColumn('factories', 'priority_level', 'INTEGER DEFAULT 3');
    ensureColumn('factories', 'priority_label', "TEXT DEFAULT 'عادية'");
    
    // Orders
    ensureColumn('orders', 'quantity', 'REAL DEFAULT 1');
    ensureColumn('orders', 'assigned_truck_id', 'INTEGER');
    ensureColumn('orders', 'assigned_driver_id', 'INTEGER');
    ensureColumn('orders', 'distribution_notes', "TEXT DEFAULT ''");
    
    // Incoming trucks
    ensureColumn('incoming_trucks', 'expected_arrival', 'TEXT');
    ensureColumn('incoming_trucks', 'assigned', 'INTEGER DEFAULT 0');

    // Distribution exceptions
    db.exec(`CREATE TABLE IF NOT EXISTS distribution_exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      factory_id INTEGER,
      truck_id INTEGER,
      driver_id INTEGER,
      truck_number TEXT DEFAULT '',
      driver_name TEXT DEFAULT '',
      reason TEXT NOT NULL,
      details TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Distribution cancellations
    db.exec(`CREATE TABLE IF NOT EXISTS distribution_cancellations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      reason TEXT NOT NULL,
      cancelled_by INTEGER,
      cancelled_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Incoming trucks
    db.exec(`CREATE TABLE IF NOT EXISTS incoming_trucks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      truck_number TEXT NOT NULL,
      driver_name TEXT DEFAULT '',
      source_email TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      body TEXT DEFAULT '',
      status TEXT DEFAULT 'في الطريق',
      detected_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expected_arrival TEXT,
      assigned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Incoming rejects
    db.exec(`CREATE TABLE IF NOT EXISTS incoming_rejects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      truck_id INTEGER NOT NULL,
      truck_number TEXT NOT NULL,
      reason TEXT NOT NULL,
      rejected_by INTEGER,
      rejected_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(truck_id) REFERENCES incoming_trucks(id) ON DELETE CASCADE
    )`);

    // Saved reports
    db.exec(`CREATE TABLE IF NOT EXISTS saved_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
    )`);

    // Indexes
    db.exec("CREATE INDEX IF NOT EXISTS idx_incoming_assigned ON incoming_trucks(assigned)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_incoming_detected ON incoming_trucks(detected_at)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_logs_username ON logs(username)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_dist_cancellations_order ON distribution_cancellations(order_id)");

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

function logAction(userId, action, entity = '', entityId = null, details = '') {
  db.prepare(`INSERT INTO logs (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)`)
    .run(userId || null, action, entity, entityId, details);
}

function getSidebarPages(user) {
  if (!user) return [];
  if (user.role === 'admin') {
    return db.prepare(`SELECT * FROM pages WHERE is_active = 1 ORDER BY sort_order, id`).all();
  }
  return db.prepare(`
    SELECT p.* FROM pages p
    JOIN user_pages up ON up.page_id = p.id AND up.can_view = 1
    WHERE p.is_active = 1 AND up.user_id = ?
    ORDER BY p.sort_order, p.id
  `).all(user.id);
}

function canAccessPage(user, requestPath) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const cleanPath = requestPath.split('?')[0];
  const allowed = db.prepare(`
    SELECT p.id FROM pages p
    JOIN user_pages up ON up.page_id = p.id AND up.can_view = 1
    WHERE up.user_id = ? AND p.is_active = 1 AND (p.path = ? OR ? LIKE p.path || '/%')
    LIMIT 1
  `).get(user.id, cleanPath, cleanPath);
  return Boolean(allowed);
}

init();

module.exports = { db, init, logAction, getSidebarPages, canAccessPage };