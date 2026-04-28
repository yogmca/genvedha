# Network-Level Blocking Issue - 403 Even with Standalone Mode

## Critical Discovery

You're getting 403 errors **even with Certbot's standalone mode**, which means the problem is NOT your application or Nginx configuration. This is a **network-level blocking issue**.

## The Real Problem

When even standalone mode fails with 403, it means:
- ✅ Certbot is running its own web server correctly
- ✅ Port 80 is listening on your server
- ❌ **Something between the internet and your server is blocking or modifying the traffic**

## Most Likely Causes

### 1. AWS Security Group Misconfiguration (Most Common)

Your AWS Security Group might have:
- Port 80 open but with **wrong source** (not 0.0.0.0/0)
- Port 80 open but **Network ACL** is blocking
- Port 80 open but **stateful rules** are blocking return traffic

### 2. AWS Network ACL Blocking

Network ACLs are stateless and need both inbound AND outbound rules.

### 3. Reverse Proxy or CDN

If you have CloudFlare, AWS CloudFront, or another CDN/proxy in front of your server, it might be blocking the ACME challenge.

## Diagnostic Steps

### Step 1: Run the Diagnostic Script

```bash
git pull origin production
chmod +x diagnose-ssl-issue.sh
sudo ./diagnose-ssl-issue.sh
```

This will check:
- DNS resolution
- Port 80 accessibility
- Firewall rules
- AWS configuration
- Network routes

### Step 2: Check AWS Security Group

1. Go to **AWS Console** → **EC2** → **Instances**
2. Select your instance
3. Click **Security** tab
4. Click on the Security Group name
5. Check **Inbound rules**:

**Required rules:**
```
Type        Protocol    Port Range    Source          Description
HTTP        TCP         80            0.0.0.0/0       Allow HTTP from anywhere
HTTP        TCP         80            ::/0            Allow HTTP from anywhere IPv6
HTTPS       TCP         443           0.0.0.0/0       Allow HTTPS from anywhere
HTTPS       TCP         443           ::/0            Allow HTTPS from anywhere IPv6
```

**Critical:** Source MUST be `0.0.0.0/0` (not your IP, not a specific range)

### Step 3: Check Network ACLs

1. Go to **AWS Console** → **VPC** → **Network ACLs**
2. Find the ACL associated with your subnet
3. Check **Inbound Rules**:

**Required inbound rules:**
```
Rule #    Type        Protocol    Port Range    Source          Allow/Deny
100       HTTP (80)   TCP (6)     80            0.0.0.0/0       ALLOW
110       HTTPS (443) TCP (6)     443           0.0.0.0/0       ALLOW
*         All         All         All           0.0.0.0/0       DENY
```

4. Check **Outbound Rules**:

**Required outbound rules:**
```
Rule #    Type        Protocol    Port Range    Destination     Allow/Deny
100       Custom TCP  TCP (6)     1024-65535    0.0.0.0/0       ALLOW
*         All         All         All           0.0.0.0/0       DENY
```

**Note:** Network ACLs are stateless, so you need both inbound AND outbound rules.

### Step 4: Test from Outside

From your local machine (not the EC2 instance), test:

```bash
# Test if port 80 is accessible
curl -v http://genvedha.com

# Test if you can reach a specific path
curl -v http://genvedha.com/.well-known/acme-challenge/test

# Check what's responding
curl -I http://genvedha.com
```

If you get 403, something is actively blocking or filtering the traffic.

## Quick Fixes

### Fix 1: Update Security Group (AWS Console)

1. EC2 → Security Groups → Your SG → Edit inbound rules
2. Add rule:
   - Type: HTTP
   - Protocol: TCP
   - Port: 80
   - Source: 0.0.0.0/0
   - Description: Allow HTTP from anywhere
3. Save rules

### Fix 2: Update Security Group (AWS CLI)

```bash
# Get your security group ID
aws ec2 describe-instances --instance-ids YOUR_INSTANCE_ID --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId'

# Add HTTP rule
aws ec2 authorize-security-group-ingress \
    --group-id YOUR_SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0
```

### Fix 3: Check for CloudFlare or CDN

If you're using CloudFlare:
1. Go to CloudFlare dashboard
2. SSL/TLS → Overview
3. Set to "Full" or "Flexible" (not "Full (strict)" until you have a certificate)
4. Temporarily set DNS to "DNS only" (gray cloud) instead of "Proxied" (orange cloud)

### Fix 4: Temporarily Disable Firewall

```bash
# Check if UFW is active
sudo ufw status

# If active, temporarily disable
sudo ufw disable

# Try SSL setup again
sudo ./fix-ssl-aggressive.sh

# Re-enable after
sudo ufw enable
```

## Alternative: Use DNS Validation

If network-level blocking persists, use DNS validation instead:

```bash
sudo certbot certonly \
    --manual \
    --preferred-challenges dns \
    -d genvedha.com \
    -d www.genvedha.com \
    --email your-email@example.com
```

This will ask you to add TXT records to your DNS:
1. Certbot will display the TXT record name and value
2. Go to GoDaddy → DNS Management
3. Add TXT record:
   - Name: `_acme-challenge`
   - Value: (the value Certbot provides)
   - TTL: 600
4. Wait 2-3 minutes for DNS propagation
5. Press Enter in Certbot

**Advantages:**
- ✅ No need for port 80 to be accessible
- ✅ Works even with network blocking
- ✅ No downtime

**Disadvantages:**
- ⚠️ Manual process (need to add DNS records)
- ⚠️ Renewal requires manual intervention (or API integration)

## Testing Network Connectivity

### From Your EC2 Instance

```bash
# Test if you can reach the internet
curl -I https://google.com

# Test if Let's Encrypt can reach you (from your perspective)
curl -I http://$(curl -s ifconfig.me)

# Check what's listening on port 80
sudo netstat -tlnp | grep :80

# Check iptables rules
sudo iptables -L -n -v
```

### From External Source

Use online tools:
- https://www.yougetsignal.com/tools/open-ports/
- https://check-host.net/check-http

Enter: `http://genvedha.com` and check if it's accessible.

## Expected Behavior

**When working correctly:**
```bash
$ curl -I http://genvedha.com
HTTP/1.1 200 OK
# or
HTTP/1.1 502 Bad Gateway  # If app not running, but Nginx is
# or
HTTP/1.1 404 Not Found    # If path doesn't exist
```

**When blocked:**
```bash
$ curl -I http://genvedha.com
HTTP/1.1 403 Forbidden    # ← This is your issue
# or
curl: (7) Failed to connect  # Port blocked completely
```

## Root Cause Analysis

The 403 error with standalone mode means:
1. ✅ Your server is reachable (not a complete block)
2. ✅ Port 80 is open (traffic is getting through)
3. ❌ Something is **inspecting and blocking** the ACME challenge requests specifically

This is typically:
- **AWS WAF** (Web Application Firewall) if configured
- **Security Group with application-level filtering**
- **Network ACL with specific rules**
- **Reverse proxy/CDN** (CloudFlare, CloudFront) blocking the requests

## Immediate Action Plan

1. **Run diagnostic script**: `sudo ./diagnose-ssl-issue.sh`
2. **Check AWS Security Group**: Ensure port 80 is open to 0.0.0.0/0
3. **Check Network ACLs**: Ensure both inbound and outbound rules allow HTTP
4. **Test from outside**: Use online port checker
5. **If still blocked**: Use DNS validation method instead

## Contact AWS Support

If you've checked everything and still getting 403:

```bash
# Gather information for AWS support
echo "Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)"
echo "Security Groups: $(aws ec2 describe-instances --instance-ids $(curl -s http://169.254.169.254/latest/meta-data/instance-id) --query 'Reservations[0].Instances[0].SecurityGroups')"
echo "VPC ID: $(curl -s http://169.254.169.254/latest/meta-data/network/interfaces/macs/$(curl -s http://169.254.169.254/latest/meta-data/network/interfaces/macs/)/vpc-id)"
```

Provide this information to AWS support and explain that port 80 is returning 403 even with a simple standalone web server.
