const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Path to the correct database file
const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath);

// Change these as needed
const NEW_FULLNAME = 'User One'; // Set your desired display name
const NEW_PASSWORD = 'your_new_password'; // Set your new password

async function updateUser1() {
  const SALT_ROUNDS = 10;
  const hashedPassword = await bcrypt.hash(NEW_PASSWORD, SALT_ROUNDS);

  db.run(
    `UPDATE users SET fullname = ?, password = ? WHERE username = 'user1'`,
    [NEW_FULLNAME, hashedPassword],
    function (err) {
      if (err) {
        console.error('Error updating user1:', err);
      } else {
        console.log('✅ user1 updated:');
        console.log('  New fullname:', NEW_FULLNAME);
        console.log('  New password (hashed):', hashedPassword.substring(0, 25) + '...');
      }
      db.close();
    }
  );
}

updateUser1();
