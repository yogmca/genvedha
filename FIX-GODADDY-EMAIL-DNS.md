# Fix GoDaddy Email for Gmail Delivery

## 🎯 Goal
Add DNS authentication records to genvedha.com so emails reach Gmail inboxes.

---

## 📋 Step-by-Step Instructions

### Step 1: Login to GoDaddy

1. Go to https://www.godaddy.com
2. Click "Sign In"
3. Enter your credentials
4. Go to "My Products"

### Step 2: Access DNS Management

1. Find "genvedha.com" in your domains list
2. Click the three dots (⋮) next to the domain
3. Click "Manage DNS"
4. You should see the DNS Management page

### Step 3: Add SPF Record

**What is SPF?** Sender Policy Framework - tells Gmail which servers can send email for your domain.

1. Scroll to "Records" section
2. Click "Add" button
3. Fill in the form:
   - **Type:** TXT
   - **Name:** @ (this means root domain)
   - **Value:** `v=spf1 include:secureserver.net ~all`
   - **TTL:** 600 (10 minutes)
4. Click "Save"

**Expected Result:**
```
Type: TXT
Name: @
Value: v=spf1 include:secureserver.net ~all
TTL: 600
```

### Step 4: Add DMARC Record

**What is DMARC?** Domain-based Message Authentication - tells Gmail what to do with emails that fail authentication.

1. Click "Add" button again
2. Fill in the form:
   - **Type:** TXT
   - **Name:** _dmarc
   - **Value:** `v=DMARC1; p=none; rua=mailto:support@genvedha.com`
   - **TTL:** 600
3. Click "Save"

**Expected Result:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:support@genvedha.com
TTL: 600
```

### Step 5: Enable DKIM (Most Important!)

**What is DKIM?** DomainKeys Identified Mail - cryptographic signature that proves the email is authentic.

#### Option A: Through GoDaddy Email Admin (Recommended)

1. Go to https://email.secureserver.net
2. Login with support@genvedha.com / Leopard@1982
3. Click on Settings (gear icon)
4. Look for "Email Authentication" or "DKIM Settings"
5. Click "Enable DKIM"
6. Copy the DKIM record provided
7. Go back to GoDaddy DNS Management
8. Add the DKIM record as a TXT or CNAME record

#### Option B: Manual DKIM Setup

If you can't find DKIM settings in email admin:

1. Contact GoDaddy Support:
   - Phone: 1-480-505-8877
   - Chat: https://www.godaddy.com/contact-us
2. Ask them to: "Enable DKIM for support@genvedha.com"
3. They will provide you with DKIM DNS records
4. Add those records to your DNS

**Typical DKIM Record looks like:**
```
Type: CNAME or TXT
Name: default._domainkey
Value: (provided by GoDaddy)
TTL: 600
```

### Step 6: Verify DNS Records

**Wait Time:** DNS changes take 1-24 hours to propagate globally.

**Check SPF Record:**
```bash
dig TXT genvedha.com
# Should show: v=spf1 include:secureserver.net ~all
```

**Check DMARC Record:**
```bash
dig TXT _dmarc.genvedha.com
# Should show: v=DMARC1; p=none; rua=mailto:support@genvedha.com
```

**Check DKIM Record:**
```bash
dig TXT default._domainkey.genvedha.com
# Should show DKIM signature
```

### Step 7: Test Email Deliverability

**After 24 hours**, test your email:

1. **Use Mail Tester:**
   ```bash
   # Visit https://www.mail-tester.com
   # Get the test email address
   node send-genvedha-email.js test-xxxxx@mail-tester.com "Test"
   # Check your score (aim for 10/10)
   ```

2. **Send to Gmail:**
   ```bash
   node send-genvedha-email.js yogemca@gmail.com "Yogesh"
   ```

3. **Check Email Headers:**
   - Open the email in Gmail
   - Click three dots → "Show original"
   - Look for:
     - `spf=pass`
     - `dkim=pass`
     - `dmarc=pass`

---

## 🔍 Visual Guide - What Your DNS Should Look Like

After completing all steps, your DNS records should include:

```
┌─────────┬──────────────────┬────────────────────────────────────────────┬─────┐
│ Type    │ Name             │ Value                                      │ TTL │
├─────────┼──────────────────┼────────────────────────────────────────────┼─────┤
│ TXT     │ @                │ v=spf1 include:secureserver.net ~all       │ 600 │
│ TXT     │ _dmarc           │ v=DMARC1; p=none; rua=mailto:support@...   │ 600 │
│ TXT/CNAME│ default._domainkey│ (DKIM signature from GoDaddy)            │ 600 │
└─────────┴──────────────────┴────────────────────────────────────────────┴─────┘
```

---

## ⚠️ Important Notes

### DNS Propagation Time
- **Minimum:** 1 hour
- **Typical:** 4-6 hours
- **Maximum:** 24-48 hours

### Don't Delete Existing Records
- Only ADD new records
- Don't modify existing A, CNAME, MX records
- If unsure, take a screenshot before making changes

### Backup Your DNS
Before making changes:
1. Take screenshots of all existing DNS records
2. Export DNS records if GoDaddy provides that option

---

## 🧪 Testing Tools

### 1. MXToolbox
- URL: https://mxtoolbox.com/SuperTool.aspx
- Enter: genvedha.com
- Check: SPF, DKIM, DMARC

### 2. Mail Tester
- URL: https://www.mail-tester.com
- Send test email to provided address
- Get score out of 10

### 3. Google Admin Toolbox
- URL: https://toolbox.googleapps.com/apps/checkmx/
- Enter: genvedha.com
- Verify MX and authentication records

### 4. DMARC Analyzer
- URL: https://dmarcian.com/dmarc-inspector/
- Enter: genvedha.com
- Check DMARC configuration

---

## 🔧 Troubleshooting

### Problem: Can't find DNS Management
**Solution:** 
- Make sure you're logged into the correct GoDaddy account
- Domain might be managed by someone else
- Contact GoDaddy support

### Problem: SPF record already exists
**Solution:**
- Don't create duplicate
- Modify existing SPF to include: `include:secureserver.net`
- Example: `v=spf1 include:secureserver.net include:_spf.google.com ~all`

### Problem: DKIM not available in email settings
**Solution:**
- Contact GoDaddy support directly
- They can enable it on their end
- Phone: 1-480-505-8877

### Problem: Still going to spam after 24 hours
**Solution:**
1. Verify all 3 records are active (use MXToolbox)
2. Check email content (avoid spam words)
3. Start with small batches (5-10 emails/day)
4. Ask recipients to mark as "Not Spam"
5. Build sender reputation gradually

---

## 📞 GoDaddy Support Contact

If you need help:

**Phone Support:**
- US: 1-480-505-8877
- International: Check godaddy.com/contact-us

**Live Chat:**
- Go to: https://www.godaddy.com/contact-us
- Click "Chat with us"

**What to Say:**
> "I need help setting up email authentication (SPF, DKIM, DMARC) for my domain genvedha.com to improve email deliverability to Gmail."

---

## ✅ Completion Checklist

- [ ] Login to GoDaddy
- [ ] Access DNS Management for genvedha.com
- [ ] Add SPF record (TXT @ v=spf1...)
- [ ] Add DMARC record (TXT _dmarc v=DMARC1...)
- [ ] Enable DKIM (contact support if needed)
- [ ] Take screenshot of DNS records
- [ ] Wait 24 hours for propagation
- [ ] Test with MXToolbox
- [ ] Test with Mail Tester
- [ ] Send test email to Gmail
- [ ] Check email headers for pass/fail
- [ ] Send to brand contacts

---

## 📊 Expected Timeline

| Step | Time Required |
|------|---------------|
| Add DNS records | 15 minutes |
| DNS propagation | 1-24 hours |
| DKIM setup (if need support) | 1-2 hours |
| Testing | 30 minutes |
| **Total** | **2-26 hours** |

---

## 🎯 Success Criteria

You'll know it's working when:
1. ✅ Mail Tester score is 9/10 or 10/10
2. ✅ MXToolbox shows all green checks
3. ✅ Gmail shows email in inbox (not spam)
4. ✅ Email headers show: spf=pass, dkim=pass, dmarc=pass

---

**Last Updated:** 2026-07-15  
**Status:** Ready to implement  
**Estimated Time:** 15 minutes + 24 hours propagation
