# EC2 Pull Fix - Get LLM Service on Production Server

## Issue
The EC2 server has local changes to `package.json` and `package-lock.json` that prevent pulling the latest code with the LLM service.

## Error Message
```
error: Your local changes to the following files would be overwritten by merge:
        package-lock.json
        package.json
Please commit your changes or stash them before you merge.
```

## Solution - Stash Local Changes and Pull

### Step 1: SSH into EC2 Server
```bash
ssh -i ~/your-key.pem ubuntu@YOUR_EC2_IP
```

### Step 2: Navigate to Project Directory
```bash
cd ~/genvedha-website
```

### Step 3: Check Current Status
```bash
git status
```

### Step 4: Stash Local Changes
This will save your local changes temporarily:
```bash
git stash save "Local package.json changes before LLM service pull"
```

### Step 5: Pull Latest Code from Production
```bash
git pull origin production
```

### Step 6: Verify LLM Service is Present
```bash
ls -la genvedha-llm-service/
```

You should see:
```
genvedha-llm-service/
├── config/
├── services/
├── templates/
├── index.js
├── package.json
└── README.md
```

### Step 7: Install Dependencies
```bash
# Install main project dependencies (if package.json changed)
npm install

# Install LLM service dependencies
cd genvedha-llm-service
npm install
cd ..
```

### Step 8: Configure Environment Variables
```bash
# Check if .env has LLM service variables
nano .env
```

Add these if missing:
```env
# GenVedha LLM Service Configuration
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
GENVEDHA_SERVICE_PORT=3001
ENABLE_GENVEDHA_SERVICE=true
GENVEDHA_API_KEY=your_genvedha_api_key_here
```

### Step 9: Restart the Application
```bash
# Stop current processes
pm2 stop all

# Start the main server
pm2 start server.js --name genvedha-website

# Start the LLM service
pm2 start genvedha-llm-service/index.js --name genvedha-llm-service

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

## Alternative: Force Pull (Use with Caution)

If you don't need the local changes:

```bash
# Backup current state
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

# Reset to remote state
git reset --hard origin/production

# Pull latest
git pull origin production

# Install dependencies
npm install
cd genvedha-llm-service && npm install && cd ..
```

## Verify LLM Service is Running

### Check PM2 Status
```bash
pm2 status
```

You should see both:
- `genvedha-website` (port 3000)
- `genvedha-llm-service` (port 3001)

### Test LLM Service Endpoint
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "GenVedha LLM Service",
  "version": "1.0.0"
}
```

### Check Logs
```bash
# View LLM service logs
pm2 logs genvedha-llm-service

# View main website logs
pm2 logs genvedha-website
```

## What Changed in package.json

The LLM service added these dependencies:
- `@anthropic-ai/sdk` - Claude AI integration
- `fs-extra` - Enhanced file system operations

These are already in the main `package.json`, so the LLM service shares the parent dependencies.

## Troubleshooting

### Issue: LLM Service Won't Start
```bash
# Check if port 3001 is in use
sudo lsof -i :3001

# Kill process if needed
sudo kill -9 <PID>

# Restart
pm2 restart genvedha-llm-service
```

### Issue: Missing Dependencies
```bash
cd ~/genvedha-website
npm install
cd genvedha-llm-service
npm install
```

### Issue: Permission Errors
```bash
# Fix ownership
sudo chown -R ubuntu:ubuntu ~/genvedha-website

# Fix permissions
chmod -R 755 ~/genvedha-website
```

## Quick Command Summary

```bash
# Complete fix in one go
cd ~/genvedha-website
git stash
git pull origin production
npm install
cd genvedha-llm-service && npm install && cd ..
pm2 restart all
pm2 save
pm2 status
```

## Verify Everything Works

1. **Check website**: `https://genvedha.com`
2. **Check Genvedha Guru**: `https://genvedha.com/genvedha-guru.html`
3. **Test app generation**: Try creating a test e-commerce app

## Notes

- The `.env` file is NOT tracked in git (protected by `.gitignore`)
- You need to manually add Claude API key to `.env` on the server
- The LLM service runs on port 3001 by default
- Both services should be managed by PM2 for auto-restart

## Success Indicators

✅ `git pull` completes without errors
✅ `genvedha-llm-service/` directory exists
✅ Both PM2 processes show "online" status
✅ Health check returns 200 OK
✅ Genvedha Guru page loads successfully
