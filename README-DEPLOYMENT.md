# Quick Deployment Guide

## 🚀 Deploy to AWS EC2 with HTTPS in 3 Steps

### Prerequisites
- AWS EC2 instance (Amazon Linux 2 or Ubuntu)
- Domain name with DNS pointing to EC2 IP
- SSH access to EC2 instance

---

## Step 1: Initial Server Setup

SSH into your EC2 instance and run:

```bash
curl -o- https://raw.githubusercontent.com/yogmca/genvedha/production/initial-setup.sh | bash
```

Or manually:

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
wget https://raw.githubusercontent.com/yogmca/genvedha/production/initial-setup.sh
chmod +x initial-setup.sh
./initial-setup.sh
```

This will:
- ✅ Install Node.js 18.x
- ✅ Install Git and PM2
- ✅ Clone the repository from GitHub
- ✅ Create `.env` file from template

---

## Step 2: Configure Environment

Edit the `.env` file with your settings:

```bash
cd ~/genvedha-website
nano .env
```

Update these values:
```env
NODE_ENV=production
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CONTACT_EMAIL=contact@genvedha.com
```

---

## Step 3: Deploy Application

```bash
cd ~/genvedha-website
./deploy.sh
```

This will:
- ✅ Pull latest code from GitHub (production branch)
- ✅ Install dependencies
- ✅ Build the application
- ✅ Start with PM2

Your app is now running on `http://your-ec2-ip:3000`

---

## Step 4: Setup HTTPS (Optional but Recommended)

**Before running this step:**
1. Point your domain's DNS A record to your EC2 IP
2. Ensure AWS Security Group allows ports 80 and 443

```bash
cd ~/genvedha-website
sudo ./setup-https.sh
```

You'll be prompted for:
- Domain name (e.g., `genvedha.com`)
- Email for SSL notifications

This will:
- ✅ Install and configure Nginx
- ✅ Obtain SSL certificate from Let's Encrypt
- ✅ Setup automatic certificate renewal
- ✅ Configure HTTPS redirect

Your app is now accessible at `https://your-domain.com` 🎉

---

## 🔄 Updating the Application

To deploy updates from GitHub:

```bash
cd ~/genvedha-website
./deploy.sh
```

The script automatically:
- Pulls latest code from production branch
- Preserves your `.env` file
- Rebuilds and restarts the application

---

## 📊 Monitoring

### Check Application Status
```bash
pm2 status
pm2 logs genvedha-website
pm2 monit
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/genvedha_error.log
```

### Check SSL Certificate
```bash
sudo certbot certificates
```

---

## 🛠️ Troubleshooting

### Application not starting?
```bash
pm2 logs genvedha-website --lines 100
pm2 restart genvedha-website
```

### Nginx issues?
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### SSL certificate issues?
```bash
sudo certbot renew --dry-run
```

### Port 80/443 not accessible?
Check AWS Security Group inbound rules:
- Port 22 (SSH)
- Port 80 (HTTP)
- Port 443 (HTTPS)

---

## 📁 File Structure

```
genvedha-website/
├── deploy.sh              # Main deployment script
├── setup-https.sh         # HTTPS/SSL setup script
├── initial-setup.sh       # Initial server setup
├── DEPLOYMENT.md          # Detailed deployment guide
├── .env                   # Environment variables (create from .env.example)
└── server.js              # Node.js server
```

---

## 🔐 Security Checklist

- ✅ Use strong passwords for SMTP
- ✅ Keep `.env` file secure (never commit to Git)
- ✅ Enable AWS Security Group rules properly
- ✅ Keep system updated: `sudo yum update -y`
- ✅ Monitor logs regularly
- ✅ SSL certificate auto-renews (check with `sudo certbot certificates`)

---

## 📞 Support

For detailed documentation, see [`DEPLOYMENT.md`](./DEPLOYMENT.md)

For issues:
- Check logs: `pm2 logs genvedha-website`
- Review Nginx logs: `sudo tail -f /var/log/nginx/genvedha_error.log`
- Contact: admin@genvedha.com

---

## 🎯 Quick Commands Reference

| Task | Command |
|------|---------|
| Deploy updates | `./deploy.sh` |
| View logs | `pm2 logs genvedha-website` |
| Restart app | `pm2 restart genvedha-website` |
| Check status | `pm2 status` |
| Monitor resources | `pm2 monit` |
| Restart Nginx | `sudo systemctl restart nginx` |
| Check SSL | `sudo certbot certificates` |
| Renew SSL | `sudo certbot renew` |

---

**Repository:** https://github.com/yogmca/genvedha
**Branch:** production
