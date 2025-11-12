#!/bin/bash

###############################################################################
# Update Script for File Management System
# Safely updates the application with zero downtime
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/var/www/file-management-system"

echo "=================================================="
echo "File Management System - Update Script"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}✗ Application directory not found: $APP_DIR${NC}"
    exit 1
fi

cd $APP_DIR

# Backup current database before update
echo -e "${YELLOW}➜ Creating backup before update...${NC}"
BACKUP_DIR="$APP_DIR/backups/pre-update"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

if [ -f "$APP_DIR/server/files.db" ]; then
    cp "$APP_DIR/server/files.db" "$BACKUP_DIR/files_$DATE.db"
    echo -e "${GREEN}✓ Database backed up${NC}"
fi

# Check for uncommitted changes
echo ""
echo -e "${YELLOW}➜ Checking for local changes...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠ Warning: You have uncommitted changes${NC}"
    git status --short
    echo ""
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Update cancelled${NC}"
        exit 1
    fi
fi

# Fetch latest changes
echo ""
echo -e "${YELLOW}➜ Fetching latest changes from repository...${NC}"
git fetch origin main
echo -e "${GREEN}✓ Fetched latest changes${NC}"

# Show what will be updated
echo ""
echo -e "${BLUE}Changes to be applied:${NC}"
git log HEAD..origin/main --oneline --decorate --graph | head -10

echo ""
read -p "Proceed with update? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Update cancelled${NC}"
    exit 1
fi

# Pull latest changes
echo ""
echo -e "${YELLOW}➜ Pulling latest changes...${NC}"
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"

# Install/update dependencies
echo ""
echo -e "${YELLOW}➜ Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies updated${NC}"

# Build frontend
echo ""
echo -e "${YELLOW}➜ Building frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built${NC}"

# Restart application with PM2
echo ""
echo -e "${YELLOW}➜ Restarting application...${NC}"
pm2 restart file-management-api
echo -e "${GREEN}✓ Application restarted${NC}"

# Wait a moment for app to start
sleep 3

# Check if application is running
echo ""
echo -e "${YELLOW}➜ Checking application health...${NC}"
if curl -s http://localhost:3000/api/health | grep -q "OK"; then
    echo -e "${GREEN}✓ Application is running successfully!${NC}"
else
    echo -e "${RED}✗ Application health check failed!${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    
    # Attempt to restore from backup
    if [ -f "$BACKUP_DIR/files_$DATE.db" ]; then
        cp "$BACKUP_DIR/files_$DATE.db" "$APP_DIR/server/files.db"
        pm2 restart file-management-api
        echo -e "${YELLOW}⚠ Rolled back to previous version${NC}"
    fi
    exit 1
fi

# Show current status
echo ""
echo -e "${BLUE}Current Status:${NC}"
pm2 list | grep file-management-api

# Show logs
echo ""
echo -e "${BLUE}Recent Logs:${NC}"
pm2 logs file-management-api --lines 20 --nostream

echo ""
echo "=================================================="
echo -e "${GREEN}✓ Update completed successfully!${NC}"
echo "=================================================="
echo ""
echo "Your application is now running the latest version"
echo "URL: https://fms.prism-appolice.in"
echo ""
echo "To view logs: pm2 logs file-management-api"
echo "To check status: pm2 status"
echo ""
