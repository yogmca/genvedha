# GenVedha LLM Service

AI-Powered E-commerce App Generator using Claude LLM

## 🚀 Features

- **AI-Powered Generation**: Uses Claude 3.5 Sonnet to understand natural language requirements
- **Template-Based**: Clones and customizes the Coorg Masala e-commerce template
- **Full Customization**: Automatically configures Razorpay, MongoDB, Gmail, and more
- **Production-Ready**: Generates complete, deployable e-commerce applications
- **Fast**: Generates apps in 30-90 seconds
- **Secure**: Built-in authentication, rate limiting, and validation

## 📋 Prerequisites

- Node.js 16+ and npm
- Git installed
- Claude API key from Anthropic
- Internet connection (for cloning templates)

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd genvedha-llm-service
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Claude API key:

```env
CLAUDE_API_KEY=your_claude_api_key_here
```

### 3. Start the Service

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The service will start on `http://localhost:3001`

## 📡 API Endpoints

### Generate App

**POST** `/api/genvedha/generate`

Generate a new e-commerce app based on natural language requirements.

**Request Body:**

```json
{
  "userRequirements": "Create a fashion e-commerce store for women's clothing with 500 products, Razorpay payment, and WhatsApp notifications",
  "credentials": {
    "mongodbUri": "mongodb+srv://...",
    "razorpayKeyId": "rzp_test_...",
    "razorpayKeySecret": "...",
    "gmailUser": "your-email@gmail.com",
    "gmailPassword": "your-app-password"
  },
  "userId": "user123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "App generated successfully",
  "data": {
    "generationId": "uuid-here",
    "appName": "Fashion Store",
    "appPath": "./generated-apps/fashion-store-abc123",
    "duration": 45000,
    "customizations": { ... }
  }
}
```

### Check Status

**GET** `/api/genvedha/status/:generationId`

Check the status of an ongoing generation.

### Health Check

**GET** `/api/genvedha/health`

Check if the service is running and Claude API is accessible.

## 🔧 Configuration

### Required Credentials

When generating an app, you must provide:

1. **MongoDB**: Connection URI or credentials
2. **Razorpay**: Key ID and Secret
3. **Gmail**: Email and App Password

### Optional Configuration

- `ENABLE_AUTH`: Enable API key authentication
- `RATE_LIMIT_MAX`: Maximum requests per window
- `MAX_CONCURRENT_GENERATIONS`: Concurrent generation limit

## 📦 Generated App Structure

```
generated-apps/
└── fashion-store-abc123/
    ├── .env                    # Pre-configured environment
    ├── package.json            # Dependencies
    ├── server.js               # Backend server
    ├── src/                    # Source code
    ├── public/                 # Static files
    └── GENERATED_APP_README.md # Setup instructions
```

## 🔐 Security

- **Rate Limiting**: Prevents abuse (10 requests per 15 minutes)
- **Input Validation**: Sanitizes all user inputs
- **API Authentication**: Optional API key protection
- **Credential Validation**: Validates all credentials before generation

## 🧪 Testing

### Test Generation Request

```bash
curl -X POST http://localhost:3001/api/genvedha/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userRequirements": "Create a spice e-commerce store",
    "credentials": {
      "mongodbUri": "mongodb://localhost:27017/test",
      "razorpayKeyId": "rzp_test_123",
      "razorpayKeySecret": "secret123",
      "gmailUser": "test@gmail.com",
      "gmailPassword": "password"
    }
  }'
```

## 🔄 Integration with Main Server

To integrate with your main GenVedha website:

```javascript
// In your main server.js
const GenvedhaLLMService = require('./genvedha-llm-service');

const llmService = new GenvedhaLLMService();
await llmService.initialize();

// Mount the service routes
app.use('/api/genvedha', llmService.getApp());
```

## 📊 Monitoring

The service logs all operations:

- Generation requests
- Claude API calls
- File operations
- Errors and warnings

## 🐛 Troubleshooting

### Claude API Errors

- Verify your API key is correct
- Check your Anthropic account has credits
- Ensure internet connectivity

### Template Clone Errors

- Verify Git is installed
- Check GitHub repository is accessible
- Ensure sufficient disk space

### Generation Failures

- Check logs for specific errors
- Validate all credentials are correct
- Ensure template repository is accessible

## 📝 License

Proprietary - GenVedha Global AI & Software Solutions

## 🤝 Support

For support, contact GenVedha support team.

---

**Powered by Claude 3.5 Sonnet** 🤖
