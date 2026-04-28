# How to Add TXT Records in GoDaddy for SSL Validation

## Step-by-Step Visual Guide

### Step 1: Log in to GoDaddy

Go to: https://dcc.godaddy.com/

### Step 2: Navigate to DNS Management

1. Click **My Products** in the top menu
2. Find your domain: **genvedha.com**
3. Click **DNS** button next to it
4. Or click **Manage DNS** if you see that option

### Step 3: Locate DNS Records Section

Scroll down to the **DNS Records** section (also called "Records")

You'll see existing records like:
- A records (pointing to your server IP)
- CNAME records (like www)
- NS records (nameservers)

### Step 4: Add First TXT Record

1. Click the **Add** button (usually at the bottom of the records list)

2. A form will appear with these fields:

   | Field | What to Enter |
   |-------|---------------|
   | **Type** | Select **TXT** from dropdown |
   | **Name** | Enter: `_acme-challenge` |
   | **Value** | Paste the long string from Certbot (starts with letters/numbers) |
   | **TTL** | Enter: `600` (or select "10 minutes") |

3. Click **Save** or **Add Record**

### Step 5: Add Second TXT Record (for www)

1. Click **Add** button again

2. Fill in the form:

   | Field | What to Enter |
   |-------|---------------|
   | **Type** | Select **TXT** from dropdown |
   | **Name** | Enter: `_acme-challenge.www` |
   | **Value** | Paste the second long string from Certbot |
   | **TTL** | Enter: `600` |

3. Click **Save** or **Add Record**

### Step 6: Verify Records Were Added

You should now see two new TXT records in your DNS records list:

```
Type    Name                        Value                           TTL
TXT     _acme-challenge            abc123xyz789...                 600
TXT     _acme-challenge.www        def456uvw012...                 600
```

### Step 7: Wait for Propagation

- **Minimum wait**: 2-3 minutes
- **Maximum wait**: 10 minutes (GoDaddy can be slow)
- **TTL of 600 seconds** = 10 minutes maximum propagation time

## Example Values from Certbot

When you run the DNS validation script, Certbot will show:

```
Please deploy a DNS TXT record under the name:
_acme-challenge.genvedha.com

with the following value:
xJ9kL3mN5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3rS5tU7vW9xY1zA

Before continuing, verify the TXT record has been deployed.
Press Enter to Continue
```

**What you add in GoDaddy:**
- **Name**: `_acme-challenge` (remove the `.genvedha.com` part)
- **Value**: `xJ9kL3mN5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3rS5tU7vW9xY1zA`

Then for www:

```
Please deploy a DNS TXT record under the name:
_acme-challenge.www.genvedha.com

with the following value:
bD2eF4gH6iJ8kL0mN2oP4qR6sT8uV0wX2yZ4aB6cD8eF0gH2iJ4kL6mN8oP0qR2sT
```

**What you add in GoDaddy:**
- **Name**: `_acme-challenge.www` (remove the `.genvedha.com` part)
- **Value**: `bD2eF4gH6iJ8kL0mN2oP4qR6sT8uV0wX2yZ4aB6cD8eF0gH2iJ4kL6mN8oP0qR2sT`

## Important Tips

### ✅ DO:
- Copy the ENTIRE value string (no spaces, no line breaks)
- Use exactly `_acme-challenge` and `_acme-challenge.www` as names
- Wait at least 2-3 minutes before pressing Enter in Certbot
- Keep the Certbot terminal open while adding records

### ❌ DON'T:
- Don't add `.genvedha.com` to the name (GoDaddy adds it automatically)
- Don't add quotes around the value
- Don't press Enter in Certbot before adding the records
- Don't close the Certbot terminal

## Verifying DNS Records

### From Your Computer or EC2

```bash
# Check first record
dig TXT _acme-challenge.genvedha.com

# Check second record
dig TXT _acme-challenge.www.genvedha.com

# Use Google DNS for verification
dig TXT _acme-challenge.genvedha.com @8.8.8.8
```

You should see output like:
```
;; ANSWER SECTION:
_acme-challenge.genvedha.com. 600 IN TXT "xJ9kL3mN5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3rS5tU7vW9xY1zA"
```

### Online Tools

Use these websites to check DNS propagation:
- https://dnschecker.org/
- https://www.whatsmydns.net/

Enter: `_acme-challenge.genvedha.com` and select **TXT** record type

## Troubleshooting

### "Record Not Found" When Checking

**Wait longer** - GoDaddy DNS can take 5-10 minutes to propagate.

### Certbot Says "Incorrect Validation"

1. **Check the value** - Make sure you copied it exactly
2. **Check the name** - Should be `_acme-challenge` not `_acme-challenge.genvedha.com`
3. **Wait longer** - Try waiting 5 more minutes
4. **Clear DNS cache** on your computer:
   ```bash
   # Mac
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Linux
   sudo systemd-resolve --flush-caches
   
   # Windows
   ipconfig /flushdns
   ```

### Multiple TXT Records with Same Name

If you're retrying and need to add new records:
1. **Delete old TXT records** for `_acme-challenge` first
2. Add the new ones
3. Wait for propagation

### GoDaddy Interface Looks Different

GoDaddy occasionally updates their interface. Look for:
- "DNS Management" or "Manage DNS"
- "DNS Records" or "Records" section
- "Add" or "Add Record" button
- Dropdown to select "TXT" record type

## After Adding Records

1. ✅ Verify records are visible with `dig` command
2. ✅ Wait 2-3 minutes minimum
3. ✅ Go back to Certbot terminal
4. ✅ Press **Enter** to continue
5. ✅ Certbot will verify and issue certificate
6. ✅ Your site will be live with HTTPS!

## Cleanup (Optional)

After SSL certificate is issued, you can:
- **Keep the TXT records** - They don't hurt anything
- **Delete them** - They're only needed during validation

If you plan to renew manually in 90 days, **keep them** so you know what they look like.

## Need Help?

- See full guide: [`DNS-VALIDATION-GUIDE.md`](DNS-VALIDATION-GUIDE.md)
- Quick reference: [`QUICK-FIX-403-ERROR.md`](QUICK-FIX-403-ERROR.md)
- GoDaddy Support: https://www.godaddy.com/help
