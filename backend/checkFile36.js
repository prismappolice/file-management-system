const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('Checking file ID 36...');
const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath);

db.get('SELECT * FROM files WHERE id = 36', (err, row) => {
  if (err) {
    console.error('Error:', err);
  } else if (!row) {
    console.log('❌ File ID 36 not found in database');
  } else {
    console.log('✅ File found in database:');
    console.log(`ID: ${row.id}`);
    console.log(`Filename: ${row.filename}`);
    console.log(`Filepath: ${row.filepath}`);
    console.log(`Created by: ${row.created_by}`);
    
    // Check if file exists on disk
    if (fs.existsSync(row.filepath)) {
      const stats = fs.statSync(row.filepath);
      console.log(`✅ File exists on disk`);
      console.log(`File size: ${stats.size} bytes`);
      
      // Check if it's a valid file or contains error content
      if (stats.size < 100) {
        console.log('⚠️  File is very small - might be corrupted');
        try {
          const content = fs.readFileSync(row.filepath, 'utf8');
          console.log('File content:', content);
        } catch (e) {
          console.log('Could not read file as text (might be binary)');
        }
      }
    } else {
      console.log('❌ File does not exist on disk');
    }
  }
  
  // Also check recent files
  console.log('\n--- Recent files in database ---');
  db.all('SELECT id, filename, filepath FROM files ORDER BY id DESC LIMIT 5', (err, rows) => {
    if (err) {
      console.error('Error fetching recent files:', err);
    } else {
      rows.forEach(row => {
        const exists = fs.existsSync(row.filepath);
        console.log(`ID ${row.id}: ${row.filename} - Exists: ${exists}`);
      });
    }
    db.close();
  });
});