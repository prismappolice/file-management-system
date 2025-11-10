const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking file ID 36...');

db.get('SELECT * FROM files WHERE id = 36', (err, row) => {
  if (err) {
    console.error('Error:', err);
  } else if (!row) {
    console.log('❌ File ID 36 not found in database');
  } else {
    console.log('✅ File found:');
    console.log('ID:', row.id);
    console.log('Filename:', row.filename);
    console.log('Filepath:', row.filepath);
    
    // Check if file exists on disk
    const exists = fs.existsSync(row.filepath);
    console.log('File exists on disk:', exists);
    
    if (exists) {
      const stats = fs.statSync(row.filepath);
      console.log('File size:', stats.size, 'bytes');
    }
  }
  db.close();
});