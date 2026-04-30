// check_db.js
const { db } = require('./db');
try {
  const count = db.prepare("SELECT COUNT(*) as count FROM incoming_trucks").get();
  console.log(`عدد السيارات في incoming_trucks: ${count.count}`);
  if (count.count > 0) {
    const sample = db.prepare("SELECT * FROM incoming_trucks LIMIT 3").all();
    console.log("عينة:", sample);
  } else {
    console.log("الجدول فارغ – تحتاج إلى مزامنة ناجحة أو إدخال يدوي.");
  }
} catch(e) {
  console.error("خطأ:", e.message);
}