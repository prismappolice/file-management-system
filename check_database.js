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
    console.log('Connected to SQLite database');
});

// Check users table
console.log('\n=== USERS TABLE ===');
db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
        console.error('Error fetching users:', err.message);
    } else {
        console.log('Users count:', rows.length);
        rows.forEach((row) => {
            console.log(`- ID: ${row.id}, Username: ${row.username}, UserType: ${row.userType}`);
        });
    }
});

// Check files table
console.log('\n=== FILES TABLE ===');
db.all("SELECT * FROM files LIMIT 10", [], (err, rows) => {
    if (err) {
        console.error('Error fetching files:', err.message);
    } else {
        console.log('Files count (showing first 10):', rows.length);
        rows.forEach((row) => {
            console.log(`- ID: ${row.id}, Program: ${row.program}, Created by: ${row.created_by}, Subject: ${row.subject}`);
        });
    }
});

// Check programs table
console.log('\n=== PROGRAMS TABLE ===');
db.all("SELECT * FROM programs", [], (err, rows) => {
    if (err) {
        console.error('Error fetching programs:', err.message);
    } else {
        console.log('Programs count:', rows.length);
        rows.forEach((row) => {
            console.log(`- ID: ${row.id}, Name: ${row.name}, Description: ${row.description}`);
        });
    }
    
    // Close database connection
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('\nDatabase connection closed.');
        }
    });
});