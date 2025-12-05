const express = require('express');
const pool = require('./database');

const router = express.Router();

// GET /api/memos/:programId - Get all memos for a program
router.get('/memos/:programId', async (req, res) => {
  const { programId } = req.params;
  const sql = `SELECT * FROM memos WHERE program_id = $1 ORDER BY number ASC`;
  
  try {
    const result = await pool.query(sql, [programId]);
    res.json({
      success: true,
      memos: result.rows
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Failed to fetch memos' });
  }
});

// POST /api/memos - Add new memo
router.post('/memos', async (req, res) => {
  const { program_id, name, created_by, userType } = req.body;

  console.log('Memo creation request:', { program_id, name, userType, created_by });

  // Check if user is admin
  if (!userType || userType.toUpperCase() !== 'ADMIN') {
    console.log('Access denied - userType:', userType);
    return res.status(403).json({ error: 'Access denied. Only administrators can create memos.' });
  }

  if (!program_id || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get the next memo number for this program
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM memos WHERE program_id = $1`,
      [program_id]
    );
    const nextNumber = parseInt(countResult.rows[0].count) + 1;

    const currentDate = new Date().toISOString().split('T')[0];
    const memoId = `${program_id}-memo-${nextNumber}`;

    const sql = `INSERT INTO memos (id, program_id, name, number, created_by, created_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    
    const result = await pool.query(sql, [memoId, program_id, name, nextNumber, created_by || 'unknown', currentDate]);
    
    console.log('Memo created successfully:', { id: memoId, name });
    
    res.json({
      success: true,
      message: 'Memo added successfully',
      memo: result.rows[0]
    });
  } catch (err) {
    console.error('Database error during memo creation:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Memo already exists' });
    }
    return res.status(500).json({ error: `Failed to add memo: ${err.message}` });
  }
});

// DELETE /api/memos/:id - Delete memo
router.delete('/memos/:id', async (req, res) => {
  const memoId = req.params.id;
  const userType = req.query.userType || req.headers['user-type'];

  // Check if user is admin
  if (!userType || userType.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Only administrators can delete memos.' });
  }

  const sql = `DELETE FROM memos WHERE id = $1`;
  
  try {
    const result = await pool.query(sql, [memoId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Memo not found' });
    }

    res.json({
      success: true,
      message: 'Memo deleted successfully'
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Failed to delete memo' });
  }
});

module.exports = router;
