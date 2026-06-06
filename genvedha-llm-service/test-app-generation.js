/**
 * Test script for full app generation using the LLM service
 * This tests the complete flow from API request to generated app
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const SERVICE_URL = process.env.SERVICE_URL || 'http://localhost:3001';
const TEST_OUTPUT_DIR = path.join(__dirname, 'test-generated-app');

// Test data for sample app generation - formatted for the API
const testAppRequest = {
  userRequirements: `
Create a premium coffee e-commerce application called "Artisan Coffee Roasters".

Business Description:
Premium small-batch coffee roasting company specializing in single-origin beans from around the world.

Product Type: Coffee beans and blends

Key Features Required:
- Product catalog with advanced filtering (by roast level, origin, processing method)
- Shopping cart with quantity management
- User authentication and profiles
- Order management system
- Admin dashboard for inventory management
- Product reviews and ratings

Custom Product Fields:
- Roast Level (Light, Medium, Dark)
- Origin Country (required)
- Processing Method (Washed, Natural, Honey, Wet-hulled)
- Tasting Notes (array of flavor descriptors)
- Altitude (meters above sea level)
- Harvest Date

UI Customization:
- Primary Color: #6F4E37 (coffee brown)
- Secondary Color: #D2691E (chocolate)
- Accent Color: #8B4513 (saddle brown)
- Font: Merriweather serif for elegant feel

Sample Products to Include:
1. Ethiopian Yirgacheffe - Light roast, bright and floral with bergamot and jasmine notes, $18.99
2. Colombian Supremo - Medium roast, rich and balanced with chocolate and caramel, $16.99
3. Sumatra Mandheling - Dark roast, full-bodied with earthy and herbal complexity, $17.99

Categories: Single Origin, Blends, Decaf, Seasonal Specials
`,
  credentials: {
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/artisan_coffee',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'test_razorpay_key_id',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'test_razorpay_key_secret',
    gmailUser: process.env.GMAIL_USER || 'test@example.com',
    gmailPassword: process.env.GMAIL_PASSWORD || 'test_gmail_app_password'
  },
  userId: 'test-user-001'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70) + '\n');
}

async function checkServiceHealth() {
  logSection('🏥 Checking Service Health');
  
  try {
    const response = await axios.get(`${SERVICE_URL}/api/genvedha/health`, { timeout: 5000 });
    log(`✅ Service is healthy: ${response.data.status}`, 'green');
    if (response.data.uptime) {
      log(`   Uptime: ${response.data.uptime}s`, 'cyan');
    }
    return true;
  } catch (error) {
    log(`❌ Service health check failed: ${error.message}`, 'red');
    log(`   Make sure the service is running on ${SERVICE_URL}`, 'yellow');
    log(`   Run: cd genvedha-llm-service && npm start`, 'yellow');
    return false;
  }
}

async function generateApp() {
  logSection('🚀 Generating Sample Application');
  
  log('Configuration:', 'cyan');
  log(`  User Requirements: ${testAppRequest.userRequirements.substring(0, 100).trim()}...`, 'cyan');
  log(`  User ID: ${testAppRequest.userId}`, 'cyan');
  log(`  Credentials: MongoDB, Razorpay, Gmail configured`, 'cyan');
  
  try {
    log('\n⏳ Sending generation request (this may take a few minutes)...', 'yellow');
    
    const response = await axios.post(
      `${SERVICE_URL}/api/genvedha/generate`,
      testAppRequest,
      {
        timeout: 300000, // 5 minutes timeout for generation
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    log('\n✅ App generation completed!', 'green');
    log(`   Generation ID: ${response.data.data.generationId}`, 'cyan');
    log(`   App Name: ${response.data.data.appName}`, 'cyan');
    log(`   App Path: ${response.data.data.appPath}`, 'cyan');
    log(`   Duration: ${response.data.data.duration}`, 'cyan');
    
    return response.data.data;
  } catch (error) {
    log('\n❌ App generation failed!', 'red');
    
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${error.response.data.error || error.response.data.message}`, 'red');
      if (error.response.data.details) {
        log(`   Details: ${JSON.stringify(error.response.data.details, null, 2)}`, 'red');
      }
    } else if (error.request) {
      log(`   No response received from service`, 'red');
      log(`   Error: ${error.message}`, 'red');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    
    throw error;
  }
}

async function verifyGeneratedApp(appData) {
  logSection('🔍 Verifying Generated Application');
  
  const appPath = appData.appPath;
  
  if (!appPath) {
    log('❌ No app path provided in response', 'red');
    return false;
  }
  
  log(`Checking app directory: ${appPath}`, 'cyan');
  
  // Check if directory exists
  if (!fs.existsSync(appPath)) {
    log(`❌ App directory does not exist: ${appPath}`, 'red');
    return false;
  }
  
  log('✅ App directory exists', 'green');
  
  // Check for key files and directories
  const requiredPaths = [
    'backend',
    'frontend',
    'backend/server.js',
    'backend/package.json',
    'backend/.env',
    'backend/models',
    'backend/routes',
    'frontend/index.html',
    'frontend/app.js',
    'frontend/styles.css'
  ];
  
  let allPathsExist = true;
  
  for (const requiredPath of requiredPaths) {
    const fullPath = path.join(appPath, requiredPath);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      log(`  ✅ ${requiredPath}`, 'green');
    } else {
      log(`  ❌ ${requiredPath} - MISSING`, 'red');
      allPathsExist = false;
    }
  }
  
  // Check backend package.json
  try {
    const packageJsonPath = path.join(appPath, 'backend', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    log('\n📦 Backend Package Info:', 'cyan');
    log(`  Name: ${packageJson.name}`, 'cyan');
    log(`  Version: ${packageJson.version}`, 'cyan');
    log(`  Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`, 'cyan');
  } catch (error) {
    log(`\n⚠️  Could not read backend package.json: ${error.message}`, 'yellow');
  }
  
  // Check .env file
  try {
    const envPath = path.join(appPath, 'backend', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    log('\n🔧 Environment Configuration:', 'cyan');
    log(`  Variables: ${envLines.length}`, 'cyan');
    
    // Check for required env vars
    const requiredEnvVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET'];
    for (const envVar of requiredEnvVars) {
      const hasVar = envContent.includes(`${envVar}=`);
      if (hasVar) {
        log(`  ✅ ${envVar}`, 'green');
      } else {
        log(`  ❌ ${envVar} - MISSING`, 'red');
        allPathsExist = false;
      }
    }
  } catch (error) {
    log(`\n⚠️  Could not read .env file: ${error.message}`, 'yellow');
  }
  
  // Check for sample products in database initialization
  try {
    const dbInitPath = path.join(appPath, 'backend', 'scripts', 'init-db.js');
    if (fs.existsSync(dbInitPath)) {
      const dbInitContent = fs.readFileSync(dbInitPath, 'utf8');
      const hasSampleProducts = dbInitContent.includes('Ethiopian') || 
                                dbInitContent.includes('Colombian') ||
                                dbInitContent.includes('coffee');
      
      log('\n📊 Sample Data:', 'cyan');
      if (hasSampleProducts) {
        log('  ✅ Sample products included', 'green');
      } else {
        log('  ⚠️  Sample products may not be included', 'yellow');
      }
    }
  } catch (error) {
    log(`\n⚠️  Could not check database initialization: ${error.message}`, 'yellow');
  }
  
  return allPathsExist;
}

async function runTests() {
  logSection('🧪 Starting LLM Service App Generation Tests');
  
  log('Service URL: ' + SERVICE_URL, 'cyan');
  log('Test App: Artisan Coffee Roasters', 'cyan');
  
  try {
    // Step 1: Check service health
    const isHealthy = await checkServiceHealth();
    if (!isHealthy) {
      log('\n❌ Cannot proceed - service is not running', 'red');
      process.exit(1);
    }
    
    // Step 2: Generate new app
    const appData = await generateApp();
    
    // Step 3: Verify generated app
    const isValid = await verifyGeneratedApp(appData);
    
    // Step 4: Final summary
    logSection('📊 Test Summary');
    
    if (isValid) {
      log('✅ ALL TESTS PASSED!', 'green');
      log('\nGenerated app is ready to use:', 'green');
      log(`  Location: ${appData.appPath}`, 'cyan');
      log(`\nNext steps:`, 'cyan');
      log(`  1. cd ${appData.appPath}/backend`, 'yellow');
      log(`  2. npm install`, 'yellow');
      log(`  3. npm start`, 'yellow');
      log(`  4. Open frontend/index.html in a browser`, 'yellow');
      
      process.exit(0);
    } else {
      log('⚠️  TESTS COMPLETED WITH WARNINGS', 'yellow');
      log('Some files or configurations may be missing', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    logSection('❌ Test Failed');
    log(error.message, 'red');
    if (error.stack) {
      log('\nStack trace:', 'red');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run tests
runTests();
