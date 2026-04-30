const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { db, safeAll, safeGet, safeRun, quoteId } = require('../../utils/dbHelpers');

// Middleware للتحقق من db
function checkDb(req, res, next) {
  if (!db || typeof db.prepare !== 'function') {
    console.error('Database not available');
    return res.status(500).json({ error: 'قاعدة البيانات غير متاحة' });
  }
  next();
}
router.use(checkDb);

// GET /api/users
router.get('/', (req, res) => {
  try {
    const users = safeAll(`SELECT id, username, name, role, is_active, created_at FROM users ORDER BY username ASC`);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'فشل في جلب المستخدمين' });
  }
});

// POST /api/users (إضافة مستخدم)
router.post('/', (req, res) => {
  try {
    const { username, name, role, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`INSERT INTO users (username, name, role, password_hash, created_at, is_active) VALUES (?,?,?,?,?,?)`);
    stmt.run(username, name || username, role || 'user', hash, new Date().toISOString(), 1);
    res.json({ success: true, message: 'تم إضافة المستخدم' });
  } catch(err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ error: 'اسم المستخدم موجود مسبقاً' });
    res.status(500).json({ error: 'فشل في الإضافة' });
  }
});

// PATCH /api/users/:id/role - تحديث الصلاحيات والحالة فقط
router.patch('/:id/role', (req, res) => {
  try {
    const { role, is_active } = req.body;
    if (!role && is_active === undefined) return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
    const updates = [];
    const values = [];
    if (role) { updates.push(`role = ?`); values.push(role); }
    if (is_active !== undefined) { updates.push(`is_active = ?`); values.push(is_active ? 1 : 0); }
    values.push(req.params.id);
    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    if (result.changes === 0) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json({ success: true, message: 'تم تحديث الصلاحيات' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'فشل التحديث' });
  }
});

// PUT /api/users/:id - تحديث عام (اسم، اسم مستخدم، كلمة مرور، دور)
router.put('/:id', (req, res) => {
  try {
    const { username, name, role, password, is_active } = req.body;
    const updates = [];
    const values = [];
    if (username) { updates.push(`username = ?`); values.push(username); }
    if (name) { updates.push(`name = ?`); values.push(name); }
    if (role) { updates.push(`role = ?`); values.push(role); }
    if (password) { updates.push(`password_hash = ?`); values.push(bcrypt.hashSync(password,10)); }
    if (is_active !== undefined) { updates.push(`is_active = ?`); values.push(is_active ? 1 : 0); }
    if (updates.length === 0) return res.status(400).json({ error: 'لا توجد بيانات' });
    values.push(req.params.id);
    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    if (result.changes === 0) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json({ success: true, message: 'تم تحديث المستخدم' });
  } catch(err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ error: 'اسم المستخدم موجود' });
    res.status(500).json({ error: 'فشل التحديث' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  try {
    // منع حذف الأدمن الوحيد؟ يمكن إضافة شرط
    const stmt = db.prepare(`DELETE FROM users WHERE id = ?`);
    const result = stmt.run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json({ success: true, message: 'تم حذف المستخدم' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'فشل الحذف' });
  }
});

// POST /api/users/:id/change-password - تغيير كلمة المرور
router.post('/:id/change-password', (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'كلمة المرور مطلوبة' });
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`);
    const result = stmt.run(hash, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json({ success: true, message: 'تم تغيير كلمة المرور' });
  } catch(err) {
    res.status(500).json({ error: 'فشل تغيير كلمة المرور' });
  }
});

module.exports = router;