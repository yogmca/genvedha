# 🔧 Fix Deployment Issues Guide

## 🚨 Issues Found

Based on the test results, your deployment has **4 critical issues**:

1. ❌ **MongoDB Connection Error** - `querySrv ENOTFOUND _mongodb._tcp.undefined`
2. ❌ **Port Conflict** - `EADDRINUSE: address already in use :::3000`
3. ❌ **Application Errors** - 15 errors found in logs
4. ❌ **PM2 Startup Not Configured** - App won't restart on reboot

---

## 🚀 Quick Fix (Automated)

### Run the Fix Script

```bash
bash fix-deployment-issues.sh
```

This script will automatically:
- ✅ Fix MongoDB connection configuration
- ✅ Resolve port 3000 conflicts
- ✅ Restart the application cleanly
- ✅ Configure PM2 startup (with your help)

---

## 🔍 Manual Fix (Step-by-Step)

If you prefer to fix issues manually:

### Issue 1: Fix MongoDB Connection

**Problem:** MongoDB URI is set to `undefined` in your `.env` file

**Solution:**
```bash
# Edit .env file
nano .env

# Find this line:
MONGODB_URI=undefined

# Replace with your actual MongoDB connection string:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Save and exit (Ctrl+X, then Y, then Enter)
```

**Get your MongoDB URI:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<database>` with your database name

---

### Issue 2: Fix Port 3000 Conflict

**Problem:** Another process is already using port 3000

**Solution:**
```bash
# Stop all PM2 processes
pm2 stop all
pm2 delete all

# Find and kill any process using port 3000
sudo lsof -ti:3000 | xargs kill -9

# Verify port is free
sudo netstat -tuln | grep 3000
# (Should return nothing)
```

---

### Issue 3: Restart Application Properly

**Problem:** Application has errors and needs clean restart

**Solution:**
```bash
# Make sure you're in the project directory
cd ~/genvedha-website

# Start fresh with PM2
pm2 start server.js --name genvedha

# Wait a few seconds
sleep 5

# Check status
pm2 status

# Check logs for errors
pm2 logs genvedha --lines 50
```

**Expected output:**
```
┌────┬─────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id │ name        │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │
├────┼─────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 0  │ genvedha    │ default     │ 1.0.0   │ fork    │ XXXXX    │ Xs     │ 0    │ online    │
└────┴─────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

Status should be **`online`** ✅

---

### Issue 4: Configure PM2 Startup

**Problem:** PM2 won't restart your app if the server reboots

**Solution:**
```bash
# Generate startup script
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Copy and run that command with sudo
# Example:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Save PM2 configuration
pm2 save
```

**Verify:**
```bash
# Reboot test (optional)
sudo reboot

# After reboot, SSH back in and check:
pm2 status
# Your app should be running automatically
```

---

## ✅ Verify All Fixes

After applying fixes, run the test again:

```bash
bash test-ec2-deployment.sh
```

**Expected results:**
- ✅ MongoDB connection successful
- ✅ Port 3000 listening
- ✅ No port conflicts
- ✅ PM2 startup configured
- ✅ Application online
- ✅ No errors in logs

---

## 🔍 Detailed Issue Analysis

### MongoDB Connection Error Explained

**Error message:**
```
querySrv ENOTFOUND _mongodb._tcp.undefined
```

**What it means:**
- Your `.env` file has `MONGODB_URI=undefined`
- The app is trying to connect to a MongoDB server at "undefined"
- This is not a valid MongoDB connection string

**Why it happened:**
- The `.env` file was created from `.env.example`
- The placeholder value wasn't replaced with actual credentials

**How to prevent:**
- Always replace placeholder values in `.env`
- Never commit real credentials to Git
- Use environment-specific configuration

---

### Port Conflict Error Explained

**Error message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**What it means:**
- Port 3000 is already occupied by another process
- Your app can't start because the port is taken

**Why it happened:**
- Previous instance of the app didn't stop properly
- Multiple PM2 processes were started
- Manual `node server.js` was run alongside PM2

**How to prevent:**
- Always use PM2 to manage your app
- Use `pm2 restart` instead of starting new processes
- Check `pm2 status` before starting new instances

---

### PM2 Startup Not Configured

**What it means:**
- PM2 won't automatically start your app after server reboot
- If EC2 instance restarts, your app will be down

**Why it's important:**
- AWS can restart instances for maintenance
- Server updates require reboots
- Unexpected crashes need automatic recovery

**How to fix:**
- Run `pm2 startup` and follow instructions
- Run `pm2 save` after starting your app
- Test with `sudo reboot` to verify

---

## 🧪 Testing After Fixes

### Quick Test Commands

```bash
# 1. Check PM2 status
pm2 status
# Should show: status = online

# 2. Check MongoDB connection
pm2 logs genvedha --lines 20 | grep -i mongo
# Should show: "Connected to MongoDB successfully"

# 3. Check port 3000
curl -I http://localhost:3000
# Should return: HTTP/1.1 200 OK

# 4. Check for errors
pm2 logs genvedha --err --lines 20
# Should show: no recent errors

# 5. Check public access
curl -I http://$(curl -s http://checkip.amazonaws.com)
# Should return: HTTP/1.1 200 OK
```

### Full Test

```bash
bash test-ec2-deployment.sh
```

---

## 📊 Success Criteria

Your deployment is fixed when:

- ✅ Test shows **15+ passed** (out of 19-20 tests)
- ✅ PM2 status shows **"online"**
- ✅ Logs show **"Connected to MongoDB successfully"**
- ✅ No **"EADDRINUSE"** errors
- ✅ No **"ENOTFOUND"** errors
- ✅ Application accessible via **public IP**
- ✅ PM2 startup is **configured**

---

## 🆘 Still Having Issues?

### Check Logs in Detail

```bash
# View all logs
pm2 logs genvedha

# View only errors
pm2 logs genvedha --err

# View last 100 lines
pm2 logs genvedha --lines 100 --nostream
```

### Check Environment Variables

```bash
# View .env file (hide sensitive data)
cat .env | grep -v "PASSWORD\|SECRET\|KEY"

# Verify MongoDB URI format
cat .env | grep MONGODB_URI
```

### Check Network

```bash
# Check if ports are open
sudo netstat -tuln | grep -E ':(80|443|3000)'

# Check Nginx
sudo systemctl status nginx

# Check firewall
sudo ufw status
```

### Restart Everything

```bash
# Nuclear option - restart everything
pm2 stop all
pm2 delete all
sudo systemctl restart nginx
pm2 start server.js --name genvedha
pm2 save
```

---

## 📞 Common Questions

### Q: Why is MongoDB URI undefined?
**A:** You need to replace the placeholder in `.env` with your actual MongoDB connection string from MongoDB Atlas.

### Q: How do I get a MongoDB connection string?
**A:** Log into MongoDB Atlas → Select your cluster → Click "Connect" → Choose "Connect your application" → Copy the connection string.

### Q: Can I use a local MongoDB instead?
**A:** Yes, but you'll need to install MongoDB on your EC2 instance. Use: `MONGODB_URI=mongodb://localhost:27017/genvedha`

### Q: What if PM2 startup command fails?
**A:** Make sure you're running the command with `sudo` and that you're using the exact command PM2 generates for your system.

### Q: How do I know if the fixes worked?
**A:** Run `bash test-ec2-deployment.sh` - it should show 15+ tests passing.

---

## 🎯 Next Steps After Fixing

Once all issues are resolved:

1. **Configure Domain** - Point your domain to EC2 IP
2. **Setup SSL** - Run `bash setup-https.sh`
3. **Configure Monitoring** - Set up CloudWatch or PM2 monitoring
4. **Setup Backups** - Configure automated database backups
5. **Test Thoroughly** - Test all features of your application

---

**Remember:** Always test changes in a safe environment first! 🛡️
