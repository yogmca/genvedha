# GoDaddy Domain Configuration for EC2

Complete guide to map your GoDaddy domain to your AWS EC2 instance.

---

## 📋 Prerequisites

Before starting, you need:
- ✅ GoDaddy domain name (purchased)
- ✅ AWS EC2 instance running
- ✅ EC2 **Elastic IP** (recommended) or Public IP
- ✅ GoDaddy account access

---

## 🎯 Step-by-Step Configuration

### Step 1: Get Your EC2 IP Address

#### Option A: Allocate Elastic IP (Recommended)

An Elastic IP ensures your IP doesn't change when you restart EC2.

1. **Go to AWS Console** → EC2 → Elastic IPs
2. Click **"Allocate Elastic IP address"**
3. Click **"Allocate"**
4. Select the new Elastic IP
5. Click **"Actions"** → **"Associate Elastic IP address"**
6. Select your EC2 instance
7. Click **"Associate"**
8. **Copy the Elastic IP** (e.g., `54.123.45.67`)

#### Option B: Use Public IP (Not Recommended)

1. Go to AWS Console → EC2 → Instances
2. Select your instance
3. Copy the **Public IPv4 address**

⚠️ **Warning**: Public IPs change when you stop/start the instance. Use Elastic IP for production.

---

### Step 2: Configure GoDaddy DNS

#### 2.1 Login to GoDaddy

1. Go to [https://www.godaddy.com](https://www.godaddy.com)
2. Click **"Sign In"**
3. Enter your credentials

#### 2.2 Access DNS Management

1. Click on your **profile icon** (top right)
2. Select **"My Products"**
3. Find your domain
4. Click **"DNS"** or **"Manage DNS"**

#### 2.3 Configure DNS Records

You'll see a list of DNS records. You need to add/modify these:

---

### Configuration Option 1: Root Domain Only (example.com)

**For**: `genvedha.com` → Your EC2

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `YOUR_EC2_IP` | 600 |

**Steps:**
1. Find the existing **A record** with name **@**
2. Click the **pencil icon** to edit
3. Change **Value** to your EC2 IP address
4. Set **TTL** to `600` seconds (10 minutes)
5. Click **"Save"**

---

### Configuration Option 2: Root + WWW (Recommended)

**For**: Both `genvedha.com` AND `www.genvedha.com` → Your EC2

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `YOUR_EC2_IP` | 600 |
| CNAME | www | @ | 600 |

**Steps:**

**For Root Domain (@):**
1. Find/Edit the **A record** with name **@**
2. Set **Value** to your EC2 IP
3. Set **TTL** to `600`
4. Click **"Save"**

**For WWW Subdomain:**
1. Click **"Add"** or **"Add Record"**
2. Select **Type**: `CNAME`
3. Set **Name**: `www`
4. Set **Value**: `@` (or your domain name)
5. Set **TTL**: `600`
6. Click **"Save"**

---

### Configuration Option 3: Multiple Subdomains

**For**: `app.genvedha.com`, `api.genvedha.com`, etc.

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `YOUR_EC2_IP` | 600 |
| A | app | `YOUR_EC2_IP` | 600 |
| A | api | `YOUR_EC2_IP` | 600 |
| CNAME | www | @ | 600 |

**Steps:**
1. Add **A record** for each subdomain
2. Set **Name** to subdomain (e.g., `app`, `api`)
3. Set **Value** to your EC2 IP
4. Click **"Save"**

---

## 🔍 Example Configuration

### Before (Default GoDaddy Settings)

```
Type    Name    Value                   TTL
A       @       160.153.136.3          3600
CNAME   www     @                      3600
```

### After (Pointing to EC2)

```
Type    Name    Value                   TTL
A       @       54.123.45.67           600
CNAME   www     @                      600
```

Replace `54.123.45.67` with your actual EC2 IP address.

---

## ⏱️ DNS Propagation

After saving DNS changes:

- **Minimum**: 10 minutes (with TTL 600)
- **Typical**: 1-2 hours
- **Maximum**: 24-48 hours (rare)

### Check DNS Propagation

#### Method 1: Using Command Line

```bash
# Check A record
nslookup genvedha.com

# Check with specific DNS server
nslookup genvedha.com 8.8.8.8

# Detailed DNS info
dig genvedha.com

# Check WWW subdomain
nslookup www.genvedha.com
```

#### Method 2: Online Tools

- [https://www.whatsmydns.net](https://www.whatsmydns.net)
- [https://dnschecker.org](https://dnschecker.org)
- [https://mxtoolbox.com/DNSLookup.aspx](https://mxtoolbox.com/DNSLookup.aspx)

Enter your domain and check if it resolves to your EC2 IP globally.

---

## 🔐 Setup HTTPS After DNS Configuration

Once DNS is propagated (domain resolves to your EC2 IP), setup HTTPS:

### 1. Verify DNS is Working

```bash
# From your local machine
nslookup genvedha.com
# Should return your EC2 IP
```

### 2. SSH into EC2

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 3. Run HTTPS Setup Script

```bash
cd ~/genvedha-website
sudo ./setup-https.sh
```

You'll be prompted for:
- **Domain name**: `genvedha.com`
- **Email**: `admin@genvedha.com`

The script will:
- ✅ Install Nginx
- ✅ Configure reverse proxy
- ✅ Obtain SSL certificate from Let's Encrypt
- ✅ Setup automatic renewal
- ✅ Configure HTTP → HTTPS redirect

### 4. Verify HTTPS

```bash
# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# Test in browser
# https://genvedha.com
```

---

## 🛠️ Troubleshooting

### Issue 1: Domain Not Resolving

**Symptoms**: `nslookup` doesn't return your EC2 IP

**Solutions**:
```bash
# Check DNS records in GoDaddy
# Verify you saved the changes
# Wait 10-30 minutes for propagation

# Test with Google DNS
nslookup genvedha.com 8.8.8.8

# Clear local DNS cache (Mac)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Clear local DNS cache (Windows)
ipconfig /flushdns

# Clear local DNS cache (Linux)
sudo systemd-resolve --flush-caches
```

### Issue 2: WWW Not Working

**Problem**: `genvedha.com` works but `www.genvedha.com` doesn't

**Solution**:
1. Add CNAME record in GoDaddy:
   - Type: `CNAME`
   - Name: `www`
   - Value: `@`
2. Wait for DNS propagation
3. Update Nginx config to handle both:

```bash
# SSH into EC2
sudo nano /etc/nginx/conf.d/genvedha.conf

# Ensure server_name includes both:
server_name genvedha.com www.genvedha.com;

# Restart Nginx
sudo systemctl restart nginx
```

### Issue 3: SSL Certificate Fails

**Error**: "Failed to obtain certificate"

**Solutions**:

1. **Verify DNS is propagated**:
   ```bash
   nslookup genvedha.com
   # Must return your EC2 IP
   ```

2. **Check ports 80 and 443 are open**:
   - Go to AWS Console → EC2 → Security Groups
   - Ensure inbound rules allow:
     - Port 80 (HTTP) from 0.0.0.0/0
     - Port 443 (HTTPS) from 0.0.0.0/0

3. **Try manual certificate**:
   ```bash
   sudo certbot --nginx -d genvedha.com -d www.genvedha.com
   ```

### Issue 4: Site Shows "Connection Refused"

**Solutions**:

1. **Check application is running**:
   ```bash
   pm2 status
   pm2 logs genvedha-website
   ```

2. **Check Nginx is running**:
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

3. **Check AWS Security Group**:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)

### Issue 5: Old IP Still Showing

**Problem**: DNS shows old IP address

**Solutions**:
```bash
# Clear your local DNS cache
# Mac
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Windows
ipconfig /flushdns

# Linux
sudo systemd-resolve --flush-caches

# Wait for TTL to expire (check TTL value in GoDaddy)
# Use incognito/private browsing
# Try from different device/network
```

---

## 📊 Verification Checklist

After configuration, verify:

- [ ] **DNS Resolution**: `nslookup genvedha.com` returns EC2 IP
- [ ] **WWW Works**: `nslookup www.genvedha.com` resolves correctly
- [ ] **HTTP Access**: `http://genvedha.com` loads (may redirect to HTTPS)
- [ ] **HTTPS Access**: `https://genvedha.com` loads with valid certificate
- [ ] **WWW HTTPS**: `https://www.genvedha.com` works
- [ ] **Certificate Valid**: No browser warnings
- [ ] **Auto-Renewal**: `sudo certbot renew --dry-run` succeeds

---

## 🎯 Complete Setup Example

### Scenario: Setting up genvedha.com

**1. EC2 Setup**
```bash
# Elastic IP: 54.123.45.67
# Instance: Running on port 3000
```

**2. GoDaddy DNS Records**
```
Type    Name    Value           TTL
A       @       54.123.45.67    600
CNAME   www     @               600
```

**3. Wait for DNS Propagation (10-30 minutes)**
```bash
# Test from local machine
nslookup genvedha.com
# Should return: 54.123.45.67
```

**4. Setup HTTPS on EC2**
```bash
ssh -i key.pem ec2-user@54.123.45.67
cd ~/genvedha-website
sudo ./setup-https.sh
# Enter: genvedha.com
# Enter: admin@genvedha.com
```

**5. Verify**
```bash
# Check certificate
sudo certbot certificates

# Test in browser
# https://genvedha.com ✅
# https://www.genvedha.com ✅
```

---

## 🔄 Updating DNS Records

If you need to change your EC2 IP:

1. **Get new Elastic IP** (if needed)
2. **Associate with EC2 instance**
3. **Update GoDaddy A record**:
   - Edit the **@** A record
   - Change value to new IP
   - Save
4. **Wait for propagation** (10-30 minutes)
5. **Update SSL certificate** (if domain changed):
   ```bash
   sudo certbot renew --force-renewal
   ```

---

## 📱 Mobile/App Configuration

If you have a mobile app or need API subdomain:

### API Subdomain Setup

**GoDaddy DNS**:
```
Type    Name    Value           TTL
A       api     54.123.45.67    600
```

**Nginx Configuration**:
```bash
# Create new config
sudo nano /etc/nginx/conf.d/api.conf

# Add:
server {
    listen 80;
    server_name api.genvedha.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Test and restart
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d api.genvedha.com
```

---

## 🌐 Multiple Domains

To point multiple domains to same EC2:

**GoDaddy** (for each domain):
```
Type    Name    Value           TTL
A       @       54.123.45.67    600
```

**Nginx** (handle all domains):
```bash
sudo nano /etc/nginx/conf.d/genvedha.conf

# Update server_name:
server_name genvedha.com www.genvedha.com otherdomain.com www.otherdomain.com;

# Get certificates for all
sudo certbot --nginx -d genvedha.com -d www.genvedha.com -d otherdomain.com -d www.otherdomain.com
```

---

## 📞 Quick Reference

| Task | Command/Action |
|------|----------------|
| **Check DNS** | `nslookup genvedha.com` |
| **Check with Google DNS** | `nslookup genvedha.com 8.8.8.8` |
| **Detailed DNS info** | `dig genvedha.com` |
| **Clear DNS cache (Mac)** | `sudo dscacheutil -flushcache` |
| **Clear DNS cache (Windows)** | `ipconfig /flushdns` |
| **Test SSL** | `sudo certbot certificates` |
| **Renew SSL** | `sudo certbot renew` |
| **Check Nginx** | `sudo systemctl status nginx` |
| **Test Nginx config** | `sudo nginx -t` |

---

## 🆘 Need Help?

**DNS not propagating?**
- Wait 30 minutes minimum
- Check on [whatsmydns.net](https://www.whatsmydns.net)
- Verify you saved changes in GoDaddy

**SSL certificate failing?**
- Ensure DNS is fully propagated first
- Check AWS Security Group ports 80, 443
- Try: `sudo certbot --nginx -d genvedha.com`

**Site not loading?**
- Check: `pm2 status`
- Check: `sudo systemctl status nginx`
- Check AWS Security Group rules

---

## 📚 Related Documentation

- **EC2 Deployment**: [`EC2-REDEPLOY-GUIDE.md`](EC2-REDEPLOY-GUIDE.md:1)
- **Full Deployment**: [`DEPLOYMENT.md`](DEPLOYMENT.md:1)
- **HTTPS Setup Script**: [`setup-https.sh`](setup-https.sh:1)

---

**Last Updated**: 2026-04-28  
**Contact**: admin@genvedha.com
