/**
 * Test script for generating a bookstore e-commerce app
 */

const axios = require('axios');

const SERVICE_URL = 'http://localhost:3001';

// Test data for bookstore app
const bookstoreRequest = {
  userRequirements: `
Create an online bookstore called "Literary Haven".

Business Description:
An independent online bookstore specializing in rare books, bestsellers, and curated collections. 
Focus on creating a cozy, literary atmosphere with personalized recommendations.

Product Type: Books (physical and digital)

Key Features Required:
- Advanced book search (by title, author, genre, ISBN)
- Book preview and sample chapters
- Customer reviews and ratings
- Wishlist and reading lists
- Gift wrapping options
- Author spotlights and book clubs
- Newsletter subscription
- Personalized recommendations

Custom Product Fields:
- ISBN (required)
- Author (required)
- Publisher
- Publication Year
- Page Count
- Language
- Book Format (Hardcover, Paperback, eBook, Audiobook)
- Genre/Category
- Book Condition (New, Like New, Good, Acceptable)
- Edition (First Edition, Revised, etc.)

UI Customization:
- Primary Color: #2C1810 (dark brown - leather book binding)
- Secondary Color: #8B7355 (tan - aged paper)
- Accent Color: #C19A6B (gold - bookmark)
- Font: Georgia serif for classic literary feel

Sample Products to Include:
1. "The Great Gatsby" by F. Scott Fitzgerald - Classic American literature, hardcover, $24.99
2. "1984" by George Orwell - Dystopian fiction, paperback, $15.99
3. "To Kill a Mockingbird" by Harper Lee - Classic fiction, hardcover first edition, $45.00
4. "Pride and Prejudice" by Jane Austen - Romance classic, leather-bound edition, $39.99
5. "The Hobbit" by J.R.R. Tolkien - Fantasy adventure, illustrated edition, $32.50

Categories: Fiction, Non-Fiction, Mystery & Thriller, Science Fiction & Fantasy, Romance, 
Biography & Memoir, History, Self-Help, Children's Books, Young Adult, Poetry, Classics

Special Features:
- Book club section with discussion guides
- Author interviews and events
- Monthly book subscription boxes
- Gift cards
- Free shipping on orders over $50
`,
  credentials: {
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/literary_haven',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'test_razorpay_key_bookstore',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'test_razorpay_secret_bookstore',
    gmailUser: process.env.GMAIL_USER || 'bookstore@example.com',
    gmailPassword: process.env.GMAIL_PASSWORD || 'test_gmail_password_bookstore'
  },
  userId: 'test-user-bookstore-001'
};

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70) + '\n');
}

async function generateBookstoreApp() {
  logSection('📚 Generating Literary Haven Bookstore App');
  
  log('Business: Literary Haven - Independent Online Bookstore', 'cyan');
  log('Type: Books (physical and digital)', 'cyan');
  log('Special Features: Book clubs, author events, subscription boxes', 'cyan');
  
  try {
    log('\n⏳ Sending generation request to LLM service...', 'yellow');
    log('This will take about 60 seconds...', 'yellow');
    
    const startTime = Date.now();
    
    const response = await axios.post(
      `${SERVICE_URL}/api/genvedha/generate`,
      bookstoreRequest,
      {
        timeout: 300000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log('\n✅ Bookstore app generated successfully!', 'green');
    log(`\n📊 Generation Results:`, 'bright');
    log(`   Generation ID: ${response.data.data.generationId}`, 'cyan');
    log(`   App Name: ${response.data.data.appName}`, 'cyan');
    log(`   App Path: ${response.data.data.appPath}`, 'cyan');
    log(`   Duration: ${duration} seconds`, 'magenta');
    log(`   Customizations: ${JSON.stringify(response.data.data.customizations || {})}`, 'cyan');
    
    return response.data.data;
    
  } catch (error) {
    log('\n❌ Generation failed!', 'red');
    
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${error.response.data.error || error.response.data.message}`, 'red');
      if (error.response.data.details) {
        log(`   Details: ${JSON.stringify(error.response.data.details, null, 2)}`, 'red');
      }
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    
    throw error;
  }
}

async function runTest() {
  logSection('🧪 Testing LLM Service - Bookstore App Generation');
  
  try {
    // Check service health
    log('Checking service health...', 'yellow');
    const healthResponse = await axios.get(`${SERVICE_URL}/api/genvedha/health`);
    log(`✅ Service is healthy: ${healthResponse.data.status}`, 'green');
    
    // Generate app
    const appData = await generateBookstoreApp();
    
    // Summary
    logSection('📊 Test Summary');
    log('✅ Test completed successfully!', 'green');
    log(`\nGenerated app location:`, 'cyan');
    log(`   ${appData.appPath}`, 'bright');
    log(`\nTo run the app:`, 'cyan');
    log(`   cd genvedha-llm-service/${appData.appPath}/backend`, 'yellow');
    log(`   npm install`, 'yellow');
    log(`   PORT=5002 npm start`, 'yellow');
    
    process.exit(0);
    
  } catch (error) {
    logSection('❌ Test Failed');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Run the test
runTest();
