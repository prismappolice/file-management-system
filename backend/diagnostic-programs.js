// Diagnostic script to check programs table structure and data
const { Pool } = require('pg');

const pool = new Pool({
  user: 'fms_user',
  host: 'localhost',
  database: 'file_management',
  password: 'FMS_Secure_2025!',
  port: 5432,
});

async function diagnose() {
  try {
    console.log('\n=== DIAGNOSING PROGRAMS TABLE ===\n');
    
    // Check table structure
    console.log('1. Checking table structure...');
    const structure = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'programs'
      ORDER BY ordinal_position
    `);
    console.log('Table columns:');
    console.table(structure.rows);
    
    // Check data
    console.log('\n2. Checking program data...');
    const programs = await pool.query('SELECT * FROM programs');
    console.log(`Found ${programs.rows.length} programs:`);
    programs.rows.forEach(p => {
      console.log(`  - ID: ${p.id}, Name: ${p.name}, Path: ${p.path}, Color: ${p.color}`);
    });
    
    // Check if pm-program exists
    console.log('\n3. Checking specific program (pm-program)...');
    const pmProgram = await pool.query('SELECT * FROM programs WHERE id = $1', ['pm-program']);
    if (pmProgram.rows.length > 0) {
      console.log('PM Program found:');
      console.log(JSON.stringify(pmProgram.rows[0], null, 2));
    } else {
      console.log('⚠️  PM Program NOT FOUND in database!');
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

diagnose();
