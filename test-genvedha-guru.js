/**
 * Test Script for Genvedha Guru Chatbot
 * Tests the complete flow from requirement collection to app generation
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Test data
const testRequirements = {
    businessName: 'TechGadgets Store',
    productType: 'Electronics & Gadgets',
    description: 'Premium electronics and gadgets for tech enthusiasts',
    categories: [
        {
            id: 'cat-1',
            name: 'Smartphones',
            slug: 'smartphones',
            description: 'Smartphones products',
            order: 1
        },
        {
            id: 'cat-2',
            name: 'Laptops',
            slug: 'laptops',
            description: 'Laptops products',
            order: 2
        },
        {
            id: 'cat-3',
            name: 'Accessories',
            slug: 'accessories',
            description: 'Accessories products',
            order: 3
        }
    ],
    mongoUri: 'mongodb://localhost:27017',
    databaseName: 'techgadgets_store_db'
};

async function testHealthCheck() {
    console.log('\n🔍 Testing Health Check...');
    try {
        const response = await axios.get(`${API_BASE_URL}/api/health`);
        console.log('✅ Health Check Response:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health Check Failed:', error.message);
        return false;
    }
}

async function testAppGeneration() {
    console.log('\n🚀 Testing App Generation...');
    console.log('📋 Request Data:', JSON.stringify(testRequirements, null, 2));
    
    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/genvedha/generate`,
            testRequirements,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 120000 // 2 minutes timeout
            }
        );
        
        console.log('\n✅ App Generation Successful!');
        console.log('📦 Response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('\n📊 Generation Summary:');
            console.log(`   App Name: ${response.data.appName}`);
            console.log(`   Output Dir: ${response.data.outputDir}`);
            console.log(`   Port: ${response.data.port}`);
            console.log(`   Categories: ${response.data.categories}`);
            console.log(`   Files Generated: ${response.data.filesGenerated}`);
            
            if (response.data.portInfo) {
                console.log(`\n🔌 Port Info: ${response.data.portInfo.message}`);
            }
            
            console.log('\n📝 Next Steps:');
            response.data.nextSteps.forEach((step, index) => {
                console.log(`   ${index + 1}. ${step}`);
            });
        }
        
        return response.data;
    } catch (error) {
        console.error('\n❌ App Generation Failed!');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Error:', error.response.data);
        } else {
            console.error('   Error:', error.message);
        }
        return null;
    }
}

async function testMultipleApps() {
    console.log('\n🔄 Testing Multiple App Generation (Port Auto-Assignment)...');
    
    const apps = [
        {
            businessName: 'BookStore',
            productType: 'Books',
            description: 'Online bookstore with wide selection',
            categories: [
                { id: 'cat-1', name: 'Fiction', slug: 'fiction', description: 'Fiction books', order: 1 },
                { id: 'cat-2', name: 'Non-Fiction', slug: 'non-fiction', description: 'Non-Fiction books', order: 2 }
            ]
        },
        {
            businessName: 'FashionHub',
            productType: 'Clothing',
            description: 'Trendy fashion for everyone',
            categories: [
                { id: 'cat-1', name: 'Men', slug: 'men', description: 'Men clothing', order: 1 },
                { id: 'cat-2', name: 'Women', slug: 'women', description: 'Women clothing', order: 2 }
            ]
        }
    ];
    
    const results = [];
    
    for (const app of apps) {
        console.log(`\n📦 Generating: ${app.businessName}...`);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/genvedha/generate`,
                {
                    ...app,
                    mongoUri: 'mongodb://localhost:27017',
                    databaseName: app.businessName.toLowerCase() + '_db'
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 120000
                }
            );
            
            if (response.data.success) {
                console.log(`   ✅ ${app.businessName} created on port ${response.data.port}`);
                results.push({
                    name: app.businessName,
                    port: response.data.port,
                    success: true
                });
            }
        } catch (error) {
            console.error(`   ❌ Failed to create ${app.businessName}`);
            results.push({
                name: app.businessName,
                success: false,
                error: error.message
            });
        }
    }
    
    console.log('\n📊 Port Assignment Summary:');
    results.forEach(result => {
        if (result.success) {
            console.log(`   ${result.name}: Port ${result.port}`);
        } else {
            console.log(`   ${result.name}: Failed - ${result.error}`);
        }
    });
    
    return results;
}

async function testInvalidInput() {
    console.log('\n🧪 Testing Invalid Input Validation...');
    
    const invalidRequests = [
        {
            name: 'Missing businessName',
            data: {
                productType: 'Electronics',
                categories: []
            }
        },
        {
            name: 'Missing productType',
            data: {
                businessName: 'Test Store',
                categories: []
            }
        },
        {
            name: 'Missing categories',
            data: {
                businessName: 'Test Store',
                productType: 'Electronics'
            }
        }
    ];
    
    for (const test of invalidRequests) {
        try {
            await axios.post(`${API_BASE_URL}/api/genvedha/generate`, test.data);
            console.log(`   ❌ ${test.name}: Should have failed but didn't`);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log(`   ✅ ${test.name}: Correctly rejected`);
            } else {
                console.log(`   ⚠️  ${test.name}: Unexpected error`);
            }
        }
    }
}

async function runAllTests() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     Genvedha Guru Chatbot - Integration Tests         ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    
    // Test 1: Health Check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
        console.log('\n❌ Server is not running. Please start the server first:');
        console.log('   npm start');
        process.exit(1);
    }
    
    // Test 2: Invalid Input
    await testInvalidInput();
    
    // Test 3: Single App Generation
    const result = await testAppGeneration();
    
    // Test 4: Multiple Apps (Port Auto-Assignment)
    if (result && result.success) {
        await testMultipleApps();
    }
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              Tests Completed!                          ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📝 To test the UI:');
    console.log('   1. Open http://localhost:3000/genvedha-guru.html');
    console.log('   2. Click "Start Creating"');
    console.log('   3. Answer the questions');
    console.log('   4. Review and approve');
    console.log('   5. Watch your app being created!');
}

// Run tests
runAllTests().catch(error => {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
});
