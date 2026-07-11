# How to Add Claude API Key on EC2 for LLM Service

## Quick Steps

### 1. SSH into EC2
```bash
ssh -i ~/your-key.pem ubuntu@YOUR_EC2_IP
```

### 2. Navigate to Project Directory
```bash
cd ~/genvedha-website
```

### 3. Edit the .env File
```bash
nano .env
```

### 4. Add These Lines (if not present)
Add or update these lines in the `.env` file:

```env
# GenVedha LLM Service Configuration
CLAUDE_API_KEY=sk-ant-api03-your-actual-claude-api-key-here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
GENVEDHA_SERVICE_PORT=3001
ENABLE_GENVEDHA_SERVICE=true
GENVEDHA_API_KEY=genvedha_secret_key_123
```

### 5. Save and Exit
- Press `Ctrl + O` to save
- Press `Enter` to confirm
- Press `Ctrl + X` to exit

### 6. Restart the LLM Service
```bash
pm2 restart genvedha-llm-service
```

### 7. Check if it's Working
```bash
pm2 logs genvedha-llm-service --lines 50
```

You should see:
```
✅ GenVedha LLM Service started successfully
🚀 Server running on port 3001
```

## Where to Get Claude API Key

1. Go to: https://console.anthropic.com/
2. Sign in or create an account
3. Go to "API Keys" section
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-api03-`)
6. Paste it in the `.env` file on EC2

## Complete .env File Example

Your `.env` file on EC2 should look like this:

```env
# MongoDB Configuration
MONGODB_USERNAME=your_mongodb_username
MONGODB_PASSWORD=your_mongodb_password
MONGODB_CLUSTER=your_cluster.mongodb.net
MONGODB_DATABASE=genvedha_contacts

# Server Configuration
PORT=3000

# GenVedha LLM Service Configuration
CLAUDE_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLAUDE_MODEL=claude-3-5-sonnet-20241022
GENVEDHA_SERVICE_PORT=3001
ENABLE_GENVEDHA_SERVICE=true
GENVEDHA_API_KEY=genvedha_secret_key_123

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=GenVedha <your_email@gmail.com>
EMAIL_TO=support@genvedha.com
```

## Test the Chatbot

### 1. Check Service Health
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

### 2. Test from Browser
Visit: `https://genvedha.com/genvedha-guru.html`

The chatbot should now work!

## Troubleshooting

### Issue: "CLAUDE_API_KEY is not configured"

**Solution:**
```bash
cd ~/genvedha-website
nano .env
# Add: CLAUDE_API_KEY=sk-ant-api03-your-key-here
pm2 restart genvedha-llm-service
```

### Issue: Service not starting

**Check logs:**
```bash
pm2 logs genvedha-llm-service --lines 100
```

**Common errors:**
- Invalid API key → Check if key is correct
- Port already in use → Kill process on port 3001
- Missing dependencies → Run `cd genvedha-llm-service && npm install`

### Issue: Chatbot shows "Service unavailable"

**Check if service is running:**
```bash
pm2 status
```

Both should show "online":
- genvedha-website
- genvedha-llm-service

**Restart both:**
```bash
pm2 restart all
```

## Quick Fix Script

Run this on EC2 to check everything:

```bash
cd ~/genvedha-website

# Check if .env has Claude API key
if grep -q "CLAUDE_API_KEY=sk-ant" .env; then
    echo "✅ Claude API key found"
else
    echo "❌ Claude API key NOT found or invalid"
    echo "Please edit .env and add your Claude API key"
fi

# Check if LLM service is running
if pm2 list | grep -q "genvedha-llm-service.*online"; then
    echo "✅ LLM service is running"
else
    echo "❌ LLM service is NOT running"
    echo "Starting LLM service..."
    pm2 start genvedha-llm-service/index.js --name genvedha-llm-service
fi

# Test health endpoint
if curl -s http://localhost:3001/health | grep -q "healthy"; then
    echo "✅ LLM service health check passed"
else
    echo "❌ LLM service health check failed"
fi
```

## Security Note

⚠️ **IMPORTANT**: Never commit the `.env` file to git!

The `.gitignore` file already excludes it, but double-check:
```bash
git status
# .env should NOT appear in the list
```

## Summary

1. **Edit .env**: `nano ~/genvedha-website/.env`
2. **Add Claude API key**: `CLAUDE_API_KEY=sk-ant-api03-xxxxx`
3. **Restart service**: `pm2 restart genvedha-llm-service`
4. **Test**: Visit `https://genvedha.com/genvedha-guru.html`

That's it! The chatbot should now work. 🎉
