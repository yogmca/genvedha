# Fix Contact Form on EC2

## Issue
Contact form showing: "An error occurred while submitting your request. Please try again."

---

## Likely Causes

1. ❌ .env file not deployed to server
2. ❌ Email configuration missing
3. ❌ MongoDB connection issue
4. ❌ Server not restarted after .env update
5. ❌ CORS or API endpoint issue

---

## Quick Fix Steps

### Step 1: SSH into Server

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /home/ubuntu/genvedha-website
```

### Step 2: Check if .env Exists

```bash
ls -la .env
```

**If missing:**
```bash
# Copy from local machine
# On your local machine:
scp -i your-key.pem .env ubuntu@your-ec2-ip:/home/ubuntu/genvedha-website/
```

### Step 3: Verify Email Configuration

```bash
cat .env | grep EMAIL
```

**Should show:**
```
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=support@genvedha.com
EMAIL_PASSWORD=Leopard@2026
EMAIL_FROM=GenVedha <support@genvedha.com>
EMAIL_TO=support@genvedha.com
```

**If missing, add it:**
```bash
nano .env
# Add the email configuration lines above
# Save: Ctrl+X, Y, Enter
```

### Step 4: Restart Application

```bash
pm2 restart genvedha-app
```

### Step 5: Check Logs

```bash
pm2 logs genvedha-app --lines 50
```

**Look for:**
- ✅ `Email transporter configured successfully!`
- ✅ `Connected to MongoDB successfully!`
- ✅ `Server is running on http://localhost:3000`

**If you see errors:**
- ❌ `Email transporter not configured` → .env missing EMAIL_* variables
- ❌ `MongoDB connection error` → Check MONGODB_URI
- ❌ `Error: Cannot find module` → Run `npm install`

### Step 6: Test API Directly

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "Test message"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Thank you for contacting us! We will get back to you soon.",
  "emailSent": true
}
```

---

## Complete Fix Script

Run this on your EC2 server:

```bash
cd /home/ubuntu/genvedha-website

# Check .env
if [ ! -f .env ]; then
    echo "❌ .env file missing!"
    echo "Please copy .env from local machine"
    exit 1
fi

# Verify email config
if ! grep -q "EMAIL_HOST" .env; then
    echo "❌ Email configuration missing in .env"
    echo "Adding email configuration..."
    cat >> .env << 'EOF'

# Email Configuration (GoDaddy SMTP)
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=support@genvedha.com
EMAIL_PASSWORD=Leopard@2026
EMAIL_FROM=GenVedha <support@genvedha.com>
EMAIL_TO=support@genvedha.com
EOF
fi

# Restart application
echo "🔄 Restarting application..."
pm2 restart genvedha-app

# Wait for startup
sleep 3

# Check logs
echo "📝 Checking logs..."
pm2 logs genvedha-app --lines 20 --nostream

# Test health
echo "🏥 Testing health endpoint..."
curl http://localhost:3000/api/health

echo ""
echo "✅ Fix complete! Test the contact form now."
```

---

## Alternative: Manual .env Update

If you can't copy the file, manually add the configuration:

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /home/ubuntu/genvedha-website
nano .env
```

Add these lines at the end:

```env
# Email Configuration (GoDaddy SMTP)
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=support@genvedha.com
EMAIL_PASSWORD=Leopard@2026
EMAIL_FROM=GenVedha <support@genvedha.com>
EMAIL_TO=support@genvedha.com
```

Save (Ctrl+X, Y, Enter) and restart:

```bash
pm2 restart genvedha-app
pm2 logs genvedha-app
```

---

## Verify It's Working

### 1. Check Server Logs
```bash
pm2 logs genvedha-app --lines 50
```

Should show:
```
✅ Email transporter configured successfully!
✅ Connected to MongoDB successfully!
```

### 2. Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "success": true,
  "message": "Server is running",
  "database": "connected",
  "email": "configured"
}
```

### 3. Test Contact Form
- Go to https://genvedha.com
- Fill out contact form
- Submit
- Should see success message
- Check support@genvedha.com for email

---

## Common Issues & Solutions

### Issue: "Cannot POST /api/contact"
**Cause:** Server not running or wrong route  
**Solution:** 
```bash
pm2 restart genvedha-app
curl http://localhost:3000/api/health
```

### Issue: "CORS error"
**Cause:** Frontend trying to access API from different domain  
**Solution:** Already handled in server.js with `app.use(cors())`

### Issue: "Email transporter not configured"
**Cause:** .env missing EMAIL_* variables  
**Solution:** Add email configuration to .env and restart

### Issue: "MongoDB connection error"
**Cause:** MONGODB_URI incorrect or MongoDB down  
**Solution:** Check MONGODB_URI in .env, verify MongoDB Atlas is running

---

## Quick Deployment from Local

From your local machine:

```bash
# 1. Copy .env to server
scp -i your-key.pem .env ubuntu@your-ec2-ip:/home/ubuntu/genvedha-website/

# 2. SSH and restart
ssh -i your-key.pem ubuntu@your-ec2-ip << 'EOF'
cd /home/ubuntu/genvedha-website
pm2 restart genvedha-app
sleep 3
pm2 logs genvedha-app --lines 20 --nostream
curl http://localhost:3000/api/health
EOF
```

---

## Success Checklist

- [ ] .env file exists on server
- [ ] EMAIL_* variables present in .env
- [ ] Application restarted
- [ ] Logs show "Email transporter configured successfully"
- [ ] Health endpoint shows "email": "configured"
- [ ] Contact form submission works
- [ ] Email received at support@genvedha.com

---

The most likely issue is that the .env file with email configuration hasn't been deployed to the server yet. Follow the steps above to fix it! 🚀
