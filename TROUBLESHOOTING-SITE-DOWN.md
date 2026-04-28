# 🚨 Site Not Opening - Troubleshooting Guide

**Issue**: http://3.11.178.44:3000 is not accessible (Connection Timeout)

**Date**: 2026-04-28

---

## 🔍 Diagnosis

The connection timeout indicates that the request cannot reach your EC2 instance on port 3000. This is typically caused by:

1. ❌ **EC2 instance is stopped or terminated**
2. ❌ **AWS Security Group blocking port 3000**
3. ❌ **Application not running on EC2**
4. ❌ **Firewall blocking the port**

---

## ✅ Step-by-Step Fix

### Step 1: Check EC2 Instance Status

1. **Go to AWS Console**: https://console.aws.amazon.com/ec2/
2. **Navigate to**: EC2 → Instances
3. **Find your instance**: IP `3.11.178.44`
4. **Check Status**:
   - ✅ Should show: **Running** (green)
   - ❌ If **Stopped**: Click **Instance State** → **Start Instance**
   - ❌ If **Terminated**: You'll need to create a new instance

---

### Step 2: Verify AWS Security Group (MOST COMMON ISSUE)

**This is the most likely cause of the timeout!**

#### Check Security Group Rules:

1. **AWS Console** → **EC2** → **Instances**
2. **Select your instance** (3.11.178.44)
3. **Click the "Security" tab** (bottom panel)
4. **Click on the Security Group name** (e.g., "launch-wizard-1")
5. **Click "Edit inbound rules"**

#### Required Inbound Rules:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | 0.0.0.0/0 | SSH access |
| **Custom TCP** | **TCP** | **3000** | **0.0.0.0/0** | **Node.js app** ⚠️ |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP (optional) |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS (optional) |

#### Add Port 3000 Rule:

1. Click **"Add rule"**
2. **Type**: Custom TCP
3. **Port range**: 3000
4. **Source**: Custom → `0.0.0.0/0` (Anywhere IPv4)
5. **Description**: Node.js application
6. Click **"Save rules"**
7. **Wait 30 seconds** and try accessing http://3.11.178.44:3000 again

---

### Step 3: SSH into EC2 and Check Application

If you can SSH into your EC2 instance, run these commands:

```bash
# SSH into EC2 (replace with your key file path)
ssh -i ~/path/to/your-key.pem ec2-user@3.11.178.44
```

#### Check PM2 Status:

```bash
# Check if application is running
pm2 status
```

**Expected Output**:
```
┌─────┬──────────────────────┬─────────┬─────────┐
│ id  │ name                 │ status  │ restart │
├─────┼──────────────────────┼─────────┼─────────┤
│ 0   │ genvedha-website     │ online  │ 0       │
└─────┴──────────────────────┴─────────┴─────────┘
```

**If status is "stopped" or "errored"**:
```bash
# Restart the application
pm2 restart genvedha-website

# Check logs for errors
pm2 logs genvedha-website --lines 50
```

**If PM2 shows no processes**:
```bash
# Start the application
cd ~/genvedha-website
pm2 start server.js --name genvedha-website
pm2 save
```

#### Check if Port 3000 is Listening:

```bash
# Check if anything is listening on port 3000
sudo netstat -tlnp | grep 3000
```

**Expected Output**:
```
tcp        0      0 0.0.0.0:3000            0.0.0.0:*               LISTEN      12345/node
```

**If nothing is listening**:
```bash
# Application is not running - start it
cd ~/genvedha-website
pm2 start server.js --name genvedha-website
pm2 save
```

#### Test Locally on EC2:

```bash
# Test if app responds locally
curl http://localhost:3000
```

**Expected**: Should return HTML content

**If it fails**: Check application logs:
```bash
pm2 logs genvedha-website --lines 100
```

---

### Step 4: Check Firewall (Less Common)

```bash
# Check if firewall is running
sudo systemctl status firewalld

# If active, check rules
sudo firewall-cmd --list-all

# If port 3000 is not listed, add it
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## 🎯 Quick Fix Commands

If you can SSH into EC2, run these commands in order:

```bash
# 1. SSH into EC2
ssh -i ~/path/to/your-key.pem ec2-user@3.11.178.44

# 2. Navigate to project
cd ~/genvedha-website

# 3. Check PM2 status
pm2 status

# 4. If app is not running, start it
pm2 start server.js --name genvedha-website
pm2 save

# 5. If app is running but errored, restart it
pm2 restart genvedha-website

# 6. Check logs
pm2 logs genvedha-website --lines 50

# 7. Test locally
curl http://localhost:3000

# 8. Check if port is listening
sudo netstat -tlnp | grep 3000
```

---

## 🔧 Common Scenarios & Solutions

### Scenario A: EC2 Instance Was Stopped

**Solution**:
1. AWS Console → EC2 → Instances
2. Select instance → Instance State → Start Instance
3. Wait 2-3 minutes for instance to start
4. SSH in and check PM2: `pm2 status`
5. If app not running: `pm2 resurrect` or `pm2 start server.js --name genvedha-website`

### Scenario B: Security Group Missing Port 3000

**Solution**:
1. AWS Console → EC2 → Security Groups
2. Select your security group
3. Edit inbound rules
4. Add: Custom TCP, Port 3000, Source 0.0.0.0/0
5. Save rules
6. Test immediately: http://3.11.178.44:3000

### Scenario C: Application Crashed

**Solution**:
```bash
ssh -i key.pem ec2-user@3.11.178.44
cd ~/genvedha-website
pm2 logs genvedha-website --lines 100  # Check error
pm2 restart genvedha-website
pm2 logs genvedha-website  # Monitor startup
```

### Scenario D: Need to Redeploy

**Solution**:
```bash
ssh -i key.pem ec2-user@3.11.178.44
cd ~/genvedha-website
./deploy.sh  # Or ./quick-deploy.sh
```

---

## 📊 Verification Steps

After fixing, verify the site is working:

### 1. Test from Command Line:

```bash
# From your local machine
curl -I http://3.11.178.44:3000
```

**Expected Output**:
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

### 2. Test in Browser:

1. Open browser
2. Go to: http://3.11.178.44:3000
3. Should load your website

### 3. Check from EC2:

```bash
# SSH into EC2
ssh -i key.pem ec2-user@3.11.178.44

# Test locally
curl http://localhost:3000 | head -20

# Check PM2
pm2 status
pm2 logs genvedha-website --lines 20
```

---

## 🚨 Emergency Checklist

Run through this checklist:

- [ ] **EC2 Instance**: Is it running? (AWS Console)
- [ ] **Security Group**: Is port 3000 open? (AWS Console → Security tab)
- [ ] **SSH Access**: Can you SSH in? `ssh -i key.pem ec2-user@3.11.178.44`
- [ ] **PM2 Status**: Is app running? `pm2 status`
- [ ] **Port Listening**: Is port 3000 active? `sudo netstat -tlnp | grep 3000`
- [ ] **Local Test**: Does it work locally? `curl http://localhost:3000`
- [ ] **Logs**: Any errors? `pm2 logs genvedha-website`

---

## 💡 Prevention Tips

To avoid this in the future:

1. **Enable PM2 Startup**:
   ```bash
   pm2 startup
   pm2 save
   ```

2. **Monitor Application**:
   ```bash
   pm2 install pm2-logrotate
   ```

3. **Set Up Alerts**: Configure AWS CloudWatch alarms

4. **Use Elastic IP**: Prevents IP changes (see [`AWS-ELASTIC-IP-GUIDE.md`](AWS-ELASTIC-IP-GUIDE.md:1))

5. **Regular Backups**: Backup your `.env` file

---

## 📞 Need More Help?

### Can't SSH into EC2?

**Check**:
- Is instance running?
- Is your IP allowed in Security Group (port 22)?
- Is your key file correct? `chmod 400 your-key.pem`

### Application Keeps Crashing?

**Check logs**:
```bash
pm2 logs genvedha-website --lines 200
```

Common issues:
- Missing `.env` file
- MongoDB connection error
- Port already in use
- Out of memory

### Still Not Working?

1. **Restart EC2 Instance**:
   - AWS Console → EC2 → Instance State → Reboot Instance
   - Wait 2-3 minutes
   - SSH in and start app: `pm2 start server.js --name genvedha-website`

2. **Check System Resources**:
   ```bash
   df -h  # Disk space
   free -h  # Memory
   top  # CPU usage
   ```

---

## 📚 Related Documentation

- **Testing Guide**: [`EC2-TESTING-GUIDE.md`](EC2-TESTING-GUIDE.md:1)
- **Deployment Guide**: [`EC2-REDEPLOY-GUIDE.md`](EC2-REDEPLOY-GUIDE.md:1)
- **Deployment Checklist**: [`YOUR-DEPLOYMENT-CHECKLIST.md`](YOUR-DEPLOYMENT-CHECKLIST.md:1)
- **Elastic IP Setup**: [`AWS-ELASTIC-IP-GUIDE.md`](AWS-ELASTIC-IP-GUIDE.md:1)

---

## 🎯 Most Likely Solution

**90% of the time, the issue is the AWS Security Group not having port 3000 open.**

**Quick Fix**:
1. Go to AWS Console → EC2 → Security Groups
2. Select your instance's security group
3. Edit inbound rules
4. Add: Custom TCP, Port 3000, Source 0.0.0.0/0
5. Save and test immediately

---

**Your EC2 IP**: `3.11.178.44`  
**Test URL**: http://3.11.178.44:3000  
**Last Updated**: 2026-04-28
