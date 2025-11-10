const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking files in database...');

db.all('SELECT id, filename, filepath FROM files LIMIT 10', (err, rows) => {
  if (err) {
    console.error('Error fetching files:', err);
  } else {
    console.log('Files in database:');
    console.table(rows);
    
    // Also check if the files exist on disk
    const fs = require('fs');
    rows.forEach(row => {
      const exists = fs.existsSync(row.filepath);
      console.log(`File ${row.id}: ${row.filename} - Exists on disk: ${exists}`);
    });
  }
  db.close();
});