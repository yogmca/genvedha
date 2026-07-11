# PM2 Process Management Guide

## Current Situation
You have multiple PM2 processes running, including duplicates and one errored process:
- `genvedha` (id: 0) - ✅ Running successfully for 36 hours
- `genvedha-server` (id: 1) - ❌ Errored (210 restarts)
- `genvedha-app` (id: 2) - ✅ Just started

## Immediate Action Required

### Step 1: Stop All PM2 Processes
```bash
pm2 stop all
```

### Step 2: Delete All PM2 Processes
```bash
pm2 delete all
```

### Step 3: Start Fresh with One Process
```bash
pm2 start server.js --name genvedha-website
```

### Step 4: Save PM2 Configuration
```bash
pm2 save
```

### Step 5: Setup PM2 to Start on System Reboot
```bash
pm2 startup
# Follow the command it outputs (it will give you a sudo command to run)
```

## Verify Everything is Working

### Check PM2 Status
```bash
pm2 status
```
You should see only ONE process named `genvedha-website` with status "online"

### Check Application Logs
```bash
pm2 logs genvedha-website --lines 50
```

### Check if App is Responding
```bash
curl http://localhost:3000
```

## Useful PM2 Commands

### View Logs
```bash
# Real-time logs
pm2 logs

# Last 100 lines
pm2 logs --lines 100

# Logs for specific app
pm2 logs genvedha-website
```

### Restart Application
```bash
pm2 restart genvedha-website
```

### Stop Application
```bash
pm2 stop genvedha-website
```

### Monitor Resources
```bash
pm2 monit
```

### View Detailed Info
```bash
pm2 show genvedha-website
```

## Troubleshooting

### If App Keeps Crashing
1. Check logs: `pm2 logs genvedha-website --lines 100`
2. Check if MongoDB is running: `sudo systemctl status mongod`
3. Check if port 3000 is available: `sudo lsof -i :3000`
4. Verify environment variables: `pm2 env 0` (replace 0 with your app id)

### If Port is Already in Use
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process (replace PID with actual process ID)
sudo kill -9 PID
```

### Check Environment Variables
```bash
# View environment for a specific PM2 process
pm2 env 0  # Replace 0 with your process id
```

## Best Practices

1. **Use only ONE PM2 process** for your application
2. **Always save PM2 config** after making changes: `pm2 save`
3. **Setup startup script** so app restarts after server reboot
4. **Monitor logs regularly** to catch issues early
5. **Use meaningful names** for PM2 processes

## Quick Reference

```bash
# Clean slate
pm2 delete all

# Start app
pm2 start server.js --name genvedha-website

# Save configuration
pm2 save

# View status
pm2 status

# View logs
pm2 logs

# Restart
pm2 restart genvedha-website
```

## Why You Had Multiple Processes

The issue occurred because:
1. You started the app multiple times with different names
2. PM2 doesn't automatically replace existing processes
3. Each `pm2 start` command creates a NEW process

**Solution**: Always use `pm2 restart` to restart an existing process, or `pm2 delete` before starting a new one.

## Next Steps

1. ✅ Stop and delete all current PM2 processes
2. ✅ Start ONE fresh process
3. ✅ Save PM2 configuration
4. ✅ Setup PM2 startup script
5. ✅ Verify application is working
6. ✅ Check that HTTPS/SSL is working: https://genvedha.com

---

**Note**: The `genvedha-server` process with 210 restarts indicates it was crashing repeatedly. After cleaning up, if you still see crashes, check the logs to identify the root cause.
