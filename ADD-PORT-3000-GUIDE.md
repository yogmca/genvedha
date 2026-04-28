# 🔓 Add Port 3000 to AWS Security Group

## ✅ Problem Identified

Your Security Group `launch-wizard-1` (sg-01b24f42694bc45f6) is **missing port 3000**.

**Current Rules**:
- ✅ Port 22 (SSH)
- ✅ Port 80 (HTTP)
- ✅ Port 443 (HTTPS)
- ❌ **Port 3000 (Node.js) - MISSING**

---

## 🚀 Quick Fix (5 Minutes)

### Step 1: Edit Inbound Rules

You're already on the right page! Now:

1. **Click the "Edit inbound rules" button** (top right of the inbound rules section)

### Step 2: Add Port 3000 Rule

2. **Click "Add rule"** button
3. Fill in the new rule:
   - **Type**: Select `Custom TCP`
   - **Protocol**: TCP (auto-filled)
   - **Port range**: `3000`
   - **Source**: Select `Anywhere-IPv4` or type `0.0.0.0/0`
   - **Description**: `Node.js application` (optional)

### Step 3: Save Rules

4. **Click "Save rules"** button (bottom right)
5. **Wait 10-20 seconds** for the rule to take effect

### Step 4: Test Your Site

6. Open your browser and go to: http://3.11.178.44:3000
7. Your site should now load! 🎉

---

## 📋 Visual Guide

Your inbound rules should look like this after adding port 3000:

```
Inbound rules (4)

Name | Type      | Protocol | Port Range | Source      | Description
-----|-----------|----------|------------|-------------|------------------
–    | SSH       | TCP      | 22         | 0.0.0.0/0   | –
–    | HTTP      | TCP      | 80         | 0.0.0.0/0   | –
–    | HTTPS     | TCP      | 443        | 0.0.0.0/0   | –
–    | Custom TCP| TCP      | 3000       | 0.0.0.0/0   | Node.js application ⭐ NEW
```

---

## 🧪 Test After Adding Rule

### From Command Line:
```bash
curl -I http://3.11.178.44:3000
```

**Expected**: Should return HTTP 200 OK

### From Browser:
1. Open browser
2. Navigate to: http://3.11.178.44:3000
3. Should load your GenVedha website

---

## ⚠️ Important Notes

### About Port 3000

- **Port 3000** is needed because your Node.js application runs on this port
- This is defined in your server.js file
- Without this rule, AWS blocks all traffic to port 3000

### Security Considerations

- **Source 0.0.0.0/0** means "allow from anywhere" - this is correct for a public website
- If you want to restrict access, you can change the source to specific IP addresses
- For production, you should eventually set up Nginx to proxy port 80/443 to port 3000

### After HTTPS Setup

Once you set up HTTPS with Nginx:
- Your site will be accessible via your domain
- Nginx will proxy requests from port 443 to port 3000
- You can then optionally remove the port 3000 rule for extra security
- But for now, keep port 3000 open for direct access

---

## 🔧 Alternative: Use AWS CLI

If you prefer command line:

```bash
# Add port 3000 rule
aws ec2 authorize-security-group-ingress \
  --group-id sg-01b24f42694bc45f6 \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0 \
  --region eu-west-2
```

---

## ✅ Verification Checklist

After adding the rule:

- [ ] Rule appears in Security Group inbound rules
- [ ] Port range shows: 3000
- [ ] Source shows: 0.0.0.0/0
- [ ] Waited 10-20 seconds
- [ ] Tested with curl command
- [ ] Browser loads the site
- [ ] Website displays correctly

---

## 🆘 Still Not Working?

If the site still doesn't load after adding port 3000:

### Check Application Status

SSH into your EC2 and check if the app is running:

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@3.11.178.44

# Check PM2 status
pm2 status

# Should show: genvedha-website | online
```

If app is not running:
```bash
cd ~/genvedha-website
pm2 start server.js --name genvedha-website
pm2 save
```

### Check Logs

```bash
# View application logs
pm2 logs genvedha-website --lines 50

# Test locally on EC2
curl http://localhost:3000
```

---

## 📚 Next Steps

After your site is accessible on port 3000:

1. **Set up domain** (if you have one)
2. **Set up HTTPS**: Run setup-https.sh on EC2
3. **Configure Nginx**: Will proxy port 443 to 3000
4. **Test thoroughly**: Verify all functionality

---

## 🎯 Summary

**Problem**: Port 3000 not open in Security Group  
**Solution**: Add Custom TCP rule for port 3000 with source 0.0.0.0/0  
**Time**: 2 minutes  
**Result**: Site accessible at http://3.11.178.44:3000

---

**Your Security Group**: launch-wizard-1 (sg-01b24f42694bc45f6)  
**Your EC2 IP**: 3.11.178.44  
**Test URL**: http://3.11.178.44:3000  
**Region**: eu-west-2 (London)
