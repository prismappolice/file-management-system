# 📋 Deployment Checklist for fms.prism-appolice.in

Use this checklist to ensure all deployment steps are completed correctly.

## Pre-Deployment

- [ ] GCP Ubuntu VM created and accessible
- [ ] Domain `fms.prism-appolice.in` DNS configured to point to VM IP
- [ ] SSH access configured
- [ ] Repository pushed to GitHub

## Initial Server Setup

- [ ] Connected to VM via SSH
- [ ] System packages updated (`apt update && apt upgrade`)
- [ ] Essential tools installed (curl, wget, git, build-essential)
- [ ] Node.js 20.x LTS installed
- [ ] Nginx installed and running
- [ ] Firewall configured (UFW)
- [ ] PM2 installed globally

## SSL Certificate

- [ ] Certbot installed
- [ ] SSL certificate obtained for `fms.prism-appolice.in`
- [ ] HTTPS redirect configured
- [ ] Auto-renewal verified

## Application Deployment

- [ ] Application directory created (`/var/www/file-management-system`)
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Frontend built (`npm run build`)
- [ ] Directories created (uploads, logs)
- [ ] PM2 ecosystem config in place
- [ ] Application started with PM2
- [ ] PM2 configured for auto-start on boot

## Nginx Configuration

- [ ] Nginx config file created
- [ ] Symbolic link created in sites-enabled
- [ ] Default site disabled (optional)
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Nginx reloaded/restarted

## Security

- [ ] SSL/HTTPS enabled
- [ ] Security headers configured
- [ ] Firewall rules set (only 22, 80, 443 open)
- [ ] SSH hardened (disable root login, use SSH keys)
- [ ] File upload size limits configured
- [ ] Proper file permissions set

## Backups

- [ ] Backup script (`backup.sh`) executable
- [ ] Backup cron job configured (daily at 2 AM)
- [ ] Test backup manually
- [ ] Verify backup files created

## Testing

- [ ] API health check responds: `curl http://localhost:3000/api/health`
- [ ] Website accessible: `https://fms.prism-appolice.in`
- [ ] HTTP redirects to HTTPS
- [ ] File upload works
- [ ] File download works
- [ ] All features tested

## Monitoring

- [ ] PM2 logs accessible
- [ ] Nginx logs accessible
- [ ] Health check script works (`./health-check.sh`)
- [ ] PM2 web interface accessible (optional)

## Documentation

- [ ] All deployment scripts in repository
- [ ] `.env.example` file created
- [ ] `.gitignore` properly configured
- [ ] README updated with deployment info

## Post-Deployment

- [ ] Verify application is accessible publicly
- [ ] Test all CRUD operations
- [ ] Monitor logs for errors
- [ ] Set up monitoring/alerting (optional)
- [ ] Document any custom configurations

## Maintenance Setup

- [ ] Backup cron job running
- [ ] Log rotation configured
- [ ] Update script tested (`./update.sh`)
- [ ] Health check script tested
- [ ] PM2 startup configured

## Final Verification

```bash
# Run these commands to verify everything

# 1. Check PM2 status
pm2 status

# 2. Check Nginx status
sudo systemctl status nginx

# 3. Run health check
./health-check.sh

# 4. Test API
curl http://localhost:3000/api/health
curl https://fms.prism-appolice.in/api/health

# 5. Check SSL
curl -I https://fms.prism-appolice.in

# 6. View recent logs
pm2 logs file-management-api --lines 20
```

## Emergency Contacts

- **Repository**: https://github.com/BEZAWADAYESUBABU/file-management-system
- **Domain**: fms.prism-appolice.in
- **Server Location**: GCP Ubuntu VM

## Rollback Plan

If something goes wrong:

1. Check logs: `pm2 logs file-management-api`
2. Restart application: `pm2 restart file-management-api`
3. Restore from backup: `cp backups/files_YYYYMMDD_HHMMSS.db server/files.db`
4. Check Nginx: `sudo nginx -t && sudo systemctl reload nginx`
5. Review deployment guide

## Success Criteria

✅ Application accessible at https://fms.prism-appolice.in  
✅ SSL certificate valid and auto-renewing  
✅ All features working (upload, download, search, delete)  
✅ PM2 running and monitoring application  
✅ Backups running daily  
✅ No errors in logs  

---

**Deployment Date**: ___________________  
**Deployed By**: ___________________  
**Version**: ___________________  
**Notes**: ___________________

