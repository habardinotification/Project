const express = require('express');
const router = express.Router();
const { db } = require('../../db');
const { getAllTables, clearTable, insertFlexibleRow, getSettings, saveSettings } = require('../../utils/dbHelpers');
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
  try {
    const tables = {};
    const tableNames = getAllTables();
    for (const name of tableNames) {
      tables[name] = db.prepare(`SELECT * FROM ${quoteId(name)}`).all();
    }
    res.json({ success: true, settings: getSettings(), tables });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/restore', (req, res) => {
  try {
    const payload = req.body;
    const clearBefore = payload.replaceExisting === true;
    // استعادة الإعدادات
    if (payload.settings) saveSettings(payload.settings);
    // استعادة الجداول
    const tablesData = payload.tables || {};
    for (const tableName of Object.keys(tablesData)) {
      if (clearBefore && tableExists(tableName)) clearTable(tableName);
      for (const row of tablesData[tableName]) {
        insertFlexibleRow(tableName, row);
      }
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;