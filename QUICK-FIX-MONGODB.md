# Quick Fix: MongoDB Connection & Port Conflict

## 🚨 Issues Found

1. **MongoDB Error**: `retryWrites must be either "true" or "false"`
2. **Port Conflict**: `EADDRINUSE: address already in use :::3000`

## ✅ Solution Applied

### Fixed MongoDB URI in `.env`:
```bash
# OLD (Missing retryWrites and credentials in URI)
MONGODB_URI=mongodb://atlas-sql-69f06bb159aabca72961dac5-ew3cgx.a.query.mongodb.net/genvedha?ssl=true&authSource=admin

# NEW (Correct format with all parameters)
MONGODB_URI=mongodb://ykmysuru27_db_user:QWLP9LcE3nIRcEaY@atlas-sql-69f06bb159aabca72961dac5-ew3cgx.a.query.mongodb.net/genvedha?ssl=true&authSource=admin&retryWrites=true&w=majority
```

## 🚀 Deploy to EC2 (Choose One Method)

### Method 1: Automated Deployment (Easiest)

```bash
# Run the deployment script
./deploy-mongodb-fix.sh

# Follow the prompts:
# - Enter EC2 IP address
# - Enter path to SSH key
```

### Method 2: Manual Deployment

```bash
# 1. Upload .env file
scp -i ~/your-key.pem .env ubuntu@YOUR_EC2_IP:~/genvedha-website/.env

# 2. Upload fix script
scp -i ~/your-key.pem fix-mongodb-and-restart.sh ubuntu@YOUR_EC2_IP:~/genvedha-website/

# 3. SSH into EC2 and run fix
ssh -i ~/your-key.pem ubuntu@YOUR_EC2_IP
cd ~/genvedha-website
chmod +x fix-mongodb-and-restart.sh
./fix-mongodb-and-restart.sh
```

### Method 3: Direct SSH Commands

```bash
# SSH into EC2
ssh -i ~/your-key.pem ubuntu@YOUR_EC2_IP

# Run these commands:
cd ~/genvedha-website

# Stop PM2
pm2 stop genvedha
pm2 delete genvedha

# Kill port 3000
lsof -ti:3000 | xargs kill -9

# Update .env (paste the corrected MONGODB_URI)
nano .env

# Restart
pm2 start server.js --name genvedha --time
pm2 save
pm2 logs genvedha
```

## 🔍 Verify Fix

```bash
# Check PM2 status
ssh -i ~/your-key.pem ubuntu@YOUR_EC2_IP 'pm2 status'

# Check logs (should NOT see retryWrites error or EADDRINUSE)
ssh -i ~/your-key.pem ubuntu@YOUR_EC2_IP 'pm2 logs genvedha --lines 20'

# Test website
curl http://YOUR_EC2_IP:3000
```

## ⚠️ If Still Seeing "Running in demo mode"

This means the app is running but can't connect to MongoDB. Fix MongoDB Atlas:

### 1. Whitelist IP in MongoDB Atlas

**Quick Fix (Allow All):**
1. Go to https://cloud.mongodb.com
2. Click "Network Access"
3. Click "Add IP Address"
4. Click "Allow Access from Anywhere" (0.0.0.0/0)
5. Click "Confirm"

**Secure Fix (Specific IP):**
```bash
# Get your EC2 public IP
ssh -i ~/your-key.pem ubuntu@YOUR_EC2_IP 'curl http://checkip.amazonaws.com'

# Add this IP to MongoDB Atlas Network Access
```

### 2. Verify Database User

1. Go to "Database Access" in MongoDB Atlas
2. Verify user `ykmysuru27_db_user` exists
3. Password should be: `QWLP9LcE3nIRcEaY`
4. Ensure "Read and write to any database" permission

## 📁 Files Created/Modified

- ✅ [`.env`](.env) - Fixed MongoDB URI
- ✅ [`fix-mongodb-and-restart.sh`](fix-mongodb-and-restart.sh) - Automated fix script
- ✅ [`deploy-mongodb-fix.sh`](deploy-mongodb-fix.sh) - Deployment script
- ✅ [`MONGODB-PORT-FIX-GUIDE.md`](MONGODB-PORT-FIX-GUIDE.md) - Detailed guide

## 🆘 Quick Troubleshooting

| Issue | Command |
|-------|---------|
| Check if app is running | `pm2 status` |
| View logs | `pm2 logs genvedha` |
| Restart app | `pm2 restart genvedha` |
| Kill port 3000 | `lsof -ti:3000 \| xargs kill -9` |
| Test MongoDB connection | See MONGODB-PORT-FIX-GUIDE.md |

## 📞 Need Help?

See detailed guide: [`MONGODB-PORT-FIX-GUIDE.md`](MONGODB-PORT-FIX-GUIDE.md)
