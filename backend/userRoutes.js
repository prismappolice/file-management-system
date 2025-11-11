const bcrypt = require('bcrypt');
console.log('Hash for admin123:', bcrypt.hashSync('admin123', 10));
const express = require('express');
const router = express.Router();
const pool = require('./database');

const SALT_ROUNDS = 10;

// Get all users (admin only)
router.get('/users', async (req, res) => {
  const sql = `SELECT id, username, password, fullname, usertype, created_by, created_at, last_login FROM users ORDER BY created_at DESC`;
  
  try {
    const result = await pool.query(sql);
    // Map usertype to userType for frontend compatibility
    const users = result.rows.map(user => ({
      ...user,
      userType: user.usertype
    }));
    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Create new user (admin only)
router.post('/users/create', async (req, res) => {
  const { username, password, fullname, userType, createdBy } = req.body;

  if (!username || !password || !fullname) {
    return res.status(400).json({ 
      success: false, 
      error: 'Username, password, and full name are required' 
    });
  }

  try {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const sql = `INSERT INTO users (username, password, fullname, usertype, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
    const params = [username, hashedPassword, fullname, userType || 'district', createdBy || 'admin'];

    const result = await pool.query(sql, params);
    
    res.json({ 
      success: true, 
      message: 'User created successfully',
      userId: result.rows[0].id 
    });
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique violation error code
      return res.status(400).json({ 
        success: false, 
        error: 'Username already exists' 
      });
    }
    console.error('Error creating user:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;

  // Prevent deleting the main admin user (id = 1)
  if (userId === '1') {
    return res.status(403).json({ 
      success: false, 
      error: 'Cannot delete the main admin user' 
    });
  }

  const sql = `DELETE FROM users WHERE id = $1`;

  try {
    const result = await pool.query(sql, [userId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Username and password are required' 
    });
  }

  const sql = `SELECT id, username, password, fullname, usertype FROM users WHERE username = $1`;

  try {
    const result = await pool.query(sql, [username]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    // Check if password is hashed (new users) or plain text (legacy users)
    let passwordMatch = false;
    
    if (user.password.startsWith('$2b$')) {
      // Password is hashed, use bcrypt to compare
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain text password (for existing admin user)
      passwordMatch = password === user.password;
      
      // Optionally hash the password for future use
      if (passwordMatch) {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashedPassword, user.id]);
      }
    }

    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    // Update last login time
    await pool.query(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`, [user.id]);

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        userType: user.usertype  // PostgreSQL column is lowercase
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Update user password (admin only)
router.put('/users/:id/password', async (req, res) => {
  const userId = req.params.id;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ 
      success: false, 
      error: 'New password is required' 
    });
  }

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    const sql = `UPDATE users SET password = $1 WHERE id = $2`;
    const result = await pool.query(sql, [hashedPassword, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ success: false, error: 'Failed to update password' });
  }
});

module.exports = router;
