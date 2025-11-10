const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'files.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Starting programs table migration...');

// Add created_by column to existing programs table
db.run(`ALTER TABLE programs ADD COLUMN created_by TEXT`, function(err) {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✅ Column created_by already exists, no migration needed');
    } else {
      console.error('❌ Error adding created_by column:', err.message);
    }
  } else {
    console.log('✅ Successfully added created_by column to programs table');
  }
  
  // Update existing programs with 'system' as creator
  db.run(`UPDATE programs SET created_by = 'system' WHERE created_by IS NULL`, function(err) {
    if (err) {
      console.error('❌ Error updating existing programs:', err.message);
    } else {
      console.log(`✅ Updated ${this.changes} existing programs with 'system' creator`);
    }
    
    // Verify the migration
    db.all(`SELECT id, name, created_by FROM programs LIMIT 5`, (err, rows) => {
      if (err) {
        console.error('❌ Error verifying migration:', err.message);
      } else {
        console.log('✅ Migration verification - Sample programs:');
        rows.forEach(row => {
          console.log(`   - ${row.name} (created by: ${row.created_by || 'NULL'})`);
        });
      }
      
      db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('✅ Programs migration completed successfully!');
        }
      });
    });
  });
});