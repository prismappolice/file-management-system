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

console.log('=== COMPREHENSIVE FILE CHECK ===\n');

// 1. Check all files in database
console.log('1. ALL FILES IN DATABASE:');
db.all("SELECT id, fileNo, subject, department, date, filename, program, created_by FROM files ORDER BY id", [], (err, rows) => {
    if (err) {
        console.error('Error fetching files:', err.message);
    } else {
        console.log(`   Total files: ${rows.length}\n`);
        rows.forEach((file, index) => {
            console.log(`   File ${index + 1}:`);
            console.log(`   - ID: ${file.id}`);
            console.log(`   - File No: "${file.fileNo}" (type: ${typeof file.fileNo}, length: ${file.fileNo ? file.fileNo.length : 0})`);
            console.log(`   - Subject: ${file.subject}`);
            console.log(`   - Department: ${file.department}`);
            console.log(`   - Program: ${file.program}`);
            console.log(`   - Created by: ${file.created_by}`);
            console.log('');
        });
    }
    
    // 2. Check for any NULL or empty fileNo values
    console.log('2. FILES WITH MISSING FILE NUMBERS:');
    db.all("SELECT COUNT(*) as count FROM files WHERE fileNo IS NULL OR fileNo = '' OR TRIM(fileNo) = ''", [], (err, rows) => {
        if (err) {
            console.error('Error:', err.message);
        } else {
            console.log(`   Count: ${rows[0].count}`);
            if (rows[0].count > 0) {
                db.all("SELECT id, fileNo, subject FROM files WHERE fileNo IS NULL OR fileNo = '' OR TRIM(fileNo) = ''", [], (err, files) => {
                    if (!err) {
                        files.forEach(f => console.log(`   - ID ${f.id}: fileNo="${f.fileNo}", Subject: ${f.subject}`));
                    }
                });
            }
        }
        console.log('');
        
        // 3. Test API-like query
        console.log('3. SIMULATING API QUERY (SELECT with all columns):');
        db.all("SELECT id, fileNo, subject, department, date, filename, program, created_by, uploaded_at FROM files", [], (err, rows) => {
            if (err) {
                console.error('Error:', err.message);
            } else {
                console.log(`   Returned ${rows.length} rows`);
                rows.forEach((row, idx) => {
                    console.log(`   Row ${idx + 1}:`);
                    console.log(`     fileNo in result: "${row.fileNo}"`);
                    console.log(`     All fields present: ${row.id !== undefined && row.fileNo !== undefined && row.subject !== undefined}`);
                });
            }
            
            // Close database
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('\n✓ Database connection closed.');
                }
            });
        });
    });
});
