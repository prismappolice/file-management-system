# 🚀 Complete Ubuntu Server Setup Guide (Telugu + English)

## మీరు follow చేయవలసిన Complete Steps

---

## Step 1: GCP లో Ubuntu VM Create చేయండి

### 1.1 GCP Console కి వెళ్ళండి
```
https://console.cloud.google.com
```

### 1.2 VM Instance Create చేయండి

1. **Compute Engine** → **VM Instances** → **CREATE INSTANCE**

2. **Configure చేయండి:**
   ```
   Name: fms-server
   Region: asia-south1 (Mumbai)
   Zone: asia-south1-a
   
   Machine Configuration:
   - Series: E2
   - Machine type: e2-medium (2 vCPU, 4GB memory)
   
   Boot disk:
   - Operating System: Ubuntu
   - Version: Ubuntu 22.04 LTS
   - Size: 20 GB
   - Boot disk type: Balanced persistent disk
   
   Firewall:
   ✅ Allow HTTP traffic
   ✅ Allow HTTPS traffic
   ```

3. **CREATE** button click చేయండి

### 1.3 External IP Note చేసుకోండి
```
VM created అయిన తర్వాత External IP copy చేసుకోండి
Example: 35.200.123.45
```

---

## Step 2: Domain DNS Configure చేయండి

### 2.1 మీ Domain Provider లో (where you bought fms.prism-appolice.in)

```
Type: A Record
Name: fms (or @)
Value: <Your VM External IP>
TTL: 300 (or default)
```

**Note:** DNS propagation కి 5-30 minutes పడుతుంది

---

## Step 3: VM కి Connect అవ్వండి

### Option 1: GCP Console లో SSH
```
VM Instances page లో → SSH button click చేయండి
```

### Option 2: Local Terminal నుండి (if gcloud CLI installed)
```bash
gcloud compute ssh fms-server --zone=asia-south1-a
```

---

## Step 4: Server Setup (Copy & Paste ఈ Commands)

### 4.1 System Update చేయండి
```bash
sudo apt update
sudo apt upgrade -y
```

### 4.2 Essential Tools Install చేయండి
```bash
sudo apt install -y curl wget git build-essential
```

### 4.3 Node.js 20.x Install చేయండి
```bash
# Node.js repository add చేయండి
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js install చేయండి
sudo apt install -y nodejs

# Verify చేయండి
node --version
npm --version
```

**Expected Output:**
```
v20.x.x
10.x.x
```

### 4.4 Nginx Install చేయండి
```bash
sudo apt install -y nginx

# Start చేయండి
sudo systemctl start nginx
sudo systemctl enable nginx

# Status check చేయండి
sudo systemctl status nginx
```

### 4.5 Firewall Configure చేయండి
```bash
# UFW enable చేయండి
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Status check చేయండి
sudo ufw status
```

### 4.6 PM2 Install చేయండి
```bash
sudo npm install -g pm2

# Verify చేయండి
pm2 --version
```

### 4.7 Certbot Install చేయండి (SSL కోసం)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## Step 5: Application Deploy చేయండి

### 5.1 Application Directory Create చేయండి
```bash
# Directory create చేయండి
sudo mkdir -p /var/www/file-management-system

# Ownership మార్చండి
sudo chown -R $USER:$USER /var/www/file-management-system

# Directory కి వెళ్ళండి
cd /var/www/file-management-system
```

### 5.2 GitHub Repository Clone చేయండి
```bash
git clone https://github.com/BEZAWADAYESUBABU/file-management-system.git .
```

**Note:** మీరు private repo అయితే, GitHub Personal Access Token అవసరం:
```bash
# Token తో clone చేయండి
git clone https://<YOUR_TOKEN>@github.com/BEZAWADAYESUBABU/file-management-system.git .
```

### 5.3 Dependencies Install చేయండి
```bash
npm install
```

**ఇది 2-5 minutes పడుతుంది. Wait చేయండి.**

### 5.4 Frontend Build చేయండి
```bash
npm run build
```

**Success అయితే `dist` folder create అవుతుంది.**

### 5.5 Required Directories Create చేయండి
```bash
mkdir -p uploads logs backups
chmod 755 uploads
```

---

## Step 6: PM2 తో Application Start చేయండి

### 6.1 Application Start చేయండి
```bash
pm2 start ecosystem.config.js
```

### 6.2 PM2 Status Check చేయండి
```bash
pm2 status
pm2 logs file-management-api --lines 20
```

**Expected:** Application "online" status లో ఉండాలి

### 6.3 PM2 Auto-start Enable చేయండి
```bash
pm2 save
pm2 startup systemd
```

**Output లో ఒక command ఇస్తుంది. ఆ command copy చేసి run చేయండి.**
Example:
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

## Step 7: Nginx Configure చేయండి

### 7.1 Nginx Config File Create చేయండి
```bash
sudo nano /etc/nginx/sites-available/file-management-system
```

### 7.2 ఈ Configuration Paste చేయండి

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name fms.prism-appolice.in;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name fms.prism-appolice.in;

    # SSL certificates (Certbot will update these paths)
    ssl_certificate /etc/letsencrypt/live/fms.prism-appolice.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fms.prism-appolice.in/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root directory
    root /var/www/file-management-system/dist;
    index index.html;

    # Max upload size
    client_max_body_size 100M;

    # Serve React app
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
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

    # Serve uploads
    location /uploads {
        alias /var/www/file-management-system/uploads;
        expires 30d;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**Save చేయడానికి:** `Ctrl + X`, అప్పుడు `Y`, అప్పుడు `Enter`

### 7.3 Nginx Config Enable చేయండి
```bash
# Symbolic link create చేయండి
sudo ln -s /etc/nginx/sites-available/file-management-system /etc/nginx/sites-enabled/

# Default config disable చేయండి (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
```

**Expected Output:** `syntax is ok` and `test is successful`

### 7.4 Nginx Reload చేయండి
```bash
sudo systemctl reload nginx
```

---

## Step 8: SSL Certificate Get చేయండి

### 8.1 Certbot Run చేయండి
```bash
sudo certbot --nginx -d fms.prism-appolice.in
```

### 8.2 Prompts కి Answer ఇవ్వండి:
```
Email: <your-email@example.com>
Terms: Y (Yes)
Share email: N (No) - optional
```

**Success అయితే:** "Successfully deployed certificate" message వస్తుంది

### 8.3 Auto-renewal Test చేయండి
```bash
sudo certbot renew --dry-run
```

---

## Step 9: Backup Setup చేయండి

### 9.1 Backup Script Executable చేయండి
```bash
cd /var/www/file-management-system
chmod +x backup.sh health-check.sh update.sh
```

### 9.2 Cron Job Add చేయండి (Daily Backup)
```bash
crontab -e
```

**Select editor:** `1` (nano) choose చేయండి

**Add this line at the end:**
```
0 2 * * * /var/www/file-management-system/backup.sh
```

**Save:** `Ctrl + X`, `Y`, `Enter`

### 9.3 Test Backup
```bash
./backup.sh
```

---

## Step 10: Final Verification

### 10.1 All Services Check చేయండి
```bash
# PM2 check
pm2 status

# Nginx check
sudo systemctl status nginx

# API health check
curl http://localhost:3000/api/health

# Public URL check
curl https://fms.prism-appolice.in/api/health
```

### 10.2 Health Check Script Run చేయండి
```bash
cd /var/www/file-management-system
./health-check.sh
```

### 10.3 Browser లో Test చేయండి
```
https://fms.prism-appolice.in
```

**Expected:**
- ✅ Login page కనిపించాలి
- ✅ Green padlock (SSL) ఉండాలి
- ✅ HTTP automatically HTTPS కి redirect అవ్వాలి

---

## 🎉 Deployment Complete!

### Test చేయండి:

1. **Login:**
   - Username: `district`
   - Password: `district123`

2. **Upload a File**
3. **Download the File**
4. **Search for File**
5. **Delete File** (district user only)

---

## 🔧 Useful Commands (Future Reference)

### Application Management
```bash
# Restart application
pm2 restart file-management-api

# View logs
pm2 logs file-management-api

# Monitor
pm2 monit

# Stop application
pm2 stop file-management-api
```

### Update Application
```bash
cd /var/www/file-management-system
./update.sh
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### System Health
```bash
# Disk space
df -h

# Memory
free -h

# Running processes
pm2 list
```

---

## 🐛 Troubleshooting

### Problem: Application not accessible

**Solution:**
```bash
# Check if backend is running
pm2 status

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000

# Restart
pm2 restart file-management-api

# Check logs
pm2 logs file-management-api --lines 50
```

### Problem: SSL not working

**Solution:**
```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew

# Reload nginx
sudo systemctl reload nginx
```

### Problem: File upload not working

**Solution:**
```bash
# Check permissions
ls -la /var/www/file-management-system/uploads

# Fix permissions
chmod 755 /var/www/file-management-system/uploads

# Restart application
pm2 restart file-management-api
```

---

## 📞 Need Help?

1. Check logs: `pm2 logs file-management-api`
2. Check health: `./health-check.sh`
3. Review: `DEPLOYMENT_GUIDE.md`

---

**మీ Application ఇప్పుడు Live!** 🎊

URL: https://fms.prism-appolice.in

---

**Note:** ఈ commands అన్నీ copy-paste చేయవచ్చు. ఒక్కో step complete అయిన తర్వాత next step కి వెళ్ళండి.
