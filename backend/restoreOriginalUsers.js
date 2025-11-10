const bcrypt = require('bcrypt');
const db = require('./database');

const SALT_ROUNDS = 10;

/**
 * Restore original user system with admin/district types
 * Keep original authentication working while improving UserManagement form
 */
async function restoreOriginalUsers() {
  console.log('Restoring original user system...');
  
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
        console.log('\nCleaning up users...');
        await new Promise((resolveDelete, rejectDelete) => {
          db.run(
            `DELETE FROM users WHERE username NOT IN ('admin')`,
            function(err) {
              if (err) {
                console.error('Error deleting users:', err);
                rejectDelete(err);
              } else {
                console.log(`✅ Removed ${this.changes} users`);
                resolveDelete();
              }
            }
          );
        });

        // Restore admin user with original 'admin' type
        console.log('\nRestoring admin user...');
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
                console.log('✅ Admin user restored');
                resolveAdmin();
              }
            }
          );
        });

        // Create user1 with original district type
        console.log('\nCreating user1...');
        const user1Password = await bcrypt.hash('user123', SALT_ROUNDS);
        
        await new Promise((resolveUser1, rejectUser1) => {
          db.run(
            `INSERT OR REPLACE INTO users (id, username, password, fullname, userType) VALUES (2, 'user1', ?, 'District User', 'district')`,
            [user1Password],
            function(err) {
              if (err) {
                console.error('Error creating user1:', err);
                rejectUser1(err);
              } else {
                console.log('✅ User1 restored');
                resolveUser1();
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

          console.log('\n🎉 Original user system restored!');
          console.log('\n📋 Login Credentials:');
          console.log('Admin: username=admin, password=admin123, userType=admin');
          console.log('User1: username=user1, password=user123, userType=district');
          console.log('\n💡 NOTE: UserManagement form still uses ADMIN/USER dropdown for NEW users');
          
          resolve();
        });

      } catch (error) {
        console.error('Error during restoration:', error);
        reject(error);
      }
    });
  });
}

// Run restoration if this script is executed directly
if (require.main === module) {
  restoreOriginalUsers()
    .then(() => {
      console.log('\n✅ Restoration completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Restoration failed:', error);
      process.exit(1);
    });
}

module.exports = { restoreOriginalUsers };