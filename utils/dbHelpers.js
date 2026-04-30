const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// ============================================================
// 0. الاتصال بقاعدة البيانات
// ============================================================
let db;
try {
  const dbModule = require('../../db');
  db = dbModule.db;
  if (!db || typeof db.prepare !== 'function') {
    throw new Error('db from ../../db is not valid');
  }
  console.log('[dbHelpers] Successfully loaded db from ../../db');
} catch (err) {
  console.error('[dbHelpers] Failed to load db from ../../db, creating new connection:', err.message);
  const Database = require('better-sqlite3');
  const dbPath = path.join(__dirname, '../data/zarah.sqlite');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  console.log('[dbHelpers] Created fallback database connection');
}

// ============================================================
// 1. دوال مساعدة أساسية
// ============================================================
function ensureDataDir() {
  const dir = path.resolve(__dirname, '../data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch (e) { return fallback; }
}

function writeJsonFile(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ============================================================
// 2. دوال قواعد البيانات الأساسية
// ============================================================
function tableExists(tableName) {
  try {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
    return !!row;
  } catch(e) { return false; }
}

function getColumnInfo(tableName) {
  if (!tableExists(tableName)) return [];
  try {
    return db.prepare(`PRAGMA table_info(${quoteId(tableName)})`).all();
  } catch(e) { return []; }
}

function getTableColumns(tableName) {
  return getColumnInfo(tableName).map(c => c.name);
}

function quoteId(name) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(String(name))) throw new Error('Invalid identifier: ' + name);
  return `"${name}"`;
}

function safeAll(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) return stmt.all(...params);
    return stmt.all();
  } catch(e) { console.error(e); return []; }
}

function safeGet(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) return stmt.get(...params);
    return stmt.get();
  } catch(e) { return null; }
}

function safeRun(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) return stmt.run(...params);
    return stmt.run();
  } catch(e) { console.error(e); return null; }
}

function getAllTables() {
  try {
    return db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name);
  } catch(e) { return []; }
}

function clearTable(tableName) {
  if (tableExists(tableName)) safeRun(`DELETE FROM ${quoteId(tableName)}`);
}

function defaultValueForColumn(columnName) {
  const n = String(columnName).toLowerCase();
  if (n === 'role') return 'user';
  if (n.includes('status')) return 'جديد';
  if (n.includes('created') || n.includes('updated') || n.includes('date')) return new Date().toISOString();
  if (n.includes('password')) return bcrypt.hashSync('123456', 10);
  return '';
}

function insertFlexibleRow(tableName, row) {
  try {
    const info = getColumnInfo(tableName);
    const cols = [], vals = [];
    for (const col of info) {
      if (col.pk) continue;
      let val = row[col.name];
      if (val === undefined) {
        if (col.dflt_value !== null) continue;
        if (col.notnull) val = defaultValueForColumn(col.name);
        else continue;
      }
      cols.push(col.name);
      vals.push(val);
    }
    if (!cols.length) return false;
    const placeholders = cols.map(() => '?').join(', ');
    const quoted = cols.map(quoteId).join(',');
    db.prepare(`INSERT INTO ${quoteId(tableName)} (${quoted}) VALUES (${placeholders})`).run(...vals);
    return true;
  } catch(e) { console.error(e); return false; }
}

function updateFlexible(tableName, id, data) {
  try {
    const columns = getTableColumns(tableName);
    if (!columns.includes('id')) return null;
    const updateColumns = Object.keys(data).filter(key => columns.includes(key) && data[key] !== undefined);
    if (!updateColumns.length) return null;
    const setSql = updateColumns.map(key => `${quoteId(key)} = ?`).join(', ');
    const values = updateColumns.map(key => data[key]);
    values.push(id);
    return safeRun(`UPDATE ${quoteId(tableName)} SET ${setSql} WHERE ${quoteId('id')} = ?`, values);
  } catch(e) { return null; }
}

function rowExistsBy(tableName, checks) {
  try {
    const columns = getTableColumns(tableName);
    for (const key of Object.keys(checks)) {
      if (!columns.includes(key)) continue;
      const value = checks[key];
      if (value === undefined || value === null || value === '') continue;
      const row = safeGet(`SELECT rowid FROM ${quoteId(tableName)} WHERE ${quoteId(key)} = ? LIMIT 1`, [value]);
      if (row) return true;
    }
    return false;
  } catch(e) { return false; }
}

function getOneFromTable(tableName, id) {
  if (!tableExists(tableName) || !id) return null;
  const columns = getTableColumns(tableName);
  if (!columns.includes('id')) return null;
  return safeGet(`SELECT * FROM ${quoteId(tableName)} WHERE ${quoteId('id')}=?`, [id]);
}

function getAllFromTable(tableName, orderBy = 'id DESC', limit = 500) {
  if (!tableExists(tableName)) return [];
  const order = normalizeOrderBy(tableName, orderBy);
  const orderSql = order ? ` ORDER BY ${order}` : '';
  const limitSql = limit ? ` LIMIT ${Number(limit)}` : '';
  return safeAll(`SELECT * FROM ${quoteId(tableName)}${orderSql}${limitSql}`);
}

function normalizeOrderBy(tableName, orderBy = 'id DESC') {
  const cols = getTableColumns(tableName);
  if (!cols.length) return '';
  const req = String(orderBy).trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9_]/g, '');
  const dir = orderBy.toUpperCase().includes('ASC') ? 'ASC' : 'DESC';
  if (req && cols.includes(req)) return `${quoteId(req)} ${dir}`;
  if (cols.includes('id')) return `${quoteId('id')} DESC`;
  return `${quoteId(cols[0])} DESC`;
}

// ============================================================
// 3. دوال الإعدادات
// ============================================================
const SETTINGS_PATH = path.resolve(__dirname, '../data/settings.json');
const DEFAULT_SETTINGS = {
  companyName: 'مجموعة زرعة الخير للتطوير والاستثمار العقاري',
  systemName: 'شركة زرعة الخير للنقليات / فرع الكسارة',
  branchName: 'فرع الكسارة',
  theme: 'light', language: 'ar', currency: 'SAR', timezone: 'Asia/Riyadh',
  trucks: [], factories: [], materials: [], days: {},
  distribution: { autoRefresh: true, refreshSeconds: 30 },
  gmail: { linked: false }
};

function getSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return DEFAULT_SETTINGS;
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    if (!raw.trim()) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch(e) { return DEFAULT_SETTINGS; }
}

function saveSettings(settings) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
}

// ============================================================
// 4. دوال اليوم والطلبات
// ============================================================
function normalizeDayKey(d) {
  const raw = String(d || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return new Date().toISOString().slice(0, 10);
}

function getOrdersByDay(dayKey) {
  if (tableExists('orders')) {
    const cols = getTableColumns('orders');
    if (cols.includes('date_key'))
      return safeAll(`SELECT * FROM orders WHERE date_key = ? ORDER BY id DESC`, [dayKey]);
    if (cols.includes('created_at'))
      return safeAll(`SELECT * FROM orders WHERE substr(created_at,1,10) = ? ORDER BY id DESC`, [dayKey]);
  }
  const settings = getSettings();
  return (settings.days[dayKey] || {}).orders || [];
}

function getDistributionByDay(dayKey) {
  if (tableExists('distribution')) {
    const cols = getTableColumns('distribution');
    if (cols.includes('date_key'))
      return safeAll(`SELECT * FROM distribution WHERE date_key = ? ORDER BY id DESC`, [dayKey]);
    if (cols.includes('created_at'))
      return safeAll(`SELECT * FROM distribution WHERE substr(created_at,1,10) = ? ORDER BY id DESC`, [dayKey]);
  }
  const settings = getSettings();
  return (settings.days[dayKey] || {}).distribution || [];
}

function flattenBackupDays(daysObject) {
  const days = daysObject || {};
  const orders = [], distribution = [];
  for (const dateKey of Object.keys(days)) {
    const dayData = days[dateKey] || {};
    if (Array.isArray(dayData.orders)) {
      orders.push(...dayData.orders.map(o => ({ ...o, date_key: dateKey })));
    }
    if (Array.isArray(dayData.distribution)) {
      distribution.push(...dayData.distribution.map(d => ({ ...d, date_key: dateKey })));
    }
  }
  return { orders, distribution };
}

// ============================================================
// 5. دوال جلب البيانات
// ============================================================
function getTrucksData() {
  if (tableExists('trucks')) return getAllFromTable('trucks', 'id DESC', 500);
  const settings = getSettings();
  return (settings.trucks || []).map((t, i) => ({
    id: i + 1, truck_number: t.number || t.truck_number || '',
    driver_name: t.driver || '', status: t.status || 'active'
  }));
}

function getDriversData() {
  if (tableExists('drivers')) return getAllFromTable('drivers', 'name ASC', 500);
  const settings = getSettings();
  const names = new Set();
  (settings.trucks || []).forEach(t => { if (t.driver) names.add(t.driver); });
  return Array.from(names).map((n, i) => ({ id: i + 1, name: n }));
}

function getFactoriesData() {
  if (tableExists('factories')) return getAllFromTable('factories', 'name ASC', 500);
  const settings = getSettings();
  return (settings.factories || []).map((f, i) => ({ id: i + 1, name: f.name, distance: f.distance || 0, location: f.location || '' }));
}

function getMaterialsData() {
  if (tableExists('materials')) return getAllFromTable('materials', 'name ASC', 500);
  const settings = getSettings();
  return (settings.materials || []).map((m, i) => typeof m === 'string' ? { id: i + 1, name: m, type: m } : m);
}

function getOrdersData() {
  if (tableExists('orders')) return getAllFromTable('orders', 'id DESC', 1000);
  const settings = getSettings();
  const flat = flattenBackupDays(settings.days);
  return flat.orders.map((o, i) => ({ id: i + 1, factory: o.factory || '', material: o.material || '', time: o.time || '', timestamp: o.timestamp || '', date_key: o.date_key || '' }));
}

function getDistributionData() {
  if (tableExists('distribution')) return getAllFromTable('distribution', 'id DESC', 1000);
  const settings = getSettings();
  const flat = flattenBackupDays(settings.days);
  return flat.distribution.map((d, i) => ({ id: i + 1, order_id: d.orderId, truck_number: d.truck?.number || '', driver_name: d.truck?.driver || '', factory: d.factory || '', material: d.material || '', date_key: d.date_key || '' }));
}

function getLogsTableName() {
  if (tableExists('logs')) return 'logs';
  if (tableExists('system_logs')) return 'system_logs';
  return null;
}

// ============================================================
// 6. باقي الدوال (المصادقة، النسخ الاحتياطي، المعرفات)
// ============================================================
function verifyPassword(password, hash) { try { return bcrypt.compareSync(password, hash); } catch(e) { return false; } }
function hashPassword(password) { return bcrypt.hashSync(password, 10); }

// ... (باقي الدوال كما هي تماماً) ...

module.exports = {
  db, ensureDataDir, readJsonFile, writeJsonFile,
  tableExists, getColumnInfo, getTableColumns, quoteId,
  safeAll, safeGet, safeRun,
  getAllTables, clearTable, defaultValueForColumn,
  insertFlexibleRow, updateFlexible, rowExistsBy, getOneFromTable,
  getAllFromTable, normalizeOrderBy,
  getSettings, saveSettings,
  normalizeDayKey, getOrdersByDay, getDistributionByDay, flattenBackupDays,
  getTrucksData, getDriversData, getFactoriesData, getMaterialsData,
  getOrdersData, getDistributionData, getLogsTableName,
  // ... (باقي أسماء الدوال المصدرة)
};