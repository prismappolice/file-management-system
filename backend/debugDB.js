const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('Opening database...');
const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Connected to database');
});

console.log('Querying files...');
db.all('SELECT id, filename, created_by, uploaded_at FROM files ORDER BY id DESC LIMIT 5', (err, rows) => {
  if (err) {
    console.error('Error querying files:', err);
  } else {
    console.log('\n=== RECENT FILES WITH CREATED_BY VALUES ===');
    rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`Filename: ${row.filename}`);
      console.log(`Created by: "${row.created_by}"`);
      console.log(`Uploaded at: ${row.uploaded_at}`);
      console.log('---');
    });
  }
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
  });
});