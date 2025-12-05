const { Pool } = require('pg');

// PostgreSQL connection configuration
const pool = new Pool({
  user: 'fms_user',
  host: 'localhost',
  database: 'file_management',
  password: 'FMS_Secure_2025!',
  port: 5432,
  // Connection pool settings for better performance
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database schema
async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Initializing PostgreSQL database schema...');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        fullname VARCHAR(255) NOT NULL,
        usertype VARCHAR(50) NOT NULL DEFAULT 'district',
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);
    console.log('✓ Users table created or already exists');

    // Create programs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS programs (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon TEXT,
        path VARCHAR(255) NOT NULL,
        color VARCHAR(150) NOT NULL,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_date VARCHAR(50)
      )
    `);
    console.log('✓ Programs table created or already exists');

    // Create memos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS memos (
        id VARCHAR(255) PRIMARY KEY,
        program_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        number INTEGER NOT NULL,
        created_by VARCHAR(255),
        created_date VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Memos table created or already exists');

    // Create files table
    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        fileno VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        department VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(500) NOT NULL,
        program VARCHAR(255) NOT NULL DEFAULT 'montha',
        memo_id VARCHAR(255),
        created_by VARCHAR(255),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Files table created or already exists');

    // Create default users if they don't exist
    const bcrypt = require('bcrypt');
    const SALT_ROUNDS = 10;
    
    // Check if admin user exists
    const adminCheck = await client.query(`SELECT id FROM users WHERE username = 'admin'`);
    if (adminCheck.rows.length === 0) {
      const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
      await client.query(
        `INSERT INTO users (username, password, fullname, usertype, created_by) VALUES ($1, $2, $3, $4, $5)`,
        ['admin', adminPassword, 'System Administrator', 'admin', 'system']
      );
      console.log('✓ Default admin user created (username: admin, password: admin123)');
    }
    
    // Check if user1 exists
    const user1Check = await client.query(`SELECT id FROM users WHERE username = 'user1'`);
    if (user1Check.rows.length === 0) {
      const user1Password = await bcrypt.hash('user123', SALT_ROUNDS);
      await client.query(
        `INSERT INTO users (username, password, fullname, usertype, created_by) VALUES ($1, $2, $3, $4, $5)`,
        ['user1', user1Password, 'District User', 'district', 'admin']
      );
      console.log('✓ Default user1 created (username: user1, password: user123)');
    }

    console.log('Database initialization complete!');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Initialize on startup
initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Export pool for queries
module.exports = pool;
