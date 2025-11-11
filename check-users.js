const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./files.db');

db.all('SELECT id, username, userType FROM users', [], (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Current users in database:');
    rows.forEach(u => console.log(`  ID: ${u.id}, User: ${u.username}, Type: '${u.userType}'`));
  }
  db.close();
});
