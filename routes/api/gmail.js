// routes/api/gmail.js
const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const TOKEN_PATH = path.resolve(__dirname, '../../data/google-token.json');

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'غير مصرح' });
  next();
}

function getOAuthClient() {
  const credPath = process.env.GOOGLE_CREDENTIALS_PATH;
  if (credPath && fs.existsSync(credPath)) {
    const content = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const web = content.web || content;
    return new google.auth.OAuth2(web.client_id, web.client_secret, process.env.GOOGLE_REDIRECT_URI);
  }
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function getStoredTokens() {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    }
  } catch (e) {}
  return null;
}

async function getAuthenticatedClient() {
  const oauth2Client = getOAuthClient();
  const tokens = getStoredTokens();
  if (!tokens) throw new Error('Gmail not authenticated');
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

async function fetchPlainText(msgId, gmail) {
  const msgData = await gmail.users.messages.get({ userId: 'me', id: msgId, format: 'full' });
  let plain = '';
  const parts = msgData.data.payload.parts || [];
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      plain = Buffer.from(part.body.data, 'base64').toString('utf-8');
      break;
    }
  }
  if (!plain) {
    for (const part of parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
        plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }
  if (!plain && msgData.data.payload.body?.data) {
    plain = Buffer.from(msgData.data.payload.body.data, 'base64').toString('utf-8');
  }
  return plain;
}

async function fetchRecentEmails(maxResults = 20) {
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.list({ userId: 'me', maxResults });
  const messages = res.data.messages || [];
  console.log(`📬 عدد الرسائل في البريد الوارد: ${messages.length}`);
  const emails = [];
  for (const msg of messages) {
    const text = await fetchPlainText(msg.id, gmail);
    if (text) emails.push(text);
  }
  return emails;
}

function extractTruckNumber(text) {
  const vehicleLineMatch = text.match(/Vehicle\s*:?\s*([^\n]+)/i);
  if (!vehicleLineMatch) return null;
  const vehicleLine = vehicleLineMatch[1];
  const digits = vehicleLine.match(/\d+/g);
  if (!digits || !digits.length) return null;
  for (const num of digits) {
    if (num.length >= 2 && num.length <= 5) return num;
  }
  return digits[digits.length - 1];
}

function extractDriverName(text) {
  const driverMatch = text.match(/Driver Name\s*:?\s*([^\n]+)/i);
  if (!driverMatch) return null;
  let name = driverMatch[1].trim();
  const driverNumIdx = name.search(/Driver Number/i);
  if (driverNumIdx !== -1) name = name.substring(0, driverNumIdx).trim();
  name = name.replace(/\s*\d{6,}\s*$/, '').trim();
  name = name.replace(/\s*\d{4,}\s*$/, '').trim();
  if (!name || /^\d+$/.test(name)) return null;
  return name;
}

function parseDateTimeFromText(text) {
  const dateMatch = text.match(/Date\s*:?\s*([^\n]+)/i);
  const timeMatch = text.match(/Time\s*:?\s*([^\n]+)/i);
  if (!dateMatch || !timeMatch) return null;
  try {
    const dateStr = dateMatch[1].trim();
    const timeStr = timeMatch[1].trim();
    const dateParts = dateStr.split('/');
    if (dateParts.length !== 3) return null;
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    let hours = 0, minutes = 0, seconds = 0;
    const timeLower = timeStr.toLowerCase();
    let tm = timeLower.match(/(\d+):(\d+):(\d+)\s*(am|pm)/);
    if (tm) {
      hours = parseInt(tm[1], 10);
      minutes = parseInt(tm[2], 10);
      seconds = parseInt(tm[3], 10);
      const mod = tm[4];
      if (mod === 'pm' && hours < 12) hours += 12;
      if (mod === 'am' && hours === 12) hours = 0;
    } else {
      tm = timeLower.match(/(\d+):(\d+)\s*(am|pm)/);
      if (tm) {
        hours = parseInt(tm[1], 10);
        minutes = parseInt(tm[2], 10);
        const mod = tm[3];
        if (mod === 'pm' && hours < 12) hours += 12;
        if (mod === 'am' && hours === 12) hours = 0;
      }
    }
    const parsed = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch (e) {
    return null;
  }
}

async function syncIncomingTrucks(db, io) {
  // التأكد من وجود الأعمدة المطلوبة في الجدول
  db.exec(`
    CREATE TABLE IF NOT EXISTS incoming_trucks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      truck_number TEXT NOT NULL,
      driver_name TEXT,
      detected_at DATETIME NOT NULL,
      expected_arrival DATETIME,
      assigned INTEGER DEFAULT 0,
      status TEXT DEFAULT 'في الطريق',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const cols = db.prepare("PRAGMA table_info(incoming_trucks)").all();
  const colNames = cols.map(c => c.name);
  if (!colNames.includes('expected_arrival')) {
    db.exec("ALTER TABLE incoming_trucks ADD COLUMN expected_arrival DATETIME");
  }
  if (!colNames.includes('assigned')) {
    db.exec("ALTER TABLE incoming_trucks ADD COLUMN assigned INTEGER DEFAULT 0");
  }

  const emails = await fetchRecentEmails(20);
  if (!emails.length) {
    console.log('⚠️ لا توجد رسائل بريدية.');
    return { added: 0, skipped: 0 };
  }

  let added = 0, skipped = 0;
  for (const emailText of emails) {
    const truckNumber = extractTruckNumber(emailText);
    let driverName = extractDriverName(emailText);
    if (!truckNumber) {
      console.log(`❌ لم يتم العثور على رقم سيارة صالح في هذا البريد، تم تخطيه.`);
      skipped++;
      continue;
    }
    if (truckNumber.length > 5 || truckNumber.length < 2) {
      console.log(`⚠️ رقم السيارة المستخرج (${truckNumber}) غير معقول، تم تخطيه.`);
      skipped++;
      continue;
    }

    let detectedAt = new Date();
    let expectedArrival = new Date(Date.now() + 15 * 60000);
    const parsedDate = parseDateTimeFromText(emailText);
    if (parsedDate) {
      detectedAt = parsedDate;
      expectedArrival = new Date(parsedDate.getTime() + 15 * 60000);
    }
    if (!driverName) driverName = 'غير معروف';

    console.log(`🔍 مستخرج: السيارة=${truckNumber}, السائق=${driverName}, الوقت=${detectedAt.toLocaleString()}`);

    // التحقق من وجود سيارة بنفس الرقم خلال آخر ساعة ولم تُوزع بعد
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const existing = db.prepare(`
      SELECT id, assigned FROM incoming_trucks 
      WHERE truck_number = ? AND detected_at > ?
      ORDER BY detected_at DESC LIMIT 1
    `).get(truckNumber, oneHourAgo);

    if (existing && existing.assigned === 0) {
      console.log(`⏭️ مكررة (خلال ساعة ولم توزع): ${truckNumber}`);
      skipped++;
      continue;
    }

    // إدراج سيارة جديدة (إذا لم تكن موجودة أو كانت موزعة/قديمة)
    db.prepare(`
      INSERT INTO incoming_trucks (truck_number, driver_name, detected_at, expected_arrival, assigned)
      VALUES (?, ?, ?, ?, 0)
    `).run(truckNumber, driverName, detectedAt.toISOString(), expectedArrival.toISOString());
    added++;
    if (io) io.emit('new-incoming-truck', { truckNumber, driverName, expectedArrival });
    console.log(`✅ أضيفت: ${truckNumber} - ${driverName}`);
  }
  console.log(`📊 المزامنة: تمت معالجة ${emails.length} بريد، +${added} جديدة, ${skipped} مكررة/فاشلة`);
  return { added, skipped };
}

router.get('/status', requireAuth, (req, res) => {
  const linked = fs.existsSync(TOKEN_PATH);
  res.json({ linked });
});

router.post('/sync', requireAuth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) throw new Error('قاعدة البيانات غير متاحة');
    const io = req.app.get('io');
    const { added, skipped } = await syncIncomingTrucks(db, io);
    res.json({ success: true, added, skipped });
  } catch (err) {
    console.error('❌ خطأ في المزامنة:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;