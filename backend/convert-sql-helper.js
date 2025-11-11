/**
 * SQL Conversion Helper
 * This file provides helper patterns for converting remaining SQLite queries to PostgreSQL
 * 
 * Remaining conversions needed in fileRoutes.js:
 * 
 * 1. Line 158 - GET /api/view/:id
 *    FROM: db.get(sql, [fileId], (err, row) => {
 *    TO:   const result = await pool.query(sql, [fileId]); const row = result.rows[0];
 * 
 * 2. Line 387 - GET /api/download/:id  
 *    FROM: db.get(sql, [fileId], (err, row) => {
 *    TO:   const result = await pool.query(sql, [fileId]); const row = result.rows[0];
 * 
 * 3. Line 427 - GET /api/files/:id
 *    FROM: db.get(sql, [fileId], (err, row) => {
 *    TO:   const result = await pool.query(sql, [fileId]); const row = result.rows[0];
 * 
 * 4. Line 604 - DELETE /api/files/:id (permission check)
 *    FROM: db.get(sql, [fileId], (err, row) => {
 *    TO:   const result = await pool.query(sql, [fileId]); const row = result.rows[0];
 * 
 * 5. Line 636 - DELETE /api/files/:id (actual deletion)
 *    FROM: db.run(deleteSql, [fileId], function(err) {
 *    TO:   const result = await pool.query(deleteSql, [fileId]);
 * 
 * SQL placeholder conversion:
 * - Replace ? with $1, $2, $3, etc.
 * - Count placeholders sequentially
 * 
 * Callback to async/await pattern:
 * - Change function to async
 * - Replace db.get/run/all with await pool.query
 * - Remove callback, use try/catch
 * - this.lastID → result.rows[0].id (with RETURNING id)
 * - this.changes → result.rowCount
 */

// Example conversion:
// BEFORE:
// db.get(`SELECT * FROM files WHERE id = ?`, [fileId], (err, row) => {
//   if (err) return res.status(500).json({ error: err.message });
//   if (!row) return res.status(404).json({ error: 'Not found' });
//   res.json({ file: row });
// });

// AFTER:
// try {
//   const result = await pool.query(`SELECT * FROM files WHERE id = $1`, [fileId]);
//   const row = result.rows[0];
//   if (!row) return res.status(404).json({ error: 'Not found' });
//   res.json({ file: row });
// } catch (err) {
//   return res.status(500).json({ error: err.message });
// }

module.exports = {
  message: 'Use these patterns to convert remaining SQL queries in fileRoutes.js'
};
