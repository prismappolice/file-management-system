const bcrypt = require('bcrypt');
const pool = require('./database');

const SALT_ROUNDS = 10;

/**
 * Clean up database to only keep admin and district users
 * Remove all other users and ensure no credentials in frontend
 */
async function cleanupUsers() {
  console.log('Starting user cleanup...');
  
  try {
    // First, get all current users
    const sql = `SELECT id, username, userType FROM users`;
    const result = await pool.query(sql);
    const users = result.rows;

    console.log('Current users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Type: ${user.userType}`);
    });

    // Delete all users except admin
    console.log('\nRemoving unnecessary users...');
    const deleteResult = await pool.query(`DELETE FROM users WHERE username NOT IN ('admin')`);
    console.log(`✅ Removed ${deleteResult.rowCount} unnecessary users`);

    // Ensure admin user exists with correct credentials
    console.log('\nEnsuring admin user exists...');
    const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
    
    await pool.query(
      `INSERT INTO users (id, username, password, fullname, userType) 
       VALUES (1, 'admin', $1, 'System Administrator', 'admin')
       ON CONFLICT (username) DO UPDATE SET password = $1, fullname = 'System Administrator', userType = 'admin'`,
      [adminPassword]
    );
    console.log('✅ Admin user configured');

    // Create regular user  
    console.log('\nCreating regular user...');
    const userPassword = await bcrypt.hash('user123', SALT_ROUNDS);
    
    await pool.query(
      `INSERT INTO users (id, username, password, fullname, userType) 
       VALUES (2, 'user1', $1, 'Regular User', 'USER')
       ON CONFLICT (username) DO UPDATE SET password = $1, fullname = 'Regular User', userType = 'USER'`,
      [userPassword]
    );
    console.log('✅ Regular user configured');

    // Reset sequence to avoid ID conflicts
    await pool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);

    // Verify final state
    console.log('\nFinal user list:');
    const finalResult = await pool.query(`SELECT id, username, fullname, userType FROM users`);
    finalResult.rows.forEach(user => {
      console.log(`✅ ID: ${user.id}, Username: ${user.username}, Name: ${user.fullname}, Type: ${user.userType}`);
    });

    console.log('\n🎉 User cleanup completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: username=admin, password=admin123, userType=ADMIN');
    console.log('User: username=user1, password=user123, userType=USER');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
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