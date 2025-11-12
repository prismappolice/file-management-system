# Deployment Guide - File Management System on GCP Ubuntu VM

## Domain: fms.prism-appolice.in

This guide will walk you through deploying the District File Flow application on a Google Cloud Platform (GCP) Ubuntu VM.

---

## 📋 Prerequisites

- GCP Ubuntu VM (20.04 LTS or 22.04 LTS recommended)
- Domain: `fms.prism-appolice.in` pointing to your VM's external IP
- SSH access to the VM
- Root or sudo privileges

---

## 🚀 Step 1: Initial Server Setup

### 1.1 Connect to Your VM

```bash
# From your local machine
gcloud compute ssh <your-vm-name> --zone=<your-zone>

# Or use SSH directly
ssh username@fms.prism-appolice.in
```

### 1.2 Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Install Essential Tools

```bash
sudo apt install -y curl wget git build-essential
```

---

## 🔧 Step 2: Install Node.js and npm

### 2.1 Install Node.js (LTS version)

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

---

## 📦 Step 3: Install and Configure Nginx

### 3.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 3.2 Configure Firewall

```bash
# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

# Verify
sudo ufw status
```

### 3.3 Start Nginx

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

## 🔐 Step 4: Install SSL Certificate (Let's Encrypt)

### 4.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 4.2 Obtain SSL Certificate

```bash
# Make sure your domain is pointing to this VM's IP
sudo certbot --nginx -d fms.prism-appolice.in

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### 4.3 Auto-renewal Setup

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
```

---

## 📁 Step 5: Deploy the Application

### 5.1 Create Application Directory

```bash
# Create directory for the application
sudo mkdir -p /var/www/file-management-system
sudo chown -R $USER:$USER /var/www/file-management-system
cd /var/www/file-management-system
```

### 5.2 Clone the Repository

```bash
# Clone your repository
git clone https://github.com/BEZAWADAYESUBABU/file-management-system.git .

# Or if you're uploading files directly
# You can use SCP or SFTP to transfer files
```

### 5.3 Install Dependencies

```bash
# Install all dependencies
npm install
```

### 5.4 Build the Frontend

```bash
# Build the React frontend
npm run build
```

### 5.5 Create Required Directories

```bash
# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Create server directory if not exists
mkdir -p server
```

---

## 🔄 Step 6: Configure PM2 Process Manager

### 6.1 Install PM2

```bash
sudo npm install -g pm2
```

### 6.2 Create PM2 Ecosystem File

```bash
# Create ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'file-management-api',
    script: './server/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF
```

### 6.3 Create Logs Directory

```bash
mkdir -p logs
```

### 6.4 Start the Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Run the command that PM2 outputs

# Check application status
pm2 status
pm2 logs file-management-api
```

---

## 🌐 Step 7: Configure Nginx as Reverse Proxy

### 7.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/file-management-system
```

### 7.2 Add the Following Configuration

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name fms.prism-appolice.in;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name fms.prism-appolice.in;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/fms.prism-appolice.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fms.prism-appolice.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root directory for static files
    root /var/www/file-management-system/dist;
    index index.html;

    # Client max body size (for file uploads)
    client_max_body_size 100M;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Serve uploaded files
    location /uploads {
        alias /var/www/file-management-system/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
```

### 7.3 Enable the Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/file-management-system /etc/nginx/sites-enabled/

# Remove default configuration (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## ✅ Step 8: Verify Deployment

### 8.1 Check Services

```bash
# Check PM2 status
pm2 status
pm2 logs file-management-api --lines 50

# Check Nginx status
sudo systemctl status nginx

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000
```

### 8.2 Test the Application

```bash
# Test API health endpoint
curl http://localhost:3000/api/health

# Test from outside
curl https://fms.prism-appolice.in/api/health
```

### 8.3 Access the Application

Open your browser and navigate to:
```
https://fms.prism-appolice.in
```

---

## 🔍 Step 9: Monitoring and Maintenance

### 9.1 View Logs

```bash
# PM2 logs
pm2 logs file-management-api

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### 9.2 PM2 Commands

```bash
# Restart application
pm2 restart file-management-api

# Stop application
pm2 stop file-management-api

# View detailed info
pm2 info file-management-api

# Monitor resources
pm2 monit
```

### 9.3 Update Application

```bash
cd /var/www/file-management-system

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild frontend
npm run build

# Restart backend
pm2 restart file-management-api

# Clear PM2 logs (optional)
pm2 flush
```

---

## 🛡️ Step 10: Security Best Practices

### 10.1 Configure Firewall

```bash
# Check GCP firewall rules
# Allow only necessary ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)
```

### 10.2 Secure SSH

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Recommended settings:
# PermitRootLogin no
# PasswordAuthentication no (use SSH keys)
# Port 22 (or change to custom port)

# Restart SSH
sudo systemctl restart sshd
```

### 10.3 Regular Updates

```bash
# Create a cron job for automatic updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 10.4 Backup Database

```bash
# Create backup script
cat > /var/www/file-management-system/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/www/file-management-system/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup SQLite database
cp /var/www/file-management-system/server/files.db $BACKUP_DIR/files_$DATE.db

# Backup uploads directory
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/file-management-system/uploads/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "files_*.db" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /var/www/file-management-system/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/file-management-system/backup.sh") | crontab -
```

---

## 🐛 Troubleshooting

### Issue: Application not accessible

**Check:**
```bash
# Check if PM2 is running
pm2 status

# Check if Nginx is running
sudo systemctl status nginx

# Check logs
pm2 logs file-management-api
sudo tail -f /var/log/nginx/error.log
```

### Issue: File uploads not working

**Check:**
```bash
# Verify uploads directory permissions
ls -la /var/www/file-management-system/uploads
chmod 755 /var/www/file-management-system/uploads

# Check Nginx client_max_body_size setting
sudo nano /etc/nginx/sites-available/file-management-system
```

### Issue: SSL certificate issues

**Fix:**
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Issue: Port 3000 already in use

**Check:**
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process if needed
sudo kill -9 <PID>

# Restart PM2
pm2 restart file-management-api
```

---

## 📞 Support & Maintenance

### Regular Checks (Weekly)

- [ ] Check disk space: `df -h`
- [ ] Review application logs: `pm2 logs`
- [ ] Check system updates: `sudo apt update && sudo apt list --upgradable`
- [ ] Monitor SSL certificate expiry: `sudo certbot certificates`

### Monthly Tasks

- [ ] Review backup files
- [ ] Update Node.js packages: `npm outdated`
- [ ] Review security patches
- [ ] Test backup restoration

---

## 📝 Environment Variables (Optional)

If you need to add environment variables:

```bash
# Edit ecosystem.config.js
nano ecosystem.config.js

# Add to env section:
env: {
  NODE_ENV: 'production',
  PORT: 3000,
  DATABASE_PATH: './server/files.db',
  UPLOAD_DIR: './uploads'
}
```

---

## 🎉 Deployment Complete!

Your File Management System should now be live at:
**https://fms.prism-appolice.in**

For any issues or updates, refer to the troubleshooting section above.

---

## Quick Reference Commands

```bash
# Application Management
pm2 restart file-management-api
pm2 logs file-management-api
pm2 monit

# Nginx Management
sudo systemctl reload nginx
sudo nginx -t

# View Logs
sudo tail -f /var/log/nginx/error.log
pm2 logs --lines 100

# Update Application
cd /var/www/file-management-system
git pull
npm install
npm run build
pm2 restart file-management-api
```

---

**Last Updated:** November 4, 2025
**Maintainer:** YESUBABU BEZAWADA
