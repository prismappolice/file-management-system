const bcrypt = require('bcrypt');
const db = require('./database');

const SALT_ROUNDS = 10;

/**
 * Migration script to hash existing plain text passwords
 * Run this once after updating the login system
 */
async function migratePasswords() {
  console.log('Starting password migration...');
  
  return new Promise((resolve, reject) => {
    // Get all users with plain text passwords (not starting with $2b$)
    const sql = `SELECT id, username, password FROM users WHERE password NOT LIKE '$2b$%'`;
    
    db.all(sql, [], async (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        reject(err);
        return;
      }

      if (users.length === 0) {
        console.log('No users with plain text passwords found.');
        resolve();
        return;
      }

      console.log(`Found ${users.length} users with plain text passwords. Migrating...`);

      try {
        for (const user of users) {
          const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
          
          await new Promise((resolveUpdate, rejectUpdate) => {
            db.run(
              `UPDATE users SET password = ? WHERE id = ?`,
              [hashedPassword, user.id],
              function(err) {
                if (err) {
                  console.error(`Error updating password for user ${user.username}:`, err);
                  rejectUpdate(err);
                } else {
                  console.log(`✅ Updated password for user: ${user.username}`);
                  resolveUpdate();
                }
              }
            );
          });
        }

        console.log('✅ Password migration completed successfully!');
        resolve();
      } catch (error) {
        console.error('Error during migration:', error);
        reject(error);
      }
    });
  });
}

// Run migration if this script is executed directly
if (require.main === module) {
  migratePasswords()
    .then(() => {
      console.log('Migration finished.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migratePasswords };