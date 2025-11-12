const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'files.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database\n');
});

console.log('=== SEARCHING ALL FILES ===\n');

// Get all files grouped by program
db.all("SELECT program, COUNT(*) as count FROM files GROUP BY program", [], (err, programs) => {
    if (err) {
        console.error('Error:', err.message);
        db.close();
        return;
    }
    
    console.log('Files by Program:');
    programs.forEach(p => {
        console.log(`  - ${p.program}: ${p.count} files`);
    });
    console.log('');
    
    // Get ALL files
    db.all("SELECT id, fileNo, subject, department, program, created_by FROM files ORDER BY uploaded_at DESC", [], (err, files) => {
        if (err) {
            console.error('Error:', err.message);
        } else {
            console.log(`\nAll ${files.length} files in database:\n`);
            files.forEach((f, idx) => {
                console.log(`${idx + 1}. ID: ${f.id}`);
                console.log(`   File No: "${f.fileNo || '(empty)'}"`);
                console.log(`   Subject: ${f.subject}`);
                console.log(`   Department: ${f.department}`);
                console.log(`   Program: ${f.program}`);
                console.log(`   Created by: ${f.created_by}`);
                console.log('');
            });
        }
        
        db.close();
    });
});
