# Deployment Guide for AWS EC2

This guide explains how to deploy the Genvedha Website on an AWS EC2 instance with HTTPS support.

## Prerequisites

1. **AWS EC2 Instance**
   - Amazon Linux 2 or Ubuntu
   - At least t2.micro (1GB RAM)
   - Security Group with ports 22, 80, and 443 open

2. **Domain Name**
   - A registered domain name
   - DNS A record pointing to your EC2 instance's public IP

3. **SSH Access**
   - SSH key pair for EC2 instance access

## Initial Server Setup

### 1. Connect to EC2 Instance

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 2. Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install Git

```bash
sudo yum install git -y
```

### 4. Clone Repository

```bash
cd ~
git clone -b production https://github.com/yogmca/genvedha.git genvedha-website
cd genvedha-website
```

**Note:** The deployment script will automatically clone the repository if it doesn't exist, pulling from the `production` branch. The scripts automatically detect your home directory.

### 5. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit with your values
nano .env
```

Update the following variables:
```env
NODE_ENV=production
PORT=3000
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
CONTACT_EMAIL=contact@genvedha.com
```

## Deployment

### Option 1: Quick Deployment (HTTP Only)

The deployment script will:
- Clone the repository from `https://github.com/yogmca/genvedha.git` (if not exists)
- Pull latest code from the `production` branch
- Install dependencies
- Build the application
- Start/restart with PM2

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Option 2: Full Deployment with HTTPS

#### Step 1: Deploy Application

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

#### Step 2: Setup HTTPS

```bash
# Make script executable
chmod +x setup-https.sh

# Set your domain and email
export DOMAIN_NAME="genvedha.com"
export SSL_EMAIL="admin@genvedha.com"

# Run HTTPS setup (requires sudo)
sudo ./setup-https.sh
```

Or run interactively:

```bash
sudo ./setup-https.sh
# You'll be prompted for domain name and email
```

## Post-Deployment

### Verify Application is Running

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs genvedha-website

# Monitor application
pm2 monit
```

### Verify HTTPS

```bash
# Check Nginx status
sudo systemctl status nginx

# Test SSL certificate
sudo certbot certificates

# Check Nginx configuration
sudo nginx -t
```

### Access Your Website

- HTTP: `http://your-domain.com` (redirects to HTTPS)
- HTTPS: `https://your-domain.com`

## Updating the Application

To deploy updates from GitHub:

```bash
cd ~/genvedha-website
./deploy.sh
```

The script will:
1. Pull latest code from GitHub (`yogmca/genvedha` repository, `production` branch)
2. Preserve your `.env` file
3. Install/update dependencies
4. Build the application
5. Restart with PM2
6. Display current commit and status

You can also manually pull and deploy:

```bash
cd /home/ec2-user/genvedha-website
git pull origin production
npm ci
npm run build
pm2 restart genvedha-website
```

## SSL Certificate Management

### Auto-Renewal

Certificates automatically renew via cron job. Check renewal status:

```bash
sudo certbot renew --dry-run
```

### Manual Renewal

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### View Certificate Details

```bash
sudo certbot certificates
```

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs genvedha-website --lines 100

# Restart application
pm2 restart genvedha-website

# Check if port 3000 is in use
sudo netstat -tlnp | grep 3000
```

### Nginx Issues

```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/genvedha_error.log

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Check Let's Encrypt logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Port 80/443 Not Accessible

Check AWS Security Group:
1. Go to EC2 Console
2. Select your instance
3. Click on Security Group
4. Ensure inbound rules allow:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)

### Domain Not Resolving

```bash
# Check DNS resolution
nslookup your-domain.com

# Check if domain points to correct IP
dig your-domain.com +short
```

Should return your EC2 instance's public IP.

## Useful Commands

### PM2 Commands

```bash
pm2 list                          # List all processes
pm2 logs genvedha-website         # View logs
pm2 restart genvedha-website      # Restart app
pm2 stop genvedha-website         # Stop app
pm2 delete genvedha-website       # Remove from PM2
pm2 monit                         # Monitor resources
pm2 save                          # Save process list
```

### Nginx Commands

```bash
sudo systemctl status nginx       # Check status
sudo systemctl start nginx        # Start Nginx
sudo systemctl stop nginx         # Stop Nginx
sudo systemctl restart nginx      # Restart Nginx
sudo systemctl reload nginx       # Reload config
sudo nginx -t                     # Test configuration
```

### System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -m

# Check CPU usage
top

# Check running processes
ps aux | grep node
```

## Security Best Practices

1. **Keep System Updated**
   ```bash
   sudo yum update -y
   ```

2. **Configure Firewall**
   ```bash
   sudo firewall-cmd --list-all
   ```

3. **Regular Backups**
   - Backup `.env` file
   - Backup database (if applicable)
   - Create EC2 snapshots

4. **Monitor Logs**
   ```bash
   pm2 logs genvedha-website
   sudo tail -f /var/log/nginx/genvedha_access.log
   ```

5. **Use Strong Passwords**
   - Update SMTP credentials regularly
   - Use environment variables for secrets

## Performance Optimization

### Enable Gzip Compression

Add to Nginx configuration:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### PM2 Cluster Mode

For better performance:

```bash
pm2 start server.js --name genvedha-website -i max
```

## Support

For issues or questions:
- Check logs: `pm2 logs genvedha-website`
- Review Nginx logs: `sudo tail -f /var/log/nginx/genvedha_error.log`
- Contact: admin@genvedha.com
