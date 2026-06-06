/**
 * Simplified bookstore app generation test
 */

const axios = require('axios');

const SERVICE_URL = 'http://localhost:3001';

// Simplified bookstore requirements
const bookstoreRequest = {
  userRequirements: `
Create an online bookstore called "Page Turner Books".

Business Description:
Independent bookstore selling new and used books online with personalized service.

Product Type: Books

Key Features:
- Book catalog with search
- Shopping cart
- User accounts
- Order management
- Book reviews

Custom Fields:
- ISBN
- Author
- Publisher
- Format (Hardcover, Paperback, eBook)
- Condition (New, Used)

UI Colors:
- Primary: #8B4513 (saddle brown)
- Secondary: #D2691E (chocolate)
- Accent: #CD853F (peru)

Sample Products:
1. "The Great Gatsby" by F. Scott Fitzgerald - Classic fiction, $24.99
2. "1984" by George Orwell - Dystopian novel, $18.99
3. "To Kill a Mockingbird" by Harper Lee - American classic, $22.50

Categories: Fiction, Non-Fiction, Mystery, Sci-Fi, Classics
`,
  credentials: {
    mongodbUri: 'mongodb://localhost:27017/page_turner_books',
    razorpayKeyId: 'test_key_books',
    razorpayKeySecret: 'test_secret_books',
    gmailUser: 'books@example.com',
    gmailPassword: 'test_password'
  },
  userId: 'test-user-books'
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
  log('📚 Testing Bookstore App Generation', 'bright');
  console.log('='.repeat(70) + '\n');
  
  try {
    log('Checking service...', 'yellow');
    await axios.get(`${SERVICE_URL}/api/genvedha/health`);
    log('✅ Service is healthy\n', 'green');
    
    log('🚀 Generating Page Turner Books app...', 'cyan');
    log('⏳ Please wait ~45-60 seconds...\n', 'yellow');
    
    const start = Date.now();
    const response = await axios.post(
      `${SERVICE_URL}/api/genvedha/generate`,
      bookstoreRequest,
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
    log(`   npm install && PORT=5004 npm start`, 'yellow');
    log(`\n   cd genvedha-llm-service/${response.data.data.appPath}/frontend`, 'yellow');
    log(`   npm install && PORT=3001 npm start`, 'yellow');
    
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(0);
    
  } catch (error) {
    log('\n❌ FAILED', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${error.response.data.error}`, 'red');
      if (error.response.data.message) {
        log(`   Message: ${error.response.data.message}`, 'red');
      }
    } else {
      log(`   ${error.message}`, 'red');
    }
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(1);
  }
}

test();
