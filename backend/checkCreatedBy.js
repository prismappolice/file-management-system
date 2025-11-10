const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking created_by values in database...');

db.all('SELECT id, filename, created_by FROM files ORDER BY id DESC LIMIT 5', (err, rows) => {
  if (err) {
    console.error('Error fetching files:', err);
  } else {
    console.log('Recent files with created_by values:');
    console.table(rows);
  }
  db.close();
});