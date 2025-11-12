#!/bin/bash

###############################################################################
# Backup Script for File Management System
# Backs up SQLite database and uploads directory
###############################################################################

# Configuration
APP_DIR="/var/www/file-management-system"
BACKUP_DIR="$APP_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=================================================="
echo "File Management System - Backup Script"
echo "=================================================="
echo "Backup started at: $(date)"
echo ""

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup SQLite database
echo -e "${YELLOW}➜ Backing up SQLite database...${NC}"
if [ -f "$APP_DIR/server/files.db" ]; then
    cp "$APP_DIR/server/files.db" "$BACKUP_DIR/files_$DATE.db"
    echo -e "${GREEN}✓ Database backed up: files_$DATE.db${NC}"
else
    echo -e "${RED}✗ Database file not found!${NC}"
fi

# Backup uploads directory
echo -e "${YELLOW}➜ Backing up uploads directory...${NC}"
if [ -d "$APP_DIR/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$APP_DIR" uploads/
    echo -e "${GREEN}✓ Uploads backed up: uploads_$DATE.tar.gz${NC}"
else
    echo -e "${RED}✗ Uploads directory not found!${NC}"
fi

# Calculate backup sizes
DB_SIZE=$(du -h "$BACKUP_DIR/files_$DATE.db" 2>/dev/null | cut -f1)
UPLOADS_SIZE=$(du -h "$BACKUP_DIR/uploads_$DATE.tar.gz" 2>/dev/null | cut -f1)

echo ""
echo "Backup Details:"
echo "  Database: $DB_SIZE"
echo "  Uploads:  $UPLOADS_SIZE"

# Clean up old backups (keep only last N days)
echo ""
echo -e "${YELLOW}➜ Cleaning up old backups (keeping last $RETENTION_DAYS days)...${NC}"
find $BACKUP_DIR -name "files_*.db" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo -e "${GREEN}✓ Old backups cleaned up${NC}"

# List current backups
echo ""
echo "Current backups:"
ls -lh $BACKUP_DIR

echo ""
echo "=================================================="
echo "Backup completed at: $(date)"
echo "=================================================="
