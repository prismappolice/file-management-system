const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, '..', 'files.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Keep database connection open
db.configure('busyTimeout', 5000);

// Initialize database schema
function initializeDatabase() {
  const createFilesTableSQL = `
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fileNo TEXT NOT NULL,
      subject TEXT NOT NULL,
      department TEXT NOT NULL,
      date TEXT NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      program TEXT NOT NULL DEFAULT 'montha',
      created_by TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createProgramsTableSQL = `
    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      path TEXT NOT NULL,
      color TEXT NOT NULL,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createUsersTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fullname TEXT NOT NULL,
      userType TEXT NOT NULL DEFAULT 'district',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `;

  db.run(createFilesTableSQL, (err) => {
    if (err) {
      console.error('Error creating files table:', err.message);
    } else {
      console.log('Files table created or already exists');
      // Add program column if it doesn't exist (for existing databases)
      db.run(`ALTER TABLE files ADD COLUMN program TEXT NOT NULL DEFAULT 'montha'`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Error adding program column:', err.message);
        }
      });
    }
  });

  db.run(createProgramsTableSQL, (err) => {
    if (err) {
      console.error('Error creating programs table:', err.message);
    } else {
      console.log('Programs table created or already exists');
      // Add created_date column if it doesn't exist (for existing databases)
      db.run(`ALTER TABLE programs ADD COLUMN created_date TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Error adding created_date column:', err.message);
        }
      });
      // Programs will be created dynamically by admin users
      // No default programs inserted
    }
  });

  db.run(createUsersTableSQL, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table created or already exists');
      
      // Note: Default users are now managed by cleanupUsers.js script
      // This ensures proper password hashing and security
    }
  });
}

module.exports = db;
