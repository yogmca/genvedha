# Test Email Service Locally

## Quick Test Guide

Before deploying to your server, test the email configuration on your local machine.

---

## Prerequisites

1. ✅ Node.js installed
2. ✅ `.env` file updated with GoDaddy credentials
3. ✅ `nodemailer` package installed (already in package.json)

---

## Step 1: Update .env File

Make sure your `.env` file has the correct GoDaddy password:

```env
# Email Configuration (GoDaddy SMTP)
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=support@genvedha.com
EMAIL_PASSWORD=YourActualGoDaddyPassword  # ← Replace this!
EMAIL_FROM=GenVedha <support@genvedha.com>
EMAIL_TO=support@genvedha.com
```

---

## Step 2: Install Dependencies (if needed)

```bash
npm install
```

---

## Step 3: Run the Test Script

```bash
node test-email.js
```

---

## What the Test Does

1. ✅ Checks if all email environment variables are set
2. ✅ Tests SMTP connection to GoDaddy servers
3. ✅ Sends a test email to support@genvedha.com
4. ✅ Displays detailed results

---

## Expected Output

### ✅ Success:
```
================================================
GenVedha Email Configuration Test
================================================

📋 Current Configuration:
  EMAIL_HOST: smtpout.secureserver.net
  EMAIL_PORT: 465
  EMAIL_SECURE: true
  EMAIL_USER: support@genvedha.com
  EMAIL_PASSWORD: ✅ Set (hidden)
  EMAIL_FROM: GenVedha <support@genvedha.com>
  EMAIL_TO: support@genvedha.com

🔧 Creating email transporter...
🔍 Testing SMTP connection...

✅ SMTP Connection Successful!

📧 Sending test email...

✅ Test Email Sent Successfully!

📬 Email Details:
   Message ID: <abc123@genvedha.com>
   From: GenVedha <support@genvedha.com>
   To: support@genvedha.com
   Response: 250 OK

================================================
🎉 SUCCESS! Your email configuration is working!
================================================

✅ Check your inbox at: support@genvedha.com
✅ Look for: "Test Email - GenVedha Contact Form Setup"

Next Steps:
1. Deploy .env to server
2. Restart application: pm2 restart genvedha-app
3. Test contact form on live website
```

### ❌ If Connection Fails:
```
❌ SMTP Connection Failed!
Error: Invalid login: 535 Authentication failed

💡 Troubleshooting:
   1. Check if EMAIL_PASSWORD is correct
   2. Verify EMAIL_USER is: support@genvedha.com
   3. Try resetting password in GoDaddy
   4. Test login at: https://email.secureserver.net
```

---

## Troubleshooting

### Error: "Invalid login" or "Authentication failed"

**Cause:** Wrong password or username

**Solution:**
1. Verify EMAIL_USER is exactly: `support@genvedha.com`
2. Check EMAIL_PASSWORD is correct
3. Test login at https://email.secureserver.net with same credentials
4. If webmail login fails, reset password in GoDaddy

### Error: "Connection timeout" or "ETIMEDOUT"

**Cause:** Firewall or network blocking SMTP port

**Solution:**
1. Check your firewall allows outbound connections on port 465
2. Try using port 587 instead (update EMAIL_PORT in .env)
3. Try from a different network

### Error: "Missing required environment variables"

**Cause:** .env file not properly configured

**Solution:**
1. Ensure .env file exists in project root
2. Check all EMAIL_* variables are set
3. No spaces around the = sign
4. No quotes around values (unless part of the value)

### Error: "Cannot find module 'nodemailer'"

**Cause:** Dependencies not installed

**Solution:**
```bash
npm install
```

---

## Alternative: Test with curl

If you want to test SMTP connection without the script:

```bash
# Test SMTP connection (requires openssl)
openssl s_client -connect smtpout.secureserver.net:465 -crlf
```

Then type:
```
EHLO genvedha.com
AUTH LOGIN
[base64 encoded email]
[base64 encoded password]
QUIT
```

---

## After Successful Test

### 1. Check Your Email
- Log into https://email.secureserver.net
- Username: support@genvedha.com
- Password: [your password]
- Look for test email in inbox

### 2. Deploy to Server
```bash
# Copy .env to server
scp -i your-key.pem .env ubuntu@your-ec2-ip:/home/ubuntu/genvedha-website/

# SSH and restart
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /home/ubuntu/genvedha-website
pm2 restart genvedha-app
pm2 logs genvedha-app
```

### 3. Test on Live Website
- Go to https://genvedha.com
- Submit contact form
- Check support@genvedha.com for notification

---

## Test Email Content

The test email will contain:
- ✅ Confirmation that email is working
- Configuration details (host, port, etc.)
- Next steps for deployment
- Timestamp of test

---

## Quick Commands Reference

```bash
# Run email test
node test-email.js

# Check .env file
cat .env | grep EMAIL

# Install dependencies
npm install

# Start local server (after test passes)
npm start

# Check server logs
npm start | grep Email
```

---

## Security Note

⚠️ **Never commit .env file to Git!**

The .env file contains your email password. It's already in .gitignore, but double-check:

```bash
# Verify .env is ignored
git status

# .env should NOT appear in the list
```

---

## Summary

**To test email locally:**

1. ✅ Update `.env` with GoDaddy password
2. ✅ Run `node test-email.js`
3. ✅ Check support@genvedha.com inbox
4. ✅ If successful, deploy to server
5. ✅ Test on live website

**Test script location:** `test-email.js`

That's it! 🚀
