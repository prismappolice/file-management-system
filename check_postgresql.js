const { Pool } = require('pg');

// PostgreSQL connection configuration
const pool = new Pool({
  user: 'fms_user',
  host: 'localhost',
  database: 'file_management',
  password: 'FMS_Secure_2025!',
  port: 5432,
});

async function checkDatabase() {
  try {
    console.log('=== PostgreSQL Database Check ===\n');
    
    // Test connection
    const client = await pool.connect();
    console.log('✓ Connected to PostgreSQL database successfully');
    
    // Check files table structure
    console.log('\n=== FILES TABLE STRUCTURE ===');
    const filesStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'files' 
      ORDER BY ordinal_position;
    `);
    
    if (filesStructure.rows.length === 0) {
      console.log('❌ Files table does not exist!');
    } else {
      console.log('Files table columns:');
      filesStructure.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // Check files data
    console.log('\n=== FILES DATA ===');
    const filesCount = await client.query('SELECT COUNT(*) FROM files');
    console.log(`Total files in database: ${filesCount.rows[0].count}`);
    
    if (filesCount.rows[0].count > 0) {
      const recentFiles = await client.query(`
        SELECT id, "fileNo", subject, department, date, filename, program, created_by, uploaded_at 
        FROM files 
        ORDER BY uploaded_at DESC 
        LIMIT 10
      `);
      
      console.log('\nRecent files (last 10):');
      recentFiles.rows.forEach((file, index) => {
        console.log(`${index + 1}. ID: ${file.id}`);
        console.log(`   File No: "${file.fileNo}" (length: ${file.fileNo?.length || 0})`);
        console.log(`   Subject: "${file.subject}"`);
        console.log(`   Department: "${file.department}"`);
        console.log(`   Date: "${file.date}"`);
        console.log(`   Filename: "${file.filename}"`);
        console.log(`   Program: "${file.program}"`);
        console.log(`   Created by: "${file.created_by}"`);
        console.log(`   Uploaded: ${file.uploaded_at}`);
        console.log('---');
      });
      
      // Check for empty file numbers
      const emptyFileNos = await client.query(`
        SELECT COUNT(*) FROM files 
        WHERE "fileNo" IS NULL OR "fileNo" = '' OR TRIM("fileNo") = ''
      `);
      console.log(`\n❌ Files with empty/null File Numbers: ${emptyFileNos.rows[0].count}`);
      
      if (emptyFileNos.rows[0].count > 0) {
        const emptyFiles = await client.query(`
          SELECT id, "fileNo", subject, filename, uploaded_at 
          FROM files 
          WHERE "fileNo" IS NULL OR "fileNo" = '' OR TRIM("fileNo") = ''
          ORDER BY uploaded_at DESC
        `);
        console.log('\nFiles with missing File Numbers:');
        emptyFiles.rows.forEach((file, index) => {
          console.log(`${index + 1}. ID: ${file.id}, File No: "${file.fileNo}", Subject: "${file.subject}", File: "${file.filename}"`);
        });
      }
    }
    
    // Check programs table
    console.log('\n=== PROGRAMS TABLE ===');
    const programs = await client.query('SELECT * FROM programs ORDER BY created_at DESC');
    console.log(`Total programs: ${programs.rows.length}`);
    programs.rows.forEach((program, index) => {
      console.log(`${index + 1}. ID: ${program.id}, Name: ${program.name}, Created by: ${program.created_by}`);
    });
    
    // Check users table
    console.log('\n=== USERS TABLE ===');
    const users = await client.query('SELECT id, username, fullname, usertype, created_at FROM users');
    console.log(`Total users: ${users.rows.length}`);
    users.rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username}, Type: ${user.usertype}, Full Name: ${user.fullname}`);
    });
    
    client.release();
    console.log('\n✓ Database check completed successfully');
    
  } catch (err) {
    console.error('❌ Database error:', err.message);
    console.error('Full error:', err);
  } finally {
    await pool.end();
  }
}

checkDatabase();