# 🚀 Immediate Action Plan - Get Your Site Working

## ✅ Current Status

### GoDaddy DNS - CORRECTLY CONFIGURED ✅
```
A    | @   | 3.11.178.44        | 600 seconds  ✅
CNAME| www | genvedha.com.      | 1 Hour       ✅
```

Your DNS is perfect! The domain points to your EC2 IP.

### EC2 Instance - RUNNING ✅
- Instance: i-067c567702d1be38f
- IP: 3.11.178.44
- Status: Running

### AWS Security Group - MISSING PORT 3000 ❌
- Port 22 (SSH): ✅
- Port 80 (HTTP): ✅
- Port 443 (HTTPS): ✅
- **Port 3000 (Node.js): ❌ MISSING**

---

## 🎯 What You Need to Do NOW

### Action 1: Add Port 3000 to Security Group (5 minutes)

**Why**: Your Node.js app runs on port 3000, but AWS is blocking it.

**Steps**:
1. Go to: https://console.aws.amazon.com/ec2/
2. Click **Security Groups** (left sidebar)
3. Select `launch-wizard-1` (sg-01b24f42694bc45f6)
4. Click **"Edit inbound rules"**
5. Click **"Add rule"**
6. Fill in:
   - **Type**: Custom TCP
   - **Port range**: `3000`
   - **Source**: `0.0.0.0/0`
   - **Description**: Node.js application
7. Click **"Save rules"**

### Action 2: Test Direct IP Access

After adding port 3000, test in browser:
```
http://3.11.178.44:3000
```

**Expected**: Your website should load!

If it doesn't load, the application isn't running on EC2 (see Action 4).

### Action 3: Set Up Nginx and HTTPS (10 minutes)

**Why**: So your domain works with standard HTTPS (no port number needed).

**Steps**:
```bash
# SSH into your EC2
ssh -i your-key.pem ec2-user@3.11.178.44

# Navigate to project
cd ~/genvedha-website

# Run HTTPS setup script
./setup-https.sh
```

**What this does**:
- Installs Nginx
- Configures Nginx to proxy port 80/443 → 3000
- Installs SSL certificate for your domain
- Sets up automatic HTTPS redirect

**After this**: Your site will work at `https://genvedha.com`

### Action 4: If Site Still Doesn't Work (Check Application)

If http://3.11.178.44:3000 doesn't work after adding port 3000:

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@3.11.178.44

# Check if app is running
pm2 status

# If not running, start it
cd ~/genvedha-website
pm2 start server.js --name genvedha-website
pm2 save

# Check logs
pm2 logs genvedha-website
```

---

## 📊 Timeline

| Step | Time | Result |
|------|------|--------|
| Add port 3000 to Security Group | 2 min | http://3.11.178.44:3000 works |
| Wait for immediate effect | 30 sec | Port opens |
| Test direct IP access | 1 min | Verify site loads |
| SSH into EC2 | 1 min | Access server |
| Run setup-https.sh | 10 min | Nginx + SSL configured |
| Test domain | 1 min | https://genvedha.com works |
| **Total** | **~15 min** | **Site fully operational** |

---

## 🎯 Expected Results

### After Adding Port 3000:
- ✅ http://3.11.178.44:3000 → Works
- ❌ http://genvedha.com → Doesn't work (no web server on port 80)
- ❌ https://genvedha.com → Doesn't work (no SSL yet)

### After Running setup-https.sh:
- ✅ http://3.11.178.44:3000 → Still works
- ✅ http://genvedha.com → Redirects to HTTPS
- ✅ https://genvedha.com → Works perfectly!
- ✅ https://www.genvedha.com → Also works!

---

## 🔧 Quick Commands Reference

### Add Port 3000 (AWS Console):
```
Security Groups → launch-wizard-1 → Edit inbound rules → Add rule
Type: Custom TCP | Port: 3000 | Source: 0.0.0.0/0
```

### Test Direct Access:
```bash
curl http://3.11.178.44:3000
```

### Setup HTTPS (SSH into EC2):
```bash
ssh -i your-key.pem ec2-user@3.11.178.44
cd ~/genvedha-website
./setup-https.sh
```

### Check Application Status:
```bash
pm2 status
pm2 logs genvedha-website
```

---

## 🆘 Troubleshooting

### Port 3000 added but site doesn't load?

**Check if app is running**:
```bash
ssh -i your-key.pem ec2-user@3.11.178.44
pm2 status
```

If status is "stopped" or no processes:
```bash
cd ~/genvedha-website
pm2 start server.js --name genvedha-website
pm2 save
```

### setup-https.sh fails?

**Check domain DNS**:
```bash
nslookup genvedha.com
```

Should return: 3.11.178.44

If not, wait 10-30 minutes for DNS propagation.

### Still stuck?

**Check logs**:
```bash
pm2 logs genvedha-website --lines 100
```

**Restart everything**:
```bash
pm2 restart genvedha-website
sudo systemctl restart nginx
```

---

## 📚 Documentation

- **Add Port 3000**: [`ADD-PORT-3000-GUIDE.md`](ADD-PORT-3000-GUIDE.md:1)
- **GoDaddy Setup**: [`GODADDY-DOMAIN-SETUP.md`](GODADDY-DOMAIN-SETUP.md:1)
- **Testing Guide**: [`EC2-TESTING-GUIDE.md`](EC2-TESTING-GUIDE.md:1)
- **Troubleshooting**: [`TROUBLESHOOTING-SITE-DOWN.md`](TROUBLESHOOTING-SITE-DOWN.md:1)

---

## 🎯 Summary

**Your DNS is perfect!** ✅  
**Your EC2 is running!** ✅  
**What's missing**: Port 3000 in Security Group ❌

**Next steps**:
1. Add port 3000 to AWS Security Group (2 minutes)
2. Test: http://3.11.178.44:3000
3. Run: `./setup-https.sh` on EC2 (10 minutes)
4. Access: https://genvedha.com

---

**Your Domain**: genvedha.com  
**Your EC2 IP**: 3.11.178.44  
**Security Group**: launch-wizard-1 (sg-01b24f42694bc45f6)  
**Region**: eu-west-2 (London)
