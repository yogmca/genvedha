# 🎯 FOUND THE ROOT CAUSE!

## The Problem

Your AWS Security Group is **missing HTTP (port 80) and HTTPS (port 443)** rules!

### Current Security Group Configuration

**Security Group:** launch-wizard-1 (sg-01b24f42694bc45f6)

**Current Inbound Rules:**
- ✅ Port 3000 (TCP) from 0.0.0.0/0 - Your Node.js app
- ❌ Port 80 (HTTP) - **MISSING** ← This is why Let's Encrypt gets 403!
- ❌ Port 443 (HTTPS) - **MISSING**

## Why This Causes 403 Errors

Let's Encrypt tries to connect to your server on port 80 to verify domain ownership, but AWS Security Group is blocking all traffic to port 80. The connection reaches AWS but gets rejected before it even reaches your server, resulting in a 403 Forbidden error.

## The Fix (Choose One Method)

### Method 1: AWS Console (Easiest - Recommended)

1. **Go to AWS Console:**
   https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:

2. **Find your Security Group:**
   - Search for: `sg-01b24f42694bc45f6`
   - Or find: `launch-wizard-1`

3. **Edit Inbound Rules:**
   - Click on the security group
   - Click "Edit inbound rules" button

4. **Add HTTP Rule:**
   - Click "Add rule"
   - Type: **HTTP**
   - Protocol: TCP (auto-filled)
   - Port: 80 (auto-filled)
   - Source: **0.0.0.0/0**
   - Description: Allow HTTP from anywhere

5. **Add HTTPS Rule:**
   - Click "Add rule"
   - Type: **HTTPS**
   - Protocol: TCP (auto-filled)
   - Port: 443 (auto-filled)
   - Source: **0.0.0.0/0**
   - Description: Allow HTTPS from anywhere

6. **Save Rules:**
   - Click "Save rules"

7. **Run SSL Setup:**
   ```bash
   sudo ./fix-ssl-aggressive.sh
   ```

### Method 2: AWS CLI (If Configured)

```bash
# Run the automated fix script
sudo ./fix-aws-security-group.sh

# Then run SSL setup
sudo ./fix-ssl-aggressive.sh
```

### Method 3: Manual AWS CLI Commands

```bash
# Add HTTP rule
aws ec2 authorize-security-group-ingress \
    --group-id sg-01b24f42694bc45f6 \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

# Add HTTPS rule
aws ec2 authorize-security-group-ingress \
    --group-id sg-01b24f42694bc45f6 \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# Verify rules were added
aws ec2 describe-security-groups --group-ids sg-01b24f42694bc45f6
```

## After Adding the Rules

Once you've added port 80 and 443 to your Security Group:

```bash
# Pull latest changes
git pull origin production

# Run SSL setup (will work now!)
sudo ./fix-ssl-aggressive.sh
```

## Expected Result

After adding the Security Group rules:
- ✅ Let's Encrypt can reach your server on port 80
- ✅ SSL certificate will be obtained successfully
- ✅ Your site will be accessible via HTTPS
- ✅ No more 403 errors!

## Verification

After adding the rules, verify they're working:

```bash
# Test from your local machine (not EC2)
curl -I http://genvedha.com

# Should return HTTP 200, 404, or 502 (not 403!)
```

## Why This Happened

When you created the EC2 instance, the security group was configured to only allow:
- SSH (port 22) - for remote access
- Port 3000 - for your Node.js application

But it didn't include:
- Port 80 (HTTP) - needed for Let's Encrypt validation and HTTP traffic
- Port 443 (HTTPS) - needed for HTTPS traffic

This is a common oversight when setting up web servers.

## Final Security Group Configuration

After the fix, your inbound rules should look like:

```
Type        Protocol    Port    Source          Description
SSH         TCP         22      Your-IP/32      SSH access
HTTP        TCP         80      0.0.0.0/0       Allow HTTP from anywhere
HTTPS       TCP         443     0.0.0.0/0       Allow HTTPS from anywhere
Custom TCP  TCP         3000    0.0.0.0/0       Node.js app (can remove after Nginx setup)
```

**Note:** After Nginx is set up as a reverse proxy, you can optionally remove the port 3000 rule since all traffic will go through Nginx on ports 80/443.

## Quick Reference

**Security Group ID:** sg-01b24f42694bc45f6  
**Security Group Name:** launch-wizard-1  
**AWS Console Link:** https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:group-id=sg-01b24f42694bc45f6

## Next Steps

1. ✅ Add port 80 and 443 to Security Group (see methods above)
2. ✅ Run: `sudo ./fix-ssl-aggressive.sh`
3. ✅ Your site will be live with HTTPS!

That's it! This was the missing piece all along.
