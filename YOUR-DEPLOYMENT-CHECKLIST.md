# Your Genvedha Website Deployment Checklist

**Your EC2 Elastic IP**: `3.11.178.44`

---

## 🚀 Quick Deployment Commands

### SSH into Your EC2
```bash
ssh -i your-key.pem ec2-user@3.11.178.44
```

### Deploy Latest Changes
```bash
cd ~/genvedha-website
./deploy.sh
```

### Quick Deploy (Faster)
```bash
cd ~/genvedha-website
./quick-deploy.sh
```

---

## 🌐 GoDaddy DNS Configuration

### For Your Domain (e.g., genvedha.com)

Login to GoDaddy → My Products → Your Domain → DNS

**Add/Edit these records:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `3.11.178.44` | 600 |
| CNAME | www | @ | 600 |

**Steps:**
1. Find the **A record** with name **@**
2. Click **Edit** (pencil icon)
3. Change **Value** to: `3.11.178.44`
4. Set **TTL** to: `600`
5. Click **Save**

6. Add **CNAME record** for www:
   - Click **Add**
   - Type: `CNAME`
   - Name: `www`
   - Value: `@`
   - TTL: `600`
   - Click **Save**

---

## ⏱️ After DNS Configuration

### 1. Wait for DNS Propagation (10-30 minutes)

Check if DNS is working:
```bash
# From your local machine
nslookup genvedha.com

# Should return: 3.11.178.44
```

Or check online:
- [https://www.whatsmydns.net](https://www.whatsmydns.net)
- Enter your domain name
- Should show `3.11.178.44` globally

### 2. Setup HTTPS

Once DNS is propagated:
```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@3.11.178.44

# Navigate to project
cd ~/genvedha-website

# Run HTTPS setup
sudo ./setup-https.sh
```

You'll be prompted for:
- **Domain name**: Enter your domain (e.g., `genvedha.com`)
- **Email**: Enter your email (e.g., `admin@genvedha.com`)

---

## 📊 Monitoring Commands

### Check Application Status
```bash
pm2 status
pm2 logs genvedha-website
pm2 monit
```

### Check Nginx Status (after HTTPS setup)
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Check SSL Certificate
```bash
sudo certbot certificates
```

### View Application Logs
```bash
pm2 logs genvedha-website --lines 100
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/genvedha_access.log
sudo tail -f /var/log/nginx/genvedha_error.log
```

---

## 🔄 Regular Deployment Workflow

### When You Make Code Changes

**1. On Your Local Machine:**
```bash
# Make your changes
# Test locally: npm run dev:client

# Commit and push
git add .
git commit -m "Your commit message"
git push origin production
```

**2. On EC2:**
```bash
# SSH into server
ssh -i your-key.pem ec2-user@3.11.178.44

# Deploy
cd ~/genvedha-website
./deploy.sh

# Check status
pm2 status
pm2 logs genvedha-website --lines 50
```

**3. Verify in Browser:**
- Visit your website
- Check all pages load correctly
- Test any changed functionality

---

## 🛠️ Common Tasks

### Restart Application
```bash
pm2 restart genvedha-website
```

### View Real-time Logs
```bash
pm2 logs genvedha-website
```

### Check Build Output
```bash
ls -lh public/bundle.js
```

### Update Environment Variables
```bash
nano .env
# Make changes
pm2 restart genvedha-website
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### Renew SSL Certificate
```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] **SSH Access**: `ssh -i key.pem ec2-user@3.11.178.44` works
- [ ] **Application Running**: `pm2 status` shows "online"
- [ ] **No Errors**: `pm2 logs genvedha-website` shows no errors
- [ ] **DNS Resolves**: `nslookup your-domain.com` returns `3.11.178.44`
- [ ] **HTTP Works**: `http://your-domain.com` loads
- [ ] **HTTPS Works**: `https://your-domain.com` loads with valid certificate
- [ ] **WWW Works**: `https://www.your-domain.com` works
- [ ] **All Pages Load**: Test all pages on your website
- [ ] **Contact Form**: Test if contact form works (if applicable)

---

## 🚨 Troubleshooting

### Application Not Starting
```bash
# Check logs
pm2 logs genvedha-website --lines 100

# Restart
pm2 restart genvedha-website

# If still failing, rebuild
cd ~/genvedha-website
npm run build
pm2 restart genvedha-website
```

### DNS Not Resolving
```bash
# Check DNS
nslookup your-domain.com

# Should return: 3.11.178.44
# If not, wait longer or check GoDaddy DNS settings
```

### SSL Certificate Fails
```bash
# Ensure DNS is propagated first
nslookup your-domain.com

# Check ports are open in AWS Security Group:
# - Port 80 (HTTP)
# - Port 443 (HTTPS)

# Try manual certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Website Not Loading
```bash
# Check application
pm2 status

# Check Nginx (if HTTPS is setup)
sudo systemctl status nginx

# Check AWS Security Group allows ports 80, 443
```

### Port 3000 Already in Use
```bash
# Find process
sudo netstat -tlnp | grep 3000

# Restart PM2
pm2 restart genvedha-website
```

---

## 📱 Quick Access URLs

After setup, your website will be accessible at:

- **HTTP**: `http://your-domain.com` (redirects to HTTPS)
- **HTTPS**: `https://your-domain.com` ✅
- **WWW**: `https://www.your-domain.com` ✅
- **Direct IP**: `http://3.11.178.44:3000` (before HTTPS setup)

---

## 🔐 Security Reminders

- [ ] Never commit `.env` file to git
- [ ] Keep `NODE_ENV=production` in `.env`
- [ ] Regularly update system: `sudo yum update -y`
- [ ] Monitor logs for suspicious activity
- [ ] Keep SSH key secure
- [ ] SSL certificate auto-renews (check monthly)

---

## 📞 Quick Command Reference

| Task | Command |
|------|---------|
| **SSH to EC2** | `ssh -i key.pem ec2-user@3.11.178.44` |
| **Deploy** | `./deploy.sh` |
| **Quick Deploy** | `./quick-deploy.sh` |
| **Check Status** | `pm2 status` |
| **View Logs** | `pm2 logs genvedha-website` |
| **Restart App** | `pm2 restart genvedha-website` |
| **Check DNS** | `nslookup your-domain.com` |
| **Test SSL** | `sudo certbot certificates` |
| **Restart Nginx** | `sudo systemctl restart nginx` |

---

## 📂 Important Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (SMTP, etc.) |
| `deploy.sh` | Main deployment script |
| `quick-deploy.sh` | Fast deployment script |
| `setup-https.sh` | HTTPS/SSL setup script |
| `server.js` | Node.js server |
| `public/bundle.js` | Built React application |

---

## 🎯 First-Time Setup Checklist

If you haven't deployed yet:

1. [ ] **Allocate Elastic IP**: `3.11.178.44` ✅ (Done!)
2. [ ] **Associate with EC2**: Attach IP to your instance
3. [ ] **Configure GoDaddy DNS**: Point domain to `3.11.178.44`
4. [ ] **Wait for DNS**: 10-30 minutes
5. [ ] **SSH into EC2**: `ssh -i key.pem ec2-user@3.11.178.44`
6. [ ] **Clone Repository**: `git clone https://github.com/yogmca/genvedha.git ~/genvedha-website`
7. [ ] **Configure .env**: `cd ~/genvedha-website && cp .env.example .env && nano .env`
8. [ ] **Deploy**: `./deploy.sh`
9. [ ] **Setup HTTPS**: `sudo ./setup-https.sh`
10. [ ] **Verify**: Visit `https://your-domain.com`

---

## 📚 Detailed Documentation

For more information, see:

- **EC2 Deployment**: [`EC2-REDEPLOY-GUIDE.md`](EC2-REDEPLOY-GUIDE.md:1)
- **GoDaddy Setup**: [`GODADDY-DOMAIN-SETUP.md`](GODADDY-DOMAIN-SETUP.md:1)
- **Elastic IP Guide**: [`AWS-ELASTIC-IP-GUIDE.md`](AWS-ELASTIC-IP-GUIDE.md:1)
- **Full Deployment**: [`DEPLOYMENT.md`](DEPLOYMENT.md:1)

---

## 💡 Pro Tips

1. **Bookmark this page** for quick reference
2. **Save your SSH command** in a text file
3. **Test locally first**: Always run `npm run dev:client` before deploying
4. **Use meaningful commits**: Helps track what changed
5. **Monitor after deploy**: Watch logs for 5 minutes after deployment
6. **Keep .env backed up**: Store securely outside the server
7. **Regular updates**: Run `sudo yum update -y` monthly

---

## 🆘 Emergency Contacts

**Application Issues:**
- Check logs: `pm2 logs genvedha-website`
- Restart: `pm2 restart genvedha-website`

**Server Issues:**
- Check Nginx: `sudo systemctl status nginx`
- Check disk space: `df -h`

**DNS Issues:**
- Verify in GoDaddy DNS settings
- Check propagation: [whatsmydns.net](https://www.whatsmydns.net)

**SSL Issues:**
- Check certificate: `sudo certbot certificates`
- Renew: `sudo certbot renew`

---

**Your EC2 IP**: `3.11.178.44`  
**Repository**: https://github.com/yogmca/genvedha  
**Branch**: production  

**Last Updated**: 2026-04-28
