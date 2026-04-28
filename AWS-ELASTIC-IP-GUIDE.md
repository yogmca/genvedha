# AWS Elastic IP Setup Guide

Complete step-by-step guide with screenshots locations to allocate and associate an Elastic IP to your EC2 instance.

---

## 🎯 What is an Elastic IP?

An **Elastic IP** is a static, public IPv4 address that:
- ✅ **Doesn't change** when you stop/start your EC2 instance
- ✅ **Free** when associated with a running instance
- ✅ **Essential** for domain mapping (prevents DNS issues)
- ⚠️ **Costs money** if allocated but NOT associated (~$0.005/hour)

---

## 📍 Step-by-Step: Allocate Elastic IP

### Step 1: Login to AWS Console

1. Go to [https://console.aws.amazon.com](https://console.aws.amazon.com)
2. Sign in with your AWS account credentials
3. Make sure you're in the **correct region** (top-right corner)
   - Example: `US East (N. Virginia)` or `Asia Pacific (Mumbai)`
   - **Important**: Must be the same region as your EC2 instance

---

### Step 2: Navigate to EC2 Dashboard

**Option A: Using Services Menu**
1. Click **"Services"** in the top-left corner
2. Under **"Compute"**, click **"EC2"**

**Option B: Using Search**
1. Click the search bar at the top
2. Type **"EC2"**
3. Click **"EC2"** from results

**Option C: Direct Link**
- Go to: [https://console.aws.amazon.com/ec2](https://console.aws.amazon.com/ec2)

---

### Step 3: Access Elastic IPs Section

In the EC2 Dashboard, look at the **left sidebar**:

```
EC2 Dashboard
├── Instances
│   ├── Instances
│   ├── Instance Types
│   ├── Launch Templates
│   └── Spot Requests
├── Images
│   ├── AMIs
│   └── AMI Catalog
├── Elastic Block Store
│   ├── Volumes
│   └── Snapshots
├── Network & Security
│   ├── Security Groups
│   ├── Elastic IPs          ← Click here!
│   ├── Placement Groups
│   ├── Key Pairs
│   └── Network Interfaces
└── Load Balancing
```

**Steps**:
1. Scroll down the left sidebar
2. Find **"Network & Security"** section
3. Click **"Elastic IPs"**

**Direct Link**: 
- [https://console.aws.amazon.com/ec2/home#Addresses:](https://console.aws.amazon.com/ec2/home#Addresses:)

---

### Step 4: Allocate New Elastic IP

You'll see the **Elastic IP addresses** page.

**If you have no Elastic IPs**:
- The page will be empty
- You'll see a message: "You do not have any Elastic IP addresses"

**To allocate a new one**:

1. Click the orange **"Allocate Elastic IP address"** button (top-right)

2. You'll see the **"Allocate Elastic IP address"** page with options:

   ```
   Allocate Elastic IP address
   
   Network Border Group
   ○ [Your region] (default)
   
   Public IPv4 address pool
   ○ Amazon's pool of IPv4 addresses (default)
   ○ Customer owned pool of IPv4 addresses
   
   Tags (optional)
   Add tags to organize your resources
   ```

3. **Keep default settings**:
   - Network Border Group: Leave as default
   - Public IPv4 address pool: Select **"Amazon's pool of IPv4 addresses"**

4. **(Optional) Add tags** for organization:
   - Click **"Add tag"**
   - Key: `Name`
   - Value: `genvedha-website-ip` or `production-ip`

5. Click the orange **"Allocate"** button at the bottom

---

### Step 5: Success! Copy Your Elastic IP

After allocation, you'll see a success message:

```
✓ Successfully allocated Elastic IP address: 54.123.45.67
```

**Important**: 
- **Copy this IP address** - you'll need it for:
  - GoDaddy DNS configuration
  - SSH access
  - Nginx configuration

You'll be redirected to the **Elastic IP addresses** page showing:

```
Elastic IP addresses (1)

Allocated IPv4 address | Associated instance ID | Allocation ID
54.123.45.67          | -                      | eipalloc-xxxxx
```

---

### Step 6: Associate Elastic IP with EC2 Instance

**Important**: The Elastic IP is allocated but NOT yet attached to your instance.

1. **Select the Elastic IP**:
   - Click the checkbox next to your new Elastic IP
   - The row will be highlighted

2. **Click "Actions" dropdown** (top-right):
   ```
   Actions ▼
   ├── Associate Elastic IP address
   ├── Disassociate Elastic IP address
   ├── Release Elastic IP addresses
   └── View details
   ```

3. **Click "Associate Elastic IP address"**

4. You'll see the **"Associate Elastic IP address"** page:

   ```
   Associate Elastic IP address
   
   Resource type
   ○ Instance (default)
   ○ Network interface
   
   Instance *
   [Select an instance dropdown]
   
   Private IP address
   [Auto-populated after selecting instance]
   
   Reassociation
   ☐ Allow this Elastic IP address to be reassociated
   ```

5. **Configure association**:
   - Resource type: Select **"Instance"**
   - Instance: Click the dropdown and **select your EC2 instance**
     - You'll see: `i-xxxxx (your-instance-name)`
   - Private IP address: Will auto-populate
   - Reassociation: Leave unchecked (unless you know you need it)

6. Click the orange **"Associate"** button

---

### Step 7: Verify Association

After successful association, you'll see:

```
✓ Successfully associated Elastic IP address 54.123.45.67 with instance i-xxxxx
```

Back on the **Elastic IP addresses** page, you'll now see:

```
Allocated IPv4 address | Associated instance ID | Instance name
54.123.45.67          | i-0123456789abcdef    | your-instance-name
```

---

## 🔍 How to Find Your Elastic IP Later

### Method 1: From Elastic IPs Page

1. Go to **EC2 Dashboard**
2. Left sidebar → **Network & Security** → **Elastic IPs**
3. Your IP will be listed with associated instance

### Method 2: From EC2 Instance Page

1. Go to **EC2 Dashboard**
2. Left sidebar → **Instances** → **Instances**
3. Select your instance
4. Look at the **Details** tab (bottom panel)
5. Find **"Elastic IP addresses"** field
6. Your Elastic IP will be shown there

### Method 3: From Instance Details

1. Go to **Instances** page
2. Click on your **Instance ID** (blue link)
3. In the instance details, look for:
   - **Public IPv4 address**: Shows your Elastic IP
   - **Elastic IP addresses**: Shows associated Elastic IPs

---

## 💰 Elastic IP Costs

### Free Scenarios
- ✅ **Associated with a running EC2 instance**: FREE
- ✅ **One Elastic IP per running instance**: FREE

### Charged Scenarios
- ❌ **Allocated but NOT associated**: ~$0.005/hour (~$3.60/month)
- ❌ **Associated with stopped instance**: ~$0.005/hour
- ❌ **More than one Elastic IP per instance**: Additional IPs charged

**Best Practice**: Always associate Elastic IPs with running instances to avoid charges.

---

## 🔄 Common Operations

### Check Current Elastic IPs

```
AWS Console → EC2 → Network & Security → Elastic IPs
```

You'll see all your Elastic IPs with:
- IP address
- Associated instance
- Allocation ID
- Status

### Disassociate Elastic IP

**When**: Changing instances or removing IP

1. Go to **Elastic IPs** page
2. Select the Elastic IP
3. **Actions** → **Disassociate Elastic IP address**
4. Confirm disassociation

⚠️ **Warning**: After disassociation, the IP is still allocated and will incur charges.

### Release Elastic IP

**When**: No longer need the IP (frees it completely)

1. **First disassociate** if associated
2. Go to **Elastic IPs** page
3. Select the Elastic IP
4. **Actions** → **Release Elastic IP addresses**
5. Confirm release

⚠️ **Warning**: Once released, you cannot get the same IP back.

### Associate with Different Instance

1. **Disassociate** from current instance
2. **Associate** with new instance (follow Step 6 above)

Or use the **"Reassociation"** option:
1. Select Elastic IP
2. **Actions** → **Associate Elastic IP address**
3. Check **"Allow this Elastic IP address to be reassociated"**
4. Select new instance
5. Click **Associate**

---

## 🛠️ Troubleshooting

### Issue 1: Can't Find Elastic IPs in Sidebar

**Solution**:
- Make sure you're in **EC2 Dashboard** (not other AWS services)
- Scroll down the left sidebar to **"Network & Security"**
- If sidebar is collapsed, click the hamburger menu (☰) to expand

### Issue 2: "Allocate" Button is Grayed Out

**Possible Reasons**:
- **Region limit reached**: AWS limits Elastic IPs per region (default: 5)
- **Permissions issue**: Your IAM user lacks permissions

**Solution**:
- Check your region's Elastic IP limit
- Request limit increase: **Support** → **Service Quotas**
- Contact AWS administrator for permissions

### Issue 3: Association Fails

**Error**: "The instance is already associated with an Elastic IP"

**Solution**:
- Your instance already has an Elastic IP
- Check instance details to see current Elastic IP
- Use that IP instead of allocating a new one

### Issue 4: Can't See My Instance in Dropdown

**Possible Reasons**:
- Instance is in a different region
- Instance is terminated
- Permissions issue

**Solution**:
- Verify you're in the correct region (top-right corner)
- Check **Instances** page to confirm instance is running
- Ensure instance state is "running" or "stopped" (not "terminated")

### Issue 5: Elastic IP Not Working After Association

**Solution**:
1. **Wait 1-2 minutes** for association to complete
2. **Update Security Group**:
   - Go to **Security Groups**
   - Select your instance's security group
   - Ensure inbound rules allow your IP/ports
3. **Update SSH command** with new IP:
   ```bash
   ssh -i your-key.pem ec2-user@NEW_ELASTIC_IP
   ```

---

## 📋 Complete Workflow Example

### Scenario: Setting up Elastic IP for genvedha.com

**1. Allocate Elastic IP**
```
AWS Console → EC2 → Network & Security → Elastic IPs
→ Allocate Elastic IP address
→ Keep defaults → Allocate
→ Result: 54.123.45.67
```

**2. Associate with Instance**
```
Select IP → Actions → Associate Elastic IP address
→ Resource type: Instance
→ Instance: i-xxxxx (genvedha-website)
→ Associate
```

**3. Update SSH Access**
```bash
# Old command (with public IP)
ssh -i key.pem ec2-user@18.234.56.78

# New command (with Elastic IP)
ssh -i key.pem ec2-user@54.123.45.67
```

**4. Configure GoDaddy DNS**
```
GoDaddy → My Products → Domain → DNS
→ Edit A record
→ Name: @
→ Value: 54.123.45.67
→ Save
```

**5. Setup HTTPS**
```bash
ssh -i key.pem ec2-user@54.123.45.67
cd ~/genvedha-website
sudo ./setup-https.sh
# Enter: genvedha.com
```

---

## 🎯 Quick Navigation Paths

### Path 1: Allocate Elastic IP
```
AWS Console
→ Services → EC2
→ Network & Security → Elastic IPs
→ Allocate Elastic IP address
→ Allocate
```

### Path 2: Associate Elastic IP
```
AWS Console
→ Services → EC2
→ Network & Security → Elastic IPs
→ Select IP → Actions
→ Associate Elastic IP address
→ Select Instance → Associate
```

### Path 3: Find Instance's Elastic IP
```
AWS Console
→ Services → EC2
→ Instances → Instances
→ Select Instance
→ Details tab → Look for "Elastic IP addresses"
```

---

## 📞 Quick Reference

| Task | Location | Action |
|------|----------|--------|
| **Allocate IP** | EC2 → Elastic IPs | Allocate Elastic IP address |
| **Associate IP** | EC2 → Elastic IPs | Actions → Associate |
| **View IPs** | EC2 → Elastic IPs | List view |
| **Release IP** | EC2 → Elastic IPs | Actions → Release |
| **Check instance IP** | EC2 → Instances | Select instance → Details |

---

## 🔗 Direct AWS Console Links

- **EC2 Dashboard**: [https://console.aws.amazon.com/ec2](https://console.aws.amazon.com/ec2)
- **Elastic IPs**: [https://console.aws.amazon.com/ec2/home#Addresses:](https://console.aws.amazon.com/ec2/home#Addresses:)
- **Instances**: [https://console.aws.amazon.com/ec2/home#Instances:](https://console.aws.amazon.com/ec2/home#Instances:)
- **Security Groups**: [https://console.aws.amazon.com/ec2/home#SecurityGroups:](https://console.aws.amazon.com/ec2/home#SecurityGroups:)

**Note**: Replace region in URL if needed (e.g., `us-east-1`, `ap-south-1`)

---

## 📚 Related Documentation

- **GoDaddy Domain Setup**: [`GODADDY-DOMAIN-SETUP.md`](GODADDY-DOMAIN-SETUP.md:1)
- **EC2 Deployment**: [`EC2-REDEPLOY-GUIDE.md`](EC2-REDEPLOY-GUIDE.md:1)
- **Full Deployment Guide**: [`DEPLOYMENT.md`](DEPLOYMENT.md:1)

---

## 🆘 Still Need Help?

**Can't find Elastic IPs section?**
- Use search bar: Type "Elastic IP" in AWS Console search
- Direct link: [https://console.aws.amazon.com/ec2/home#Addresses:](https://console.aws.amazon.com/ec2/home#Addresses:)

**Need to increase Elastic IP limit?**
- AWS Console → Support → Service Quotas
- Search for "EC2 Elastic IP"
- Request limit increase

**Association not working?**
- Verify instance is running
- Check you're in the correct region
- Wait 1-2 minutes and refresh

---

**Last Updated**: 2026-04-28  
**AWS Documentation**: [https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html)
