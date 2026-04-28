# 🧪 EC2 Deployment Testing Instructions

## Overview
This guide will help you test your EC2 deployment to ensure everything is working correctly.

---

## 📋 Prerequisites

Before running the tests, ensure you have:
- ✅ SSH access to your EC2 instance
- ✅ Application deployed and running
- ✅ PM2 configured and running

---

## 🚀 Quick Test (Run This First)

### Step 1: SSH into Your EC2 Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 2: Navigate to Your Project Directory
```bash
cd ~/genvedha-website
# or wherever your project is located
```

### Step 3: Run the Comprehensive Test Script
```bash
bash test-ec2-deployment.sh
```

---

## 📊 Understanding Test Results

The script will run 20 different tests and provide a summary:

### ✅ All Tests Passed (Exit Code 0)
- Your deployment is fully functional
- No action needed

### ⚠️ Mostly Working (Exit Code 1)
- 1-3 tests failed
- Review failed tests and fix minor issues
- Application should still be functional

### ❌ Deployment Has Issues (Exit Code 2)
- 4+ tests failed
- Requires immediate attention
- Review each failed test carefully

---

## 🔍 What Each Test Checks

| Test # | Test Name | What It Checks |
|--------|-----------|----------------|
| 1 | Node.js Installation | Verifies Node.js is installed |
| 2 | npm Installation | Verifies npm is installed |
| 3 | PM2 Installation | Verifies PM2 is installed |
| 4 | PM2 Application Status | Checks if your app is running in PM2 |
| 5 | Port 3000 Availability | Verifies app is listening on port 3000 |
| 6 | Nginx Status | Checks if Nginx is installed and running |
| 7 | Port 80 (HTTP) | Verifies HTTP port is open |
| 8 | Port 443 (HTTPS) | Verifies HTTPS port is open |
| 9 | Localhost Connection | Tests app responds on localhost |
| 10 | Public IP Connection | Tests app is accessible externally |
| 11 | SSL Certificates | Checks for SSL certificate presence |
| 12 | Environment Configuration | Verifies .env file exists |
| 13 | MongoDB Connection | Checks database connectivity |
| 14 | Disk Space | Ensures sufficient disk space |
| 15 | Memory Usage | Checks memory consumption |
| 16 | Network Connectivity | Tests internet connectivity |
| 17 | Application Logs | Checks for errors in logs |
| 18 | Application Files | Verifies required files exist |
| 19 | Domain Configuration | Tests domain DNS and accessibility |
| 20 | PM2 Startup | Verifies PM2 auto-start is configured |

---

## 🛠️ Manual Testing Commands

If you want to test specific components manually:

### Test Application Status
```bash
pm2 status
pm2 logs genvedha --lines 50
```

### Test Port Connectivity
```bash
# Check what's listening on ports
sudo netstat -tuln | grep -E ':(80|443|3000)'

# Or using ss
sudo ss -tuln | grep -E ':(80|443|3000)'
```

### Test HTTP Response
```bash
# Test localhost
curl -I http://localhost:3000

# Test public IP
curl -I http://$(curl -s http://checkip.amazonaws.com)

# Test domain (if configured)
curl -I http://your-domain.com
```

### Test Nginx Configuration
```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Test SSL Certificates
```bash
# List certificates
sudo ls -la /etc/letsencrypt/live/

# Check certificate expiry
sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.com/cert.pem
```

### Test MongoDB Connection
```bash
# Check if MongoDB is accessible
pm2 logs genvedha | grep -i mongo
```

---

## 🔧 Common Issues and Fixes

### Issue 1: Port 3000 Not Listening
**Symptoms:** Test 5 fails
**Fix:**
```bash
# Restart the application
pm2 restart genvedha

# Check logs for errors
pm2 logs genvedha --err
```

### Issue 2: Nginx Not Running
**Symptoms:** Test 6 fails
**Fix:**
```bash
# Start Nginx
sudo systemctl start nginx

# Enable auto-start
sudo systemctl enable nginx
```

### Issue 3: Application Not Accessible via Public IP
**Symptoms:** Test 10 fails
**Possible Causes:**
1. AWS Security Group not configured
2. Nginx not proxying correctly
3. Application not running

**Fix:**
```bash
# Check AWS Security Group allows ports 80, 443
# Check Nginx configuration
sudo nginx -t
sudo systemctl restart nginx

# Verify app is running
pm2 status
```

### Issue 4: SSL Certificate Missing
**Symptoms:** Test 11 fails
**Fix:**
```bash
# Run SSL setup script
sudo bash setup-https.sh
```

### Issue 5: MongoDB Connection Failed
**Symptoms:** Test 13 fails
**Fix:**
```bash
# Check .env file has correct MONGODB_URI
cat .env | grep MONGODB_URI

# Restart application
pm2 restart genvedha
```

### Issue 6: High Memory Usage
**Symptoms:** Test 15 fails
**Fix:**
```bash
# Restart application to free memory
pm2 restart genvedha

# Check for memory leaks
pm2 monit
```

---

## 📱 Quick Health Check Commands

Run these commands anytime to check your deployment health:

```bash
# One-liner health check
pm2 status && curl -I http://localhost:3000 && df -h / && free -h

# Check if everything is running
sudo systemctl status nginx && pm2 status

# View recent logs
pm2 logs genvedha --lines 20 --nostream
```

---

## 🌐 Testing from Your Local Machine

You can also test your EC2 deployment from your local machine:

### Test HTTP Access
```bash
# Replace with your actual IP or domain
curl -I http://your-ec2-ip-or-domain.com
```

### Test HTTPS Access (if SSL configured)
```bash
curl -I https://your-domain.com
```

### Test Specific Endpoints
```bash
# Test homepage
curl http://your-domain.com

# Test API endpoint (if you have one)
curl http://your-domain.com/api/health
```

### Check SSL Certificate
```bash
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

---

## 📈 Monitoring Your Application

### Real-time Monitoring
```bash
# Monitor with PM2
pm2 monit

# Watch logs in real-time
pm2 logs genvedha

# Watch Nginx logs
sudo tail -f /var/log/nginx/access.log
```

### Check Application Metrics
```bash
# View PM2 metrics
pm2 show genvedha

# Check system resources
htop
# or
top
```

---

## 🔄 Automated Testing

You can set up automated testing by adding the test script to a cron job:

```bash
# Edit crontab
crontab -e

# Add this line to run tests every hour and log results
0 * * * * cd ~/genvedha-website && bash test-ec2-deployment.sh >> ~/deployment-tests.log 2>&1
```

---

## 📞 Getting Help

If tests are failing and you can't resolve the issues:

1. **Check the logs:**
   ```bash
   pm2 logs genvedha --lines 100
   sudo tail -100 /var/log/nginx/error.log
   ```

2. **Review the test output carefully** - it will tell you exactly what's failing

3. **Run the diagnostic script:**
   ```bash
   bash diagnose-ssl-issue.sh
   ```

4. **Check AWS Security Groups** - ensure ports 80, 443, and 22 are open

---

## ✅ Success Criteria

Your deployment is successful when:
- ✅ All 20 tests pass (or at least 17+ pass)
- ✅ Application is accessible via public IP
- ✅ Domain resolves correctly (if configured)
- ✅ SSL certificate is valid (if configured)
- ✅ No errors in application logs
- ✅ PM2 shows application as "online"
- ✅ Nginx is running and proxying correctly

---

## 🎯 Next Steps After Successful Testing

Once all tests pass:

1. **Set up monitoring** - Configure PM2 monitoring or CloudWatch
2. **Configure backups** - Set up automated backups for your data
3. **Enable auto-scaling** (optional) - If you expect high traffic
4. **Set up CI/CD** - Automate deployments
5. **Configure domain** - Point your domain to the EC2 instance
6. **Enable SSL** - Set up HTTPS with Let's Encrypt

---

## 📝 Test Results Log

Keep a record of your test results:

```bash
# Save test results with timestamp
bash test-ec2-deployment.sh | tee ~/test-results-$(date +%Y%m%d-%H%M%S).log
```

---

## 🚨 Emergency Commands

If something goes wrong:

```bash
# Restart everything
pm2 restart all
sudo systemctl restart nginx

# Stop everything
pm2 stop all
sudo systemctl stop nginx

# View all logs
pm2 logs --lines 100
sudo tail -100 /var/log/nginx/error.log

# Check what's using ports
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000
```

---

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

**Remember:** Always test in a safe environment first, and keep backups of your configuration files!
