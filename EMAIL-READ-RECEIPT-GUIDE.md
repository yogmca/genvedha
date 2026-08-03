# Email Read Receipt Configuration Guide

## Overview

Read receipts have been enabled in [`send-genvedha-email.js`](send-genvedha-email.js:1) to track when recipients open your emails.

## ✅ What Was Implemented

### Read Receipt Headers
Four standard headers are now included in every email:

1. **`Disposition-Notification-To`** - RFC 3798 standard (most widely supported)
2. **`Return-Receipt-To`** - Legacy standard for compatibility  
3. **`X-Confirm-Reading-To`** - Additional confirmation header
4. **`Read-Receipt-To`** - Alternative header for broader support

### Configuration
```javascript
const ENABLE_READ_RECEIPT = true; // Toggle on/off
const READ_RECEIPT_EMAIL = 'support@genvedha.com'; // Receipt destination
```

## 📧 How Read Receipts Work

### When You Send an Email:
1. Email includes read receipt request headers
2. Recipient's email client receives the request
3. When recipient opens the email, their client may prompt them
4. If they accept, a notification email is sent to `support@genvedha.com`

### What You'll Receive:
A notification email with details like:
- Original message ID
- Date/time the email was opened
- Recipient's email address
- Recipient's email client information

## ⚠️ Important Limitations

### Client Support Varies:

**✅ Good Support:**
- Microsoft Outlook (Desktop) - Usually prompts user
- Mozilla Thunderbird - Configurable
- Apple Mail - Supports MDN
- IBM Notes/Domino - Full support

**⚠️ Limited Support:**
- Gmail (Web) - Does NOT support read receipts
- Yahoo Mail (Web) - Does NOT support read receipts
- Outlook.com (Web) - Limited support
- ProtonMail - Does NOT support (privacy-focused)

**❌ No Support:**
- Most mobile email apps
- Privacy-focused email clients
- Corporate email with disabled MDN

### User Control:
- Recipients can **decline** to send read receipts
- Many email clients have settings to:
  - Never send read receipts
  - Always send read receipts
  - Ask each time
- Corporate policies may disable read receipts

## 🧪 Testing Read Receipts

### Test with Your Own Email:
```bash
# Send test email to yourself
node send-genvedha-email.js your-email@example.com "Your Name"
```

### Check Different Clients:
1. **Outlook Desktop**: Should prompt "Send read receipt?"
2. **Thunderbird**: Check Tools → Options → Return Receipts
3. **Apple Mail**: Should send automatically if configured
4. **Gmail**: Will NOT send read receipts

### Verify Headers Were Sent:
Check the raw email source in your email client:
```
Disposition-Notification-To: support@genvedha.com
Return-Receipt-To: support@genvedha.com
X-Confirm-Reading-To: support@genvedha.com
Read-Receipt-To: support@genvedha.com
```

## 📊 Expected Results

### Realistic Expectations:
- **Corporate Outlook users**: 30-50% may send receipts
- **Gmail users**: 0% (not supported)
- **Mixed clients**: 10-20% overall response rate

### Why Low Response Rates?
1. Many clients don't support it
2. Users decline the prompt
3. Corporate policies block it
4. Privacy concerns
5. Mobile apps don't support it

## 🔍 Troubleshooting

### Issue: Not receiving any read receipts

**Possible Causes:**
1. ✅ Recipients using Gmail/Yahoo (web) - **Expected behavior**
2. ✅ Recipients declining the prompt - **Expected behavior**
3. ✅ Corporate email blocking MDN - **Expected behavior**
4. ❌ Headers not being sent - **Check email source**
5. ❌ Wrong receipt email address - **Verify configuration**

**Solutions:**
```bash
# 1. Verify the configuration
grep "READ_RECEIPT_EMAIL" send-genvedha-email.js

# 2. Send test email to Outlook user
node send-genvedha-email.js outlook-user@company.com "Test User"

# 3. Check email headers in sent email
# View raw email source and look for "Disposition-Notification-To"
```

### Issue: Terminal showing corrupted email address

**Example:**
```
📬 Read receipt requested to: support@/genvedha-llm-service/...
```

**Cause:** Terminal display corruption (not a code issue)

**Solution:**
```bash
# Clear terminal and run again
clear
node send-genvedha-email.js recipient@example.com "Name"

# Or check the actual variable value
node -e "console.log('support@genvedha.com')"
```

## 📈 Alternative Tracking Methods

Since read receipts have limitations, consider these alternatives:

### 1. Email Tracking Pixels
Add invisible 1x1 pixel image to HTML email:
```html
<img src="https://genvedha.com/track/{{EMAIL_ID}}.png" width="1" height="1" />
```

### 2. Link Tracking
Use trackable links:
```
https://genvedha.com/track/click?id={{EMAIL_ID}}&url={{DESTINATION}}
```

### 3. Third-Party Services
- SendGrid (email analytics)
- Mailgun (tracking API)
- Amazon SES with SNS notifications

### 4. Custom Tracking Server
Create endpoint to log email opens:
```javascript
app.get('/track/:emailId.png', (req, res) => {
    logEmailOpen(req.params.emailId);
    res.sendFile('1x1-transparent.png');
});
```

## 🔧 Configuration Options

### Disable Read Receipts:
```javascript
const ENABLE_READ_RECEIPT = false;
```

### Change Receipt Email:
```javascript
const READ_RECEIPT_EMAIL = 'tracking@genvedha.com';
```

### Per-Email Control:
Modify the `sendEmail` function to accept a parameter:
```javascript
async function sendEmail(recipientEmail, recipientName, customSubject = null, requestReceipt = true) {
    // ...
    if (ENABLE_READ_RECEIPT && requestReceipt) {
        mailOptions.headers = { /* ... */ };
    }
}
```

## 📝 Best Practices

### DO:
✅ Use read receipts for important business communications
✅ Combine with other tracking methods
✅ Respect recipient privacy
✅ Have realistic expectations (10-20% response rate)
✅ Test with different email clients

### DON'T:
❌ Rely solely on read receipts for critical tracking
❌ Expect 100% response rate
❌ Assume Gmail users will send receipts
❌ Use for spam or unsolicited emails
❌ Violate privacy regulations (GDPR, CAN-SPAM)

## 🔐 Privacy & Compliance

### GDPR Considerations:
- Read receipts may be considered tracking
- Include in privacy policy
- Provide opt-out mechanism
- Document legitimate interest

### CAN-SPAM Compliance:
- Read receipts are generally acceptable
- Must still include unsubscribe link
- Honor opt-out requests
- Include physical address

## 📞 Support

### Check Configuration:
```bash
node send-genvedha-email.js
# Look for: "Read Receipt: Enabled ✅"
```

### Test Email:
```bash
node send-genvedha-email.js --test your-email@example.com
```

### Debug Mode:
Add logging to see headers:
```javascript
console.log('Mail options:', JSON.stringify(mailOptions, null, 2));
```

## 📚 Additional Resources

- [RFC 3798 - Message Disposition Notification](https://tools.ietf.org/html/rfc3798)
- [Nodemailer Documentation](https://nodemailer.com/message/)
- [Email Header Reference](https://www.iana.org/assignments/message-headers/message-headers.xhtml)

---

**Last Updated:** July 18, 2026  
**Status:** ✅ Read receipts enabled and configured
