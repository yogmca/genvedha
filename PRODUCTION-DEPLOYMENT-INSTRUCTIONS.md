# Production Deployment Instructions

## ✅ Code Successfully Pushed to Production Branch

Your latest changes have been pushed to the `production` branch on GitHub.

## 🚀 Deploy to EC2 Server

Now you need to set up/update the production server. Follow these steps:

### Step 1: Copy the setup script to your EC2 server

```bash
scp -i your-key.pem setup-production-server.sh ubuntu@your-ec2-ip:~/
```

### Step 2: SSH into your EC2 server

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 3: Run the setup script

```bash
chmod +x setup-production-server.sh
./setup-production-server.sh
```

## 📋 What the Script Does

1. **Clones the repository** from the production branch
2. **Installs dependencies** (npm install)
3. **Builds the application** (npm run build)
4. **Stops existing PM2 processes**
5. **Starts the application** with PM2
6. **Saves PM2 configuration** for auto-restart
7. **Sets up PM2 startup script** to run on server reboot

## 🔍 Verify Deployment

After running the script, verify your site is working:

1. Check PM2 status:
   ```bash
   sudo pm2 status
   ```

2. Check application logs:
   ```bash
   sudo pm2 logs genvedha
   ```

3. Visit your website:
   - http://genvedha.com
   - https://genvedha.com (if SSL is configured)

## 🔄 Future Updates

For future updates, you can use a simpler update script:

```bash
cd ~/genvedha-website
git pull origin production
npm install
npm run build
sudo pm2 restart genvedha
```

## 🆘 Troubleshooting

If the site is not working:

1. Check if the app is running:
   ```bash
   sudo pm2 status
   ```

2. Check logs for errors:
   ```bash
   sudo pm2 logs genvedha --lines 50
   ```

3. Check if port 3000 is listening:
   ```bash
   sudo netstat -tlnp | grep 3000
   ```

4. Restart the application:
   ```bash
   sudo pm2 restart genvedha
   ```

## 📝 Notes

- The application runs on port 3000
- Make sure your AWS Security Group allows inbound traffic on ports 80, 443, and 3000
- Nginx should be configured to proxy requests to port 3000
