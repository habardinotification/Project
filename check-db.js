const db = require('better-sqlite3')('data/zarah.sqlite');

// عرض جميع الجداول
console.log("📋 قائمة الجداول في قاعدة البيانات:");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.table(tables);

// إذا كان جدول users موجوداً، أظهر هيكله
const userTableExists = tables.some(t => t.name === 'users');
if (userTableExists) {
    console.log("\n📋 هيكل جدول users:");
    const schema = db.prepare("PRAGMA table_info(users)").all();
    console.table(schema);
    
    console.log("\n👤 عدد المستخدمين:");
    const count = db.prepare("SELECT COUNT(*) as count FROM users").get();
    console.log(count);
    
    // عرض أي بيانات موجودة (إن وجدت)
    const anyUser = db.prepare("SELECT * FROM users LIMIT 5").all();
    if (anyUser.length > 0) {
        console.log("\n📋 بيانات المستخدمين (أول 5):");
        console.table(anyUser);
    } else {
        console.log("⚠️ جدول users موجود لكنه فارغ.");
    }
} else {
    console.log("❌ جدول users غير موجود في قاعدة البيانات.");
}

// عرض جميع الجداول الأخرى (مثل employees, admins, إلخ)
console.log("\n📋 جميع الجداول:");
db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().forEach(t => console.log(t.name));