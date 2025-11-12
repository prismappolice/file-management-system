const { Pool } = require('pg');

const pool = new Pool({
  user: 'fms_user',
  host: 'localhost',
  database: 'file_management',
  password: 'FMS_Secure_2025!',
  port: 5432,
});

async function migrateColorField() {
  console.log('Starting migration: Expanding color field from VARCHAR(50) to VARCHAR(150)...\n');
  
  try {
    const client = await pool.connect();
    
    // Alter the color column to allow longer values
    await client.query(`
      ALTER TABLE programs 
      ALTER COLUMN color TYPE VARCHAR(150)
    `);
    
    console.log('✅ Successfully expanded color field to VARCHAR(150)');
    console.log('✅ Programs table can now store gradient colors!');
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

migrateColorField();
