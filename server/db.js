/**
 * Simple JSON file database (no external deps)
 */
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDB({ users: [], projects: [] });
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { users: [], projects: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = { readDB, writeDB };
