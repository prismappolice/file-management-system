#!/bin/bash

###############################################################################
# Health Check Script for File Management System
# Checks if all services are running properly
###############################################################################

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=================================================="
echo "File Management System - Health Check"
echo "=================================================="
echo ""

# Check PM2 Status
echo -e "${YELLOW}Checking PM2 Status...${NC}"
if pm2 list | grep -q "file-management-api"; then
    if pm2 list | grep "file-management-api" | grep -q "online"; then
        echo -e "${GREEN}✓ PM2 Application is running${NC}"
    else
        echo -e "${RED}✗ PM2 Application is not online${NC}"
    fi
else
    echo -e "${RED}✗ PM2 Application not found${NC}"
fi

# Check Nginx Status
echo ""
echo -e "${YELLOW}Checking Nginx Status...${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx is not running${NC}"
fi

# Check if port 3000 is listening
echo ""
echo -e "${YELLOW}Checking Backend Port (3000)...${NC}"
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo -e "${GREEN}✓ Backend is listening on port 3000${NC}"
else
    echo -e "${RED}✗ Backend is not listening on port 3000${NC}"
fi

# Check API Health Endpoint
echo ""
echo -e "${YELLOW}Checking API Health Endpoint...${NC}"
if curl -s http://localhost:3000/api/health | grep -q "OK"; then
    echo -e "${GREEN}✓ API health endpoint responding${NC}"
else
    echo -e "${RED}✗ API health endpoint not responding${NC}"
fi

# Check SSL Certificate
echo ""
echo -e "${YELLOW}Checking SSL Certificate...${NC}"
if [ -f "/etc/letsencrypt/live/fms.prism-appolice.in/fullchain.pem" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/fms.prism-appolice.in/fullchain.pem | cut -d= -f2)
    echo -e "${GREEN}✓ SSL Certificate exists${NC}"
    echo "  Expires: $EXPIRY"
else
    echo -e "${RED}✗ SSL Certificate not found${NC}"
fi

# Check Disk Space
echo ""
echo -e "${YELLOW}Checking Disk Space...${NC}"
DISK_USAGE=$(df -h /var/www/file-management-system | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✓ Disk space is adequate ($DISK_USAGE% used)${NC}"
elif [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "${YELLOW}⚠ Disk space is getting low ($DISK_USAGE% used)${NC}"
else
    echo -e "${RED}✗ Disk space is critically low ($DISK_USAGE% used)${NC}"
fi

# Check Database File
echo ""
echo -e "${YELLOW}Checking Database...${NC}"
if [ -f "/var/www/file-management-system/server/files.db" ]; then
    DB_SIZE=$(du -h /var/www/file-management-system/server/files.db | cut -f1)
    echo -e "${GREEN}✓ Database file exists ($DB_SIZE)${NC}"
else
    echo -e "${RED}✗ Database file not found${NC}"
fi

# Check Uploads Directory
echo ""
echo -e "${YELLOW}Checking Uploads Directory...${NC}"
if [ -d "/var/www/file-management-system/uploads" ]; then
    UPLOAD_COUNT=$(find /var/www/file-management-system/uploads -type f | wc -l)
    UPLOAD_SIZE=$(du -sh /var/www/file-management-system/uploads 2>/dev/null | cut -f1)
    echo -e "${GREEN}✓ Uploads directory exists${NC}"
    echo "  Files: $UPLOAD_COUNT"
    echo "  Size: $UPLOAD_SIZE"
else
    echo -e "${RED}✗ Uploads directory not found${NC}"
fi

echo ""
echo "=================================================="
echo "Health Check Completed at: $(date)"
echo "=================================================="
