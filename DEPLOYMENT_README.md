# 🚀 Deployment Files for File Management System

This directory contains all the necessary files and scripts for deploying the File Management System to your GCP Ubuntu VM at **fms.prism-appolice.in**.

## 📁 Deployment Files Overview

| File | Purpose |
|------|---------|
| `DEPLOYMENT_GUIDE.md` | Complete step-by-step deployment guide |
| `DEPLOY_QUICK_REF.md` | Quick reference for common commands |
| `deploy.sh` | Automated setup script for initial server configuration |
| `ecosystem.config.js` | PM2 process manager configuration |
| `nginx.conf` | Nginx reverse proxy configuration template |
| `backup.sh` | Automated backup script for database and uploads |
| `health-check.sh` | System health check script |
| `.env.example` | Environment variables template |

## 🎯 Quick Deployment Steps

### 1️⃣ On Your GCP Ubuntu VM

```bash
# Connect to your VM
gcloud compute ssh your-vm-name --zone=your-zone

# Run the automated deployment script
wget https://raw.githubusercontent.com/BEZAWADAYESUBABU/file-management-system/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 2️⃣ Clone and Setup Application

```bash
cd /var/www/file-management-system
git clone https://github.com/BEZAWADAYESUBABU/file-management-system.git .
npm install
npm run build
mkdir -p uploads logs
```

### 3️⃣ Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd
```

### 4️⃣ Configure Nginx

```bash
sudo cp nginx.conf /etc/nginx/sites-available/file-management-system
sudo ln -s /etc/nginx/sites-available/file-management-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5️⃣ Get SSL Certificate

```bash
sudo certbot --nginx -d fms.prism-appolice.in
```

### 6️⃣ Setup Automated Backups

```bash
chmod +x backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/file-management-system/backup.sh") | crontab -
```

## 📚 Documentation

- **Full Guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions
- **Quick Reference**: See [DEPLOY_QUICK_REF.md](./DEPLOY_QUICK_REF.md) for common commands

## 🔧 Essential Commands

### Application Management
```bash
pm2 status                          # Check application status
pm2 restart file-management-api     # Restart the application
pm2 logs file-management-api        # View application logs
```

### Update Application
```bash
cd /var/www/file-management-system
git pull origin main
npm install
npm run build
pm2 restart file-management-api
```

### Health Check
```bash
./health-check.sh                   # Run system health check
```

### Manual Backup
```bash
./backup.sh                         # Run backup manually
```

## 🌐 Access Your Application

After deployment, your application will be available at:
- **Production URL**: https://fms.prism-appolice.in
- **API Health**: https://fms.prism-appolice.in/api/health

## 🔐 Security Features

✅ SSL/TLS encryption via Let's Encrypt  
✅ Nginx reverse proxy  
✅ Security headers configured  
✅ Firewall rules (UFW)  
✅ Automated backups  
✅ PM2 process monitoring  

## 📊 Monitoring

### View Logs
```bash
# Application logs
pm2 logs file-management-api

# Nginx logs
sudo tail -f /var/log/nginx/file-management-error.log
sudo tail -f /var/log/nginx/file-management-access.log
```

### Check Resources
```bash
pm2 monit                           # Real-time monitoring
df -h                               # Disk space
free -h                             # Memory usage
```

## 🐛 Troubleshooting

If you encounter issues:

1. **Check service status**: `./health-check.sh`
2. **Review logs**: `pm2 logs file-management-api`
3. **Verify Nginx**: `sudo nginx -t`
4. **Test API**: `curl http://localhost:3000/api/health`

For detailed troubleshooting, see the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## 📝 Important Paths

- **Application**: `/var/www/file-management-system`
- **Database**: `/var/www/file-management-system/server/files.db`
- **Uploads**: `/var/www/file-management-system/uploads`
- **Backups**: `/var/www/file-management-system/backups`
- **Logs**: `/var/www/file-management-system/logs`

## 🎉 That's It!

Your File Management System should now be live and accessible at **https://fms.prism-appolice.in**

For questions or issues, refer to the detailed [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

---

**Last Updated**: November 4, 2025  
**Repository**: https://github.com/BEZAWADAYESUBABU/file-management-system
