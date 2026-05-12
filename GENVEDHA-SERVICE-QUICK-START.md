# GenVedha LLM Service - Quick Start Guide

## 🎯 What is This?

An AI-powered service that generates complete e-commerce applications in minutes based on natural language descriptions. Perfect for creating custom online stores for your customers.

## ⚡ Quick Start (5 Minutes)

### Step 1: Get Claude API Key

1. Visit: https://console.anthropic.com/
2. Sign up (free tier available)
3. Go to "API Keys" section
4. Create new key
5. Copy the key (starts with `sk-ant-api03-`)

### Step 2: Start the Service

```bash
# Make the start script executable (first time only)
chmod +x start-genvedha-service.sh

# Start the service
./start-genvedha-service.sh
```

The script will:
- Check Node.js installation
- Install dependencies
- Create `.env` file
- Prompt you to add your Claude API key
- Start the service on port 3001

### Step 3: Add Your API Key

When prompted, edit the `.env` file:

```bash
cd genvedha-llm-service
nano .env  # or use your preferred editor
```

Add your Claude API key:

```env
CLAUDE_API_KEY=sk-ant-api03-your-actual-key-here
```

Save and restart the service.

### Step 4: Test the Service

```bash
# In a new terminal
node test-genvedha-service.js
```

This will:
- Check if service is running
- Generate a test fashion e-commerce app
- Show you the generated app location

## 🎨 Generate Your First App

### Example 1: Fashion Store

```bash
curl -X POST http://localhost:3001/api/genvedha/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userRequirements": "Create a fashion store for women'\''s clothing with Razorpay payment",
    "credentials": {
      "mongodbUri": "mongodb://localhost:27017/fashionstore",
      "razorpayKeyId": "rzp_test_123",
      "razorpayKeySecret": "secret123",
      "gmailUser": "store@gmail.com",
      "gmailPassword": "app-password"
    }
  }'
```

### Example 2: Electronics Store

```bash
curl -X POST http://localhost:3001/api/genvedha/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userRequirements": "Create an electronics store selling phones, laptops, and accessories with COD option",
    "credentials": {
      "mongodbUri": "mongodb://localhost:27017/electronics",
      "razorpayKeyId": "rzp_test_123",
      "razorpayKeySecret": "secret123",
      "gmailUser": "electronics@gmail.com",
      "gmailPassword": "app-password"
    }
  }'
```

### Example 3: Food Delivery

```bash
curl -X POST http://localhost:3001/api/genvedha/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userRequirements": "Create a food delivery app for restaurants with real-time order tracking",
    "credentials": {
      "mongodbUri": "mongodb://localhost:27017/fooddelivery",
      "razorpayKeyId": "rzp_test_123",
      "razorpayKeySecret": "secret123",
      "gmailUser": "food@gmail.com",
      "gmailPassword": "app-password"
    }
  }'
```

## 📦 Using Generated Apps

After generation completes:

```bash
# Navigate to generated app
cd generated-apps/your-app-name-xxxxx

# Install dependencies
npm install

# Start the app
npm start

# Access at http://localhost:3000
```

## 🔧 Configuration

### Minimum Required Credentials

```json
{
  "mongodbUri": "mongodb://...",
  "razorpayKeyId": "rzp_test_...",
  "razorpayKeySecret": "...",
  "gmailUser": "email@gmail.com",
  "gmailPassword": "app-password"
}
```

### Optional Credentials

```json
{
  "emailTo": "support@example.com",
  "whatsappNumber": "+919876543210",
  "whatsappApiKey": "...",
  "appUrl": "https://yourstore.com"
}
```

## 🎯 What Gets Generated?

Each generated app includes:

- ✅ Complete MERN stack application
- ✅ Product catalog with categories
- ✅ Shopping cart & checkout
- ✅ Razorpay payment integration
- ✅ User authentication
- ✅ Admin panel
- ✅ Email notifications
- ✅ Responsive design
- ✅ SEO optimization
- ✅ Pre-configured `.env` file
- ✅ Setup documentation

## ⏱️ Generation Time

- **Simple Store**: 30-45 seconds
- **Advanced Store**: 60-90 seconds
- **Complex Marketplace**: 90-120 seconds

## 💰 Cost

- **Claude API**: ~$0.05-0.15 per generation
- **Infrastructure**: Uses your existing server
- **No recurring fees**: One-time generation cost

## 🔐 Security

- API key authentication (optional)
- Rate limiting (10 requests per 15 min)
- Input validation & sanitization
- Credential validation before generation

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check if port 3001 is available
lsof -i :3001

# Kill process if needed
kill -9 <PID>

# Restart service
./start-genvedha-service.sh
```

### Claude API Error

- Verify API key is correct
- Check account has credits
- Ensure internet connection

### Generation Fails

- Check all credentials are valid
- Verify MongoDB URI format
- Test Razorpay keys in dashboard
- Use Gmail App Password (not regular password)

## 📚 Full Documentation

For complete documentation, see:
- [`GENVEDHA-LLM-SERVICE-SETUP.md`](GENVEDHA-LLM-SERVICE-SETUP.md) - Complete setup guide
- [`genvedha-llm-service/README.md`](genvedha-llm-service/README.md) - Service documentation

## 🎓 Video Tutorial

Coming soon: Step-by-step video guide

## 💬 Support

For help:
1. Check logs in console
2. Review generated app's README
3. Contact GenVedha support

## 🚀 Next Steps

1. ✅ Start the service
2. ✅ Generate a test app
3. ✅ Customize for your needs
4. ✅ Deploy to production
5. ✅ Start selling!

---

**Built with ❤️ by GenVedha Global AI & Software Solutions**
