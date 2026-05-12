/**
 * Test Script for GenVedha LLM Service
 * Run this to test the service end-to-end
 */

const axios = require('axios');

const SERVICE_URL = 'http://localhost:3001';

// Test data
const testRequest = {
  userRequirements: `Create a fashion e-commerce store called "StyleVista" for women's clothing. 
  The store should sell dresses, tops, jeans, and accessories. 
  Include Razorpay payment integration, WhatsApp notifications for orders, 
  and a modern pink and gold color scheme. 
  The store should have product reviews, wishlist functionality, and discount coupons.`,
  
  credentials: {
    // MongoDB
    mongodbUri: 'mongodb://localhost:27017/stylevista',
    
    // Razorpay (use test keys)
    razorpayKeyId: 'rzp_test_1234567890',
    razorpayKeySecret: 'test_secret_key_12345',
    
    // Gmail
    gmailUser: 'test@gmail.com',
    gmailPassword: 'test_app_password',
    emailTo: 'support@stylevista.com',
    
    // Optional
    whatsappNumber: '+919876543210',
    appUrl: 'https://stylevista.com'
  },
  
  userId: 'test-user-001'
};

async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  try {
    const response = await axios.get(`${SERVICE_URL}/api/genvedha/health`);
    console.log('✅ Health Check Passed');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

async function testGeneration() {
  console.log('\n🎨 Testing App Generation...');
  console.log('Request:', JSON.stringify(testRequest, null, 2));
  
  try {
    const startTime = Date.now();
    const response = await axios.post(
      `${SERVICE_URL}/api/genvedha/generate`,
      testRequest,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutes
      }
    );
    
    const duration = Date.now() - startTime;
    
    console.log('\n✅ Generation Successful!');
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log('\nResponse:', JSON.stringify(response.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('\n❌ Generation Failed');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
}

async function testStatusCheck(generationId) {
  console.log('\n📊 Testing Status Check...');
  try {
    const response = await axios.get(
      `${SERVICE_URL}/api/genvedha/status/${generationId}`
    );
    console.log('✅ Status Check Passed');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Status Check Failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 GenVedha LLM Service - Test Suite');
  console.log('='.repeat(60));
  
  // Test 1: Health Check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.error('\n❌ Service is not healthy. Please start the service first:');
    console.error('   cd genvedha-llm-service && npm start');
    process.exit(1);
  }
  
  // Test 2: App Generation
  const result = await testGeneration();
  if (!result) {
    console.error('\n❌ Generation test failed');
    process.exit(1);
  }
  
  // Test 3: Status Check (if we have a generation ID)
  if (result.generationId) {
    await testStatusCheck(result.generationId);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All Tests Passed!');
  console.log('='.repeat(60));
  
  if (result.appPath) {
    console.log('\n📦 Generated App Location:');
    console.log(`   ${result.appPath}`);
    console.log('\n📝 Next Steps:');
    console.log(`   1. cd ${result.appPath}`);
    console.log('   2. npm install');
    console.log('   3. npm start');
    console.log('   4. Open http://localhost:3000');
  }
  
  console.log('\n');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
