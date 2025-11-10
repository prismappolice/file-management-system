const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking table structure...');

db.all("PRAGMA table_info(files)", (err, rows) => {
  if (err) {
    console.error('Error getting table info:', err);
  } else {
    console.log('Files table structure:');
    console.table(rows);
  }
  db.close();
});