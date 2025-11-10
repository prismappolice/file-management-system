const express = require('express');
const db = require('./database');

const router = express.Router();

// GET /api/programs - Get all programs
router.get('/programs', (req, res) => {
  const sql = `SELECT * FROM programs ORDER BY created_at ASC`;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch programs' });
    }

    res.json({
      success: true,
      programs: rows
    });
  });
});

// POST /api/programs - Add new program (Admin only)
router.post('/programs', (req, res) => {
  const { id, name, icon, path, color, created_date, createdBy, userType } = req.body;

  // Check if user is admin
  if (userType !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Only administrators can create programs.' });
  }

  if (!id || !name || !path || !color) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Ensure created_date is always set
  const currentDate = created_date || new Date().toISOString().split('T')[0];

  const sql = `INSERT INTO programs (id, name, icon, path, color, created_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [id, name, icon || '', path, color, currentDate, createdBy || 'unknown'], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Program already exists' });
      }
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to add program' });
    }

    res.json({
      success: true,
      message: 'Program added successfully',
      program: { id, name, icon, path, color, created_date: currentDate, created_by: createdBy || 'unknown' }
    });
  });
});

// DELETE /api/programs/:id - Delete program (Admin only)
router.delete('/programs/:id', (req, res) => {
  const programId = req.params.id;
  const userType = req.query.userType || req.headers['user-type'];

  // Check if user is admin
  if (userType !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Only administrators can delete programs.' });
  }

  // Don't allow deleting default programs
  const defaultPrograms = ['montha', 'pm', 'president', 'vp'];
  if (defaultPrograms.includes(programId)) {
    return res.status(400).json({ error: 'Cannot delete default programs' });
  }

  const sql = `DELETE FROM programs WHERE id = ?`;
  
  db.run(sql, [programId], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to delete program' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json({
      success: true,
      message: 'Program deleted successfully'
    });
  });
});

module.exports = router;
