# Testing Your EC2 Instance

**Your EC2 IP**: `3.11.178.44`

---

## 🧪 Testing Methods

### Method 1: Test HTTP (Port 3000)

Your Node.js application runs on port 3000 by default.

```bash
# From your local machine
curl http://3.11.178.44:3000
```

**Expected Result**: HTML content of your website

**In Browser**:
- Visit: `http://3.11.178.44:3000`
- Should load your website

⚠️ **Note**: Port 3000 must be open in AWS Security Group

---

### Method 2: Test HTTPS (After Nginx Setup)

After running [`setup-https.sh`](setup-https.sh:1), test with domain:

```bash
# Test with domain (not IP)
curl https://your-domain.com
```

**In Browser**:
- Visit: `https://your-domain.com`
- Should show valid SSL certificate

⚠️ **Note**: HTTPS requires a domain name. You cannot use `https://3.11.178.44` without proper SSL certificate for the IP.

---

## 🔍 Current Testing Steps

### Step 1: Check if EC2 is Reachable

```bash
# Ping test (may not work if ICMP is blocked)
ping 3.11.178.44

# Better: Try SSH
ssh -i your-key.pem ec2-user@3.11.178.44
```

### Step 2: Check Application Status (from EC2)

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@3.11.178.44

# Check PM2 status
pm2 status

# Check if app is listening on port 3000
sudo netstat -tlnp | grep 3000

# Test locally on EC2
curl http://localhost:3000
```

### Step 3: Test from Outside

#### Option A: Using curl

```bash
# From your local machine
curl http://3.11.178.44:3000

# With headers
curl -I http://3.11.178.44:3000

# Follow redirects
curl -L http://3.11.178.44:3000
```

#### Option B: Using Browser

1. Open browser
2. Go to: `http://3.11.178.44:3000`
3. Should load your website

#### Option C: Using telnet

```bash
# Test if port 3000 is open
telnet 3.11.178.44 3000

# If connected, type:
GET / HTTP/1.1
Host: 3.11.178.44
[Press Enter twice]
```

---

## 🔐 AWS Security Group Configuration

For testing to work, ensure these ports are open:

### Required Inbound Rules

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | Your IP or 0.0.0.0/0 | SSH access |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | Node.js app (before Nginx) |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP (after Nginx) |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS (after Nginx) |

### How to Check/Add Security Group Rules

1. **AWS Console** → **EC2** → **Instances**
2. Select your instance
3. Click **Security** tab
4. Click on the **Security Group** link
5. Click **Edit inbound rules**
6. Add missing rules:
   - Click **Add rule**
   - Type: `Custom TCP`
   - Port: `3000`
   - Source: `0.0.0.0/0` (Anywhere IPv4)
   - Description: `Node.js application`
   - Click **Save rules**

---

## 🧪 Complete Testing Workflow

### Before HTTPS Setup (Direct Node.js Access)

```bash
# 1. SSH into EC2
ssh -i your-key.pem ec2-user@3.11.178.44

# 2. Check application is running
pm2 status
# Should show: genvedha-website | online

# 3. Test locally on EC2
curl http://localhost:3000
# Should return HTML

# 4. Exit EC2
exit

# 5. Test from your machine
curl http://3.11.178.44:3000
# Should return HTML

# 6. Test in browser
# Open: http://3.11.178.44:3000
```

### After HTTPS Setup (with Nginx)

```bash
# 1. Ensure DNS is configured
nslookup your-domain.com
# Should return: 3.11.178.44

# 2. Test HTTP (should redirect to HTTPS)
curl -I http://your-domain.com
# Should show: 301 Moved Permanently

# 3. Test HTTPS
curl https://your-domain.com
# Should return HTML

# 4. Test in browser
# Open: https://your-domain.com
# Should show valid SSL certificate
```

---

## 🛠️ Troubleshooting

### Issue 1: Connection Refused

**Error**: `curl: (7) Failed to connect to 3.11.178.44 port 3000: Connection refused`

**Solutions**:

1. **Check application is running**:
   ```bash
   ssh -i key.pem ec2-user@3.11.178.44
   pm2 status
   pm2 logs genvedha-website
   ```

2. **Check port 3000 is listening**:
   ```bash
   sudo netstat -tlnp | grep 3000
   ```

3. **Check AWS Security Group**:
   - Ensure port 3000 is open
   - Source: `0.0.0.0/0`

4. **Restart application**:
   ```bash
   pm2 restart genvedha-website
   ```

### Issue 2: Connection Timeout

**Error**: `curl: (28) Failed to connect to 3.11.178.44 port 3000: Connection timed out`

**Solutions**:

1. **Check AWS Security Group** - Port 3000 is likely blocked
2. **Check if EC2 is running** - Instance might be stopped
3. **Check firewall on EC2**:
   ```bash
   sudo firewall-cmd --list-all
   ```

### Issue 3: Empty Response

**Error**: `curl: (52) Empty reply from server`

**Solutions**:

1. **Application crashed** - Check logs:
   ```bash
   pm2 logs genvedha-website --lines 100
   ```

2. **Restart application**:
   ```bash
   pm2 restart genvedha-website
   ```

### Issue 4: Cannot Access via HTTPS with IP

**Error**: SSL certificate error when accessing `https://3.11.178.44`

**Explanation**: 
- SSL certificates are issued for domain names, not IP addresses
- You cannot use `https://3.11.178.44` without a proper certificate

**Solutions**:
- Use HTTP: `http://3.11.178.44:3000`
- Or setup domain and use: `https://your-domain.com`

---

## 📊 Testing Checklist

### Basic Connectivity
- [ ] Can ping EC2: `ping 3.11.178.44`
- [ ] Can SSH: `ssh -i key.pem ec2-user@3.11.178.44`
- [ ] Application running: `pm2 status` shows "online"

### Application Testing (Before Nginx)
- [ ] Local test works: `curl http://localhost:3000` (from EC2)
- [ ] External test works: `curl http://3.11.178.44:3000` (from local)
- [ ] Browser works: `http://3.11.178.44:3000` loads

### DNS Testing (After GoDaddy Setup)
- [ ] DNS resolves: `nslookup your-domain.com` returns `3.11.178.44`
- [ ] WWW resolves: `nslookup www.your-domain.com` works
- [ ] Global propagation: Check on [whatsmydns.net](https://www.whatsmydns.net)

### HTTPS Testing (After setup-https.sh)
- [ ] HTTP redirects: `curl -I http://your-domain.com` shows 301
- [ ] HTTPS works: `curl https://your-domain.com` returns HTML
- [ ] Certificate valid: `sudo certbot certificates` shows valid cert
- [ ] Browser shows lock icon: `https://your-domain.com`
- [ ] WWW works: `https://www.your-domain.com` loads

---

## 🎯 Quick Test Commands

```bash
# Test SSH
ssh -i your-key.pem ec2-user@3.11.178.44

# Test HTTP (port 3000)
curl http://3.11.178.44:3000

# Test with headers
curl -I http://3.11.178.44:3000

# Test DNS
nslookup your-domain.com

# Test HTTPS (with domain)
curl https://your-domain.com

# Test from EC2 locally
ssh -i key.pem ec2-user@3.11.178.44 "curl http://localhost:3000"
```

---

## 🔍 Detailed Testing Script

Save this as `test-deployment.sh`:

```bash
#!/bin/bash

EC2_IP="3.11.178.44"
DOMAIN="your-domain.com"  # Replace with your actual domain

echo "=== Testing EC2 Deployment ==="
echo ""

echo "1. Testing SSH connectivity..."
ssh -i your-key.pem ec2-user@$EC2_IP "echo 'SSH: OK'" || echo "SSH: FAILED"
echo ""

echo "2. Testing HTTP (port 3000)..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://$EC2_IP:3000 || echo "HTTP: FAILED"
echo ""

echo "3. Testing DNS resolution..."
nslookup $DOMAIN | grep "Address:" | tail -1
echo ""

echo "4. Testing HTTPS (if configured)..."
curl -s -o /dev/null -w "HTTPS Status: %{http_code}\n" https://$DOMAIN || echo "HTTPS: Not configured or failed"
echo ""

echo "=== Test Complete ==="
```

---

## 📱 Browser Testing

### Test in Multiple Browsers

1. **Chrome/Edge**:
   - Open DevTools (F12)
   - Network tab
   - Visit: `http://3.11.178.44:3000`
   - Check for errors

2. **Firefox**:
   - Open Developer Tools (F12)
   - Network tab
   - Visit: `http://3.11.178.44:3000`
   - Check for errors

3. **Safari** (Mac):
   - Develop → Show Web Inspector
   - Network tab
   - Visit: `http://3.11.178.44:3000`

### What to Check

- [ ] Page loads completely
- [ ] No console errors (F12 → Console)
- [ ] All resources load (F12 → Network)
- [ ] Images display correctly
- [ ] CSS styles applied
- [ ] JavaScript works (React components render)
- [ ] Links work
- [ ] Contact form works (if applicable)

---

## 🆘 Quick Fixes

### Application Not Responding

```bash
ssh -i key.pem ec2-user@3.11.178.44
pm2 restart genvedha-website
pm2 logs genvedha-website
```

### Port 3000 Not Accessible

```bash
# Check AWS Security Group
# Add inbound rule: TCP port 3000 from 0.0.0.0/0
```

### DNS Not Working

```bash
# Wait 10-30 minutes for propagation
# Check GoDaddy DNS settings
# Verify A record points to 3.11.178.44
```

---

## 📚 Related Documentation

- **Deployment Checklist**: [`YOUR-DEPLOYMENT-CHECKLIST.md`](YOUR-DEPLOYMENT-CHECKLIST.md:1)
- **EC2 Deployment**: [`EC2-REDEPLOY-GUIDE.md`](EC2-REDEPLOY-GUIDE.md:1)
- **GoDaddy Setup**: [`GODADDY-DOMAIN-SETUP.md`](GODADDY-DOMAIN-SETUP.md:1)

---

**Your EC2 IP**: `3.11.178.44`  
**Test URL**: `http://3.11.178.44:3000`  
**Last Updated**: 2026-04-28
