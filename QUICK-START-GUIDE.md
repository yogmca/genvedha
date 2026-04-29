# 🚀 QUICK START GUIDE - Get genvedha.com Back Online

## ⚡ 5-Minute Quick Fix

### Step 1: Check AWS Console (2 minutes)

1. Open: https://console.aws.amazon.com/ec2/v2/home#Instances:
2. Find your instance (look for genvedha or the IPs: 3.11.178.44, 15.197.148.33, 3.33.130.190)
3. Check "Instance State":
   - **If STOPPED** → Click "Instance State" → "Start Instance" → Wait 2 min
   - **If RUNNING** → Go to Step 2
   - **If TERMINATED** → You need to redeploy (see EC2-REDEPLOY-GUIDE.md)

### Step 2: Check Security Group (1 minute)

1. In EC2 console, click on your instance
2. Click "Security" tab
3. Click on the security group name (sg-01b24f42694bc45f6)
4. Check "Inbound rules" - you MUST have:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 3000 (Custom TCP)
5. If any are missing:
   - Click "Edit inbound rules"
   - Click "Add rule"
   - Select the type and set Source to 0.0.0.0/0
   - Click "Save rules"

### Step 3: SSH and Run Recovery (2 minutes)

```bash
# SSH to your server (replace with your key and IP)
ssh -i ~/.ssh/your-key.pem ubuntu@genvedha.com

# Navigate to project
cd /home/ubuntu/genvedha-website

# Pull latest code
git pull origin production

# Run emergency recovery
sudo ./emergency-server-recovery.sh
```

### Step 4: Setup SSL (Optional - 5 minutes)

```bash
# After recovery script completes successfully
sudo ./fix-site-down-ssl.sh
```

## ✅ Verification

Test your site:
```bash
# From your local machine
curl http://genvedha.com
curl https://genvedha.com
```

Or open in browser: https://genvedha.com

## 🆘 If Something Goes Wrong

### Can't SSH?
- Check instance is running in AWS console
- Check security group has port 22 open
- Check you're using correct key file
- Try IP address instead of domain: `ssh -i key.pem ubuntu@3.11.178.44`

### Scripts not found?
```bash
cd /home/ubuntu/genvedha-website
git pull origin production
ls -la *.sh
```

### App still not working?
```bash
# Check logs
pm2 logs

# Check status
pm2 status

# Restart manually
pm2 restart all
```

### SSL fails?
- Make sure ports 80 and 443 are open in security group
- Check DNS is pointing to correct IP
- Wait 5 minutes and try again

## 📞 Still Need Help?

Read the detailed guides:
- **Server completely down:** `CRITICAL-SERVER-DOWN.md`
- **SSL issues:** `SITE-IS-DOWN-FIX.md`
- **Full redeployment:** `EC2-REDEPLOY-GUIDE.md`

---

**Remember:** The most common issue is that the EC2 instance is stopped. Always check AWS Console first!
