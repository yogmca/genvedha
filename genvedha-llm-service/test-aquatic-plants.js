/**
 * Test: Generate Aquatic Plants Store
 */

const axios = require('axios');

const SERVICE_URL = 'http://localhost:3001';

const aquaticPlantsRequest = {
  userRequirements: `
Create an online store called "AquaGarden Paradise" for selling aquatic plants.

Business Description:
Specialized online retailer of aquatic plants for aquariums, ponds, and water gardens.
We offer a wide variety of freshwater and aquatic plants for hobbyists and professionals.

Product Type: Aquatic plants

Key Features:
- Product catalog with care difficulty ratings
- Plant compatibility checker
- Shopping cart and checkout
- User accounts and order history
- Care guides and tutorials

Custom Product Fields:
- Plant Type (Floating, Rooted, Moss, Fern)
- Difficulty Level (Easy, Moderate, Difficult)
- Light Requirements (Low, Medium, High)
- Growth Rate (Slow, Medium, Fast)
- Water Parameters (pH range, temperature)
- Tank Size Recommendation

UI Colors:
- Primary: #006994 (deep water blue)
- Secondary: #4CAF50 (aquatic green)
- Accent: #00BCD4 (cyan)

Sample Products:
1. Java Fern - Easy care, low light plant perfect for beginners, $12.99
2. Amazon Sword - Popular background plant, moderate care, $15.99
3. Anubias Nana - Hardy plant that grows on rocks and driftwood, $9.99

Categories: Foreground Plants, Background Plants, Floating Plants, Moss & Ferns, Rare Species
`,
  credentials: {
    mongodbUri: process.env.MONGODB_URI || 'mongodb://ykmysuru27_db_user:QWLP9LcE3nIRcEaY@atlas-sql-69f06bb159aabca72961dac5-ew3cgx.a.query.mongodb.net/genvedha?ssl=true&authSource=admin&retryWrites=true&w=majority',
    razorpayKeyId: 'test_key_aquatic',
    razorpayKeySecret: 'test_secret_aquatic',
    gmailUser: 'aquagarden@example.com',
    gmailPassword: 'test_password'
  },
  userId: 'test-user-aquatic'
};

async function generateAquaticStore() {
  console.log('\n🌊 Generating AquaGarden Paradise - Aquatic Plants Store\n');
  
  try {
    const start = Date.now();
    const response = await axios.post(
      `${SERVICE_URL}/api/genvedha/generate`,
      aquaticPlantsRequest,
      { timeout: 300000 }
    );
    
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    
    console.log('\n✅ SUCCESS!');
    console.log(`App Name: ${response.data.data.appName}`);
    console.log(`Path: ${response.data.data.appPath}`);
    console.log(`Duration: ${duration}s`);
    console.log(`\nLocation: genvedha-llm-service/${response.data.data.appPath}`);
    
  } catch (error) {
    console.log('\n❌ FAILED');
    if (error.response) {
      console.log(`Error: ${error.response.data.error}`);
    } else {
      console.log(`Error: ${error.message}`);
    }
  }
}

generateAquaticStore();
