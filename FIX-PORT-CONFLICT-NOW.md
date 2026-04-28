# 🔧 Fix Port 3000 Conflict - IMMEDIATE ACTION

## Problem
Your application is crashing with `EADDRINUSE` error because port 3000 is already in use. PM2 keeps trying to restart but fails each time.

## Solution - Run These Commands on Your EC2 Server

### Step 1: SSH into your server
```bash
ssh -i your-key.pem ubuntu@genvedha.com
# OR
ssh root@genvedha.com
```

### Step 2: Stop all PM2 processes
```bash
pm2 stop all
pm2 delete all
```

### Step 3: Kill any process using port 3000
```bash
# Find the process
sudo lsof -i :3000

# Kill it (replace PID with the actual process ID from above)
sudo kill -9 $(sudo lsof -t -i:3000)
```

### Step 4: Verify port is free
```bash
sudo lsof -i :3000
# Should return nothing
```

### Step 5: Navigate to project and pull latest changes
```bash
cd /root/genvedha-website
git pull origin production
```

### Step 6: Rebuild and restart
```bash
npm install
npm run build
pm2 start server.js --name genvedha
pm2 save
```

### Step 7: Check status
```bash
pm2 status
pm2 logs genvedha --lines 20
```

## Alternative: One-Line Fix

Run this single command on your server:
```bash
pm2 delete all && sudo kill -9 $(sudo lsof -t -i:3000) 2>/dev/null; cd /root/genvedha-website && git pull origin production && npm install && npm run build && pm2 start server.js --name genvedha && pm2 save && pm2 status
```

## Check if it's working
```bash
curl http://localhost:3000
# Should return HTML content

# Check from outside
curl http://genvedha.com
```

## If Still Not Working

### Check what's using port 3000:
```bash
sudo netstat -tulpn | grep :3000
```

### Check PM2 logs:
```bash
pm2 logs genvedha --lines 50
```

### Check if Node is running multiple times:
```bash
ps aux | grep node
# Kill all node processes if needed:
sudo killall node
```

## Prevention

To prevent this in the future, always use PM2 commands:
- `pm2 restart genvedha` - Restart the app
- `pm2 stop genvedha` - Stop the app
- `pm2 delete genvedha` - Remove from PM2

Never run `node server.js` or `npm start` directly when using PM2!
