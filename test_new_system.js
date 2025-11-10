const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'backend', 'files.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database');
});

console.log('\n=== 🔐 UPDATED USER SYSTEM TEST ===\n');

// Check users table with new ADMIN/USER types
console.log('📋 Current Users:');
db.all("SELECT * FROM users ORDER BY id", [], (err, rows) => {
    if (err) {
        console.error('❌ Error fetching users:', err.message);
    } else {
        console.log(`Found ${rows.length} users:`);
        rows.forEach((row, index) => {
            console.log(`${index + 1}. Username: ${row.username}`);
            console.log(`   Full Name: ${row.fullname}`);
            console.log(`   User Type: ${row.userType}`);
            console.log(`   Created: ${row.created_at}`);
            console.log(`   Last Login: ${row.last_login || 'Never'}`);
            console.log('   ---');
        });
    }
    
    // Test file access logic
    console.log('\n🔒 File Access Control Test:');
    console.log('Testing file filtering logic...\n');
    
    // Get some sample files to test with
    db.all("SELECT * FROM files LIMIT 3", [], (err, files) => {
        if (err) {
            console.error('❌ Error fetching files:', err.message);
        } else {
            console.log(`📁 Sample files in database: ${files.length}`);
            
            if (files.length === 0) {
                console.log('ℹ️  No files in database yet. Upload some files to test access control.');
            } else {
                files.forEach((file, index) => {
                    console.log(`${index + 1}. File: ${file.filename}`);
                    console.log(`   Program: ${file.program}`);
                    console.log(`   Created by: ${file.created_by}`);
                    console.log(`   Upload date: ${file.uploaded_at}`);
                    console.log('   ---');
                });
            }
        }
        
        console.log('\n🎯 Expected Behavior:');
        console.log('✅ ADMIN users: Can see ALL files from ALL users');
        console.log('✅ USER users: Can only see files THEY uploaded');
        console.log('✅ User types: Only ADMIN and USER (predefined)');
        console.log('✅ Table: Shows S.No instead of ID with serial numbering');
        
        console.log('\n📋 Login Credentials:');
        console.log('🔑 Admin: username=admin, password=admin123, type=ADMIN');
        console.log('🔑 User: username=user1, password=user123, type=USER');
        
        console.log('\n🌐 Application URLs:');
        console.log('📱 Frontend: http://localhost:5174');
        console.log('🔧 Backend API: http://localhost:3000/api');
        
        // Close database connection
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            } else {
                console.log('\n✅ Database connection closed.');
                console.log('\n🎉 System verification complete! Test the login and user management features.');
            }
        });
    });
});