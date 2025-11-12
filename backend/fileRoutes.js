const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./database');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept all file types
    // You can add restrictions here if needed in the future
    cb(null, true);
  }
  // No file size limit
});

// POST /api/upload - Upload file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('=== UPLOAD REQUEST ===');
    console.log('Request body:', req.body);
    console.log('File info:', { name: req.file.originalname, size: req.file.size });
    
    const { fileNo, subject, department, date, program } = req.body;
    
    console.log('Extracted values:');
    console.log('  fileNo:', fileNo);
    console.log('  subject:', subject);
    console.log('  department:', department);
    console.log('  date:', date);
    console.log('  program:', program);

    if (!fileNo || !subject || !department || !date) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'File No, subject, department, and date are required' });
    }

    const filename = req.file.filename;
    const filepath = req.file.path;
    const programName = program || 'montha'; // Default to montha if not specified
    const createdBy = req.body.createdBy || 'Unknown';
    
    console.log('Final program name:', programName);
    console.log('Created by:', createdBy);

    // Insert into database - PostgreSQL uses lowercase column names by default
    const sql = `INSERT INTO files (fileno, subject, department, date, filename, filepath, program, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`;
    
    try {
      const result = await pool.query(sql, [fileNo, subject, department, date, filename, filepath, programName, createdBy]);
      const fileId = result.rows[0].id;
      
      console.log('✓ File saved successfully - ID:', fileId, 'Program:', programName);
      console.log('=====================\n');

      res.json({
        success: true,
        message: 'File Uploaded Successfully',
        fileId: fileId,
        filename: filename
      });
    } catch (err) {
      console.error('Database error:', err);
      // Delete uploaded file if database insert fails
      fs.unlinkSync(filepath);
      return res.status(500).json({ error: 'Failed to save file information' });
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/files - Get all uploaded files (filtered by program and user access)
router.get('/files', async (req, res) => {
  const program = req.query.program;
  const userType = req.query.userType;
  const userName = req.query.userName;
  
  console.log('Files request - Program:', program, 'UserType:', userType, 'UserName:', userName);
  
  let sql = `SELECT id, fileno, subject, department, date, filename, program, created_by, uploaded_at FROM files`;
  let params = [];
  let whereClauses = [];
  let paramIndex = 1;
  
  // Filter by program if specified
  if (program) {
    whereClauses.push(`program = $${paramIndex++}`);
    params.push(program);
  }
  
  // Apply user-based file access control
  if (!userType || userType.toUpperCase() !== 'ADMIN') {
    // Non-admin users can only see their own files
    whereClauses.push(`created_by = $${paramIndex++}`);
    params.push(userName);
  }
  // Admin users can see all files (no additional filter)
  
  // Add WHERE clause if we have conditions
  if (whereClauses.length > 0) {
    sql += ` WHERE ` + whereClauses.join(' AND ');
  }
  
  sql += ` ORDER BY uploaded_at DESC`;
  
  console.log('SQL:', sql, 'Params:', params);
  
  try {
    const result = await pool.query(sql, params);
    console.log('Found', result.rows.length, 'files for user:', userName, 'type:', userType);
    
    // Map fileno to fileNo for frontend compatibility - remove fileno to avoid confusion
    const files = result.rows.map(file => {
      const { fileno, ...rest } = file;
      return {
        ...rest,
        fileNo: fileno
      };
    });

    res.json({
      success: true,
      files: files
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// GET /api/view/:id - Create HTML preview page for files
router.get('/view/:id', async (req, res) => {
  const fileId = req.params.id;
  
  const sql = `SELECT * FROM files WHERE id = $1`;
  
  try {
    const result = await pool.query(sql, [fileId]);
    const row = result.rows[0];
    
    if (!row) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = row.filepath;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    const fileExtension = path.extname(row.filename).toLowerCase();
    const stats = fs.statSync(filePath);
    
    // Function to get appropriate file icon
    const getFileIcon = (ext) => {
      const iconMap = {
        '.doc': '📝', '.docx': '📝',
        '.xls': '📊', '.xlsx': '📊',
        '.ppt': '📽️', '.pptx': '📽️',
        '.zip': '🗜️', '.rar': '🗜️', '.7z': '🗜️',
        '.exe': '⚙️', '.msi': '⚙️',
        '.iso': '💿', '.dmg': '💿',
        '.dll': '🔧', '.lib': '🔧',
        '.bat': '⚡', '.sh': '⚡',
        '.py': '🐍', '.js': '🟨', '.php': '🐘',
        '.java': '☕', '.cpp': '⚡', '.c': '⚡',
        '.sql': '🗃️', '.db': '🗃️'
      };
      return iconMap[ext] || '📄';
    };
    
    // Create HTML preview page
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File Viewer - ${row.filename}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container { 
                max-width: 900px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 15px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                overflow: hidden;
            }
            .header { 
                background: linear-gradient(135deg, #ff0844 0%, #0066ff 100%); 
                color: white; 
                padding: 25px; 
                text-align: center; 
            }
            .header h1 { font-size: 1.8rem; margin-bottom: 10px; }
            .file-info { 
                padding: 30px; 
                background: #f8f9fa; 
            }
            .info-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 20px; 
                margin-bottom: 30px; 
            }
            .info-item { 
                background: white; 
                padding: 15px; 
                border-radius: 8px; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .info-label { 
                font-weight: 600; 
                color: #555; 
                margin-bottom: 5px; 
            }
            .info-value { 
                color: #333; 
                font-size: 1.1rem; 
            }
            .preview-section { 
                padding: 30px; 
                text-align: center; 
            }
            .file-icon { 
                font-size: 4rem; 
                margin-bottom: 20px; 
            }
            .download-section { 
                background: #e9ecef; 
                padding: 25px; 
                text-align: center; 
            }
            .download-btn { 
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                color: white; 
                border: none; 
                padding: 15px 30px; 
                font-size: 1.1rem; 
                border-radius: 50px; 
                cursor: pointer; 
                text-decoration: none; 
                display: inline-block; 
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            }
            .download-btn:hover { 
                transform: translateY(-2px); 
                box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
            }
            .note { 
                margin-top: 20px; 
                padding: 15px; 
                background: #fff3cd; 
                border: 1px solid #ffeaa7; 
                border-radius: 8px; 
                color: #856404; 
            }
            iframe { 
                width: 100%; 
                height: 600px; 
                border: none; 
                border-radius: 8px; 
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📄 File Viewer</h1>
                <p>AP POLICE - File Management System</p>
            </div>
            
            <div class="file-info">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">File Name</div>
                        <div class="info-value">${row.filename}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">File No/C No</div>
                        <div class="info-value">${row.fileno || row.fileNo || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Subject</div>
                        <div class="info-value">${row.subject}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Department</div>
                        <div class="info-value">${row.department}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date</div>
                        <div class="info-value">${new Date(row.date).toLocaleDateString()}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">File Size</div>
                        <div class="info-value">${(stats.size / 1024).toFixed(2)} KB</div>
                    </div>
                </div>
            </div>
            
            <div class="preview-section">
                ${fileExtension === '.pdf' 
                  ? `<iframe src="/api/serve/${fileId}"></iframe>`
                  : fileExtension === '.txt' || fileExtension === '.csv' || fileExtension === '.html' || fileExtension === '.json' || fileExtension === '.xml'
                  ? `<iframe src="/api/serve/${fileId}" style="background: white;"></iframe>`
                  : ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(fileExtension)
                  ? `<img src="/api/serve/${fileId}" style="max-width: 100%; max-height: 600px; object-fit: contain;" alt="File preview" />`
                  : ['.mp4', '.webm'].includes(fileExtension)
                  ? `<video controls style="max-width: 100%; max-height: 600px;">
                       <source src="/api/serve/${fileId}" type="video/${fileExtension.substring(1)}">
                       Your browser does not support the video tag.
                     </video>`
                  : ['.mp3', '.wav'].includes(fileExtension)
                  ? `<audio controls style="width: 100%;">
                       <source src="/api/serve/${fileId}" type="audio/${fileExtension === '.mp3' ? 'mpeg' : 'wav'}">
                       Your browser does not support the audio tag.
                     </audio>`
                  : `
                    <div class="file-icon">${getFileIcon(fileExtension)}</div>
                    <h3>File Preview</h3>
                    <p>This ${fileExtension.toUpperCase()} file cannot be previewed directly in the browser.</p>
                    <div class="note">
                        <strong>💡 Note:</strong> To view the complete content of this file, 
                        please download it and open with appropriate application.
                    </div>
                  `
                }
            </div>
            
            <div class="download-section">
                <a href="/api/download/${fileId}" class="download-btn">
                    ⬇️ Download File to View Content
                </a>
                <p style="margin-top: 15px; color: #6c757d;">
                    Click download to save and open the file with appropriate software
                </p>
            </div>
        </div>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/download/:id - Download file
router.get('/download/:id', async (req, res) => {
  const fileId = req.params.id;
  
  const sql = `SELECT * FROM files WHERE id = $1`;
  
  try {
    const result = await pool.query(sql, [fileId]);
    const row = result.rows[0];
    
    if (!row) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = row.filepath;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Get original filename from database
    const originalName = row.filename;
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream file to client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/serve/:id - Serve file directly for viewing in browser
router.get('/serve/:id', async (req, res) => {
  const fileId = req.params.id;
  
  console.log(`=== SERVE REQUEST ===`);
  console.log(`File ID: ${fileId}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  const sql = `SELECT * FROM files WHERE id = $1`;
  
  try {
    const result = await pool.query(sql, [fileId]);
    const row = result.rows[0];
    
    if (!row) {
      console.log(`File not found in database: ${fileId}`);
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = row.filepath;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`Physical file not found: ${filePath}`);
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Validate file integrity
    const stats = fs.statSync(filePath);
    if (stats.size < 100) { // Files smaller than 100 bytes are likely corrupted
      console.log(`File appears corrupted (size: ${stats.size} bytes): ${filePath}`);
      // Check if it contains error JSON
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('error') && content.includes('{')) {
          console.log(`File contains error JSON: ${content}`);
          return res.status(500).json({ error: 'File is corrupted and cannot be served' });
        }
      } catch (e) {
        // If we can't read it as text, it might be binary and okay
      }
    }

    // Get file extension to determine content type
    const fileExtension = path.extname(row.filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    // Set appropriate content type based on file extension
    switch (fileExtension) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.xls':
        contentType = 'application/vnd.ms-excel';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case '.ppt':
        contentType = 'application/vnd.ms-powerpoint';
        break;
      case '.pptx':
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.csv':
        contentType = 'text/csv';
        break;
      case '.html':
      case '.htm':
        contentType = 'text/html';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.js':
        contentType = 'application/javascript';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.xml':
        contentType = 'application/xml';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.bmp':
        contentType = 'image/bmp';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.ico':
        contentType = 'image/x-icon';
        break;
      case '.mp4':
        contentType = 'video/mp4';
        break;
      case '.webm':
        contentType = 'video/webm';
        break;
      case '.mp3':
        contentType = 'audio/mpeg';
        break;
      case '.wav':
        contentType = 'audio/wav';
        break;
      case '.zip':
        contentType = 'application/zip';
        break;
      case '.rar':
        contentType = 'application/vnd.rar';
        break;
      case '.7z':
        contentType = 'application/x-7z-compressed';
        break;
      default:
        contentType = 'application/octet-stream';
    }

    // Files that can be viewed inline in browser
    const canViewInline = [
      '.pdf', '.txt', '.csv', '.html', '.htm', '.css', '.js', '.json', '.xml',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico',
      '.mp4', '.webm', '.mp3', '.wav'
    ].includes(fileExtension);
    
    // Set headers for inline viewing or download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    
    if (canViewInline) {
      res.setHeader('Content-Disposition', `inline; filename="${row.filename}"`);
      console.log(`Serving ${row.filename} for inline viewing (${stats.size} bytes)`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${row.filename}"`);
      console.log(`Serving ${row.filename} for download (${stats.size} bytes)`);
    }

    // Stream file to client with error handling
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error(`Error streaming file ${filePath}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error reading file' });
      }
    });
    
    fileStream.pipe(res);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/files/:id - Delete file (with ownership check)
router.delete('/files/:id', async (req, res) => {
  const fileId = req.params.id;
  const { userName, userType } = req.body;
  
  console.log(`=== DELETE REQUEST ===`);
  console.log(`File ID: ${fileId}`);
  console.log(`Request userName: "${userName}"`);
  console.log(`Request userType: "${userType}"`);
  
  try {
    // First, get file details including who created it
    const sql = `SELECT * FROM files WHERE id = $1`;
    const result = await pool.query(sql, [fileId]);
    const row = result.rows[0];
    
    if (!row) {
      return res.status(404).json({ error: 'File not found' });
    }

    console.log(`File found - created_by: "${row.created_by}"`);

    // Authorization check:
    // Only file owner can delete their own files (to prevent admin misuse)
    const isOwner = row.created_by === userName;

    console.log(`Auth check - isOwner: ${isOwner}`);
    console.log(`Comparing: "${row.created_by}" === "${userName}"`);

    if (!isOwner) {
      console.log('Authorization failed - only file owner can delete');
      return res.status(403).json({ 
        error: 'You can only delete files uploaded by you',
        success: false 
      });
    }

    const filePath = row.filepath;
    
    // Delete from database
    const deleteSql = `DELETE FROM files WHERE id = $1`;
    await pool.query(deleteSql, [fileId]);

    // Delete physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
