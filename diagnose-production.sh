#!/bin/bash
# Production Diagnostics Script for File Management System

echo "=========================================="
echo "FILE MANAGEMENT SYSTEM DIAGNOSTICS"
echo "=========================================="
echo ""

# Check if running as correct user
echo "1. Current User:"
whoami
echo ""

# Check PM2 processes
echo "2. PM2 Process Status:"
pm2 status
echo ""

# Check if Node.js backend is responding
echo "3. Backend Health Check:"
curl -s http://localhost:3000/api/programs | head -20
echo ""

# Check nginx status
echo "4. Nginx Status:"
sudo systemctl status nginx --no-pager | head -10
echo ""

# Check if port 3000 is listening
echo "5. Port 3000 Listening Status:"
sudo netstat -tuln | grep :3000
echo ""

# Check recent nginx error logs
echo "6. Recent Nginx Errors:"
sudo tail -20 /var/log/nginx/file-management-error.log
echo ""

# Check if dist folder exists and has files
echo "7. Frontend Dist Folder:"
ls -lh /var/www/file-management-system/dist/ | head -10
echo ""

# Check if images folder exists
echo "8. Images Folder:"
ls -lh /var/www/file-management-system/dist/images/ 2>/dev/null || echo "Images folder not found!"
echo ""

# Check PostgreSQL
echo "9. PostgreSQL Status:"
sudo systemctl status postgresql --no-pager | head -5
echo ""

# Check database connection
echo "10. Database Connection Test:"
cd /var/www/file-management-system
node -e "const pool = require('./backend/database.js'); pool.query('SELECT COUNT(*) FROM users').then(r => console.log('Users:', r.rows[0].count)).catch(e => console.log('DB Error:', e.message)).finally(() => process.exit())"
echo ""

# Check Git status
echo "11. Git Status:"
cd /var/www/file-management-system
git status --short
git log -1 --oneline
echo ""

# Check PM2 logs
echo "12. Recent PM2 Logs (last 20 lines):"
pm2 logs --lines 20 --nostream
echo ""

echo "=========================================="
echo "DIAGNOSTICS COMPLETE"
echo "=========================================="
