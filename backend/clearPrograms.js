const db = require('./database');

console.log('🧹 Clearing all existing programs...');

// Clear all programs from the database
db.run('DELETE FROM programs', [], function(err) {
  if (err) {
    console.error('❌ Error clearing programs:', err.message);
  } else {
    console.log(`✅ Cleared ${this.changes} programs from database`);
    console.log('📋 Database is now clean - admin can create programs from scratch');
    
    // Also clear any program-related files if needed
    db.run('DELETE FROM files', [], function(err) {
      if (err) {
        console.error('❌ Error clearing files:', err.message);
      } else {
        console.log(`🗂️ Also cleared ${this.changes} files from database`);
        console.log('🎯 Fresh start! Admin can now create programs and upload files');
      }
      
      // Close database connection
      db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('✅ Database connection closed');
        }
      });
    });
  }
});