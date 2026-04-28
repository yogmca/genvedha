# IMMEDIATE FIX: MongoDB URI Format Error

## 🚨 Current Issue

The `.env` file on your EC2 server has a malformed MongoDB URI:
```
MONGODB_URI=mongodb://atlas-sql-...?ssl=true&authSource=adminw=majority
                                                              ↑ Missing & here
```

This causes: `MongoParseError: retryWrites must be either "true" or "false"`

## ✅ Quick Fix (Run on EC2 Server)

### Step 1: SSH into your EC2 server
```bash
ssh -i ~/your-key.pem ubuntu@YOUR_EC2_IP
cd ~/genvedha-website
```

### Step 2: Run the fix script
```bash
# Pull latest scripts
git pull origin production

# Run the fix
chmod +x fix-env-on-server.sh
./fix-env-on-server.sh
```

### Step 3: Verify
```bash
pm2 logs genvedha --lines 20
```

You should see:
- ✅ No "retryWrites" error
- ✅ No "EADDRINUSE" error
- ⚠️ May still see "Running in demo mode" (requires MongoDB Atlas network access)

---

## Alternative: Manual Fix

If the script doesn't work, manually edit the `.env` file:

```bash
# On EC2 server
cd ~/genvedha-website
nano .env
```

Replace the entire `MONGODB_URI` line with:
```
MONGODB_URI=mongodb://ykmysuru27_db_user:QWLP9LcE3nIRcEaY@atlas-sql-69f06bb159aabca72961dac5-ew3cgx.a.query.mongodb.net/genvedha?ssl=true&authSource=admin&retryWrites=true&w=majority
```

**Key points:**
- ✅ Username and password in the URI
- ✅ `&retryWrites=true` (with & before it)
- ✅ `&w=majority` (with & before it)

Then restart:
```bash
pm2 stop genvedha
pm2 delete genvedha
lsof -ti:3000 | xargs kill -9
pm2 start server.js --name genvedha --time
pm2 save
pm2 logs genvedha
```

---

## MongoDB Atlas Network Access

After fixing the URI, if you see "Running in demo mode":

1. Go to https://cloud.mongodb.com
2. Select your cluster
3. Click "Network Access" (left sidebar)
4. Click "Add IP Address"
5. Click "Allow Access from Anywhere" (0.0.0.0/0)
6. Click "Confirm"
7. Wait 1-2 minutes for changes to propagate
8. Restart: `pm2 restart genvedha`

---

## Verification Commands

```bash
# Check PM2 status
pm2 status

# View logs (should NOT see retryWrites error)
pm2 logs genvedha --lines 50

# Test MongoDB connection
node -e "
const { MongoClient } = require('mongodb');
require('dotenv').config();
const client = new MongoClient(process.env.MONGODB_URI);
client.connect()
  .then(() => { console.log('✅ Connected!'); client.close(); })
  .catch(err => console.error('❌ Error:', err.message));
"

# Test website
curl http://localhost:3000
```

---

## Expected Results

### ✅ Success (MongoDB Connected)
```
✅ MongoDB connected successfully!
✅ Email transporter configured successfully!
🚀 Server running on port 3000
```

### ⚠️ Partial Success (App Running, MongoDB Not Connected)
```
⚠️  Running in demo mode without database
💡 To fix: Check your MongoDB connection string in .env
✅ Email transporter configured successfully!
🚀 Server running on port 3000
```
→ Fix: Configure MongoDB Atlas network access

### ❌ Failure
```
MongoParseError: retryWrites must be either "true" or "false"
```
→ Fix: Run the fix script or manually update .env

---

## Files Created

- [`fix-env-on-server.sh`](fix-env-on-server.sh:1) - Automated fix script (run on EC2)
- Local [`.env`](.env:2) - Already fixed (for reference)

---

## Need Help?

See detailed guides:
- [`QUICK-FIX-MONGODB.md`](QUICK-FIX-MONGODB.md:1)
- [`MONGODB-PORT-FIX-GUIDE.md`](MONGODB-PORT-FIX-GUIDE.md:1)
