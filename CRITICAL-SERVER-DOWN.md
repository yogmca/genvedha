# 🚨 CRITICAL: SERVER COMPLETELY DOWN

## Current Status (2026-04-29 03:18 UTC)

### ❌ CRITICAL ISSUES
- ❌ **Server is completely unreachable** - Connection timeout on all ports
- ❌ Cannot connect to http://3.11.178.44:3000 (timeout after 10 seconds)
- ❌ Cannot connect to https://genvedha.com (SSL error)
- ❌ Cannot connect to http://genvedha.com (405 error, but this might be cached)

### 🔍 Diagnosis

The connection timeout indicates one of these critical issues:

1. **EC2 Instance is Stopped/Terminated** ⚠️ MOST LIKELY
2. **AWS Security Group is blocking ALL traffic** (including port 3000)
3. **EC2 Instance has crashed/frozen**
4. **Network/VPC configuration issue**

## 🆘 IMMEDIATE ACTIONS REQUIRED

### Action 1: Check EC2 Instance Status (URGENT)

1. **Go to AWS EC2 Console:**
   https://console.aws.amazon.com/ec2/v2/home#Instances:

2. **Find your instance:**
   - Look for instance with IP: `3.11.178.44` or `15.197.148.33` or `3.33.130.190`
   - Check the "Instance State" column

3. **Possible States:**

   **If STOPPED:**
   - ✅ Click "Instance State" → "Start Instance"
   - Wait 2-3 minutes for it to start
   - Note: IP address might change if you don't have Elastic IP
   - After starting, SSH in and run: `sudo ./emergency-server-recovery.sh`

   **If RUNNING:**
   - Check "Status Checks" - should show 2/2 checks passed
   - If failing, there's a system/instance issue
   - Try "Instance State" → "Reboot" (NOT Stop/Start)
   - If still failing, may need to check system logs

   **If TERMINATED:**
   - ⚠️ Instance is gone - you need to create a new one
   - Follow: `EC2-REDEPLOY-GUIDE.md`

### Action 2: Check Security Group (CRITICAL)

Even if instance is running, security group might be blocking everything:

1. **Go to Security Groups:**
   https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:group-id=sg-01b24f42694bc45f6

2. **Check Inbound Rules - MUST HAVE:**
   ```
   Type        Protocol    Port    Source          Description
   SSH         TCP         22      0.0.0.0/0       SSH access
   HTTP        TCP         80      0.0.0.0/0       HTTP traffic
   HTTPS       TCP         443     0.0.0.0/0       HTTPS traffic
   Custom TCP  TCP         3000    0.0.0.0/0       Node.js app
   ```

3. **If ANY of these are missing:**
   - Click "Edit inbound rules"
   - Click "Add rule" for each missing port
   - Select the type (SSH, HTTP, HTTPS, or Custom TCP)
   - For Custom TCP, enter port 3000
   - Source: 0.0.0.0/0 (anywhere)
   - Click "Save rules"

### Action 3: Try to SSH into Server

Once instance is running and security group is fixed:

```bash
# Replace with your actual key file and IP
ssh -i ~/.ssh/your-key.pem ubuntu@3.11.178.44

# If that fails, try other IPs
ssh -i ~/.ssh/your-key.pem ubuntu@15.197.148.33
ssh -i ~/.ssh/your-key.pem ubuntu@3.33.130.190
```

**If SSH works:**
```bash
# Check system status
uptime
free -h
df -h

# Check if services are running
pm2 status
sudo systemctl status nginx

# Run recovery script
cd /home/ubuntu/genvedha-website
sudo ./emergency-server-recovery.sh
```

**If SSH doesn't work:**
- Instance is definitely stopped or security group blocks port 22
- Go back to Action 1 and 2

### Action 4: Check DNS (If Instance IP Changed)

If you had to start a stopped instance, the IP might have changed:

```bash
# Check current DNS
dig genvedha.com +short

# Compare with your EC2 instance's public IP in AWS console
```

If they don't match, you need to:
1. Get Elastic IP (recommended) or note new IP
2. Update DNS A records in GoDaddy to point to new IP
3. Wait 5-10 minutes for DNS propagation

## 📋 Step-by-Step Recovery Checklist

- [ ] **Step 1:** Log into AWS Console
- [ ] **Step 2:** Navigate to EC2 → Instances
- [ ] **Step 3:** Find instance with genvedha.com
- [ ] **Step 4:** Check instance state
  - [ ] If STOPPED → Start it
  - [ ] If RUNNING → Check status checks
  - [ ] If TERMINATED → Need to redeploy
- [ ] **Step 5:** Check Security Group (sg-01b24f42694bc45f6)
  - [ ] Port 22 (SSH) is open
  - [ ] Port 80 (HTTP) is open
  - [ ] Port 443 (HTTPS) is open
  - [ ] Port 3000 (Node.js) is open
- [ ] **Step 6:** Note the Public IP address
- [ ] **Step 7:** Try SSH: `ssh -i key.pem ubuntu@<IP>`
- [ ] **Step 8:** If SSH works, run recovery:
  ```bash
  cd /home/ubuntu/genvedha-website
  git pull origin production
  sudo ./emergency-server-recovery.sh
  ```
- [ ] **Step 9:** If IP changed, update DNS in GoDaddy
- [ ] **Step 10:** Wait for DNS propagation (5-10 min)
- [ ] **Step 11:** Test: `curl http://genvedha.com`
- [ ] **Step 12:** Setup SSL: `sudo ./fix-site-down-ssl.sh`

## 🔧 Scripts Available

Once you can SSH into the server:

### 1. Emergency Recovery (Run First)
```bash
cd /home/ubuntu/genvedha-website
sudo ./emergency-server-recovery.sh
```
This will:
- Check system resources
- Install/verify Node.js and PM2
- Install dependencies
- Start the application
- Verify everything is working

### 2. SSL Fix (Run After Recovery)
```bash
sudo ./fix-site-down-ssl.sh
```
This will:
- Stop services
- Get SSL certificate
- Configure Nginx
- Start everything with HTTPS

## 🆘 If You Can't Access AWS Console

If you don't have AWS console access:

1. **Contact whoever has AWS access**
2. **Ask them to:**
   - Check if EC2 instance is running
   - Check security group has ports 22, 80, 443, 3000 open
   - Get the current public IP address
   - Start the instance if it's stopped

## 📊 Understanding the Error

```
curl: (28) Failed to connect to 3.11.178.44 port 3000 after 10006 ms: Timeout was reached
```

This error means:
- ❌ NOT a server error (would get 500, 502, 503)
- ❌ NOT an application error (would get 404, 405)
- ❌ NOT an SSL error (would get SSL handshake error)
- ✅ **Connection timeout = server is unreachable**

Possible causes (in order of likelihood):
1. **EC2 instance is stopped** (90% likely)
2. **Security group blocks port 3000** (8% likely)
3. **Instance crashed/frozen** (2% likely)

## 🔗 Quick Links

- **EC2 Instances:** https://console.aws.amazon.com/ec2/v2/home#Instances:
- **Security Groups:** https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:group-id=sg-01b24f42694bc45f6
- **DNS Check:** https://dnschecker.org/#A/genvedha.com
- **Your IPs:** 3.11.178.44, 15.197.148.33, 3.33.130.190

## 💡 Prevention for Future

To prevent this from happening again:

1. **Use Elastic IP** (so IP doesn't change when instance restarts)
2. **Setup CloudWatch Alarms** (get notified if instance stops)
3. **Enable Auto-Recovery** (automatically restart if instance fails)
4. **Setup Monitoring** (UptimeRobot, Pingdom, etc.)
5. **Document your AWS credentials** (so you can always access console)

## 📞 Need Help?

If you're stuck:

1. **Check AWS Console first** - this is the most important step
2. **Verify security group** - second most important
3. **Try SSH** - confirms connectivity
4. **Run recovery scripts** - automates the fix

## ⏱️ Expected Timeline

- **AWS Console check:** 2 minutes
- **Start instance (if stopped):** 2-3 minutes
- **Fix security group:** 2 minutes
- **SSH and run recovery:** 5-10 minutes
- **SSL setup:** 5 minutes
- **DNS propagation (if IP changed):** 5-10 minutes

**Total: 15-30 minutes** (depending on what needs to be fixed)

---

**Status:** 🔴 CRITICAL - Server completely down  
**Last Updated:** 2026-04-29 03:18 UTC  
**Priority:** IMMEDIATE ACTION REQUIRED  
**Next Step:** Check AWS EC2 Console NOW
