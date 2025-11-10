// Verification: Current Programs with Creation Dates
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath);

console.log('=== CURRENT PROGRAMS WITH CREATION DATES ===\n');

db.all('SELECT id, name, icon, created_date FROM programs ORDER BY created_date DESC', (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    if (rows.length === 0) {
      console.log('No programs found in database.');
    } else {
      rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.name}`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Serial: ${row.icon}`);
        console.log(`   Created: ${row.created_date || 'N/A'}`);
        console.log('');
      });
    }
  }
  db.close();
});