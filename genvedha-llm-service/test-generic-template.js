/**
 * Test script for Generic Template System
 * Tests all components and their integration
 */

const templateCleaner = require('./services/template-cleaner');
const contentInjector = require('./services/content-injector');
const categoryManager = require('./services/category-manager');
const genericTemplateGenerator = require('./services/generic-template-generator');
const { createProductModel, createProductModelWithPreset, getAvailablePresets } = require('./models/GenericProduct');

// Test data
const sampleSourceCode = `
import React from 'react';

const SpiceProducts = () => {
  const spiceCategories = ['Whole Spices', 'Ground Spices', 'Spice Blends'];
  const products = [
    { name: 'Organic Turmeric Powder', price: 299 },
    { name: 'Premium Cumin Seeds', price: 199 }
  ];

  return (
    <div className="spice-container">
      <h1>Organic Spice Bazaar</h1>
      <p>Welcome to our premium spice collection</p>
    </div>
  );
};

export default SpiceProducts;
`;

const testConfig = {
  businessName: 'My Generic Store',
  description: 'A flexible e-commerce platform',
  productType: 'product',
  categories: 'ecommerce',
  mongoUri: 'mongodb://localhost:27017',
  databaseName: 'test_generic_db',
  port: 5000,
  productSchema: {
    customFields: {
      brand: { type: 'String' },
      warranty: { type: 'Number' }
    }
  }
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    fn();
    console.log(`✅ PASSED: ${name}`);
    results.passed++;
    results.tests.push({ name, status: 'passed' });
  } catch (error) {
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('🚀 Starting Generic Template System Tests\n');
console.log('='.repeat(60));

// Test 1: Template Cleaner
test('Template Cleaner - Clean JavaScript content', () => {
  const cleaned = templateCleaner.cleanContent(sampleSourceCode, 'js');
  
  assert(!cleaned.includes('Organic Spice Bazaar'), 'Business name should be replaced');
  assert(cleaned.includes('{{BUSINESS_NAME}}'), 'Should contain placeholder');
  assert(!cleaned.includes('spiceCategories'), 'Spice-specific variables should be replaced');
  assert(cleaned.includes('categories'), 'Should use generic variable names');
});

// Test 2: Template Cleaner - Validation
test('Template Cleaner - Validate cleaned content', () => {
  const cleaned = templateCleaner.cleanContent(sampleSourceCode, 'js');
  const validation = templateCleaner.validateCleanedContent(cleaned);
  
  assert(validation.isClean, 'Cleaned content should pass validation');
  assert(validation.issues.length === 0, 'Should have no validation issues');
});

// Test 3: Content Injector - Create configuration
test('Content Injector - Create configuration', () => {
  const config = contentInjector.createConfiguration({
    businessName: 'Test Store',
    productType: 'product',
    mongoUri: 'mongodb://localhost:27017',
    databaseName: 'test_db'
  });
  
  assert(config.business, 'Should have business config');
  assert(config.business.businessName === 'Test Store', 'Should set business name');
  assert(config.database, 'Should have database config');
  assert(config.productSchema, 'Should have product schema');
});

// Test 4: Content Injector - Inject content
test('Content Injector - Inject business config', () => {
  const template = 'Welcome to {{BUSINESS_NAME}}! We sell {{PRODUCT_TYPE}}s.';
  const injected = contentInjector.inject(template, {
    BUSINESS_NAME: 'My Store',
    PRODUCT_TYPE: 'product'
  });
  
  assert(injected.includes('My Store'), 'Should inject business name');
  assert(injected.includes('products'), 'Should inject product type');
  assert(!injected.includes('{{'), 'Should not have remaining placeholders');
});

// Test 5: Category Manager - Load from object
test('Category Manager - Load categories from object', () => {
  const categories = [
    { id: 'cat1', name: 'Category 1', order: 1 },
    { id: 'cat2', name: 'Category 2', order: 2 }
  ];
  
  categoryManager.loadFromObject({ categories });
  const loaded = categoryManager.getAll();
  
  assert(loaded.length === 2, 'Should load 2 categories');
  assert(loaded[0].slug, 'Should generate slug');
  assert(loaded[0].active !== false, 'Should be active by default');
});

// Test 6: Category Manager - Get by ID
test('Category Manager - Get category by ID', () => {
  const category = categoryManager.getById('cat1');
  
  assert(category !== null, 'Should find category');
  assert(category.name === 'Category 1', 'Should have correct name');
});

// Test 7: Category Manager - Get tree
test('Category Manager - Get category tree', () => {
  categoryManager.loadFromObject({
    categories: [
      { id: 'parent', name: 'Parent', order: 1 },
      { id: 'child1', name: 'Child 1', parent: 'parent', order: 1 },
      { id: 'child2', name: 'Child 2', parent: 'parent', order: 2 }
    ]
  });
  
  const tree = categoryManager.getTree();
  
  assert(tree.length === 1, 'Should have 1 root category');
  assert(tree[0].children.length === 2, 'Root should have 2 children');
});

// Test 8: Category Manager - Search
test('Category Manager - Search categories', () => {
  const results = categoryManager.search('parent');
  
  assert(results.length > 0, 'Should find matching categories');
  assert(results[0].name.toLowerCase().includes('parent'), 'Should match search term');
});

// Test 9: Category Manager - Default configs
test('Category Manager - Create default config', () => {
  const ecommerceCategories = categoryManager.constructor.createDefaultConfig('ecommerce');
  const foodCategories = categoryManager.constructor.createDefaultConfig('food');
  
  assert(ecommerceCategories.length > 0, 'Should create ecommerce categories');
  assert(foodCategories.length > 0, 'Should create food categories');
  assert(ecommerceCategories[0].id, 'Categories should have IDs');
});

// Test 10: Generic Product Model - Create basic model
test('Generic Product Model - Create basic model', () => {
  const Product = createProductModel();
  
  assert(Product, 'Should create model');
  assert(Product.schema, 'Should have schema');
  assert(Product.schema.paths.name, 'Should have name field');
  assert(Product.schema.paths.price, 'Should have price field');
  assert(Product.schema.paths.category, 'Should have category field');
});

// Test 11: Generic Product Model - Create with preset
test('Generic Product Model - Create with preset', () => {
  const FoodProduct = createProductModelWithPreset('food', {}, 'food_products');
  
  assert(FoodProduct, 'Should create model with preset');
  assert(FoodProduct.schema.paths.weight, 'Should have weight field from food preset');
  assert(FoodProduct.schema.paths.organic, 'Should have organic field from food preset');
});

// Test 12: Generic Product Model - Get available presets
test('Generic Product Model - Get available presets', () => {
  const presets = getAvailablePresets();
  
  assert(presets.length > 0, 'Should have presets');
  assert(presets.includes('ecommerce'), 'Should include ecommerce preset');
  assert(presets.includes('food'), 'Should include food preset');
  assert(presets.includes('fashion'), 'Should include fashion preset');
});

// Test 13: Generic Template Generator - Validate config
test('Generic Template Generator - Validate configuration', () => {
  const validation = genericTemplateGenerator.validateConfig(testConfig);
  
  assert(validation.valid, 'Valid config should pass validation');
  assert(validation.errors.length === 0, 'Should have no errors');
});

// Test 14: Generic Template Generator - Validate invalid config
test('Generic Template Generator - Validate invalid configuration', () => {
  const invalidConfig = { businessName: 'Test' }; // Missing required fields
  const validation = genericTemplateGenerator.validateConfig(invalidConfig);
  
  assert(!validation.valid, 'Invalid config should fail validation');
  assert(validation.errors.length > 0, 'Should have validation errors');
});

// Test 15: Integration Test - Clean and Inject
test('Integration - Clean template and inject content', () => {
  // Clean
  const cleaned = templateCleaner.cleanContent(sampleSourceCode, 'js');
  
  // Setup categories
  categoryManager.loadFromObject({
    categories: [{ id: 'electronics', name: 'Electronics', order: 1 }]
  });
  
  // Inject
  const config = contentInjector.createConfiguration({
    businessName: 'Tech Store',
    productType: 'gadget',
    categories: categoryManager.getAll()
  });
  
  const injected = contentInjector.injectBusinessConfig(cleaned, config.business);
  
  assert(injected.includes('Tech Store'), 'Should inject business name');
  assert(!injected.includes('Organic Spice Bazaar'), 'Should not have original business name');
});

// Test 16: Category Manager - Export/Import
test('Category Manager - Export and Import', () => {
  categoryManager.loadFromObject({
    categories: [
      { id: 'test1', name: 'Test 1', order: 1 },
      { id: 'test2', name: 'Test 2', order: 2 }
    ]
  });
  
  // Export
  const exported = categoryManager.export('json');
  assert(exported, 'Should export data');
  
  // Import
  categoryManager.import(exported, 'json', false);
  const categories = categoryManager.getAll();
  assert(categories.length === 2, 'Should import categories');
});

// Test 17: Category Manager - Statistics
test('Category Manager - Get statistics', () => {
  const stats = categoryManager.getStats();
  
  assert(stats.total >= 0, 'Should have total count');
  assert(stats.active >= 0, 'Should have active count');
  assert(stats.lastLoadTime, 'Should have last load time');
});

// Print results
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Results Summary\n');
console.log(`Total Tests: ${results.passed + results.failed}`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%`);

if (results.failed > 0) {
  console.log('\n❌ Failed Tests:');
  results.tests
    .filter(t => t.status === 'failed')
    .forEach(t => {
      console.log(`   - ${t.name}`);
      console.log(`     Error: ${t.error}`);
    });
}

console.log('\n' + '='.repeat(60));

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
