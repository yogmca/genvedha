# GenVedha LLM Service - Complete Setup Guide

## 🎯 Overview

The GenVedha LLM Service is an AI-powered e-commerce app generator that uses Claude 3.5 Sonnet to create customized e-commerce applications based on natural language requirements.

## 📁 Service Structure

```
genvedha-llm-service/
├── config/
│   └── index.js                 # Configuration management
├── services/
│   ├── claude-client.js         # Claude API integration
│   ├── template-manager.js      # GitHub template management
│   ├── app-generator.js         # Main generation orchestrator
│   ├── env-generator.js         # Environment config generator
│   └── code-customizer.js       # Code customization engine
├── api/
│   └── routes.js                # API endpoints
├── middleware/
│   ├── auth.js                  # Authentication
│   ├── validation.js            # Request validation
│   └── rate-limit.js            # Rate limiting
├── index.js                     # Main entry point
├── package.json                 # Dependencies
├── .env.example                 # Environment template
└── README.md                    # Documentation
```

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd genvedha-llm-service
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Claude API key:

```env
CLAUDE_API_KEY=sk-ant-api03-your-key-here
```

### Step 3: Start the Service

```bash
# Standalone mode
npm start

# Development mode with auto-reload
npm run dev
```

The service will be available at `http://localhost:3001`

## 🔑 Getting Claude API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-api03-`)
6. Add to your `.env` file

## 📡 API Usage

### Generate E-commerce App

**Endpoint:** `POST /api/genvedha/generate`

**Request:**

```json
{
  "userRequirements": "Create a fashion e-commerce store for women's clothing with Razorpay payment and WhatsApp notifications",
  "credentials": {
    "mongodbUri": "mongodb+srv://username:password@cluster.mongodb.net/database",
    "razorpayKeyId": "rzp_test_xxxxxxxxxxxx",
    "razorpayKeySecret": "your_razorpay_secret",
    "gmailUser": "your-email@gmail.com",
    "gmailPassword": "your-gmail-app-password",
    "emailTo": "support@example.com"
  },
  "userId": "customer123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "App generated successfully",
  "data": {
    "generationId": "abc-123-def-456",
    "appName": "Fashion Store",
    "appPath": "./generated-apps/fashion-store-abc123",
    "duration": 45000,
    "customizations": {
      "appName": "Fashion Store",
      "businessType": "fashion",
      "brandingChanges": {
        "companyName": "Fashion Store",
        "primaryColor": "#ff1493",
        "secondaryColor": "#ffd700"
      }
    }
  }
}
```

### Check Generation Status

**Endpoint:** `GET /api/genvedha/status/:generationId`

**Response:**

```json
{
  "success": true,
  "data": {
    "generationId": "abc-123-def-456",
    "status": "completed",
    "progress": 100
  }
}
```

### Health Check

**Endpoint:** `GET /api/genvedha/health`

**Response:**

```json
{
  "success": true,
  "service": "GenVedha LLM Service",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔗 Integration with Main Server

To integrate the LLM service with your main GenVedha website:

### Option 1: Standalone Service (Recommended)

Run the service on a separate port and proxy requests:

```javascript
// In your main server.js
const axios = require('axios');

app.post('/api/generate-app', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:3001/api/genvedha/generate', req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Option 2: Integrated Service

Mount the service directly in your main server:

```javascript
// In your main server.js
const GenvedhaLLMService = require('./genvedha-llm-service');

// Initialize the service
const llmService = new GenvedhaLLMService();
await llmService.initialize();

// Mount routes
app.use('/api/genvedha', llmService.getApp());
```

## 🎨 Example: Generate Fashion Store

```bash
curl -X POST http://localhost:3001/api/genvedha/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userRequirements": "Create a fashion e-commerce store for women'\''s clothing with 500 products, Razorpay payment, WhatsApp notifications, and Instagram integration. Brand name: StyleVista",
    "credentials": {
      "mongodbUri": "mongodb+srv://user:pass@cluster.mongodb.net/stylevista",
      "razorpayKeyId": "rzp_test_123456",
      "razorpayKeySecret": "secret123",
      "gmailUser": "support@stylevista.com",
      "gmailPassword": "app-password-here",
      "emailTo": "admin@stylevista.com",
      "whatsappNumber": "+919876543210"
    },
    "userId": "customer001"
  }'
```

## 📦 Generated App Structure

After generation, you'll find:

```
generated-apps/
└── stylevista-abc123/
    ├── .env                          # Pre-configured with your credentials
    ├── .env.example                  # Template for reference
    ├── package.json                  # Updated with app name
    ├── server.js                     # Backend server
    ├── src/
    │   ├── config/
    │   │   ├── app-config.json      # App configuration
    │   │   └── features.json        # Feature flags
    │   └── styles/
    │       └── variables.css        # Brand colors
    ├── public/
    │   ├── index.html               # Updated with branding
    │   └── robots.txt               # SEO configuration
    └── GENERATED_APP_README.md      # Setup instructions
```

## 🚀 Deploying Generated Apps

### Step 1: Navigate to Generated App

```bash
cd generated-apps/stylevista-abc123
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Review Configuration

```bash
cat .env
# Verify all credentials are correct
```

### Step 4: Start the App

```bash
# Development
npm run dev

# Production
npm start
```

### Step 5: Access the App

- Frontend: http://localhost:3000
- Admin Panel: http://localhost:3000/admin

## 🔐 Security Best Practices

1. **API Key Protection**: Never commit `.env` files
2. **Rate Limiting**: Default 10 requests per 15 minutes
3. **Authentication**: Enable `ENABLE_AUTH=true` for production
4. **Credential Validation**: All credentials are validated before generation
5. **Input Sanitization**: User inputs are sanitized automatically

## 🐛 Troubleshooting

### Issue: Claude API Error

**Solution:**
- Verify API key is correct
- Check Anthropic account has credits
- Ensure internet connectivity

### Issue: Template Clone Failed

**Solution:**
- Verify Git is installed: `git --version`
- Check GitHub repository is accessible
- Ensure sufficient disk space

### Issue: Generation Timeout

**Solution:**
- Increase `GENERATION_TIMEOUT` in `.env`
- Check Claude API response time
- Verify network connectivity

### Issue: Invalid Credentials

**Solution:**
- Verify MongoDB URI format
- Test Razorpay keys in dashboard
- Use Gmail App Password (not regular password)

## 📊 Performance Metrics

- **Generation Time**: 30-90 seconds per app
- **Claude API Cost**: $0.05-0.15 per generation
- **Template Size**: ~50MB per app
- **Concurrent Generations**: Up to 5 (configurable)

## 🔄 Maintenance

### Clean Up Old Apps

```bash
curl -X POST http://localhost:3001/api/genvedha/cleanup \
  -H "X-API-Key: your-api-key"
```

This removes apps older than 30 days (configurable via `CLEANUP_DAYS`).

### Update Template

The service automatically pulls the latest template on initialization. To force update:

```bash
rm -rf templates/coorgmasala
# Restart the service
npm start
```

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLAUDE_API_KEY` | ✅ Yes | - | Anthropic Claude API key |
| `CLAUDE_MODEL` | No | claude-3-5-sonnet-20241022 | Claude model to use |
| `TEMPLATE_REPO_URL` | No | yogmca/coorgmasala | GitHub template repository |
| `TEMPLATE_BRANCH` | No | coorg_masal_genvedha_template | Template branch |
| `GENVEDHA_SERVICE_PORT` | No | 3001 | Service port |
| `ENABLE_AUTH` | No | false | Enable API authentication |
| `GENVEDHA_API_KEY` | No | - | API key for authentication |
| `RATE_LIMIT_MAX` | No | 10 | Max requests per window |
| `MAX_CONCURRENT_GENERATIONS` | No | 5 | Concurrent generation limit |

## 🎯 Next Steps

1. **Test the Service**: Generate a test app
2. **Integrate with Frontend**: Connect your AI chatbot
3. **Configure Payment**: Set up Razorpay webhook
4. **Deploy to Production**: Use PM2 or Docker
5. **Monitor Usage**: Track Claude API costs

## 📞 Support

For issues or questions:
- Check logs in console
- Review generated app's `GENERATED_APP_README.md`
- Contact GenVedha support team

---

**Powered by Claude 3.5 Sonnet** 🤖
**Built by GenVedha Global AI & Software Solutions** 🚀
