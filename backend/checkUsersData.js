const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('files.db');

console.log('=== USERS DATABASE CONTENT ===');

db.all('SELECT id, username, fullname, userType, password FROM users ORDER BY id', (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log(`Found ${rows.length} users:`);
    rows.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Full Name: ${user.fullname}`);
      console.log(`  User Type: ${user.userType}`);
      console.log(`  Password: ${user.password.substring(0, 25)}...`);
      console.log('---');
    });
  }
  db.close();
});