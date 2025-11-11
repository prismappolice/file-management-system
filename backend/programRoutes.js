const express = require('express');
const pool = require('./database');

const router = express.Router();

// GET /api/programs - Get all programs
router.get('/programs', async (req, res) => {
  const sql = `SELECT * FROM programs ORDER BY created_at ASC`;
  
  try {
    const result = await pool.query(sql);
    res.json({
      success: true,
      programs: result.rows
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// POST /api/programs - Add new program (Admin only)
router.post('/programs', async (req, res) => {
  const { id, name, icon, path, color, created_date, createdBy, userType } = req.body;

  console.log('Program creation request:', { id, name, userType, createdBy });

  // Check if user is admin (case-insensitive)
  if (!userType || userType.toUpperCase() !== 'ADMIN') {
    console.log('Access denied - userType:', userType);
    return res.status(403).json({ error: 'Access denied. Only administrators can create programs.' });
  }

  if (!id || !name || !path || !color) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Ensure created_date is always set
  const currentDate = created_date || new Date().toISOString().split('T')[0];

  const sql = `INSERT INTO programs (id, name, icon, path, color, created_date, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
  
  try {
    await pool.query(sql, [id, name, icon || '', path, color, currentDate, createdBy || 'unknown']);
    
    res.json({
      success: true,
      message: 'Program added successfully',
      program: { id, name, icon, path, color, created_date: currentDate, created_by: createdBy || 'unknown' }
    });
  } catch (err) {
    if (err.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({ error: 'Program already exists' });
    }
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Failed to add program' });
  }
});

// DELETE /api/programs/:id - Delete program (Admin only)
router.delete('/programs/:id', async (req, res) => {
  const programId = req.params.id;
  const userType = req.query.userType || req.headers['user-type'];

  // Check if user is admin (case-insensitive)
  if (!userType || userType.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Only administrators can delete programs.' });
  }

  // Don't allow deleting default programs
  const defaultPrograms = ['montha', 'pm', 'president', 'vp'];
  if (defaultPrograms.includes(programId)) {
    return res.status(400).json({ error: 'Cannot delete default programs' });
  }

  const sql = `DELETE FROM programs WHERE id = $1`;
  
  try {
    const result = await pool.query(sql, [programId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json({
      success: true,
      message: 'Program deleted successfully'
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Failed to delete program' });
  }
});

module.exports = router;
