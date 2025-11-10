# ⚡ Quick Commands Cheat Sheet

## Copy-Paste చేయడానికి Ready Commands

---

## 🚀 Complete Setup (One-by-One Copy Paste చేయండి)

### 1. System Update
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install All Tools at Once
```bash
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx
```

### 3. Install Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
```

### 4. Install PM2
```bash
sudo npm install -g pm2
```

### 5. Setup Firewall
```bash
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw --force enable
```

### 6. Create & Setup Application Directory
```bash
sudo mkdir -p /var/www/file-management-system && sudo chown -R $USER:$USER /var/www/file-management-system && cd /var/www/file-management-system
```

### 7. Clone Repository
```bash
git clone https://github.com/BEZAWADAYESUBABU/file-management-system.git .
```

### 8. Install Dependencies & Build
```bash
npm install && npm run build
```

### 9. Create Directories
```bash
mkdir -p uploads logs backups && chmod 755 uploads
```

### 10. Start with PM2
```bash
pm2 start ecosystem.config.js && pm2 save
```

### 11. PM2 Startup (Run the command PM2 outputs after this)
```bash
pm2 startup systemd
```

### 12. Make Scripts Executable
```bash
chmod +x backup.sh health-check.sh update.sh deploy.sh
```

---

## 🌐 Nginx Configuration (One Command)

### Create Nginx Config
```bash
sudo tee /etc/nginx/sites-available/file-management-system > /dev/null <<'EOF'
server {
    listen 80;
    server_name fms.prism-appolice.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name fms.prism-appolice.in;

    ssl_certificate /etc/letsencrypt/live/fms.prism-appolice.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fms.prism-appolice.in/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    root /var/www/file-management-system/dist;
    index index.html;

    client_max_body_size 100M;

    location / {
        try_files $uri $uri/ /index.html;
    }

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
    }

    location /uploads {
        alias /var/www/file-management-system/uploads;
        expires 30d;
    }

    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
EOF
```

### Enable Nginx Config
```bash
sudo ln -s /etc/nginx/sites-available/file-management-system /etc/nginx/sites-enabled/ && sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔐 SSL Certificate (One Command)

```bash
sudo certbot --nginx -d fms.prism-appolice.in
```

---

## 📅 Setup Daily Backup (One Command)

```bash
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/file-management-system/backup.sh") | crontab -
```

---

## ✅ Verification Commands

### Check Everything at Once
```bash
echo "=== PM2 Status ===" && pm2 status && echo -e "\n=== Nginx Status ===" && sudo systemctl status nginx --no-pager && echo -e "\n=== API Health ===" && curl -s http://localhost:3000/api/health && echo -e "\n=== Port 3000 ===" && sudo netstat -tlnp | grep 3000
```

### Health Check
```bash
cd /var/www/file-management-system && ./health-check.sh
```

### Test API
```bash
curl http://localhost:3000/api/health && curl https://fms.prism-appolice.in/api/health
```

---

## 🔄 Daily Use Commands

### Restart Application
```bash
pm2 restart file-management-api
```

### View Logs (Last 50 lines)
```bash
pm2 logs file-management-api --lines 50
```

### Monitor Application
```bash
pm2 monit
```

### Update Application
```bash
cd /var/www/file-management-system && ./update.sh
```

### Manual Backup
```bash
cd /var/www/file-management-system && ./backup.sh
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### Check Disk Space
```bash
df -h
```

### Check Memory
```bash
free -h
```

---

## 🐛 Troubleshooting Commands

### Application Not Working?
```bash
# Check PM2
pm2 status
pm2 logs file-management-api --lines 100

# Restart
pm2 restart file-management-api

# Check port
sudo netstat -tlnp | grep 3000
```

### Nginx Issues?
```bash
# Test config
sudo nginx -t

# Check status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# View error logs
sudo tail -n 100 /var/log/nginx/error.log
```

### SSL Certificate Issues?
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Reload nginx after renewal
sudo systemctl reload nginx
```

### File Upload Not Working?
```bash
# Check upload directory permissions
ls -la /var/www/file-management-system/uploads

# Fix permissions
chmod 755 /var/www/file-management-system/uploads

# Restart application
pm2 restart file-management-api
```

### Database Issues?
```bash
# Check database file
ls -lh /var/www/file-management-system/server/files.db

# View database location
cd /var/www/file-management-system/server && pwd

# Restore from backup
cp backups/files_YYYYMMDD_HHMMSS.db server/files.db
```

---

## 🔄 Update Workflow

```bash
# Navigate to app directory
cd /var/www/file-management-system

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build frontend
npm run build

# Restart backend
pm2 restart file-management-api

# Check status
pm2 status
```

---

## 📊 System Monitoring

### Check All Services
```bash
pm2 status && sudo systemctl status nginx --no-pager && df -h && free -h
```

### View All Logs
```bash
# PM2 logs
pm2 logs --lines 20

# Nginx access log
sudo tail -n 50 /var/log/nginx/access.log

# Nginx error log
sudo tail -n 50 /var/log/nginx/error.log
```

---

## 🔒 Security Commands

### Check Firewall Status
```bash
sudo ufw status verbose
```

### View Open Ports
```bash
sudo netstat -tlnp
```

### Check SSL Certificate Expiry
```bash
sudo certbot certificates
```

### Test SSL Certificate Auto-renewal
```bash
sudo certbot renew --dry-run
```

---

## 💾 Backup & Restore

### Create Manual Backup
```bash
cd /var/www/file-management-system
DATE=$(date +%Y%m%d_%H%M%S)
cp server/files.db backups/files_$DATE.db
tar -czf backups/uploads_$DATE.tar.gz uploads/
```

### Restore from Backup
```bash
# List backups
ls -lh /var/www/file-management-system/backups/

# Restore database (replace DATE with actual backup date)
cp backups/files_YYYYMMDD_HHMMSS.db server/files.db

# Restore uploads
tar -xzf backups/uploads_YYYYMMDD_HHMMSS.tar.gz
```

---

## 🎯 Performance Optimization

### Clear PM2 Logs
```bash
pm2 flush
```

### Restart All Services
```bash
pm2 restart all && sudo systemctl restart nginx
```

### Check System Resources
```bash
top -bn1 | head -20
```

---

## 📝 Useful Aliases (Optional - Add to ~/.bashrc)

```bash
# Add these to ~/.bashrc for quick access
echo 'alias fms-logs="pm2 logs file-management-api"' >> ~/.bashrc
echo 'alias fms-status="pm2 status"' >> ~/.bashrc
echo 'alias fms-restart="pm2 restart file-management-api"' >> ~/.bashrc
echo 'alias fms-update="cd /var/www/file-management-system && ./update.sh"' >> ~/.bashrc
echo 'alias fms-health="cd /var/www/file-management-system && ./health-check.sh"' >> ~/.bashrc
echo 'alias fms-backup="cd /var/www/file-management-system && ./backup.sh"' >> ~/.bashrc

# Reload bashrc
source ~/.bashrc
```

**After adding aliases, you can use:**
```bash
fms-status    # Check PM2 status
fms-logs      # View logs
fms-restart   # Restart application
fms-update    # Update application
fms-health    # Run health check
fms-backup    # Run backup
```

---

## 🎉 Complete Setup - All Commands in Order

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install tools
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs

# 4. Install PM2
sudo npm install -g pm2

# 5. Firewall
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw --force enable

# 6. Create app directory
sudo mkdir -p /var/www/file-management-system && sudo chown -R $USER:$USER /var/www/file-management-system && cd /var/www/file-management-system

# 7. Clone repo
git clone https://github.com/BEZAWADAYESUBABU/file-management-system.git .

# 8. Install & build
npm install && npm run build

# 9. Create directories
mkdir -p uploads logs backups && chmod 755 uploads

# 10. Start PM2
pm2 start ecosystem.config.js && pm2 save && pm2 startup systemd

# 11. Setup Nginx (run the long command from above)

# 12. Get SSL
sudo certbot --nginx -d fms.prism-appolice.in

# 13. Setup backup
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/file-management-system/backup.sh") | crontab -

# 14. Make scripts executable
chmod +x backup.sh health-check.sh update.sh

# 15. Health check
./health-check.sh
```

---

**అన్నీ Setup అయిపోయింది! Your application is now live at https://fms.prism-appolice.in** 🎊
