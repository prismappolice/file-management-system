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

console.log('Querying users...');
db.all('SELECT id, username, fullname, userType FROM users', (err, rows) => {
  if (err) {
    console.error('Error querying users:', err);
  } else {
    console.log('\n=== ALL USERS ===');
    rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`Username: "${row.username}"`);
      console.log(`Full name: "${row.fullname}"`);
      console.log(`User type: "${row.userType}"`);
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