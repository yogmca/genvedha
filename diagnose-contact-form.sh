#!/bin/bash

# Diagnostic script for contact form issues on EC2

echo "================================================"
echo "Contact Form Diagnostic Script"
echo "================================================"
echo ""

echo "1. Checking if .env file exists..."
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo ""
    echo "2. Checking email configuration..."
    grep "EMAIL_" .env | sed 's/EMAIL_PASSWORD=.*/EMAIL_PASSWORD=***hidden***/'
else
    echo "❌ .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

echo ""
echo "3. Checking if server is running..."
if pm2 list | grep -q "genvedha-app"; then
    echo "✅ Application is running"
    pm2 status genvedha-app
else
    echo "❌ Application not running!"
    echo "Starting application..."
    pm2 start server.js --name genvedha-app
fi

echo ""
echo "4. Checking recent logs..."
pm2 logs genvedha-app --lines 30 --nostream

echo ""
echo "5. Testing health endpoint..."
curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health

echo ""
echo "6. Testing contact API endpoint..."
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "company": "Test Company",
    "service": "General Inquiry",
    "message": "This is a test message from diagnostic script"
  }' | python3 -m json.tool 2>/dev/null || curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "company": "Test Company",
    "service": "General Inquiry",
    "message": "This is a test message from diagnostic script"
  }'

echo ""
echo "================================================"
echo "Diagnostic Complete"
echo "================================================"
