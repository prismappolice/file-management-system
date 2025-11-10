const db = require('./database');

console.log('Migrating created_at to created_date for programs...');

// Update existing programs to copy created_at to created_date if created_date is null
const updateSQL = `
  UPDATE programs 
  SET created_date = created_at 
  WHERE created_date IS NULL AND created_at IS NOT NULL
`;

db.run(updateSQL, function(err) {
  if (err) {
    console.error('Error updating programs:', err.message);
  } else {
    console.log(`Updated ${this.changes} programs with created_date`);
  }
  
  // Display all programs to verify
  db.all('SELECT id, name, created_at, created_date FROM programs', [], (err, rows) => {
    if (err) {
      console.error('Error fetching programs:', err.message);
    } else {
      console.log('\nPrograms in database:');
      rows.forEach(row => {
        console.log(`- ${row.name}: created_at=${row.created_at}, created_date=${row.created_date}`);
      });
    }
    process.exit(0);
  });
});