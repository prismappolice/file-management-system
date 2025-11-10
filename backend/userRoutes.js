const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('./database');

const SALT_ROUNDS = 10;

// Get all users (admin only)
router.get('/users', (req, res) => {
  const sql = `SELECT id, username, password, fullname, userType, created_by, created_at, last_login FROM users ORDER BY created_at DESC`;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, users: rows });
  });
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
    
    const sql = `INSERT INTO users (username, password, fullname, userType, created_by) VALUES (?, ?, ?, ?, ?)`;
    const params = [username, hashedPassword, fullname, userType || 'district', createdBy || 'admin'];

    db.run(sql, params, function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ 
            success: false, 
            error: 'Username already exists' 
          });
        }
        console.error('Error creating user:', err);
        return res.status(500).json({ success: false, error: err.message });
      }

      res.json({ 
        success: true, 
        message: 'User created successfully',
        userId: this.lastID 
      });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    return res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', (req, res) => {
  const userId = req.params.id;

  // Prevent deleting the main admin user (id = 1)
  if (userId === '1') {
    return res.status(403).json({ 
      success: false, 
      error: 'Cannot delete the main admin user' 
    });
  }

  const sql = `DELETE FROM users WHERE id = ?`;

  db.run(sql, [userId], function(err) {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ success: false, error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  });
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

  const sql = `SELECT id, username, password, fullname, userType FROM users WHERE username = ?`;

  db.get(sql, [username], async (err, user) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).json({ success: false, error: err.message });
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    try {
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
          db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, user.id]);
        }
      }

      if (!passwordMatch) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid username or password' 
        });
      }

      // Update last login time
      db.run(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);

      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          fullname: user.fullname,
          userType: user.userType
        }
      });
    } catch (error) {
      console.error('Error verifying password:', error);
      return res.status(500).json({ success: false, error: 'Login failed' });
    }
  });
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
    
    const sql = `UPDATE users SET password = ? WHERE id = ?`;

    db.run(sql, [hashedPassword, userId], function(err) {
      if (err) {
        console.error('Error updating password:', err);
        return res.status(500).json({ success: false, error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Password updated successfully' 
      });
    });
  } catch (error) {
    console.error('Error hashing new password:', error);
    return res.status(500).json({ success: false, error: 'Failed to update password' });
  }
});

module.exports = router;
