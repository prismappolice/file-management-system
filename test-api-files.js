const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'files.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database\n');
});

// Test query - exactly like the API does
const sql = `SELECT id, fileNo, subject, department, date, filename, program, created_by, uploaded_at FROM files ORDER BY uploaded_at DESC`;

console.log('=== TESTING FILE QUERY (API Simulation) ===\n');
console.log('SQL Query:', sql);
console.log('');

db.all(sql, [], (err, rows) => {
    if (err) {
        console.error('Error fetching files:', err.message);
        db.close();
        return;
    }

    console.log(`Total files returned: ${rows.length}\n`);
    
    rows.forEach((file, index) => {
        console.log(`File ${index + 1}:`);
        console.log('  Raw row data:', JSON.stringify(file, null, 2));
        console.log('  fileNo value:', file.fileNo);
        console.log('  fileNo type:', typeof file.fileNo);
        console.log('  fileNo length:', file.fileNo ? file.fileNo.length : 'N/A');
        console.log('  subject:', file.subject);
        console.log('  department:', file.department);
        console.log('---\n');
    });
    
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
});
