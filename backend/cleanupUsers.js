const bcrypt = require('bcrypt');
const db = require('./database');

const SALT_ROUNDS = 10;

/**
 * Clean up database to only keep admin and district users
 * Remove all other users and ensure no credentials in frontend
 */
async function cleanupUsers() {
  console.log('Starting user cleanup...');
  
  return new Promise((resolve, reject) => {
    // First, get all current users
    const sql = `SELECT id, username, userType FROM users`;
    
    db.all(sql, [], async (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        reject(err);
        return;
      }

      console.log('Current users in database:');
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Username: ${user.username}, Type: ${user.userType}`);
      });

      try {
        // Delete all users except admin
        console.log('\nRemoving unnecessary users...');
        await new Promise((resolveDelete, rejectDelete) => {
          db.run(
            `DELETE FROM users WHERE username NOT IN ('admin')`,
            function(err) {
              if (err) {
                console.error('Error deleting users:', err);
                rejectDelete(err);
              } else {
                console.log(`✅ Removed ${this.changes} unnecessary users`);
                resolveDelete();
              }
            }
          );
        });

        // Ensure admin user exists with correct credentials
        console.log('\nEnsuring admin user exists...');
        const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
        
        await new Promise((resolveAdmin, rejectAdmin) => {
          db.run(
            `INSERT OR REPLACE INTO users (id, username, password, fullname, userType) VALUES (1, 'admin', ?, 'System Administrator', 'admin')`,
            [adminPassword],
            function(err) {
              if (err) {
                console.error('Error creating admin user:', err);
                rejectAdmin(err);
              } else {
                console.log('✅ Admin user configured');
                resolveAdmin();
              }
            }
          );
        });

        // Create regular user  
        console.log('\nCreating regular user...');
        const userPassword = await bcrypt.hash('user123', SALT_ROUNDS);
        
        await new Promise((resolveUser, rejectUser) => {
          db.run(
            `INSERT OR REPLACE INTO users (id, username, password, fullname, userType) VALUES (2, 'user1', ?, 'Regular User', 'USER')`,
            [userPassword],
            function(err) {
              if (err) {
                console.error('Error creating regular user:', err);
                rejectUser(err);
              } else {
                console.log('✅ Regular user configured');
                resolveUser();
              }
            }
          );
        });

        // Verify final state
        console.log('\nFinal user list:');
        db.all(`SELECT id, username, fullname, userType FROM users`, [], (err, finalUsers) => {
          if (err) {
            console.error('Error fetching final users:', err);
            reject(err);
            return;
          }

          finalUsers.forEach(user => {
            console.log(`✅ ID: ${user.id}, Username: ${user.username}, Name: ${user.fullname}, Type: ${user.userType}`);
          });

          console.log('\n🎉 User cleanup completed successfully!');
          console.log('\n📋 Login Credentials:');
          console.log('Admin: username=admin, password=admin123, userType=ADMIN');
          console.log('User: username=user1, password=user123, userType=USER');
          
          resolve();
        });

      } catch (error) {
        console.error('Error during cleanup:', error);
        reject(error);
      }
    });
  });
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupUsers()
    .then(() => {
      console.log('\n✅ Cleanup finished successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupUsers };