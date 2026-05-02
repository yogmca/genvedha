# Email Configuration Instructions for support@genvedha.com

## Current Status
Your contact form is **already built and ready** to send emails to `support@genvedha.com`. You just need to configure the email credentials in the `.env` file.

## What You Need to Configure

In your `.env` file (lines 11-17), replace the placeholder values with actual credentials:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com          # ← Replace this
EMAIL_PASSWORD=your_app_specific_password # ← Replace this
EMAIL_FROM=GenVedha <your_email@gmail.com> # ← Replace this
EMAIL_TO=support@genvedha.com             # ✅ Already correct
```

---

## Option 1: Using Gmail (Easiest for Quick Setup)

### Step 1: Choose a Gmail Account
Use any Gmail account you have access to. This will be the **sending** account.
- Example: `genvedhawebsite@gmail.com` or your personal Gmail

### Step 2: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Click on "2-Step Verification"
3. Follow the steps to enable it

### Step 3: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" for app type
3. Select "Other (Custom name)" for device
4. Enter "GenVedha Website" as the name
5. Click "Generate"
6. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 4: Update Your .env File
Replace lines 14-16 in your `.env` file:

```env
EMAIL_USER=genvedhawebsite@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM=GenVedha <genvedhawebsite@gmail.com>
```

**Example Configuration:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=genvedhawebsite@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=GenVedha <genvedhawebsite@gmail.com>
EMAIL_TO=support@genvedha.com
```

---

## Option 2: Using GoDaddy Email (Professional Setup)

If you have email hosting with GoDaddy for `support@genvedha.com`:

### Step 1: Get Your GoDaddy Email Password
- You should have set this up when creating the email account
- If you forgot it, reset it in GoDaddy Email & Office dashboard

### Step 2: Update Your .env File
Replace lines 11-17:

```env
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=support@genvedha.com
EMAIL_PASSWORD=your_godaddy_password
EMAIL_FROM=GenVedha <support@genvedha.com>
EMAIL_TO=support@genvedha.com
```

**GoDaddy SMTP Settings:**
- **Outgoing Server:** smtpout.secureserver.net
- **Port:** 465 (SSL) or 587 (TLS)
- **Username:** Your full email address (support@genvedha.com)

---

## Option 3: Using a Professional Email Service

For production, consider using dedicated email services:

### SendGrid (Free tier: 100 emails/day)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=GenVedha <noreply@genvedha.com>
EMAIL_TO=support@genvedha.com
```

### Mailgun (Free tier: 5,000 emails/month)
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@mg.genvedha.com
EMAIL_PASSWORD=your_mailgun_smtp_password
EMAIL_FROM=GenVedha <noreply@genvedha.com>
EMAIL_TO=support@genvedha.com
```

---

## Deployment to Server

### For Local Testing:
1. Update `.env` file with your credentials
2. Restart the server:
   ```bash
   npm start
   ```
3. Check console for: `✅ Email transporter configured successfully!`

### For EC2 Production Server:

#### Method 1: Direct Edit on Server
```bash
# SSH into server
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to project
cd /home/ubuntu/genvedha-website

# Edit .env file
nano .env

# Update the EMAIL_* variables
# Save: Ctrl+X, then Y, then Enter

# Restart application
pm2 restart genvedha-app

# Check logs
pm2 logs genvedha-app
```

#### Method 2: Update and Deploy
```bash
# On your local machine
# 1. Update .env file with credentials
# 2. Copy to server
scp -i your-key.pem .env ubuntu@your-ec2-ip:/home/ubuntu/genvedha-website/

# 3. SSH and restart
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /home/ubuntu/genvedha-website
pm2 restart genvedha-app
```

---

## Testing the Configuration

### 1. Check Server Health
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "database": "connected",
  "email": "configured"
}
```

### 2. Submit Test Contact Form
1. Go to https://genvedha.com
2. Scroll to Contact section
3. Fill out the form with test data
4. Submit
5. Check `support@genvedha.com` inbox

### 3. Check Server Logs
```bash
pm2 logs genvedha-app --lines 50
```

Look for:
- `✅ Email transporter configured successfully!`
- `✅ Email notification sent successfully to support@genvedha.com`

---

## What Happens When Someone Submits the Form

1. **User fills out contact form** on your website
2. **Form data is saved** to MongoDB database
3. **Email notification is sent** to support@genvedha.com
4. **Email contains:**
   - Name
   - Email address (clickable)
   - Phone number
   - Company name
   - Service interest
   - Message
   - Timestamp

---

## Troubleshooting

### Issue: "Email transporter not configured"
**Cause:** Email credentials not set in .env file  
**Solution:** Update EMAIL_USER and EMAIL_PASSWORD in .env

### Issue: "Invalid login" or "Authentication failed"
**Cause:** Wrong credentials or not using App Password (for Gmail)  
**Solution:** 
- For Gmail: Use App Password, not regular password
- For GoDaddy: Verify password is correct
- Check EMAIL_USER is the full email address

### Issue: "Connection timeout"
**Cause:** Firewall blocking SMTP ports  
**Solution:** 
- Check AWS Security Group allows outbound traffic on port 587/465
- Verify EMAIL_HOST and EMAIL_PORT are correct

### Issue: Emails not arriving
**Cause:** Emails might be in spam folder  
**Solution:** 
- Check spam folder in support@genvedha.com
- Add sender to safe senders list
- Consider using professional email service (SendGrid, Mailgun)

---

## Security Notes

1. **Never commit .env to Git** - Already in .gitignore ✅
2. **Use App Passwords for Gmail** - Never use your main password
3. **Keep credentials secure** - Don't share in public channels
4. **Rotate passwords regularly** - Update every 3-6 months

---

## Quick Start Checklist

- [ ] Choose email service (Gmail recommended for quick start)
- [ ] Get SMTP credentials (App Password for Gmail)
- [ ] Update `.env` file with credentials
- [ ] Deploy to server (if applicable)
- [ ] Restart application
- [ ] Check logs for success message
- [ ] Test by submitting contact form
- [ ] Verify email received at support@genvedha.com

---

## Example: Complete Gmail Setup

**Before:**
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=GenVedha <your_email@gmail.com>
```

**After:**
```env
EMAIL_USER=genvedhawebsite@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=GenVedha <genvedhawebsite@gmail.com>
```

That's it! The system is ready to send notifications to support@genvedha.com.

---

## Need Help?

If you encounter issues:
1. Check server logs: `pm2 logs genvedha-app`
2. Verify .env file has correct values
3. Test SMTP connection manually
4. Ensure no typos in email addresses
5. Check email service provider documentation

The email system is fully implemented - you just need to add the credentials! 🚀
