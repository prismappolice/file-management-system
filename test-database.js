const { Pool } = require('pg');

const pool = new Pool({
  user: 'fms_user',
  host: 'localhost',
  database: 'file_management',
  password: 'FMS_Secure_2025!',
  port: 5432,
});

async function testDatabase() {
  console.log('Testing database connection...\n');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!\n');
    
    // Check users table
    console.log('Checking users table...');
    const usersResult = await client.query('SELECT id, username, fullname, usertype, created_at FROM users ORDER BY id');
    console.log(`✅ Found ${usersResult.rows.length} users:`);
    usersResult.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, UserType: ${user.usertype}, Full Name: ${user.fullname}`);
    });
    console.log('');
    
    // Check programs table
    console.log('Checking programs table...');
    const programsResult = await client.query('SELECT * FROM programs ORDER BY created_at');
    console.log(`✅ Found ${programsResult.rows.length} programs:`);
    programsResult.rows.forEach(prog => {
      console.log(`  - ID: ${prog.id}, Name: ${prog.name}, Created: ${prog.created_date}`);
    });
    console.log('');
    
    // Check files table
    console.log('Checking files table...');
    const filesResult = await client.query('SELECT COUNT(*) as count FROM files');
    console.log(`✅ Found ${filesResult.rows[0].count} files\n`);
    
    client.release();
    
    console.log('✅ All database checks passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testDatabase();
