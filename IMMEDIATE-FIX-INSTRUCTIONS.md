# 🚨 IMMEDIATE FIX INSTRUCTIONS

## Current Situation

**Instance Status:** ✅ RUNNING  
**Instance ID:** i-067c567702d1be38f  
**Public IP:** 3.11.178.44 (Elastic IP)  
**Problem:** Application inside the instance is not responding

## 🎯 The Issue

Your EC2 instance is running, but the Node.js application is either:
1. Not started
2. Crashed
3. Misconfigured

## ⚡ Quick Fix (Choose One Method)

### Method 1: Automated Script (Recommended)

1. **Update the SSH key path** in [`ssh-and-fix.sh`](ssh-and-fix.sh:14):
   ```bash
   # Edit line 14 in ssh-and-fix.sh
   KEY_FILE="$HOME/.ssh/your-actual-key.pem"
   ```

2. **Run the script:**
   ```bash
   ./ssh-and-fix.sh
   ```

This will automatically:
- Connect to your server
- Diagnose the issue
- Run the recovery script
- Start your application

### Method 2: Manual SSH (If you prefer)

1. **SSH to your server:**
   ```bash
   ssh -i ~/.ssh/your-key.pem ubuntu@3.11.178.44
   ```

2. **Navigate to project:**
   ```bash
   cd /home/ubuntu/genvedha-website
   ```

3. **Pull latest code:**
   ```bash
   git pull origin production
   ```

4. **Run recovery script:**
   ```bash
   sudo ./emergency-server-recovery.sh
   ```

5. **If script doesn't exist, manual recovery:**
   ```bash
   # Install dependencies
   npm install --production
   
   # Stop old processes
   pm2 stop all
   pm2 delete all
   
   # Start application
   pm2 start server.js --name genvedha
   pm2 save
   
   # Check status
   pm2 status
   pm2 logs genvedha --lines 50
   ```

### Method 3: AWS Systems Manager (No SSH key needed)

If you don't have SSH key:

1. Go to: https://console.aws.amazon.com/systems-manager/session-manager/sessions
2. Click "Start session"
3. Select instance: i-067c567702d1be38f
4. Click "Start session"
5. Run commands:
   ```bash
   sudo su - ubuntu
   cd /home/ubuntu/genvedha-website
   git pull origin production
   sudo ./emergency-server-recovery.sh
   ```

## 🔍 What to Check

### 1. Is the app running?
```bash
pm2 status
```

### 2. Check logs for errors:
```bash
pm2 logs genvedha --lines 50
```

### 3. Check if port 3000 is listening:
```bash
sudo netstat -tlnp | grep :3000
```

### 4. Test locally on server:
```bash
curl http://localhost:3000
```

### 5. Check environment variables:
```bash
cat .env
```

## 🛡️ Security Group Check

Your security group MUST have these ports open:

| Type | Protocol | Port | Source | Status |
|------|----------|------|--------|--------|
| SSH | TCP | 22 | 0.0.0.0/0 | ❓ Check |
| HTTP | TCP | 80 | 0.0.0.0/0 | ❓ Check |
| HTTPS | TCP | 443 | 0.0.0.0/0 | ❓ Check |
| Custom | TCP | 3000 | 0.0.0.0/0 | ❓ Check |

**Check here:** https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:group-id=sg-01b24f42694bc45f6

If any are missing:
1. Click "Edit inbound rules"
2. Click "Add rule"
3. Select type and set Source to 0.0.0.0/0
4. Click "Save rules"

## 📋 Common Issues & Solutions

### Issue 1: "Permission denied" when SSH
```bash
# Fix key permissions
chmod 600 ~/.ssh/your-key.pem
```

### Issue 2: PM2 not installed
```bash
sudo npm install -g pm2
```

### Issue 3: Node.js not installed
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs
```

### Issue 4: MongoDB connection error
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Or update .env to use demo mode
```

### Issue 5: Port 3000 already in use
```bash
# Kill process on port 3000
sudo fuser -k 3000/tcp

# Then restart app
pm2 restart genvedha
```

## ✅ Verification Steps

After running the fix:

1. **Check PM2 status:**
   ```bash
   pm2 status
   # Should show "genvedha" as "online"
   ```

2. **Test locally:**
   ```bash
   curl http://localhost:3000
   # Should return HTML
   ```

3. **Test from your machine:**
   ```bash
   curl http://3.11.178.44:3000
   # Should return HTML
   ```

4. **Test domain:**
   ```bash
   curl http://genvedha.com
   # Should return HTML or redirect
   ```

5. **Open in browser:**
   - http://3.11.178.44:3000
   - http://genvedha.com

## 🔐 After App is Running - Setup SSL

Once the app is responding:

```bash
# SSH to server
ssh -i ~/.ssh/your-key.pem ubuntu@3.11.178.44

# Navigate to project
cd /home/ubuntu/genvedha-website

# Run SSL setup
sudo ./fix-site-down-ssl.sh
```

This will:
- Get SSL certificate from Let's Encrypt
- Configure Nginx as reverse proxy
- Enable HTTPS
- Setup auto-renewal

## 📞 Still Not Working?

### Check these in order:

1. **Instance running?**
   - AWS Console → EC2 → Instances
   - Should show "Running" with 2/2 status checks

2. **Can you SSH?**
   - `ssh -i key.pem ubuntu@3.11.178.44`
   - If no, check security group port 22

3. **Is app in PM2?**
   - `pm2 status`
   - If no, start it: `pm2 start server.js --name genvedha`

4. **Any errors in logs?**
   - `pm2 logs genvedha`
   - Fix errors shown

5. **Port 3000 listening?**
   - `sudo netstat -tlnp | grep :3000`
   - If no, app isn't running

6. **Security group open?**
   - Check AWS console
   - Ports 22, 80, 443, 3000 must be open

## 🎯 Expected Timeline

- SSH to server: 1 minute
- Run recovery script: 5-10 minutes
- Verify working: 2 minutes
- Setup SSL: 5 minutes

**Total: 15-20 minutes**

## 📝 Quick Commands Reference

```bash
# SSH to server
ssh -i ~/.ssh/your-key.pem ubuntu@3.11.178.44

# Check app status
pm2 status

# View logs
pm2 logs genvedha

# Restart app
pm2 restart genvedha

# Stop app
pm2 stop genvedha

# Start app
pm2 start server.js --name genvedha

# Check what's on port 3000
sudo netstat -tlnp | grep :3000

# Test locally
curl http://localhost:3000

# Check Nginx
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

**Instance:** i-067c567702d1be38f  
**IP:** 3.11.178.44  
**Region:** eu-west-2 (London)  
**Type:** t3.micro  
**Status:** ✅ Running  
**Next Step:** SSH and run recovery script
