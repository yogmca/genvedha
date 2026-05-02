# Titan Email Configuration for support@genvedha.com

## Important Discovery! 

You're using **Titan Email** (not standard GoDaddy email). Titan has different SMTP settings.

---

## Correct Titan Email SMTP Settings

Update your `.env` file with these settings:

```env
# Email Configuration (Titan Email - GoDaddy)
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=support@genvedha.com
EMAIL_PASSWORD=Leopard@2026
EMAIL_FROM=GenVedha <support@genvedha.com>
EMAIL_TO=support@genvedha.com
```

**Key Changes:**
- `EMAIL_HOST` changed from `smtpout.secureserver.net` to `smtp.titan.email`
- `EMAIL_PORT` changed from `465` to `587`
- `EMAIL_SECURE` changed from `true` to `false`

---

## Titan Email SMTP Details

**Outgoing Mail Server (SMTP):**
- Server: `smtp.titan.email`
- Port: 587 (TLS/STARTTLS)
- Security: STARTTLS
- Authentication: Required
- Username: Your full email (support@genvedha.com)
- Password: Your Titan email password

**Incoming Mail Server (IMAP):**
- Server: `imap.titan.email`
- Port: 993 (SSL)

---

## Next Steps

1. Update `.env` file with Titan settings (see above)
2. Run test: `node test-email.js`
3. Check support@genvedha.com inbox
4. Deploy to server

---

## Why This Matters

GoDaddy offers two email services:
1. **GoDaddy Email** (older) - Uses `smtpout.secureserver.net`
2. **Titan Email** (newer, better) - Uses `smtp.titan.email`

You have Titan Email, which is actually better! It's more reliable and has a nicer interface.
