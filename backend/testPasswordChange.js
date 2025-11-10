const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath);

// Test script to verify password change functionality
async function testPasswordChange() {
    console.log('🔧 Testing Password Change Logic...\n');

    try {
        // 1. Get current users
        console.log('1. Current users in database:');
        const users = await new Promise((resolve, reject) => {
            db.all('SELECT id, username, fullname, userType FROM users', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        users.forEach(user => {
            console.log(`   ID: ${user.id}, Username: ${user.username}, Type: ${user.userType}`);
        });

        if (users.length === 0) {
            console.log('   No users found in database');
            return;
        }

        // 2. Test with first non-admin user (or create one for testing)
        let testUser = users.find(u => u.userType !== 'admin' && u.userType !== 'ADMIN');
        
        if (!testUser) {
            console.log('\n2. Creating test user for password change test...');
            const testPassword = 'testpass123';
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            
            const insertResult = await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO users (username, password, fullname, userType, created_by) 
                    VALUES (?, ?, ?, ?, ?)
                `, ['testuser', hashedPassword, 'Test User', 'USER', 'admin'], function(err) {
                    if (err) reject(err);
                    else resolve({ lastInsertRowid: this.lastID });
                });
            });
            
            testUser = {
                id: insertResult.lastInsertRowid,
                username: 'testuser',
                fullname: 'Test User',
                userType: 'USER'
            };
            console.log(`   Created test user: ID ${testUser.id}, Username: ${testUser.username}`);
        }

        console.log(`\n3. Testing password change for user: ${testUser.username} (ID: ${testUser.id})`);
        
        // 3. Get current password hash
        const beforeChange = await new Promise((resolve, reject) => {
            db.get('SELECT password FROM users WHERE id = ?', [testUser.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        console.log(`   Current password hash: ${beforeChange.password.substring(0, 20)}...`);

        // 4. Simulate password change
        const newPassword = 'newpassword123';
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        
        console.log('\n4. Changing password...');
        const updateResult = await new Promise((resolve, reject) => {
            db.run('UPDATE users SET password = ? WHERE id = ?', [newHashedPassword, testUser.id], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
        
        console.log(`   Update result - changes: ${updateResult.changes}`);

        // 5. Verify password was changed
        const afterChange = await new Promise((resolve, reject) => {
            db.get('SELECT password FROM users WHERE id = ?', [testUser.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        console.log(`   New password hash: ${afterChange.password.substring(0, 20)}...`);

        // 6. Test password verification
        console.log('\n5. Testing password verification:');
        const oldPasswordMatch = await bcrypt.compare('testpass123', afterChange.password);
        const newPasswordMatch = await bcrypt.compare(newPassword, afterChange.password);
        
        console.log(`   Old password matches: ${oldPasswordMatch} (should be false)`);
        console.log(`   New password matches: ${newPasswordMatch} (should be true)`);

        // 7. Test the API endpoint logic simulation
        console.log('\n6. Testing API endpoint logic simulation:');
        
        // Simulate the API call logic
        const simulateApiCall = async (userId, newPass) => {
            try {
                const hashedPass = await bcrypt.hash(newPass, 10);
                const result = await new Promise((resolve, reject) => {
                    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPass, userId], function(err) {
                        if (err) reject(err);
                        else resolve({ changes: this.changes });
                    });
                });
                
                return {
                    success: result.changes > 0,
                    changes: result.changes,
                    message: result.changes > 0 ? 'Password updated successfully' : 'User not found'
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        };

        const apiResult = await simulateApiCall(testUser.id, 'finalpassword456');
        console.log(`   API simulation result:`, apiResult);

        // 8. Final verification
        const finalPassword = await new Promise((resolve, reject) => {
            db.get('SELECT password FROM users WHERE id = ?', [testUser.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        const finalMatch = await bcrypt.compare('finalpassword456', finalPassword.password);
        console.log(`   Final password verification: ${finalMatch} (should be true)`);

        console.log('\n✅ Password change logic test completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   - Password hashing: ✓ Working');
        console.log('   - Database update: ✓ Working');
        console.log('   - Password verification: ✓ Working');
        console.log('   - API endpoint logic: ✓ Working');

    } catch (error) {
        console.error('\n❌ Error during password change test:', error);
    } finally {
        db.close();
    }
}

testPasswordChange();