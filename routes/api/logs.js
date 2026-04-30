const express = require('express');
const router = express.Router();
const { tableExists, safeAll, safeRun, getSettings } = require('../../utils/dbHelpers');

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Helper: log action to DB
function logToDB(db, username, role, action, details, ip, location) {
  if (!tableExists('logs')) return;
  safeRun(
    `INSERT INTO logs (username, role, action, details, ip, location, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [username, role, action, details || '', ip || '', location || '', new Date().toISOString()]
  );
}

// GET: Full sessions with login/logout info
router.get('/full-sessions', requireAuth, (req, res) => {
  try {
    const db = req.app.locals.db;
    const sessions = [];

    if (tableExists('logs')) {
      const allLogs = safeAll(`SELECT * FROM logs ORDER BY created_at ASC LIMIT 1000`);
      
      let currentSession = null;

      for (const log of allLogs) {
        const actionLower = (log.action || '').toLowerCase();
        const isLogin = actionLower.includes('دخول') || actionLower.includes('login') || actionLower.includes('تسجيل');
        const isLogout = actionLower.includes('خروج') || actionLower.includes('logout');

        if (isLogin) {
          if (currentSession && currentSession.session_active) {
            currentSession.session_active = false;
          }
          currentSession = {
            username: log.username || 'Unknown',
            role: log.role || 'User',
            login_time: log.created_at,
            logout_time: null,
            ip_address: log.ip || null,
            location: log.location || null,
            session_active: true
          };
          sessions.push({
            ...currentSession,
            action: log.action || 'Login',
            action_type: 'login',
            created_at: log.created_at
          });
        } else if (isLogout) {
          if (currentSession && currentSession.session_active) {
            currentSession.logout_time = log.created_at;
            currentSession.session_active = false;
          }
          sessions.push({
            username: log.username || (currentSession?.username || 'Unknown'),
            role: log.role || (currentSession?.role || 'User'),
            login_time: currentSession?.login_time || log.created_at,
            logout_time: log.created_at,
            ip_address: currentSession?.ip_address || log.ip || null,
            location: currentSession?.location || log.location || null,
            session_active: false,
            action: log.action || 'Logout',
            action_type: 'logout',
            created_at: log.created_at
          });
        } else {
          sessions.push({
            username: log.username || (currentSession?.username || 'Unknown'),
            role: log.role || (currentSession?.role || 'User'),
            login_time: currentSession?.login_time || log.created_at,
            logout_time: currentSession?.logout_time || null,
            ip_address: currentSession?.ip_address || log.ip || null,
            location: currentSession?.location || log.location || null,
            session_active: currentSession?.session_active || false,
            action: log.action || 'Action',
            action_type: 'action',
            created_at: log.created_at
          });
        }
      }
    }

    res.json({ sessions: sessions.reverse() });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: error.message, sessions: [] });
  }
});

// GET: Normal logs with filter
router.get('/', requireAuth, (req, res) => {
  try {
    let logs = [];
    const actionFilter = req.query.action;

    if (tableExists('logs')) {
      let query = `SELECT * FROM logs`;
      const params = [];

      if (actionFilter === 'login') {
        query += ` WHERE (action LIKE '%دخول%' OR action LIKE '%login%' OR action LIKE '%تسجيل%')`;
      } else if (actionFilter === 'logout') {
        query += ` WHERE (action LIKE '%خروج%' OR action LIKE '%logout%')`;
      }
      query += ` ORDER BY created_at DESC LIMIT 500`;

      logs = safeAll(query, params);
    } else {
      const settings = getSettings();
      logs = settings.logs || [];
    }

    res.json({ logs: logs.map(log => ({
      ...log,
      username: log.username || 'Unknown'
    })) });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: error.message, logs: [] });
  }
});

// POST: Create new log entry
router.post('/', requireAuth, (req, res) => {
  try {
    const { action, details } = req.body;
    const username = req.session.user?.username || req.session.user?.name || 'Unknown';
    const role = req.session.user?.role || 'User';
    const ip = req.ip || req.connection?.remoteAddress || '';
    const location = req.body.location || '';

    const newLog = {
      username, role, action: action || 'Event', details: details || '',
      ip, location, created_at: new Date().toISOString()
    };

    logToDB(req.app.locals.db, username, role, action, details, ip, location);

    res.json({ success: true, log: newLog });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Login history (compatibility)
router.get('/login-history', requireAuth, (req, res) => {
  req.query.action = 'login';
  router.handle(req, res);
});

module.exports = router;