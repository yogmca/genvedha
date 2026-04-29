#!/bin/bash

# Quick status check script

echo "============================================"
echo "GENVEDHA.COM - STATUS CHECK"
echo "============================================"
echo ""

# Check PM2
echo "=== PM2 Status ==="
pm2 status
echo ""

# Check if app is responding
echo "=== Testing Application ==="
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ App is responding on port 3000"
    echo ""
    echo "Response preview:"
    curl -I http://localhost:3000 2>/dev/null | head -5
else
    echo "❌ App is NOT responding on port 3000"
fi
echo ""

# Check Nginx
echo "=== Nginx Status ==="
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
fi
echo ""

# Check ports
echo "=== Listening Ports ==="
if command -v ss &> /dev/null; then
    sudo ss -tlnp | grep -E ":(80|443|3000) " || echo "No services found"
elif command -v netstat &> /dev/null; then
    sudo netstat -tlnp | grep -E ":(80|443|3000) " || echo "No services found"
else
    echo "Neither ss nor netstat available"
fi
echo ""

# Test external access
echo "=== External Access Test ==="
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
echo "Public IP: $PUBLIC_IP"
echo ""

# Check logs
echo "=== Recent PM2 Logs (last 10 lines) ==="
pm2 logs --lines 10 --nostream 2>/dev/null || echo "No logs available"
echo ""

echo "============================================"
echo "Quick Commands:"
echo "  View logs:    pm2 logs"
echo "  Restart app:  pm2 restart all"
echo "  Test locally: curl http://localhost:3000"
echo "  Setup SSL:    sudo ./fix-site-down-ssl.sh"
echo "============================================"
