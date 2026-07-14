# AI E-commerce Service Page - Deployment Guide

## 🎉 What's New

A comprehensive service page showcasing GenVedha's AI-powered e-commerce solution has been added to the website.

### New Files Created:
- `src/pages/AIEcommerceSolution.jsx` - React component for the service page
- `public/ai-ecommerce-solution.html` - Static HTML version (backup)
- `deploy-to-ec2-server.sh` - Server-side deployment script
- `deploy-from-local.sh` - Local deployment helper script

### Modified Files:
- `src/App.jsx` - Added route for `/ai-ecommerce-solution`
- `src/components/Services.jsx` - Updated link to point to new React page

---

## 🚀 Deployment Options

### Option 1: Deploy from Local Machine (Recommended)

1. **Update SSH Configuration** in `deploy-from-local.sh`:
   ```bash
   EC2_KEY="~/.ssh/your-key.pem"  # Update with your actual key path
   ```

2. **Run the deployment script**:
   ```bash
   ./deploy-from-local.sh
   ```

This will:
- Upload the deployment script to EC2
- Execute it remotely
- Pull latest changes
- Build the React app
- Restart the server

---

### Option 2: Deploy Directly on EC2 Server

1. **SSH into your EC2 server**:
   ```bash
   ssh -i ~/.ssh/your-key.pem ubuntu@genvedha.com
   ```

2. **Navigate to project directory**:
   ```bash
   cd /home/ubuntu/genvedha-website
   ```

3. **Run the deployment script**:
   ```bash
   ./deploy-to-ec2-server.sh
   ```

---

### Option 3: Manual Deployment

If you prefer manual control:

```bash
# SSH into EC2
ssh -i ~/.ssh/your-key.pem ubuntu@genvedha.com

# Navigate to project
cd /home/ubuntu/genvedha-website

# Pull latest changes
git checkout production
git pull origin production

# Install dependencies
npm install

# Build React app
npm run build

# Restart server
pm2 restart genvedha-website
# OR
pkill -f "node.*server.js" && nohup node server.js > server.log 2>&1 &
```

---

## 📋 Post-Deployment Checklist

After deployment, verify:

- [ ] Website is accessible: https://genvedha.com
- [ ] New service page loads: https://genvedha.com/ai-ecommerce-solution
- [ ] Navigation from homepage services section works
- [ ] "Learn More" button on AI E-commerce card links correctly
- [ ] All sections render properly (Hero, Features, Benefits, etc.)
- [ ] "The Result" section has proper styling (dark gradient background)
- [ ] Footer links work correctly
- [ ] Mobile responsive design works

---

## 🧪 Testing Locally

Before deploying to production, test locally:

```bash
# Start local server
npm start

# Visit in browser
http://localhost:3000/ai-ecommerce-solution

# Test navigation
- Click GenVedha logo → should go to home
- Click "Learn More" on AI E-commerce service → should go to service page
- Test all internal links
```

---

## 🔍 Troubleshooting

### Server not starting after deployment
```bash
# Check server logs
pm2 logs genvedha-website
# OR
tail -f /home/ubuntu/genvedha-website/server.log
```

### Build fails
```bash
# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Page not loading (404)
- Ensure React Router is properly configured
- Check that `dist/` folder was built correctly
- Verify server.js is serving the React app

### Changes not reflecting
```bash
# Clear browser cache or use incognito mode
# Force rebuild on server
npm run build
pm2 restart genvedha-website --update-env
```

---

## 📊 Page Features

The new AI E-commerce Solution page includes:

### Sections:
1. **Hero Section** - Eye-catching title and subtitle
2. **Overview** - Explanation of how GenVedha reimagined e-commerce
3. **Features Included** - 7 key features (product catalog, cart, admin, etc.)
4. **Then We Go Further** - AWS hosting and domain mapping
5. **How It Works** - 6-step process flow
6. **The GenVedha Advantage** - 8 benefits
7. **The Result** - Highlighted section with dark gradient background
8. **CTA Section** - Call-to-action buttons

### Styling Highlights:
- Dark gradient background for "The Result" section
- Gold-colored tagline (#ffd700)
- Responsive design for all devices
- Consistent with existing GenVedha branding

---

## 🌐 Live URLs

After deployment:
- **Homepage**: https://genvedha.com
- **AI E-commerce Page**: https://genvedha.com/ai-ecommerce-solution
- **Application Development**: https://genvedha.com/application-development

---

## 📝 Notes

- The deployment scripts use PM2 if available, otherwise fall back to nohup
- All changes are committed to the `production` branch
- The React build is automatically generated in the `dist/` folder
- Server runs on port 3000 by default

---

## 🆘 Support

If you encounter issues:
1. Check server logs: `pm2 logs genvedha-website`
2. Verify git status: `git status`
3. Check running processes: `ps aux | grep node`
4. Test server response: `curl http://localhost:3000`

---

**Last Updated**: 2026-07-14
**Version**: 1.0.0
