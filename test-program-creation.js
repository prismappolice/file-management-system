const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Test database connection and program creation
const dbPath = path.join(__dirname, 'files.db');

console.log('Testing database connection...');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to SQLite database\n');
    runTests();
  }
});

function runTests() {
  console.log('=== DATABASE CONNECTION TEST ===\n');

  // Test 1: Check if programs table exists
  db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name='programs'`, [], (err, rows) => {
    if (err) {
      console.error('❌ Error checking tables:', err.message);
    } else if (rows.length === 0) {
      console.error('❌ Programs table does NOT exist');
    } else {
      console.log('✅ Programs table exists');
      checkProgramsTableSchema();
    }
  });

  // Test 2: Check if users table exists
  db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`, [], (err, rows) => {
    if (err) {
      console.error('❌ Error checking users table:', err.message);
    } else if (rows.length === 0) {
      console.error('❌ Users table does NOT exist');
    } else {
      console.log('✅ Users table exists');
    }
  });

  // Test 3: Check if files table exists
  db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name='files'`, [], (err, rows) => {
    if (err) {
      console.error('❌ Error checking files table:', err.message);
    } else if (rows.length === 0) {
      console.error('❌ Files table does NOT exist');
    } else {
      console.log('✅ Files table exists\n');
    }
  });
}

function checkProgramsTableSchema() {
  console.log('\n=== PROGRAMS TABLE SCHEMA ===\n');
  db.all(`PRAGMA table_info(programs)`, [], (err, rows) => {
    if (err) {
      console.error('❌ Error getting schema:', err.message);
    } else {
      rows.forEach(col => {
        console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
      });
      checkExistingPrograms();
    }
  });
}

function checkExistingPrograms() {
  console.log('\n=== EXISTING PROGRAMS ===\n');
  db.all(`SELECT * FROM programs`, [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching programs:', err.message);
    } else {
      if (rows.length === 0) {
        console.log('⚠️  No programs found in database');
      } else {
        console.log(`Found ${rows.length} program(s):`);
        rows.forEach(prog => {
          console.log(`  - ID: ${prog.id}, Name: ${prog.name}, Path: ${prog.path}, Color: ${prog.color}`);
        });
      }
      testProgramCreation();
    }
  });
}

function testProgramCreation() {
  console.log('\n=== TEST PROGRAM CREATION ===\n');
  
  const testProgram = {
    id: 'test-program-' + Date.now(),
    name: 'Test Program',
    icon: 'TP',
    path: '/test-program',
    color: '#ff0844',
    created_date: new Date().toISOString().split('T')[0],
    created_by: 'test-script'
  };

  const sql = `INSERT INTO programs (id, name, icon, path, color, created_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [testProgram.id, testProgram.name, testProgram.icon, testProgram.path, testProgram.color, testProgram.created_date, testProgram.created_by], function(err) {
    if (err) {
      console.error('❌ Failed to create test program:', err.message);
    } else {
      console.log('✅ Test program created successfully!');
      console.log(`   ID: ${testProgram.id}`);
      
      // Clean up test program
      db.run(`DELETE FROM programs WHERE id = ?`, [testProgram.id], (err) => {
        if (err) {
          console.error('⚠️  Failed to delete test program:', err.message);
        } else {
          console.log('✅ Test program cleaned up');
        }
        
        checkUsers();
      });
    }
  });
}

function checkUsers() {
  console.log('\n=== CHECKING USERS ===\n');
  db.all(`SELECT id, username, fullname, userType FROM users`, [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching users:', err.message);
    } else {
      if (rows.length === 0) {
        console.log('⚠️  No users found in database');
      } else {
        console.log(`Found ${rows.length} user(s):`);
        rows.forEach(user => {
          console.log(`  - ID: ${user.id}, Username: ${user.username}, Type: ${user.userType}, Name: ${user.fullname}`);
        });
      }
    }
    
    console.log('\n=== ALL TESTS COMPLETE ===\n');
    db.close();
  });
}
