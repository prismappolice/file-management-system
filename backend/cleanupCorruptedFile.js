const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('Cleaning up corrupted file (ID 33)...');
const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath);

// First get the file path
db.get('SELECT filepath FROM files WHERE id = 33', (err, row) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  if (!row) {
    console.log('File ID 33 not found in database');
    db.close();
    return;
  }
  
  const filePath = row.filepath;
  
  // Delete from database
  db.run('DELETE FROM files WHERE id = 33', (err) => {
    if (err) {
      console.error('Error deleting from database:', err);
    } else {
      console.log('✓ Deleted file record from database');
      
      // Delete physical file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('✓ Deleted corrupted file from uploads folder');
      } else {
        console.log('Physical file not found');
      }
    }
    
    db.close();
    console.log('Cleanup complete. You can now upload a fresh file.');
  });
});