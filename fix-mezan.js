const db = require('better-sqlite3')('data/zarah.sqlite');
const bcrypt = require('bcrypt');

const username = 'Mezan1';
const password = 'Mz2026';
const name = 'مستخدم ميزان';
const role = 'employee';   // تغيير من user إلى employee

const hashedPassword = bcrypt.hashSync(password, 10);

try {
  const update = db.prepare(`
    UPDATE users 
    SET password_hash = ?, name = ?, role = ?, is_active = 1
    WHERE username = ?
  `);
  const result = update.run(hashedPassword, name, role, username);
  
  if (result.changes > 0) {
    console.log(`✅ تم تحديث ${username} بنجاح بالصلاحية ${role}`);
  } else {
    // إذا لم يكن موجوداً، نقوم بإدراجه
    const insert = db.prepare(`
      INSERT INTO users (username, password_hash, name, role, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'))
    `);
    insert.run(username, hashedPassword, name, role);
    console.log(`✅ تم إنشاء ${username} بالصلاحية ${role}`);
  }
} catch (err) {
  console.error('❌ خطأ:', err.message);
}