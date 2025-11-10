const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting database migration...');

db.serialize(() => {
  // Check if fileNo column exists
  db.all("PRAGMA table_info(files)", (err, columns) => {
    if (err) {
      console.error('Error checking table:', err);
      db.close();
      return;
    }

    const hasFileNo = columns.some(col => col.name === 'fileNo');

    if (hasFileNo) {
      console.log('fileNo column already exists. Migration not needed.');
      db.close();
      return;
    }

    console.log('Adding fileNo column...');

    // Create new table with fileNo column
    db.run(`
      CREATE TABLE files_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fileNo TEXT NOT NULL DEFAULT '',
        subject TEXT NOT NULL,
        department TEXT NOT NULL,
        date TEXT NOT NULL,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating new table:', err);
        db.close();
        return;
      }

      // Copy data from old table to new table
      db.run(`
        INSERT INTO files_new (id, fileNo, subject, department, date, filename, filepath, uploaded_at)
        SELECT id, '', subject, department, date, filename, filepath, uploaded_at
        FROM files
      `, (err) => {
        if (err) {
          console.error('Error copying data:', err);
          db.close();
          return;
        }

        // Drop old table
        db.run('DROP TABLE files', (err) => {
          if (err) {
            console.error('Error dropping old table:', err);
            db.close();
            return;
          }

          // Rename new table to files
          db.run('ALTER TABLE files_new RENAME TO files', (err) => {
            if (err) {
              console.error('Error renaming table:', err);
            } else {
              console.log('Migration completed successfully!');
            }
            db.close();
          });
        });
      });
    });
  });
});
