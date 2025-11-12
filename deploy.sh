#!/bin/bash

###############################################################################
# File Management System - Automated Deployment Script
# Domain: fms.prism-appolice.in
# Author: YESUBABU BEZAWADA
###############################################################################

set -e  # Exit on error

echo "=================================================="
echo "File Management System Deployment Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/file-management-system"
DOMAIN="fms.prism-appolice.in"
NODE_VERSION="20"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root"
    exit 1
fi

echo "Step 1: Updating system packages..."
sudo apt update
sudo apt upgrade -y
print_success "System packages updated"

echo ""
echo "Step 2: Installing essential tools..."
sudo apt install -y curl wget git build-essential
print_success "Essential tools installed"

echo ""
echo "Step 3: Installing Node.js ${NODE_VERSION}.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js installed: $(node --version)"
else
    print_info "Node.js already installed: $(node --version)"
fi

echo ""
echo "Step 4: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "Nginx installed and started"
else
    print_info "Nginx already installed"
fi

echo ""
echo "Step 5: Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
print_success "Firewall configured"

echo ""
echo "Step 6: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 installed"
else
    print_info "PM2 already installed"
fi

echo ""
echo "Step 7: Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR
print_success "Application directory created: $APP_DIR"

echo ""
echo "Step 8: Installing Certbot for SSL..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
    print_success "Certbot installed"
else
    print_info "Certbot already installed"
fi

echo ""
print_info "Setup completed! Next steps:"
echo ""
echo "1. Clone your repository:"
echo "   cd $APP_DIR"
echo "   git clone https://github.com/BEZAWADAYESUBABU/file-management-system.git ."
echo ""
echo "2. Install dependencies and build:"
echo "   npm install"
echo "   npm run build"
echo ""
echo "3. Start the application:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup systemd"
echo ""
echo "4. Configure Nginx (see DEPLOYMENT_GUIDE.md)"
echo ""
echo "5. Obtain SSL certificate:"
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
print_success "Deployment script completed!"
