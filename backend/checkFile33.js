const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('Checking file ID 33...');
const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath);

db.get('SELECT * FROM files WHERE id = 33', (err, row) => {
  if (err) {
    console.error('Error:', err);
  } else if (!row) {
    console.log('File ID 33 not found');
  } else {
    console.log('File details:');
    console.log(`ID: ${row.id}`);
    console.log(`Filename: ${row.filename}`);
    console.log(`Filepath: ${row.filepath}`);
    console.log(`Created by: ${row.created_by}`);
    
    // Check if file exists and its size
    if (fs.existsSync(row.filepath)) {
      const stats = fs.statSync(row.filepath);
      console.log(`File exists: Yes`);
      console.log(`File size: ${stats.size} bytes`);
      
      if (stats.size < 100) {
        console.log('\n⚠️  File is very small - might be corrupted');
        // Read the file content if it's small
        const content = fs.readFileSync(row.filepath, 'utf8');
        console.log('File content:');
        console.log(content);
      }
    } else {
      console.log('File exists: No');
    }
  }
  db.close();
});