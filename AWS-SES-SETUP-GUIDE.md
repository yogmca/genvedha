# AWS SES Setup Guide for GenVedha Email System

## 🎯 Why AWS SES?

AWS SES (Simple Email Service) provides:
- ✅ **High Deliverability** - Gmail, Yahoo, Outlook accept emails
- ✅ **Low Cost** - $0.10 per 1,000 emails
- ✅ **Built-in Authentication** - SPF, DKIM, DMARC handled automatically
- ✅ **Scalable** - Send millions of emails
- ✅ **Analytics** - Track bounces, complaints, deliveries

---

## 📋 Prerequisites

1. AWS Account (create at https://aws.amazon.com)
2. Node.js installed
3. AWS CLI installed (optional but recommended)

---

## 🚀 Step-by-Step Setup

### Step 1: Create AWS Account

1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the registration process
4. Add payment method (free tier available)

### Step 2: Access AWS SES Console

1. Login to AWS Console
2. Search for "SES" or go to: https://console.aws.amazon.com/ses/
3. Select region: **US East (N. Virginia)** - us-east-1 (recommended)

### Step 3: Verify Email Address

**Important:** You must verify the sender email before sending.

1. In SES Console, click "Verified identities"
2. Click "Create identity"
3. Select "Email address"
4. Enter: `support@genvedha.com`
5. Click "Create identity"
6. Check email inbox for verification link
7. Click the verification link
8. Status should change to "Verified"

### Step 4: Request Production Access

**Note:** New AWS SES accounts start in "Sandbox mode" (can only send to verified emails).

1. In SES Console, click "Account dashboard"
2. Click "Request production access"
3. Fill out the form:
   - **Mail Type:** Transactional
   - **Website URL:** https://genvedha.com
   - **Use Case Description:**
     ```
     GenVedha Global AI & Software Solutions sends transactional and 
     marketing emails to clients about our AI-powered e-commerce solutions 
     and software development services. We maintain a clean email list 
     and follow best practices for email deliverability.
     ```
   - **Compliance:** Confirm you comply with AWS policies
4. Submit request
5. **Wait 24-48 hours** for approval

### Step 5: Create IAM User for SES

1. Go to IAM Console: https://console.aws.amazon.com/iam/
2. Click "Users" → "Add users"
3. User name: `genvedha-ses-sender`
4. Select "Access key - Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search and select: `AmazonSESFullAccess`
8. Click "Next" → "Create user"
9. **IMPORTANT:** Save the credentials:
   - Access Key ID
   - Secret Access Key

### Step 6: Install AWS SDK

```bash
cd /Users/avydiya/Desktop/genvedha-website
npm install @aws-sdk/client-ses
```

### Step 7: Configure Credentials

**Option A: Environment Variables (Recommended)**
```bash
export AWS_ACCESS_KEY_ID=your_access_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_key_here
export AWS_REGION=us-east-1
```

**Option B: AWS Credentials File**
```bash
# Create credentials file
mkdir -p ~/.aws
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = your_access_key_here
aws_secret_access_key = your_secret_key_here
EOF

cat > ~/.aws/config << EOF
[default]
region = us-east-1
EOF
```

### Step 8: Test Email Sending

```bash
# Test with verified email first
node send-email-aws-ses.js --test support@genvedha.com
```

---

## 🧪 Testing in Sandbox Mode

While waiting for production access, you can test by:

1. Verify recipient email addresses in SES
2. Send test emails to verified addresses only

**Verify test email:**
1. SES Console → "Verified identities"
2. "Create identity" → "Email address"
3. Enter test email (e.g., yogemca@gmail.com)
4. Verify via email link
5. Now you can send to this address

---

## 📧 Usage After Setup

### Send Single Email
```bash
node send-email-aws-ses.js recipient@example.com "Recipient Name"
```

### Send Bulk Emails
```bash
node send-email-aws-ses.js --bulk brand-contacts.json
```

### With Custom Subject
```bash
node send-email-aws-ses.js recipient@example.com "Name" "Custom Subject"
```

---

## 🔧 Configure Domain Authentication (Optional but Recommended)

### Add DKIM Records

1. In SES Console, go to "Verified identities"
2. Click on your domain (genvedha.com)
3. Go to "DKIM" tab
4. Click "Publish DNS records"
5. Copy the 3 CNAME records
6. Add them to GoDaddy DNS:
   - Login to GoDaddy
   - Go to DNS Management
   - Add each CNAME record
7. Wait for verification (up to 72 hours)

### Benefits:
- ✅ Better deliverability
- ✅ Higher sender reputation
- ✅ Reduced spam classification

---

## 💰 Pricing

### Free Tier (First 12 Months)
- 62,000 emails/month when sending from EC2
- OR 3,000 emails/month from other sources

### After Free Tier
- $0.10 per 1,000 emails sent
- $0.12 per GB of attachments

### Example Costs:
- 10,000 emails/month = $1.00
- 100,000 emails/month = $10.00
- 1,000,000 emails/month = $100.00

---

## 📊 Monitoring & Analytics

### View Email Statistics

1. SES Console → "Account dashboard"
2. View metrics:
   - Sends
   - Deliveries
   - Bounces
   - Complaints

### Set Up Bounce Handling

1. Create SNS topic for bounces
2. Subscribe to notifications
3. Automatically remove bounced emails

---

## ⚠️ Important Notes

### Sandbox Mode Limitations:
- ❌ Can only send to verified emails
- ❌ Limited to 200 emails/day
- ❌ 1 email per second

### Production Mode Benefits:
- ✅ Send to any email address
- ✅ 50,000 emails/day (can request increase)
- ✅ 14 emails per second

### Best Practices:
1. Always verify sender email
2. Request production access early
3. Monitor bounce rates (keep < 5%)
4. Monitor complaint rates (keep < 0.1%)
5. Maintain clean email lists
6. Use double opt-in for subscriptions

---

## 🔍 Troubleshooting

### Error: "Email address is not verified"
**Solution:** Verify the sender email in SES Console

### Error: "Account is in sandbox mode"
**Solution:** Request production access or verify recipient email

### Error: "Daily sending quota exceeded"
**Solution:** Request quota increase in SES Console

### Emails going to spam
**Solution:** 
1. Set up DKIM authentication
2. Warm up your sending (start slow)
3. Maintain good content (avoid spam words)
4. Monitor bounce/complaint rates

---

## 📞 Support

### AWS Support:
- Documentation: https://docs.aws.amazon.com/ses/
- Support Center: https://console.aws.amazon.com/support/
- Forums: https://forums.aws.amazon.com/forum.jspa?forumID=90

### GenVedha Support:
- Email: support@genvedha.com
- This guide: AWS-SES-SETUP-GUIDE.md

---

## ✅ Setup Checklist

- [ ] Create AWS account
- [ ] Access SES Console
- [ ] Verify support@genvedha.com
- [ ] Request production access
- [ ] Create IAM user
- [ ] Save AWS credentials
- [ ] Install @aws-sdk/client-ses
- [ ] Configure credentials
- [ ] Test email sending
- [ ] (Optional) Set up DKIM
- [ ] Wait for production access approval
- [ ] Start sending emails!

---

## 🎯 Quick Start Commands

```bash
# Install dependencies
npm install @aws-sdk/client-ses

# Set credentials
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret

# Test
node send-email-aws-ses.js --test support@genvedha.com

# Send to brands (after production access)
node send-email-aws-ses.js --bulk brand-contacts.json
```

---

**Last Updated:** 2026-07-15  
**Status:** Ready for implementation  
**Estimated Setup Time:** 30 minutes + 24-48 hours for production access
