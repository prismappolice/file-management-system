const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path - check root directory
const dbPath = path.join(__dirname, 'files.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database');
});

// Check if tables exist
console.log('\n=== DATABASE SCHEMA ===');
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
        console.error('Error fetching tables:', err.message);
    } else {
        console.log('Tables in database:', rows.length);
        rows.forEach((row) => {
            console.log(`- ${row.name}`);
        });
    }
    
    // If files table exists, check its structure and data
    db.all("PRAGMA table_info(files)", [], (err, columns) => {
        if (err) {
            console.error('Files table does not exist or error:', err.message);
        } else if (columns.length > 0) {
            console.log('\n=== FILES TABLE STRUCTURE ===');
            columns.forEach((col) => {
                console.log(`- ${col.name}: ${col.type} (nullable: ${col.notnull === 0})`);
            });
            
            // Check files data
            console.log('\n=== FILES DATA ===');
            db.all("SELECT COUNT(*) as count FROM files", [], (err, countRows) => {
                if (err) {
                    console.error('Error counting files:', err.message);
                } else {
                    console.log(`Total files in database: ${countRows[0].count}`);
                    
                    if (countRows[0].count > 0) {
                        db.all("SELECT * FROM files ORDER BY id DESC LIMIT 10", [], (err, files) => {
                            if (err) {
                                console.error('Error fetching files:', err.message);
                            } else {
                                console.log('\nRecent files (last 10):');
                                files.forEach((file, index) => {
                                    console.log(`${index + 1}. ID: ${file.id}`);
                                    console.log(`   File No: "${file.fileNo}" (length: ${file.fileNo?.length || 0})`);
                                    console.log(`   Subject: "${file.subject}"`);
                                    console.log(`   Department: "${file.department}"`);
                                    console.log(`   Date: "${file.date}"`);
                                    console.log(`   Filename: "${file.filename}"`);
                                    console.log(`   Program: "${file.program}"`);
                                    console.log(`   Created by: "${file.created_by}"`);
                                    console.log('---');
                                });
                                
                                // Check for empty file numbers
                                db.all("SELECT * FROM files WHERE fileNo IS NULL OR fileNo = '' OR TRIM(fileNo) = ''", [], (err, emptyFiles) => {
                                    if (err) {
                                        console.error('Error checking empty file numbers:', err.message);
                                    } else {
                                        console.log(`\n❌ Files with empty/null File Numbers: ${emptyFiles.length}`);
                                        if (emptyFiles.length > 0) {
                                            console.log('\nFiles with missing File Numbers:');
                                            emptyFiles.forEach((file, index) => {
                                                console.log(`${index + 1}. ID: ${file.id}, File No: "${file.fileNo}", Subject: "${file.subject}", File: "${file.filename}"`);
                                            });
                                        }
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
                            }
                        });
                    } else {
                        // Close database connection if no files
                        db.close((err) => {
                            if (err) {
                                console.error('Error closing database:', err.message);
                            } else {
                                console.log('\nDatabase connection closed.');
                            }
                        });
                    }
                }
            });
        } else {
            console.log('\nFiles table does not exist');
            // Close database connection
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('\nDatabase connection closed.');
                }
            });
        }
    });
});