# EC2 Build and Redeploy Guide

## 🚀 Quick Redeploy (Most Common Use Case)

When you've made changes and want to redeploy to EC2:

### 1. Push Your Changes to GitHub

```bash
# On your local machine (current directory)
git add .
git commit -m "Your commit message"
git push origin production
```

### 2. SSH into EC2 and Deploy

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Navigate to project directory and deploy
cd ~/genvedha-website
./deploy.sh
```

**That's it!** The [`deploy.sh`](deploy.sh:1) script automatically:
- ✅ Pulls latest code from GitHub (production branch)
- ✅ Backs up and restores your `.env` file
- ✅ Installs/updates dependencies
- ✅ Builds the application with webpack
- ✅ Restarts the app with PM2

---

## 📋 Detailed Build & Deploy Process

### Understanding the Build Process

Your application uses **webpack** to bundle React components. The build process:

1. **Compiles JSX** → JavaScript
2. **Bundles** all React components and dependencies
3. **Outputs** to `public/bundle.js`
4. **Minifies** for production

### Build Commands

```bash
# Development build (with watch mode)
npm run build:dev

# Production build (optimized & minified)
npm run build

# Development server (local testing)
npm run dev:client
```

---

## 🔄 Complete Redeploy Workflow

### Option 1: Automated Deploy (Recommended)

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Run deployment script
cd ~/genvedha-website
./deploy.sh
```

### Option 2: Quick Deploy (Faster, No Prompts)

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Run quick deployment
cd ~/genvedha-website
./quick-deploy.sh
```

### Option 3: Manual Deploy (Step by Step)

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Navigate to project
cd ~/genvedha-website

# Pull latest code
git pull origin production

# Install dependencies (including devDependencies for webpack)
npm ci --include=dev

# Build the application
npm run build

# Restart with PM2
pm2 restart genvedha-website

# Check status
pm2 status
pm2 logs genvedha-website --lines 50
```

---

## 🛠️ Build Troubleshooting

### Build Fails with "webpack not found"

```bash
# Install devDependencies
npm install --include=dev

# Or reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Fails with Memory Error

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

### Build Succeeds but App Doesn't Work

```bash
# Check if bundle.js was created
ls -lh public/bundle.js

# Check PM2 logs for errors
pm2 logs genvedha-website --lines 100

# Restart the application
pm2 restart genvedha-website
```

### Port 3000 Already in Use

```bash
# Find process using port 3000
sudo netstat -tlnp | grep 3000

# Kill the process (replace PID)
kill -9 <PID>

# Or restart PM2
pm2 restart genvedha-website
```

---

## 📊 Monitoring After Deploy

### Check Application Status

```bash
# View PM2 status
pm2 status

# View real-time logs
pm2 logs genvedha-website

# Monitor CPU/Memory
pm2 monit

# View last 100 log lines
pm2 logs genvedha-website --lines 100
```

### Check Build Output

```bash
# Verify bundle.js exists and size
ls -lh public/bundle.js

# Check when it was last built
stat public/bundle.js
```

### Test the Application

```bash
# Test local endpoint
curl http://localhost:3000

# Test from outside (if HTTPS is setup)
curl https://your-domain.com
```

---

## 🔧 Common Deployment Scenarios

### Scenario 1: Code Changes Only

```bash
# Local machine
git add .
git commit -m "Updated component"
git push origin production

# EC2
cd ~/genvedha-website
./quick-deploy.sh
```

### Scenario 2: Dependency Changes (package.json)

```bash
# Local machine
git add package.json package-lock.json
git commit -m "Updated dependencies"
git push origin production

# EC2
cd ~/genvedha-website
./deploy.sh  # Use full deploy to ensure clean install
```

### Scenario 3: Environment Variable Changes

```bash
# EC2 only (don't commit .env to git!)
cd ~/genvedha-website
nano .env  # Edit your variables

# Restart application
pm2 restart genvedha-website
```

### Scenario 4: Server Configuration Changes (server.js)

```bash
# Local machine
git add server.js
git commit -m "Updated server config"
git push origin production

# EC2
cd ~/genvedha-website
./deploy.sh
```

### Scenario 5: Static Files (CSS, HTML)

```bash
# Local machine
git add public/
git commit -m "Updated styles"
git push origin production

# EC2
cd ~/genvedha-website
git pull origin production
pm2 restart genvedha-website  # No build needed for static files
```

---

## 🚨 Emergency Rollback

If deployment breaks your site:

```bash
# SSH into EC2
cd ~/genvedha-website

# View recent commits
git log --oneline -10

# Rollback to previous commit
git reset --hard <previous-commit-hash>

# Rebuild and restart
npm run build
pm2 restart genvedha-website

# Verify
pm2 logs genvedha-website
```

---

## 📦 Build Artifacts

After a successful build, you should have:

```
public/
├── bundle.js           # Main application bundle (React app)
├── bundle.js.map       # Source map (for debugging)
├── index.html          # Main HTML file
├── styles.css          # Global styles
└── ...other static files
```

---

## ⚡ Performance Tips

### 1. Use Quick Deploy for Faster Updates

```bash
./quick-deploy.sh  # Faster than deploy.sh
```

### 2. Skip Build for Static-Only Changes

```bash
git pull origin production
pm2 restart genvedha-website
# Skip npm run build if only CSS/HTML changed
```

### 3. Use PM2 Cluster Mode (for high traffic)

```bash
pm2 delete genvedha-website
pm2 start server.js --name genvedha-website -i max
pm2 save
```

### 4. Enable Production Mode

Ensure your `.env` has:
```env
NODE_ENV=production
```

---

## 🔐 Security Checklist Before Deploy

- [ ] `.env` file is not committed to git
- [ ] `NODE_ENV=production` in `.env`
- [ ] SMTP credentials are correct
- [ ] AWS Security Group allows ports 80, 443
- [ ] SSL certificate is valid (if using HTTPS)
- [ ] No sensitive data in client-side code

---

## 📞 Quick Command Reference

| Task | Command |
|------|---------|
| **Deploy latest code** | `./deploy.sh` |
| **Quick deploy** | `./quick-deploy.sh` |
| **Build locally** | `npm run build` |
| **View logs** | `pm2 logs genvedha-website` |
| **Restart app** | `pm2 restart genvedha-website` |
| **Check status** | `pm2 status` |
| **Monitor resources** | `pm2 monit` |
| **Pull latest code** | `git pull origin production` |
| **Check commit** | `git log -1 --oneline` |
| **Test endpoint** | `curl http://localhost:3000` |

---

## 🎯 Deployment Checklist

Before deploying:
- [ ] Code tested locally (`npm run dev:client`)
- [ ] Changes committed to git
- [ ] Pushed to production branch
- [ ] SSH access to EC2 working
- [ ] `.env` file configured on EC2

After deploying:
- [ ] Check PM2 status (`pm2 status`)
- [ ] Review logs (`pm2 logs genvedha-website`)
- [ ] Test website in browser
- [ ] Verify all pages load correctly
- [ ] Check contact form works (if changed)

---

## 📚 Related Documentation

- **Full Deployment Guide**: [`DEPLOYMENT.md`](DEPLOYMENT.md:1)
- **Quick Start**: [`README-DEPLOYMENT.md`](README-DEPLOYMENT.md:1)
- **Deployment Script**: [`deploy.sh`](deploy.sh:1)
- **Quick Deploy Script**: [`quick-deploy.sh`](quick-deploy.sh:1)
- **HTTPS Setup**: [`setup-https.sh`](setup-https.sh:1)

---

## 💡 Pro Tips

1. **Always test locally first**: Run `npm run dev:client` before deploying
2. **Use meaningful commit messages**: Helps track what changed
3. **Monitor logs after deploy**: Watch for errors with `pm2 logs`
4. **Keep .env backed up**: Store securely outside the server
5. **Regular updates**: Run `sudo yum update -y` monthly
6. **Check disk space**: Run `df -h` before large deployments

---

## 🆘 Need Help?

**Application not starting?**
```bash
pm2 logs genvedha-website --lines 100
pm2 restart genvedha-website
```

**Build failing?**
```bash
npm install --include=dev
npm run build
```

**Website not accessible?**
```bash
sudo systemctl status nginx
pm2 status
```

**Still stuck?**
- Check logs: `pm2 logs genvedha-website`
- Review Nginx logs: `sudo tail -f /var/log/nginx/genvedha_error.log`
- Verify DNS: `nslookup your-domain.com`

---

**Repository**: https://github.com/yogmca/genvedha  
**Branch**: production  
**Contact**: admin@genvedha.com
