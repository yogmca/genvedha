/**
 * Simple test for generating a basic e-commerce app
 */

const axios = require('axios');

const SERVICE_URL = 'http://localhost:3001';

// Simpler test data
const simpleRequest = {
  userRequirements: `
Create an online store called "Fresh Organic Produce".

Business Description:
Online marketplace for fresh organic fruits and vegetables delivered to your door.

Product Type: Fresh produce (fruits and vegetables)

Key Features:
- Product catalog with categories
- Shopping cart
- User accounts
- Order tracking
- Payment processing

Custom Fields:
- Organic certification (yes/no)
- Farm origin
- Harvest date
- Weight/quantity

UI Colors:
- Primary: #4CAF50 (green)
- Secondary: #8BC34A (light green)
- Accent: #FF9800 (orange)

Sample Products:
1. Organic Apples - Fresh from local farms, $4.99/lb
2. Organic Tomatoes - Vine-ripened, $3.99/lb
3. Organic Carrots - Crunchy and sweet, $2.99/lb

Categories: Fruits, Vegetables, Herbs, Seasonal
`,
  credentials: {
    mongodbUri: 'mongodb://localhost:27017/fresh_produce',
    razorpayKeyId: 'test_key_produce',
    razorpayKeySecret: 'test_secret_produce',
    gmailUser: 'produce@example.com',
    gmailPassword: 'test_password'
  },
  userId: 'test-user-produce'
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function test() {
  console.log('\n' + '='.repeat(70));
  log('🧪 Testing Simple App Generation', 'bright');
  console.log('='.repeat(70) + '\n');
  
  try {
    // Health check
    log('Checking service...', 'yellow');
    await axios.get(`${SERVICE_URL}/api/genvedha/health`);
    log('✅ Service is healthy\n', 'green');
    
    // Generate app
    log('🚀 Generating Fresh Organic Produce app...', 'cyan');
    log('⏳ Please wait ~60 seconds...\n', 'yellow');
    
    const start = Date.now();
    const response = await axios.post(
      `${SERVICE_URL}/api/genvedha/generate`,
      simpleRequest,
      { timeout: 300000 }
    );
    
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    
    log('\n✅ SUCCESS!', 'green');
    log(`\n📊 Results:`, 'bright');
    log(`   App Name: ${response.data.data.appName}`, 'cyan');
    log(`   Generation ID: ${response.data.data.generationId}`, 'cyan');
    log(`   Path: ${response.data.data.appPath}`, 'cyan');
    log(`   Duration: ${duration}s`, 'cyan');
    
    log(`\n📂 Location:`, 'bright');
    log(`   genvedha-llm-service/${response.data.data.appPath}`, 'yellow');
    
    log(`\n🚀 To run:`, 'bright');
    log(`   cd genvedha-llm-service/${response.data.data.appPath}/backend`, 'yellow');
    log(`   npm install && PORT=5003 npm start`, 'yellow');
    
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(0);
    
  } catch (error) {
    log('\n❌ FAILED', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${error.response.data.error}`, 'red');
    } else {
      log(`   ${error.message}`, 'red');
    }
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(1);
  }
}

test();
