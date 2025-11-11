#!/bin/bash
# Quick Fix Script for Production Issues

echo "=========================================="
echo "PRODUCTION QUICK FIX SCRIPT"
echo "=========================================="
echo ""

# Navigate to project directory
cd /var/www/file-management-system || exit 1

# Step 1: Pull latest code
echo "Step 1: Pulling latest code from GitHub..."
git pull origin main
echo ""

# Step 2: Install dependencies (if package.json changed)
echo "Step 2: Checking for dependency updates..."
npm install
echo ""

# Step 3: Build frontend
echo "Step 3: Building frontend..."
npm run build
echo ""

# Step 4: Check if images exist, if not copy them
echo "Step 4: Checking images folder..."
if [ ! -d "dist/images" ]; then
    echo "Images folder missing! Copying..."
    cp -r public/images dist/
else
    echo "Images folder exists"
fi
echo ""

# Step 5: Restart PM2 processes
echo "Step 5: Restarting PM2 processes..."
pm2 restart all
echo ""

# Step 6: Wait a moment for processes to start
echo "Waiting for processes to start..."
sleep 3
echo ""

# Step 7: Check PM2 status
echo "Step 6: Checking PM2 status..."
pm2 status
echo ""

# Step 8: Test backend
echo "Step 7: Testing backend API..."
curl -s http://localhost:3000/api/programs || echo "Backend not responding!"
echo ""

# Step 9: Reload nginx (just in case)
echo "Step 8: Reloading Nginx..."
sudo systemctl reload nginx
echo ""

# Step 10: Show final status
echo "Step 9: Final Status Check..."
pm2 status
echo ""

echo "=========================================="
echo "QUICK FIX COMPLETE!"
echo "=========================================="
echo ""
echo "Test the site at: http://fms.prismappolice.in"
echo ""
echo "If still not working, run: ./diagnose-production.sh"
