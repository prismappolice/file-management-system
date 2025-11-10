# Quick Deployment Reference

## 🚀 Quick Start Commands

### On Ubuntu VM (fms.prism-appolice.in)

```bash
# 1. Run the automated setup script
wget https://raw.githubusercontent.com/BEZAWADAYESUBABU/file-management-system/main/deploy.sh
chmod +x deploy.sh
./deploy.sh

# 2. Clone and setup application
cd /var/www/file-management-system
git clone https://github.com/BEZAWADAYESUBABU/file-management-system.git .
npm install
npm run build

# 3. Create necessary directories
mkdir -p uploads logs

# 4. Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd
# Run the command that PM2 outputs

# 5. Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/file-management-system
sudo ln -s /etc/nginx/sites-available/file-management-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. Get SSL certificate
sudo certbot --nginx -d fms.prism-appolice.in

# 7. Setup backup cron job
chmod +x backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/file-management-system/backup.sh") | crontab -
```

## 📋 Essential Commands

### Application Management
```bash
pm2 status                          # Check status
pm2 restart file-management-api     # Restart app
pm2 logs file-management-api        # View logs
pm2 monit                          # Monitor resources
```

### Nginx Management
```bash
sudo nginx -t                       # Test configuration
sudo systemctl reload nginx         # Reload Nginx
sudo systemctl status nginx         # Check status
```

### View Logs
```bash
pm2 logs --lines 100               # PM2 logs
sudo tail -f /var/log/nginx/error.log   # Nginx errors
sudo tail -f /var/log/nginx/access.log  # Nginx access
```

### Update Application
```bash
cd /var/www/file-management-system
git pull origin main
npm install
npm run build
pm2 restart file-management-api
```

## 🔍 Troubleshooting

### Check if services are running
```bash
pm2 status
sudo systemctl status nginx
sudo netstat -tlnp | grep 3000
```

### Check SSL certificate
```bash
sudo certbot certificates
```

### Test API
```bash
curl http://localhost:3000/api/health
curl https://fms.prism-appolice.in/api/health
```

## 📁 Important Paths

- **Application**: `/var/www/file-management-system`
- **Database**: `/var/www/file-management-system/server/files.db`
- **Uploads**: `/var/www/file-management-system/uploads`
- **Logs**: `/var/www/file-management-system/logs`
- **Backups**: `/var/www/file-management-system/backups`
- **Nginx Config**: `/etc/nginx/sites-available/file-management-system`

## 🔐 Security Checklist

- [ ] SSL certificate installed
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] SSH key-based authentication
- [ ] Regular backups configured
- [ ] PM2 auto-restart enabled
- [ ] Nginx security headers configured

## 🌐 Access Points

- **Website**: https://fms.prism-appolice.in
- **API Health**: https://fms.prism-appolice.in/api/health
- **Backend Port**: 3000 (localhost only)
- **Frontend Port**: 443 (HTTPS)

## 📞 Support

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
