# 🚀 Quick EC2 Testing Guide

## One-Command Test

```bash
bash test-ec2-deployment.sh
```

---

## 📋 Quick Status Check (30 seconds)

```bash
# 1. Check PM2 status
pm2 status

# 2. Check if app responds
curl -I http://localhost:3000

# 3. Check public access
curl -I http://$(curl -s http://checkip.amazonaws.com)

# 4. Check Nginx
sudo systemctl status nginx

# 5. View recent logs
pm2 logs genvedha --lines 20 --nostream
```

---

## ✅ Expected Results

### PM2 Status
```
┌────┬─────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name        │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼─────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ genvedha    │ default     │ 1.0.0   │ fork    │ XXXXX    │ Xm     │ 0    │ online    │ 0%       │ XXmb     │ ubuntu   │ disabled │
└────┴─────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```
**Status should be: `online`** ✅

### Localhost Response
```
HTTP/1.1 200 OK
```
**Status code should be: `200`** ✅

### Public IP Response
```
HTTP/1.1 200 OK
```
**Status code should be: `200`** ✅

### Nginx Status
```
● nginx.service - A high performance web server and a reverse proxy server
   Loaded: loaded
   Active: active (running)
```
**Status should be: `active (running)`** ✅

---

## 🔧 Quick Fixes

### If PM2 shows "stopped" or "errored"
```bash
pm2 restart genvedha
pm2 logs genvedha --err
```

### If localhost doesn't respond
```bash
pm2 restart genvedha
netstat -tuln | grep 3000
```

### If public IP doesn't respond
```bash
# Check Nginx
sudo nginx -t
sudo systemctl restart nginx

# Check AWS Security Group allows port 80
```

### If Nginx is not running
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🌐 Test from Browser

1. **Get your public IP:**
   ```bash
   curl http://checkip.amazonaws.com
   ```

2. **Open in browser:**
   ```
   http://YOUR-PUBLIC-IP
   ```

3. **If you have a domain:**
   ```
   http://your-domain.com
   https://your-domain.com  (if SSL configured)
   ```

---

## 📊 Monitor in Real-Time

```bash
# Watch PM2 metrics
pm2 monit

# Watch logs live
pm2 logs genvedha

# Watch Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

---

## 🚨 Emergency Restart

```bash
# Restart everything
pm2 restart all && sudo systemctl restart nginx

# Check status
pm2 status && sudo systemctl status nginx
```

---

## 📱 Save Test Results

```bash
# Run test and save results
bash test-ec2-deployment.sh | tee ~/test-$(date +%Y%m%d-%H%M%S).log
```

---

## ✅ Success Checklist

- [ ] PM2 status shows "online"
- [ ] `curl http://localhost:3000` returns 200
- [ ] Public IP is accessible
- [ ] Nginx is running
- [ ] No errors in logs
- [ ] MongoDB connected (check logs)
- [ ] Domain resolves (if configured)
- [ ] SSL works (if configured)

---

## 📞 Need Help?

Run the full diagnostic:
```bash
bash test-ec2-deployment.sh
```

Check detailed logs:
```bash
pm2 logs genvedha --lines 100
sudo tail -100 /var/log/nginx/error.log
```

---

**Pro Tip:** Bookmark this page for quick reference! 🔖
