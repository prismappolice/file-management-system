const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath);

const testFilePath = path.join(__dirname, '..', 'uploads', 'test-file.txt');

console.log('Inserting test file into database...');

db.run(
  'INSERT INTO files (fileNo, subject, department, date, filename, filepath, program) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ['TEST001', 'Test File', 'IT', '2024-01-01', 'test-file.txt', testFilePath, 'test'],
  function(err) {
    if (err) {
      console.error('Error inserting test file:', err);
    } else {
      console.log(`Test file inserted with ID: ${this.lastID}`);
    }
    db.close();
  }
);