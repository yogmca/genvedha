# 🔧 MongoDB Connection Fix

## 🚨 Problem Identified

Your `.env` file has a **MongoDB SQL interface URI** which doesn't work with the Node.js MongoDB driver:

```
❌ WRONG: mongodb://atlas-sql-69f06bb159aabca72961dac5-ew3cgx.a.query.mongodb.net/...
```

This is causing the error:
```
querySrv ENOTFOUND _mongodb._tcp.undefined
```

---

## ✅ Solution

You need to use the **proper MongoDB Atlas connection string** format:

```
✅ CORRECT: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

---

## 🚀 Quick Fix (Automated)

### Step 1: Run the Fix Script

```bash
bash fix-mongodb-uri.sh
```

### Step 2: Provide Your Cluster Address

When prompted, enter your MongoDB Atlas cluster address.

**How to find it:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. Extract just the cluster address part

**Example:**
```
Full string: mongodb+srv://user:pass@cluster0.abc123.mongodb.net/mydb
Cluster address: cluster0.abc123.mongodb.net
```

### Step 3: Verify

The script will automatically:
- ✅ Backup your current `.env` file
- ✅ Update the MongoDB URI
- ✅ Restart your application
- ✅ Verify the connection works

---

## 🔍 Manual Fix (Alternative)

If you prefer to fix it manually:

### Step 1: Get Your MongoDB Connection String

1. Log into [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver
5. Copy the connection string

### Step 2: Update Your .env File

```bash
# Edit .env
nano .env

# Replace the MONGODB_URI line with your new connection string
# Use your existing credentials:
MONGODB_URI=mongodb+srv://ykmysuru27_db_user:QWLP9LcE3nIRcEaY@YOUR-CLUSTER-ADDRESS/genvedha?retryWrites=true&w=majority

# Save and exit (Ctrl+X, then Y, then Enter)
```

**Important:** Replace `YOUR-CLUSTER-ADDRESS` with your actual cluster address from MongoDB Atlas.

### Step 3: Restart Application

```bash
# Stop all PM2 processes
pm2 stop all
pm2 delete all

# Kill any process on port 3000
sudo lsof -ti:3000 | xargs kill -9

# Start fresh
pm2 start server.js --name genvedha

# Save configuration
pm2 save
```

### Step 4: Verify Connection

```bash
# Check logs for successful connection
pm2 logs genvedha --lines 50

# Look for this message:
# ✅ Connected to MongoDB successfully!
```

---

## 🔍 Understanding the Issue

### What's Wrong with the Current URI?

Your current URI uses MongoDB's **SQL interface**:
```
mongodb://atlas-sql-69f06bb159aabca72961dac5-ew3cgx.a.query.mongodb.net/...
```

This is for SQL-like queries and **doesn't work** with:
- Node.js MongoDB driver
- Mongoose
- Standard MongoDB connections

### What You Need Instead

The **standard MongoDB Atlas URI**:
```
mongodb+srv://username:password@cluster.mongodb.net/database
```

This uses:
- `mongodb+srv://` protocol (with SRV DNS lookup)
- Your actual cluster address
- Proper authentication
- Standard MongoDB wire protocol

---

## 📋 Your Current Credentials

From your `.env` file:
- **Username:** `ykmysuru27_db_user`
- **Password:** `QWLP9LcE3nIRcEaY`
- **Database:** `genvedha`

You just need to get the correct **cluster address** from MongoDB Atlas.

---

## 🌐 Finding Your Cluster Address

### Method 1: MongoDB Atlas Dashboard

1. Go to https://cloud.mongodb.com
2. Select your project
3. Click **"Connect"** on your cluster
4. Choose **"Connect your application"**
5. You'll see a connection string like:
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
   ```
6. The cluster address is: `cluster0.xxxxx.mongodb.net`

### Method 2: From Your SQL URI

Your SQL URI contains a hint:
```
atlas-sql-69f06bb159aabca72961dac5-ew3cgx.a.query.mongodb.net
```

The cluster ID is: `69f06bb159aabca72961dac5`

Your actual cluster address might be something like:
- `cluster0.69f06bb.mongodb.net`
- `69f06bb159aabca72961dac5.mongodb.net`

Check MongoDB Atlas to confirm the exact format.

---

## ✅ Expected Results After Fix

### Successful Connection Logs

```bash
pm2 logs genvedha
```

Should show:
```
✅ Email transporter configured successfully!
✅ Connected to MongoDB successfully!
Server is running on port 3000
```

### No More Errors

These errors should be **gone**:
- ❌ `querySrv ENOTFOUND _mongodb._tcp.undefined`
- ❌ `MongoDB connection error`

### Application Status

```bash
pm2 status
```

Should show:
```
┌────┬──────────┬─────────┬─────────┬────────┬──────┬───────────┐
│ id │ name     │ mode    │ pid     │ uptime │ ↺    │ status    │
├────┼──────────┼─────────┼─────────┼────────┼──────┼───────────┤
│ 0  │ genvedha │ fork    │ XXXXX   │ Xm     │ 0    │ online    │
└────┴──────────┴─────────┴─────────┴────────┴──────┴───────────┘
```

Status: **online** ✅

---

## 🧪 Testing After Fix

### Quick Test

```bash
# Test localhost
curl http://localhost:3000

# Should return your website HTML
```

### Full Test

```bash
bash test-ec2-deployment.sh
```

Should show:
- ✅ MongoDB connection successful
- ✅ Application online
- ✅ No errors in logs

---

## 🆘 Troubleshooting

### Issue: Still getting connection errors

**Check:**
1. **Network Access** in MongoDB Atlas
   - Go to "Network Access" in Atlas
   - Add your EC2 IP address or use `0.0.0.0/0` (allow all)

2. **Database User** exists
   - Go to "Database Access" in Atlas
   - Verify `ykmysuru27_db_user` exists
   - Verify password is correct

3. **Cluster is running**
   - Check cluster status in Atlas
   - Ensure it's not paused

### Issue: Can't find cluster address

**Solution:**
- Contact MongoDB Atlas support
- Or create a new connection string from Atlas dashboard
- The "Connect" button will always show the correct format

### Issue: Application won't start

**Check:**
```bash
# View detailed error logs
pm2 logs genvedha --err --lines 50

# Check if port is in use
sudo netstat -tuln | grep 3000

# Check .env file syntax
cat .env
```

---

## 📞 Need Help?

### Check MongoDB Atlas

1. Verify cluster is running
2. Check network access settings
3. Verify database user credentials
4. Get fresh connection string

### Check Application Logs

```bash
# Real-time logs
pm2 logs genvedha

# Last 100 lines
pm2 logs genvedha --lines 100 --nostream

# Only errors
pm2 logs genvedha --err
```

### Run Diagnostics

```bash
# Full deployment test
bash test-ec2-deployment.sh

# Check MongoDB specifically
pm2 logs genvedha | grep -i mongo
```

---

## 🎯 Success Checklist

After fixing, verify:

- [ ] `.env` has correct `mongodb+srv://` URI
- [ ] Application starts without errors
- [ ] Logs show "Connected to MongoDB successfully"
- [ ] PM2 status shows "online"
- [ ] No ENOTFOUND errors in logs
- [ ] Application accessible via browser
- [ ] Test script passes MongoDB connection test

---

## 📚 Additional Resources

- [MongoDB Atlas Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [Troubleshooting Connections](https://www.mongodb.com/docs/atlas/troubleshoot-connection/)

---

**Remember:** Always use `mongodb+srv://` for MongoDB Atlas connections! 🔐
