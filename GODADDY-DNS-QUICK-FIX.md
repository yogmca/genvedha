# GoDaddy DNS Quick Fix for Email Delivery

## 🚨 Issue: "_dmarc" name not accepted

GoDaddy requires the **FULL domain name** for DMARC records.

---

## ✅ Correct DNS Records for GoDaddy

### 1. SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:secureserver.net ~all
TTL: 600
```

### 2. DMARC Record (CORRECTED FORMAT)
```
Type: TXT
Name: _dmarc.genvedha.com
Value: v=DMARC1; p=none; rua=mailto:support@genvedha.com
TTL: 600
```

**⚠️ Important:** Use `_dmarc.genvedha.com` (full domain), NOT just `_dmarc`

---

## 📋 Step-by-Step for DMARC

1. Login to GoDaddy
2. Go to DNS Management for genvedha.com
3. Click "Add" button
4. Select Type: **TXT**
5. In Name field, enter: **_dmarc.genvedha.com** (exactly as shown)
6. In Value field, enter: **v=DMARC1; p=none; rua=mailto:support@genvedha.com**
7. TTL: **600**
8. Click "Save"

---

## 🔍 Alternative Formats to Try

If `_dmarc.genvedha.com` doesn't work, try these in order:

### Option 1: Full domain (RECOMMENDED)
```
Name: _dmarc.genvedha.com
```

### Option 2: Subdomain only
```
Name: _dmarc
```

### Option 3: With trailing dot
```
Name: _dmarc.genvedha.com.
```

---

## ✅ How to Verify It Worked

After adding the record, wait 10 minutes, then check:

### Using Command Line:
```bash
dig TXT _dmarc.genvedha.com
```

### Using Online Tool:
1. Go to: https://mxtoolbox.com/SuperTool.aspx
2. Enter: `_dmarc.genvedha.com`
3. Select "TXT Lookup"
4. Should show: `v=DMARC1; p=none; rua=mailto:support@genvedha.com`

---

## 📞 Still Having Issues?

### Contact GoDaddy Support:
- **Phone:** 1-480-505-8877
- **Chat:** https://www.godaddy.com/contact-us

### What to Say:
> "I'm trying to add a DMARC TXT record for _dmarc.genvedha.com but getting an 'Invalid name' error. Can you help me add this record?"

They can add it for you directly!

---

## 🎯 Complete DNS Records Summary

After all changes, you should have these 3 records:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| TXT | @ | v=spf1 include:secureserver.net ~all | SPF |
| TXT | _dmarc.genvedha.com | v=DMARC1; p=none; rua=mailto:support@genvedha.com | DMARC |
| TXT/CNAME | default._domainkey.genvedha.com | (from GoDaddy) | DKIM |

---

## ⏱️ Timeline

- **Add records:** 5 minutes
- **DNS propagation:** 1-24 hours
- **Test emails:** After 24 hours

---

**Last Updated:** 2026-07-15  
**Status:** Use full domain format for DMARC
