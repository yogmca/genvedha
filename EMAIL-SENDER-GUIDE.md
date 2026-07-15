# GenVedha Email Sender - Complete Guide

## 📧 Overview

A professional, reusable email system for sending GenVedha service emails from `support@genvedha.com`. Features a beautiful HTML template highlighting our AI-powered e-commerce solution and comprehensive services.

---

## 🚀 Quick Start

### Prerequisites

Ensure nodemailer is installed:
```bash
npm install nodemailer
```

### Make Script Executable

```bash
chmod +x send-genvedha-email.js
```

---

## 📝 Usage Examples

### 1. Send Single Email

**Basic usage:**
```bash
node send-genvedha-email.js client@example.com "John Doe"
```

**With custom subject:**
```bash
node send-genvedha-email.js client@example.com "John Doe" "Transform Your Business with AI"
```

### 2. Send Test Email

```bash
node send-genvedha-email.js --test your-email@example.com
```

### 3. Send Bulk Emails

**Create a recipients file** (`recipients.json`):
```json
[
  {
    "email": "client1@example.com",
    "name": "John Doe"
  },
  {
    "email": "client2@example.com",
    "name": "Jane Smith",
    "subject": "Custom Subject for Jane"
  }
]
```

**Send to all recipients:**
```bash
node send-genvedha-email.js --bulk recipients.json
```

---

## 📧 Email Configuration

### SMTP Settings
- **Host:** `smtpout.secureserver.net`
- **Port:** `465` (SSL)
- **From:** `support@genvedha.com`
- **Password:** `Leopard@1982`

### Email Features
- ✅ Professional HTML template with GenVedha branding
- ✅ Responsive design for all devices
- ✅ Plain text fallback
- ✅ Highlighted AI e-commerce solution
- ✅ Complete service overview
- ✅ Call-to-action buttons
- ✅ GenVedha logo and branding

---

## 🎨 Email Template

### Template Location
`email-templates/genvedha-services-email.html`

### Template Sections
1. **Header** - GenVedha logo and tagline
2. **Featured Service** - AI E-commerce solution (highlighted)
3. **Service List** - All GenVedha services
4. **Call-to-Action** - Link to website
5. **Footer** - Contact information

### Customization
The template uses placeholders:
- `{{RECIPIENT_NAME}}` - Replaced with recipient's name

To customize the template, edit `email-templates/genvedha-services-email.html`

---

## 📊 Bulk Email Features

### Rate Limiting
- Automatically waits 2 seconds between emails
- Prevents SMTP rate limiting issues

### Error Handling
- Continues sending even if one email fails
- Provides detailed summary at the end

### Summary Report
After bulk sending, you'll see:
```
📊 BULK EMAIL SUMMARY
✅ Successful: 8
❌ Failed: 2
📧 Total: 10
```

---

## 🧪 Testing

### Test Before Sending

Always test with your own email first:
```bash
node send-genvedha-email.js --test your-email@genvedha.com
```

### Verify Email Appearance
1. Check inbox (and spam folder)
2. Verify logo displays correctly
3. Test all links
4. Check mobile responsiveness

---

## 💡 Use Cases

### 1. New Client Outreach
```bash
node send-genvedha-email.js newclient@company.com "Sarah Johnson"
```

### 2. Service Announcement
```bash
node send-genvedha-email.js client@company.com "Mike Chen" "New AI E-commerce Service Launch"
```

### 3. Marketing Campaign
```bash
# Create campaign-recipients.json with target list
node send-genvedha-email.js --bulk campaign-recipients.json
```

### 4. Follow-up Emails
```bash
node send-genvedha-email.js prospect@company.com "Alex Brown" "Following Up: AI Solutions for Your Business"
```

---

## 🔧 Troubleshooting

### Email Not Sending

**Check SMTP credentials:**
```javascript
// In send-genvedha-email.js
const EMAIL_CONFIG = {
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: {
        user: 'support@genvedha.com',
        pass: 'Leopard@1982'  // Verify this is correct
    }
};
```

**Test SMTP connection:**
```bash
node send-genvedha-email.js --test your-email@example.com
```

### Template Not Found

Ensure the template exists:
```bash
ls -la email-templates/genvedha-services-email.html
```

### Logo Not Displaying

The logo URL in the template should point to:
```html
<img src="https://genvedha.com/logo.png" alt="GenVedha Logo" />
```

Ensure `logo.png` is accessible at this URL.

---

## 📋 Best Practices

### 1. Personalization
Always provide recipient names:
```bash
# Good
node send-genvedha-email.js client@example.com "John Doe"

# Avoid
node send-genvedha-email.js client@example.com
```

### 2. Subject Lines
Use compelling, specific subjects:
```bash
node send-genvedha-email.js client@example.com "John" "Launch Your E-commerce Store in Minutes"
```

### 3. Bulk Sending
- Test with small batch first
- Use descriptive recipient file names
- Keep backup of recipient lists

### 4. Timing
- Avoid sending during weekends
- Best times: Tuesday-Thursday, 10 AM - 2 PM
- Respect time zones

---

## 🔐 Security Notes

### Credentials
- Email password is stored in the script
- For production, use environment variables:

```javascript
// Recommended approach
const EMAIL_CONFIG = {
    auth: {
        user: process.env.EMAIL_USER || 'support@genvedha.com',
        pass: process.env.EMAIL_PASS || 'Leopard@1982'
    }
};
```

### Usage
```bash
EMAIL_USER=support@genvedha.com EMAIL_PASS=Leopard@1982 node send-genvedha-email.js client@example.com "John"
```

---

## 📈 Advanced Usage

### Use as Node Module

```javascript
const { sendEmail, sendBulkEmails } = require('./send-genvedha-email');

// Send single email
await sendEmail('client@example.com', 'John Doe', 'Custom Subject');

// Send bulk emails
const recipients = [
    { email: 'client1@example.com', name: 'John' },
    { email: 'client2@example.com', name: 'Jane' }
];
await sendBulkEmails(recipients);
```

### Custom Template

```javascript
const { loadEmailTemplate } = require('./send-genvedha-email');

// Load and customize template
const html = loadEmailTemplate('John Doe');
// Modify html as needed
```

---

## 📞 Support

For issues or questions:
- **Email:** support@genvedha.com
- **Website:** https://genvedha.com
- **Documentation:** This guide

---

## 📝 Example Scenarios

### Scenario 1: New Product Launch
```bash
# Create announcement list
cat > launch-recipients.json << EOF
[
  {"email": "client1@example.com", "name": "John Doe"},
  {"email": "client2@example.com", "name": "Jane Smith"}
]
EOF

# Send announcement
node send-genvedha-email.js --bulk launch-recipients.json
```

### Scenario 2: Individual Follow-up
```bash
node send-genvedha-email.js prospect@company.com "Michael Chen" "AI E-commerce Solution - Perfect for Your Business"
```

### Scenario 3: Weekly Newsletter
```bash
# Use cron job for weekly sends
0 10 * * 2 cd /path/to/genvedha-website && node send-genvedha-email.js --bulk weekly-subscribers.json
```

---

## ✅ Checklist Before Sending

- [ ] Test email sent to yourself
- [ ] Logo displays correctly
- [ ] All links work
- [ ] Mobile responsive
- [ ] Recipient list verified
- [ ] Subject line compelling
- [ ] Timing appropriate
- [ ] SMTP credentials valid

---

**Last Updated:** 2026-07-15  
**Version:** 1.0.0  
**Maintained by:** GenVedha Team
