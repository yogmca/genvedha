# MongoDB Connection & Port Conflict Fix Guide

## Issues Identified

From the PM2 logs, two critical issues were found:

### 1. MongoDB Connection Error
```
⚠️  MongoDB connection error: retryWrites must be either "true" or "false"
```

**Root Cause**: The MongoDB URI in `.env` was missing the `retryWrites` parameter.

### 2. Port Conflict Error
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Root Cause**: Multiple instances of the application are trying to use port 3000.

---

## Solution Applied

### Fixed MongoDB URI Format

**Before:**
```
MONGODB_URI=mongodb://atlas-sql-69f06bb159aabca72961dac5-ew3cgx.a.query.mongodb.net/genvedha?ssl=true&authSource=admin
```

**After:**
```
MONGODB_URI=mongodb://ykmysuru27_db_user:QWLP9LcE3nIRcEaY@atlas-sql-69f06bb159aabca72961dac5-ew3cgx.a.query.mongodb.net/genvedha?ssl=true&authSource=admin&retryWrites=true&w=majority
```

**Key Changes:**
1. ✅ Added username and password to the connection string
2. ✅ Added `retryWrites=true` parameter
3. ✅ Added `w=majority` parameter for write concern

---

## Deployment Instructions

### Option 1: Automated Fix (Recommended)

Run the automated fix script on your EC2 server:

```bash
# SSH into your EC2 server
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to project directory
cd ~/genvedha-website

# Pull the latest changes (including fixed .env)
git pull origin main

# Run the fix script
./fix-mongodb-and-restart.sh
```

### Option 2: Manual Fix

If you prefer to fix manually:

```bash
# 1. Stop PM2 process
pm2 stop genvedha
pm2 delete genvedha

# 2. Kill any process on port 3000
lsof -ti:3000 | xargs kill -9

# 3. Update .env file with correct MongoDB URI
nano .env
# Paste the corrected MONGODB_URI from above

# 4. Test MongoDB connection
node -e "
const { MongoClient } = require('mongodb');
require('dotenv').config();
const client = new MongoClient(process.env.MONGODB_URI);
client.connect()
  .then(() => { console.log('✅ Connected!'); client.close(); })
  .catch(err => console.error('❌ Error:', err.message));
"

# 5. Start the application
pm2 start server.js --name genvedha --time
pm2 save

# 6. Check status
pm2 status
pm2 logs genvedha --lines 50
```

---

## Verification Steps

After running the fix, verify everything is working:

### 1. Check PM2 Status
```bash
pm2 status
```
Expected: `genvedha` should show status `online`

### 2. Check Application Logs
```bash
pm2 logs genvedha --lines 20
```
Expected: Should NOT see "retryWrites" error or "EADDRINUSE" error

### 3. Test Local Connection
```bash
curl http://localhost:3000
```
Expected: Should return HTML content

### 4. Test External Connection
```bash
curl http://your-domain.com
```
Expected: Website should load

### 5. Test Contact Form
- Visit your website
- Fill out the contact form
- Submit
- Check if submission is saved to MongoDB

---

## MongoDB Atlas Configuration

If you still see "Running in demo mode" after the fix, you need to configure MongoDB Atlas:

### 1. Network Access (Whitelist IP)

**Option A: Allow All IPs (Quick Fix)**
```
IP Address: 0.0.0.0/0
Description: Allow all IPs
```

**Option B: Whitelist Specific IP (More Secure)**
```bash
# Get your EC2 public IP
curl http://checkip.amazonaws.com

# Add this IP to MongoDB Atlas Network Access
```

Steps in MongoDB Atlas:
1. Go to https://cloud.mongodb.com
2. Select your cluster
3. Click "Network Access" in left sidebar
4. Click "Add IP Address"
5. Either:
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Or enter your EC2 public IP
6. Click "Confirm"

### 2. Database User Credentials

Verify your database user exists:
1. Go to "Database Access" in MongoDB Atlas
2. Verify user `ykmysuru27_db_user` exists
3. If not, create it with password: `QWLP9LcE3nIRcEaY`
4. Ensure it has "Read and write to any database" privileges

### 3. Connection String Format

Your connection string should follow this format:
```
mongodb://[username]:[password]@[host]/[database]?[options]
```

For MongoDB Atlas SQL interface:
```
mongodb://username:password@atlas-sql-xxxxx.a.query.mongodb.net/database?ssl=true&authSource=admin&retryWrites=true&w=majority
```

---

## Troubleshooting

### Issue: Still seeing "retryWrites" error

**Solution:**
```bash
# Verify .env file has correct format
cat .env | grep MONGODB_URI

# Should contain: retryWrites=true
```

### Issue: Still seeing "EADDRINUSE" error

**Solution:**
```bash
# Find and kill all processes on port 3000
sudo lsof -ti:3000 | xargs sudo kill -9

# Or use fuser
sudo fuser -k 3000/tcp

# Then restart
pm2 restart genvedha
```

### Issue: "Running in demo mode"

This means the app is running but can't connect to MongoDB. Check:

1. **Network Access**: Is your IP whitelisted in MongoDB Atlas?
2. **Credentials**: Are username/password correct?
3. **Connection String**: Does it have all required parameters?

**Test connection:**
```bash
node -e "
const { MongoClient } = require('mongodb');
require('dotenv').config();
const uri = process.env.MONGODB_URI;
console.log('Testing:', uri.replace(/:[^:@]+@/, ':****@'));
const client = new MongoClient(uri);
client.connect()
  .then(() => { console.log('✅ Success!'); return client.close(); })
  .catch(err => console.error('❌ Failed:', err.message));
"
```

### Issue: MongoDB connection timeout

**Possible causes:**
1. EC2 security group blocking outbound traffic
2. MongoDB Atlas network access not configured
3. Incorrect connection string

**Solution:**
```bash
# Test if you can reach MongoDB Atlas
nc -zv atlas-sql-69f06bb159aabca72961dac5-ew3cgx.a.query.mongodb.net 27017

# Check EC2 security group allows outbound traffic on port 27017
```

---

## Quick Reference Commands

```bash
# View logs
pm2 logs genvedha

# Restart application
pm2 restart genvedha

# Stop application
pm2 stop genvedha

# Check status
pm2 status

# View environment variables
pm2 env genvedha

# Monitor in real-time
pm2 monit

# Clear logs
pm2 flush genvedha
```

---

## Files Modified

1. **`.env`** - Updated MongoDB URI with correct format
2. **`fix-mongodb-and-restart.sh`** - Automated fix script

---

## Next Steps

1. ✅ Run the fix script on EC2 server
2. ✅ Verify MongoDB connection works
3. ✅ Test contact form submission
4. ✅ Monitor logs for any errors
5. ✅ Configure MongoDB Atlas network access if needed

---

## Support

If you continue to experience issues:

1. Check PM2 logs: `pm2 logs genvedha --lines 100`
2. Check MongoDB Atlas status: https://status.mongodb.com
3. Verify EC2 security groups allow outbound traffic
4. Test MongoDB connection with the test command above

---

**Last Updated**: 2026-04-28
**Status**: Ready for deployment
